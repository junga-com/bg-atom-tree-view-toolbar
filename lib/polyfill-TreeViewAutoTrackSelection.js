import { PolyfillObjectMixin }        from 'bg-atom-utils'
import { BGFindWorkspaceItemFromURI } from 'bg-atom-utils'

export class TreeViewAutoTrackSelection extends PolyfillObjectMixin {
	constructor() {
		super(
			BGFindWorkspaceItemFromURI('atom://tree-view'),
			[]
		);

		// for degugging....
		// global.target = this.target;
		// global.poly = this;
	}

	// if this new config setting exists, (and we have not installed the polyfill yet) then the PR was probably accepted and distributed
	doesTargetAlreadySupportFeature() {
		return !this.isInstalled() && atom.config.getSchema('tree-view.autoTrackActivePane.enabled').type == 'boolean'
	}

	// if we can find the callback that TreeView registers with the workspace center then the code is probably still compatible with this patch
	isTargetStillCompatibleWithThisPollyfill() {
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
		console.assert(this.getStatus()!=PolyfillObjectMixin.sNoLongerCompatile, `PolyfillObjectMixin '${this.name}' can not be installed because the target Atom code has changed since it was written`);
		if (this.getStatus()!=PolyfillObjectMixin.sUninstalled) return;

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
				handlers[i] = (...p)=>{this.repondToActiveEditorFocusChange(...p)}
			}
		}

		// if the user had it set to the non-default value, then set it in its new place
		if (oldValue)
			atom.config.set('tree-view.autoTrackActivePane.autoReveal', true);
	}

	uninstall() {
		// this preamble is copied from the base implementation to make sure that we can run uninstall
		if (this.getStatus()!=PolyfillObjectMixin.sInstalled) return;

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
			this.target.selectActiveFile();
			if (autoReveal) {
				this.target.revealActiveFile({show: false, focus: false});
			}
		}
	}
}


TreeViewAutoTrackSelection.config =  {
	'tree-view.autoTrackActivePane' : {
		"type": "object",
		"title": "Auto Select Active Pane (polyfill for #1336)",
		"description": "The Active Pane is typically the focused editor buffer",
		"properties": {
			"enabled": {
				"order": 1,
				"title": "Enabled",
				"type": "boolean",
				"default": true,
				"description": "Change the selected tree node to reflect the active pane item as it changes. ([#1336](https://github.com/atom/tree-view/pull/1336))"
			},
			"autoReveal": {
				"order": 2,
				"title": "Auto Reveal",
				"type": "boolean",
				"default": false,
				"description": "If the new tree selection is not visible, expand and scroll as needed to reveal it into view. ([#1336](https://github.com/atom/tree-view/pull/1336))"
			}
		}
	}
};
