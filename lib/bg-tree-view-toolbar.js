
import { CompositeDisposable } from 'atom';
import { BGAtomPlugin } from 'bg-atom-utils';
import { TreeToolbarView } from './bg-TreeToolbarView';

// const CompositeDisposable    = require('atom').CompositeDisposable;
// const BGAtomPlugin           = require('bg-atom-utils').BGAtomPlugin;
// const TreeToolbarView        = require('./bg-TreeToolbarView').TreeToolbarView;
// 
// Main Atom Plugin Class
class TreeToolBarAtomPlugin extends BGAtomPlugin {
	constructor() {
		super();
		// bgTreeViewToolbar = this; console.log("the global variable 'bgTreeViewToolbar' is available on the console to hack with the bg-tree-view-toolabr package code");
	}

	activate(state) {
		super.activate();
		this.lastSessionsState = state || {};
		this.addCommand("bg-tree-view-toolbar:show", ()=>this.show());
		this.addCommand("bg-tree-view-toolbar:hide", ()=>this.hide());
		// more commands are registered by the TreeToolbarView

		// We do idempotent activation in response to the tree-view. Its almost always active, but it can be disabled and reenabed.
		// Also, we delay the initial activation until all packages have had a chance to activate because we found that we can not
		// reliably lookup keymaps earlier than that.
		this.disposables.add(atom.packages.onDidActivatePackage((pkg)=>{
			if (pkg && pkg.name == "tree-view" )
				this.lateActivate();
		}));
	}

	lateActivate() {
		this.getView();
	}

	getView() {
		if (!this.view) {
			this.view = new TreeToolbarView(this.lastSessionsState.shouldInitiallyBeShown);
			this.subscriptions.add(this.view);
		}
		return this.view;
	}

	// the defintion of whether its 'shown' is whether its DOM element is in the DOM. It will not be visible if the tree-view's tab
	// is not visible
	isShown() { return this.view && this.view.isMounted(); }

	// this inserts our view into the DOM at the top of the tree-view 
	show() {
		if (!this.getView()) return
		this.view.show();
		if (!this.view.isMounted())
			atom.notifications.addError("package bg-tree-view-toolbar could not find a tree-view to work with");
	}

	// this removes our view from the DOM
	hide() {this.view.hide();}

	// save our state so that on the next start its the same.
	serialize() {
		return {'shouldInitiallyBeShown': this.isShown()};
	}

	destroy() {
		BGAtomRedomExamples.Singleton('deactivate')
		super.destroy();
	}
};


//export default new TreeToolBarAtomPlugin()
module.exports = new TreeToolBarAtomPlugin()
