import { PolyfillObjectMixin }        from 'bg-atom-utils'
import { BGFindWorkspaceItemFromURI } from 'bg-atom-utils'

export class TreeViewPageUpDnModesPolyfill extends PolyfillObjectMixin {
	constructor() {
		super(
			BGFindWorkspaceItemFromURI('atom://tree-view'),
			['pageMode','realizePagingParams','pageUp','pageDown','getAdjacentEntry','scrollAPage']
		);

		// for degugging....
		// global.target = this.target;
		// global.poly = this;

		// 1==onlyScroll, 2==onlyChangeSelectedEntry 3==scrollAndChangeSelectionIntoView
		Reflect.defineProperty( this, 'pageMode', {
		  configurable: true,
		  enumerable: true,
		  get: function () {return this.pagingParams && this.pagingParams.pageMode},
		  set: function (pageMode) {
			if ((typeof pageMode) != 'object') switch (pageMode) {
				case 2:  pageMode = {pageMode: pageMode, moveCursor: true, entryOffset: -1, scrollType: '2', pixelOffset: 0}; break;
				case 3:  pageMode = {pageMode: pageMode, moveCursor: true, entryOffset: -1, scrollType: '3', pixelOffset: 0}; break;
				case 4:  pageMode = {pageMode: pageMode, moveCursor: true, entryOffset: -1, scrollType: '4', pixelOffset: 0}; break;
				default: pageMode = {pageMode: 1,        moveCursor: false,                 scrollType: '1', pixelOffset: 0}
			}
			this.pagingParams = pageMode
		  }
		})
		this.pageMode = 4
	}

	doesTargetAlreadySupportFeature() {return !!this.target.pageMode;}
	isTargetStillCompatibleWithThisPollyfill() {return true;}


	// this fills in the pagingParams with the calculated page size in number of entries that fit in a page and in pixels.
	// this assumes that all entries have the same height. There are some pageModes that handle non uniform entry heights that will
	// not use these parameters
	realizePagingParams() {
		// get any entry and query its height. A directory entry contains a child for itself and a child for all its descendants
		var entry = this.getAdjacentEntry(null, true);
		this.pagingParams.entryHeight = (!entry) ? 25 : (entry.matches('.expanded') && entry.children[0].offsetHeight)
			? entry.children[0].offsetHeight
			: entry.offsetHeight;

		// the number of entries that fit in a visible page
		this.pagingParams.pageHeightInEntries = Math.floor(this.element.clientHeight / this.pagingParams.entryHeight) + this.pagingParams.entryOffset

		// the actual height of the visible page in pixels
		this.pagingParams.pageHeightInPixels = this.element.clientHeight + this.pagingParams.pixelOffset

		// this is the closest page height in pixels which is an even number of entries high.
		this.pagingParams.pageHeightEvenEntries = this.pagingParams.pageHeightInEntries*this.pagingParams.entryHeight + this.pagingParams.pixelOffset
	}

	// given a entry, get the entry immediately above or below it taking into account the collasped directories.
	// direction==true is down and false is up. If there is no adjacent entry in the direction, it returns null
	// if the entry passed in is null, it returns either the first entry if direction is true or the last one if direction is false.
	getAdjacentEntry(entry, direction) {
		if (!entry) {
			var entries = this.list.querySelectorAll('.entry')
			return entries[(direction) ? 0 : entries.length-1]
		}

		var nextEntry
		if (direction) {
			if (entry.classList.contains('directory') && entry.entries.children[0])
				nextEntry = entry.entries.children[0];
			else
				nextEntry = this.nextEntry(entry);
		} else
			nextEntry = this.previousEntry(entry) || entry.parentElement.closest('.directory');
		return (entry === nextEntry) ? null : nextEntry
	}


	pageUp(event) {
		return this.scrollAPage(event, false);
	}

	pageDown(event) {
		return this.scrollAPage(event, true);
	}


	scrollAPage(event, direction) {
		event && event.stopImmediatePropagation();
		this.realizePagingParams();

		let pixelOffset = 0;
		var selectedEntry = this.selectedEntry() || this.getAdjacentEntry(null, direction)
		if (this.pagingParams.moveCursor) {
			let visCount=0;
			for (let i = 0; i<this.pagingParams.pageHeightInEntries; i++) {
				const newEntry = this.getAdjacentEntry(selectedEntry, direction)
				if (!newEntry) break;
				selectedEntry = newEntry;
				pixelOffset += (selectedEntry.matches('.expanded')) ? selectedEntry.children[0].offsetHeight : selectedEntry.offsetHeight;
			}
			selectedEntry && this.selectEntry(selectedEntry)
		}

		var dir = (direction) ? 1 : -1;
		switch (this.pagingParams.scrollType) {
			case '1': this.element.scrollTop += dir*this.pagingParams.pageHeightInPixels; break
			case '3': this.element.scrollTop += dir*this.pagingParams.pageHeightEvenEntries; break
			case '4':
				if (selectedEntry.offsetTop<this.element.scrollTop || (selectedEntry.offsetTop+selectedEntry.offsetHeight)>(this.element.scrollTop+this.element.clientHeight))
					this.element.scrollTop += dir*pixelOffset
				break
		}

		if (this.pagingParams.scrollIntoView) {
			this.scrollToEntry(this.selectedEntry(), false)
		}
	}
}


TreeViewPageUpDnModesPolyfill.config =  {
	'tree-view.pageUpDnMode': {
		"order": 1,
		"type": "integer",
		"default": 4,
		"title": "PageUp/Down behavior",
		"description": "Choose how the pageUp and pageDown keys behave in the tree view",
		enum: [
	      {value: 1,  description: 'Classic Atom -- does not move the cursor'},
		  {value: 2,  description: 'scroll type 2'},
		  {value: 3,  description: 'scroll type 3'},
		  {value: 4,  description: 'scroll type 4'},
		],
	    radio: true
	}
}
