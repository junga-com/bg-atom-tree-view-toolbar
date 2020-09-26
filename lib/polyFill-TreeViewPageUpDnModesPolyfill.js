import { PolyfillObjectMixin }        from 'bg-atom-utils'

export class TreeViewPageUpDnModesPolyfill extends PolyfillObjectMixin {
	constructor(configKey) {
		super(
			atom.workspace.getItemByURI('atom://tree-view'),
			['pageMode','realizePagingParams','pageUp','pageDown','getAdjacentEntry','scrollAPage','moveSelectionBy',
			 'scrollEntryIntoFullView', 'isEntryInFullView', 'getEntryHeight'
			],
			configKey
		);

		// 1==onlyScroll, 2==onlyChangeSelectedEntry 3==scrollAndChangeSelectionIntoView
		Reflect.defineProperty( this, 'pageMode', {
		  configurable: true,
		  enumerable: true,
		  get: function () {return this.pagingParams && this.pagingParams.pageMode},
		  set: function (pageMode) {
			if ((typeof pageMode) != 'object') switch (pageMode) {
				case 2:  pageMode = {pageMode: pageMode, moveCursor: true,  entryOffset: 0, scrollType: '2'}; break;
				case 3:  pageMode = {pageMode: pageMode, moveCursor: true,  entryOffset: 0, scrollType: '3'}; break;
				case 4:  pageMode = {pageMode: pageMode, moveCursor: true,  entryOffset: 0, scrollType: '4'}; break;
				case 5:  pageMode = {pageMode: pageMode, moveCursor: true,  entryOffset: 0, scrollType: '5'}; break;
				default: pageMode = {pageMode: 1,        moveCursor: false, entryOffset: 0, scrollType: '1'}
			}
			this.pagingParams = pageMode
		  }
		})
		this.pageMode = 4;

		// the tree-view is configured to be permanent but it is still possible for it to come and go during a session
		atom.workspace.addDep_itemOpenned("atom://tree-view", this, ()=>{this.sync();});

		this.sync();
	}

	sync() {
		super.sync();
		if (this.target) this.target.pageMode=atom.config.get('tree-view.pageUpDnMode');
	}

	getTarget() {return atom.workspace.itemForURI('atom://tree-view');}
	doesTargetAlreadySupportFeature() {return atom.config.existsSchema('tree-view.pageUpDnMode')}
	isTargetStillCompatibleWithThisPollyfill() {return this.existsInTarget('selectedEntry,scrollToEntry,element,list,nextEntry,previousEntry');}

	// hook into install to add the
	install(...p) {
		super.install(...p);
		atom.config.addDep('tree-view.pageUpDnMode', this, ({newValue})=>{this.target.pageMode=newValue});
	}

