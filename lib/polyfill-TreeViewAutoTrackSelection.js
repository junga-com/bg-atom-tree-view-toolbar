import { PolyfillObjectMixin }        from 'bg-atom-utils'

const States = PolyfillObjectMixin.States;

export class TreeViewAutoTrackSelection extends PolyfillObjectMixin {
	constructor(configKey) {
		super(
			atom.workspace.getItemByURI('atom://tree-view'),
			['repondToActiveEditorFocusChange'],
			configKey
		);

		// the tree-view is configured to be permanent but it is still possible for it to come and go during a session
		atom.workspace.addDep_itemsOpenned("atom://tree-view", this, ()=>{this.sync();});

		this.sync();
	}

	getTarget() {return atom.workspace.itemForURI('atom://tree-view');}

	// if this new config setting exists, then the PR was probably accepted and distributed
	doesTargetAlreadySupportFeature() {return atom.config.existsSchema('tree-view.autoTrackActivePane.enabled')}

	isTargetStillCompatibleWithThisPollyfill() {
		// our new method calls these existing methods
		if (!this.existsInTarget('selectActiveFile,revealActiveFile'))
			return false;

		// now, if we can find the callback that TreeView registers with the workspace center then the code is probably still compatible with this patch
		const handlers = atom.workspace.getCenter().paneContainer.emitter.handlersByEventName["did-change-active-pane-item"];
		for (let i=0; i<handlers.length; i++) {
			if (/tree-view.autoReveal/.test(handlers[i])) {
				return true;
			}
		}
		return false;
	}


	// override install to migrate old AutoReveal setting value since this change changes its key (i.e. it moves it to a new location)
	install() {
		// this preamble is copied from the base implementation to make sure that we can run install
		console.assert(this.getStatus()!=States.NoLongerCompatile, `PolyfillObjectMixin '${this.name}' can not be installed because the target Atom code has changed since it was written`);
		if (this.getStatus()!=States.Uninstalled) return;

		deps.changeStart(this);

		// save the old tree-view.autoReveal value and then get rid of its schema
		const oldValue = atom.config.get('tree-view.autoReveal');
		atom.config.removeSchema('tree-view.autoReveal');
		this.origAutorevealSchema = atom.config.getSchema('tree-view.autoReveal');

		// do the normal polyfill install
		super.install();

		// find and replace the handler that TreeView registers with the workspace center object
		const handlers = atom.workspace.getCenter().paneContainer.emitter.handlersByEventName["did-change-active-pane-item"];
		for (let i=0; i<handlers.length; i++) {
			if (/tree-view.autoReveal/.test(handlers[i])) {
				this.prevHandler = handlers[i];
				handlers[i] = (...p)=>{this.target.repondToActiveEditorFocusChange(...p)}
			}
		}

		// if the user had it set to the non-default value, then set it in its new place
		if (oldValue)
			atom.config.set('tree-view.autoTrackActivePane.autoReveal', true);

		deps.changeEnd(this);
	}

	uninstall() {
		// this preamble is copied from the base implementation to make sure that we can run uninstall
		if (this.getStatus()!=States.Installed) return;

		// save the old tree-view.autoReveal value from the 'new' location that this patch put it at
		const oldValue = atom.config.get('tree-view.autoTrackActivePane.autoReveal');

		// do the normal polyfill uninstall
		super.uninstall();

		// find the handler that we replaced and restore it to its original value
		const handlers = atom.workspace.getCenter().paneContainer.emitter.handlersByEventName["did-change-active-pane-item"];
		for (let i=0; i<handlers.length; i++) {
			if (/repondToActiveEditorFocusChange/.test(handlers[i])) {
				handlers[i] = this.prevHandler;
			}
		}

		// restore the old AutoRevealSchema
		atom.config.setSchema('tree-view.autoReveal', this.origAutorevealSchema);
		atom.config.set('tree-view.autoReveal', oldValue);
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Polyfill Methods...
	// These methods are writtien in the context of the target object and will be dynamically added to that object when this polyfill
	// is installed.  If the name matches an existing method of the target object, it will be replaced and the original will be
	// available as orig_<methodName>
	// The 'this' pointer of these methods will be the target object, not the polyfill object when they are invoked.


	repondToActiveEditorFocusChange() {
		// its possible that some code is setting the value in the old location so if it ever shows up with the non-default value
		// at the old key location, move it to the new key location and remove the old key
		if (atom.config.get('tree-view.autoReveal')) {
			atom.config.set('tree-view.autoTrackActivePane.autoReveal', true);
			atom.config.unset('tree-view.autoReveal');
		}

		const autoTrackActivePane = atom.config.get('tree-view.autoTrackActivePane.enabled')
		const autoReveal = atom.config.get('tree-view.autoTrackActivePane.autoReveal')
		if (autoTrackActivePane) {
			this.selectActiveFile();
			if (autoReveal) {
				this.revealActiveFile({show: false, focus: false});
			}
		}
	}
}


TreeViewAutoTrackSelection.config =  {
	'tree-view.autoTrackActivePane' : {
		"type": "object",
		"title": "Auto Select Active Pane",
		"description": "The Active Pane is typically the focused editor buffer. <br/>Note: this setting is being provided by a dynamic patch from bg-tree-view-toolbar package. It can be disabled from there. See [tree-view PR#1336](https://github.com/atom/tree-view/pull/1336)",
		"properties": {
			"enabled": {
				"order": 1,
				"title": "Enabled",
				"type": "boolean",
				"default": true,
				"description": "Change the selected tree node to reflect the active pane item as it changes"
			},
			"autoReveal": {
				"order": 2,
				"title": "Auto Reveal",
				"type": "boolean",
				"default": false,
				"description": "If the new tree selection is not visible, expand and scroll as needed to reveal it into view"
			}
		}
	}
};
