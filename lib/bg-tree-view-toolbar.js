'use babel';

import { CompositeDisposable } from 'atom';
import { BGAtomPlugin } from 'bg-atom-utils';
import { TreeToolbarView } from './bg-TreeToolbarView';
import { BGToggleAtomRedomExamples } from 'bg-atom-redom-ui';

// Main Atom Plugin Class
class TreeToolBarAtomPlugin extends BGAtomPlugin {
	constructor() {
		super();
		// bgTreeViewToolbar = this; console.log("the global variable 'bgTreeViewToolbar' is available on the console to hack with the bg-tree-view-toolabr package code");
	}

	activate(state) {
		setTimeout(()=>{
			try {
				this.view = new TreeToolbarView();
				this.subscriptions.add(this.view);

				this.addCommand("bg-tree-view-toolbar:show", ()=>this.show());
				this.addCommand("bg-tree-view-toolbar:hide", ()=>this.hide());
				// more commands are registered by the TreeToolbarView

				this.addCommand("bg-redom-ui:toggle", ()=>BGToggleAtomRedomExamples());

				if (state && state.isShown)
					this.show();
			}
			catch (e) {
				console.log(e);
			}
		}, 1000)
	}

	// the defintion of whether its 'shown' is whether its DOM element is in the DOM. It will not be visible if the tree-view's tab
	// is not visible
	isShown() { return this.view && this.view.isMounted(); }

	// this inserts our view into the DOM at the top of the tree-view 
	show() {
		this.view.mount();
		if (!this.view.isMounted())
			atom.notifications.addError("package bg-tree-view-toolbar could not find a tree-view to work with");
	}

	// this removes our view from the DOM
	hide() {this.view.unmount();}

	// save our state so that on the next start its the same.
	serialize() {
		return {'isShown': this.isShown()};
	}
};

export default new TreeToolBarAtomPlugin
