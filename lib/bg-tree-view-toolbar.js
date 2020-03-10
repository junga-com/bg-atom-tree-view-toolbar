'use babel';

import { CompositeDisposable } from 'atom';
import { BGAtomPlugin } from 'bg-atom-utils';
import { TreeToolbarView } from './bg-TreeToolbarView';

// Main Atom Plugin Class
class TreeToolBarAtomPlugin extends BGAtomPlugin {
	constructor() {
		super();
		// bgTreeViewToolbar = this; console.log("the global variable 'bgTreeViewToolbar' is available on the console to hack with the bg-tree-view-toolabr package code");
	}

	activate(state) {
		try {
			this.view = new TreeToolbarView();
			this.subscriptions.add(this.view);

			this.addCommand("bg-tree-view-toolbar:show", ()=>this.show());
			this.addCommand("bg-tree-view-toolbar:hide", ()=>this.hide());
			// more commands are registered by the TreeToolbarView

			// this.addCommand("bg-tree-view:increase-font-size",  ()=>this.view.increaseTreeViewFontSize());
			// this.addCommand("bg-tree-view:decrease-font-size",  ()=>this.view.decreaseTreeViewFontSize());
			// this.addCommand("bg-tree-view:reset-font-size",     ()=>this.view.resetTreeViewFontSize());
			// this.addCommand("bg-tree-view:increase-line-height", ()=>this.view.increaseTreeViewLineHeight());
			// this.addCommand("bg-tree-view:decrease-line-height", ()=>this.view.decreaseTreeViewLineHeight());


			// import SelectListView from  'atom-select-list'
			// const usersSelectListView = new SelectListView({
			// 	items: ['Alice', 'Bob', 'Carol'],
			// 	elementForItem: (item) => {
			// 		const element = document.createElement('li');
			// 		element.innerHTML = item;
			// 		return element
			// 	}
			// });
			// this.view.el.appendChild(usersSelectListView.element)

			if (state && state.isShown)
				this.show();
		}
		catch (e) {
			console.log(e);
		}
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
