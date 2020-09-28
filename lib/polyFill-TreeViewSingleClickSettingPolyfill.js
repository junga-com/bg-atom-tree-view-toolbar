import { PolyfillObjectMixin }        from 'bg-dom'

export class TreeViewSingleClickSettingPolyfill extends PolyfillObjectMixin {
	constructor(configKey) {
		super(
			atom.workspace.getItemByURI('atom://tree-view'),
			['entryClicked'],
			configKey
		);

		// the tree-view is configured to be permanent but it is still possible for it to come and go during a session
		atom.workspace.addDep_itemOpenned("atom://tree-view", this, ()=>{this.sync();});

		this.sync();
	}


	getTarget() {return atom.workspace.itemForURI('atom://tree-view');}
	doesTargetAlreadySupportFeature() {return atom.config.existsSchema('tree-view.singleClickMode');}
	isTargetStillCompatibleWithThisPollyfill() {return this.existsInTarget('entryClicked,fileViewEntryClicked,selectEntry');}

	install() {
		super.install();
		// the default value for the new option is '1' to make it preserve the classic behavior by default but the user would only
		// enable this polyfill if they want the new behavior so this makes the default '2' when the polyfill is installed.
		atom.config.set('tree-view.singleClickMode',2)
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Polyfill Methods...
	// These methods are writtien in the context of the target object and will be dynamically added to that object when this polyfill
	// is installed.  If the name matches an existing method of the target object, it will be replaced and the original will be
	// available as orig_<methodName>
	// The 'this' pointer of these methods will be the target object, not the polyfill object when they are invoked.


	// entryClicked handles all mouse clicks. We provide a new implementation that calls the original implementation when it can.
	entryClicked(e) {
		// option set to classic atom behavior so just pass through to the original implementation
		if (atom.config.get('tree-view.singleClickMode')==1)
			this.orig_entryClicked(e);

		// its a dbl click so pass it on to the original implementation but if core.allowPendingPaneItems is enabled, demote the
		// dbl click to a single click so that the original implementation will open the file with the pending tab.
 		// hitting <enter> on the tree-view entry will cancel the pending mode for that entry.
		else if (e.detail==2) {
			if (atom.config.get('core.allowPendingPaneItems')==true)
				e.__defineGetter__('detail', ()=>{return 1})
			this.orig_entryClicked(e);

		// its a single click
		} else {
			const entry = e.target.closest('.entry');

			// clicked on directory arrow -> do the normal single click action which is to expand/colapse the directory
			if (entry && entry.classList.contains('directory') && e.offsetX <= 10)
				this.orig_entryClicked(e);

			// clicked elsewhere so only select the entry
			else
				entry && this.selectEntry(entry);
		}
	}
}



TreeViewSingleClickSettingPolyfill.config =  {
	'tree-view.singleClickMode': {
		"order": 1,
		"type": "integer",
		"default": 1,
		"title": "Mouse Single Click behavior",
		"description": "Choose how the mouse single click works in the tree view. If core.allowPendingPaneItems is enabled, the new behavior will make dbl click work like single click in classic mode openning a pending editor and leaving the focus in the tree view. The &lt;enter&gt; key will do what dbl click used to, openning a non-pending editor and setting focus in the editor<br/>Note: this setting is being provided by a dynamic patch from bg-tree-view-toolbar package. It can be disabled from there. See [tree-view PR#NNNN](https://github.com/atom/tree-view/pull/NNNN)",
		enum: [
			{value: 1,  description: 'Classic Atom -- open file or expand directory'},
			{value: 2,  description: 'select entry only'},
		],
		radio: true
	}
}