	uninstall(...p) {
		atom.config.removeDep('tree-view.pageUpDnMode', this);
		super.uninstall(...p);
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Polyfill Methods...
	// These methods are writtien in the context of the target object and will be dynamically added to that object when this polyfill
	// is installed.  If the name matches an existing method of the target object, it will be replaced and the original will be
	// available as orig_<methodName>
	// The 'this' pointer of these methods will be the target object, not the polyfill object when they are invoked.

	// The entry height is the height of just the highlighted 'header' part of the entry. The Atom tree-view makes it non trivial
	// because when a directory is expanded, the height of that entry includes its children.
	getEntryHeight(entry) {
		const ret =
			(!entry)
				? 25 // This should not be used but returns something sane just in case
				: (entry.matches('.expanded') && entry.children[0].offsetHeight)
					? entry.children[0].offsetHeight
					: entry.offsetHeight;
		return ret;
	}

	// this fills in the pagingParams with the calculated page size in number of entries that fit in a page and in pixels.
	// this assumes that all entries have the same height. There are some pageModes that handle non uniform entry heights that will
	// not use these parameters
	realizePagingParams() {
		// get any entry and query its height. A directory entry contains a child for itself and a child for all its descendants
		// so if its expanded, we have to query its
		var entry = this.getAdjacentEntry(null, 1);
		this.pagingParams.entryHeight = this.getEntryHeight(entry);

		// the number of entries that fit in a visible page
		this.pagingParams.pageHeightInEntries = (Math.floor(this.element.clientHeight / this.pagingParams.entryHeight)) + this.pagingParams.entryOffset

		// the actual height of the visible page in pixels
		this.pagingParams.pageHeightInPixels = this.element.clientHeight;

		// this is the closest page height in pixels which is an even number of entries high.
		this.pagingParams.pageHeightEvenEntries = (this.pagingParams.pageHeightInEntries-1)*this.pagingParams.entryHeight;
	}

	// given a entry, get the entry immediately above or below it taking into account the collasped directories.
	// If there is no adjacent entry in the direction, it returns null
	// if the entry passed in is null, it returns either the first entry if direction is down(1) or the last one if direction is up(-1).
	// Params:
	//    <entry>     : the tree entry to start at
	//    <direction> : 1==down, -1==up
	getAdjacentEntry(entry, direction) {
		if (!entry) {
			var entries = this.list.querySelectorAll('.entry')
			return entries[(direction>0) ? 0 : entries.length-1]
		}

		var nextEntry
		if (direction>0) {
			if (entry.classList.contains('directory') && entry.entries.children[0])
				nextEntry = entry.entries.children[0];
			else
				nextEntry = this.nextEntry(entry);
		} else
			nextEntry = this.previousEntry(entry) || entry.parentElement.closest('.directory');
		return (entry === nextEntry) ? null : nextEntry
	}


	pageUp(event) {
		return this.scrollAPage(event, -1);
	}

	pageDown(event) {
		return this.scrollAPage(event, 1);
	}


	// This supports several different styles of pageUp/pageDn behaivior based on the this.pagingParams structure. The idea is that
	// pagingParams has the individual parameters that are used in this algorithm and they are set by the pageMode setter function
	// according to a discrete number of styles, 1, 2, 3, etc...
	// PageMode Styles:
	//    1 : classic atom which just scrolls the screen without changing the cursor poistion
	//    2 : move the cursor a page then use atom's scrollToEntry(). This is similar to style 4 but produces a scroll as well as a
	//        cursor change to get to the edge of the view so its harder for the user to understand where they ended up.
	//    3 : move the cursor a page then scroll the view a full page so that the cursor appears to stay in the same place.
	//    4 : if the cursor is not already at the edge of the direction being traveled, move it to the edge without scrolling. This
	//        has the effect of being able to quickly get around the current page of entries without changing it until you need to.
	//    5 : if the cursor is at the opposite edge of travel, move it to the edge of the direction of travel but if its not, scroll
	//        by a whole page so it is like style 3
	// Params:
	//    <event>     : the ui event (mouse,keyboard,etc...) that caused the action
	//    <direction> : 1==down, -1==up
	scrollAPage(event, direction) {
		event && event.stopImmediatePropagation();

		// pagingParams has some input properties that determine the behavior and also some transient properties that are derived
		// from the current UI dimensions of the tree view. This updates the trasient properties based on the sizes of the tree view now.
		this.realizePagingParams();

		// most types of paging moves the cursor but the classic atom behavior only scrolls the view without changing the cursor selection
		let {selectedEntry, pixelOffestOfCursorMove} = this.moveSelectionBy(
				direction,
				(this.pagingParams.moveCursor)?(this.pagingParams.pageHeightInEntries-1):0,
				this.pagingParams.scrollType==4
			);

		// this block scrolls the viewport by setting this.element.scrollTop
		//      case 1: scroll by the actual client height even if its a uneven number of entries
		//      case 2: use atom's behavior to scroll the cursor selection into view if its not in view after the above block moved it
		//      case 3: scroll by the nearest of the greatest number of whole entries
		//      case 4: if the cursor is not fully in view, scroll by the actual pixel distance of the cursor move
		switch (this.pagingParams.scrollType) {
			case '1': this.element.scrollTop += direction*this.pagingParams.pageHeightInPixels; break
			case '2': this.scrollToEntry(this.selectedEntry(), false); break
			case '3': this.element.scrollTop += direction*this.pagingParams.pageHeightEvenEntries; break
			case '4':
			case '5':
				if (!this.isEntryInFullView(selectedEntry)) {
					this.element.scrollTop += direction*pixelOffestOfCursorMove
				}
				break
		}

		if (this.pagingParams.moveCursor)
			this.scrollEntryIntoFullView(selectedEntry);
	}

	// return false if any vertical part of the entry is not visible in the viewport
	isEntryInFullView(entry) {
		const entryHeight = this.getEntryHeight(entry);
		return (entry.offsetTop>=this.element.scrollTop && (entry.offsetTop+entryHeight)<=(this.element.scrollTop+this.element.clientHeight));
	}

	// if the entry is not fully within the viewport, scroll the minimum amount to make it fully visible
	scrollEntryIntoFullView(entry) {
		const entryHeight = this.getEntryHeight(entry);
		if (entry.offsetTop<this.element.scrollTop)
			this.element.scrollTop = entry.offsetTop;
		else if ( (entry.offsetTop+entryHeight)>(this.element.scrollTop+this.element.clientHeight) )
			this.element.scrollTop = (entry.offsetTop+entryHeight) - this.element.clientHeight;
	}

	// move the cursor selection <count> times in the <direction> indicated
	// Params:
	//    <direction>        : 1==down, -1==up
	//    <count>            : the number of times to move the cursor to its adjacent entry
	//    <stopAtEdgeOfView> : if true and the cursor is not already at the edge, stop at the edge of the view
	moveSelectionBy(direction, count, stopAtEdgeOfView) {
		// that atom tree-view allows there to be no selection sometimes. In that case we select the item at either the top or bottom
		// depending on the direction we are paging.
		var selectedEntry = this.selectedEntry() || this.getAdjacentEntry(null, direction)
		var selectedEntryInView = this.isEntryInFullView(selectedEntry);

		var pixelOffestOfCursorMove=0;
		for (let i = 0; i<count; i++) {
			const newEntry = this.getAdjacentEntry(selectedEntry, direction)
			if (!newEntry) break;
			const newEntryInView = this.isEntryInFullView(newEntry);
			if (stopAtEdgeOfView && i>0 && selectedEntryInView && !newEntryInView)
				break;
			selectedEntry = newEntry;
			selectedEntryInView = newEntryInView;
			pixelOffestOfCursorMove += (selectedEntry.matches('.expanded')) ? selectedEntry.children[0].offsetHeight : selectedEntry.offsetHeight;
		}
		selectedEntry && this.selectEntry(selectedEntry);
		return {selectedEntry, pixelOffestOfCursorMove};
	}
}



TreeViewPageUpDnModesPolyfill.config =  {
	'tree-view.pageUpDnMode': {
		"order": 1,
		"type": "integer",
		"default": 4,
		"title": "PageUp/Down behavior",
		"description": "Choose how the pageUp and pageDown commands behave in the tree view <br/>Note: this setting is being provided by a dynamic patch from bg-tree-view-toolbar package. It can be disabled from there. See [tree-view PR#NNNN](https://github.com/atom/tree-view/pull/NNNN)",
		enum: [
			{value: 1,  description: 'Classic Atom -- does not move the cursor'},
			{value: 3,  description: 'keep selection stationary in the view'},
			{value: 4,  description: 'move selection in direction of travel first'},
			{value: 5,  description: 'hybrid -- move in direction of travel only when starting from the other edge'},
		],
		radio: true
	}
}
