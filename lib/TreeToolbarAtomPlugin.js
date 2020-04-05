
import { CompositeDisposable } from 'atom';
import { BGAtomPlugin } from 'bg-atom-utils';
import { TreeToolbarView } from './TreeToolbarView';

// Plugin Class for Atom
class TreeToolbarAtomPlugin extends BGAtomPlugin {
	constructor(state) {
		super('bg-tree-view-toolbar', (state && 'shouldBeShown' in state) ? state : {shouldBeShown: true});

		this.view = null;
	
		this.addCommand("bg-tree-view-toolbar:show", ()=>this.lazyGetView().show());
		this.addCommand("bg-tree-view-toolbar:hide", ()=>this.view && this.view.hide());
		// more commands are registered by the TreeToolbarView

		// We do idempotent activation in lateActivate, in response to the tree-view coming into existence. Its almost always
		// active, and it gets activated before us when Atom starts because we declare needing it's service, but it can be
		// disabled and reenabed so we'd better support that.
		this.disposables.add(atom.packages.onDidActivatePackage((pkg)=>{
			if (pkg && pkg.name == "tree-view" ) {
				this.lateActivate();
			}
		}));
	}

	// lateActivate is registerd by the base class to be called after all packages are loaded.  
	// We create the view after all packages have had a chance to activate because we found that we can not reliably lookup keymaps
	// and cmds earlier than that event if they are from a package that activated before us.
	lateActivate() {
		this.lazyGetView();
	}

	// Everything in this class uses lazyGetView() to get at the this.view so that it can be created on demand. If it gets created
	// too early, the command buttons might not be created correctly so nothing called in the constructor should call this
	lazyGetView() {
		if (!this.view) {
			this.view = new TreeToolbarView(this.lastSessionsState.shouldBeShown);
			this.disposables.add(this.view);
		}
		return this.view;
	}

	// save our state so that on the next start its the same.
	serialize() {
		return {'shouldBeShown': (this.view && this.view.shouldBeShown)};
	}

	// getView<Version> returns a service API to work with the toolbar. Its like a public  
	// this is registered as a service in package.json and also available directly for other pacakges and init.js to use
	getViewV1() {
		return {
			isShown:         () => {return (this.view && this.view.isMounted())},
			show:            () => {return this.lazyGetView().show()},
			hide:            () => {return this.lazyGetView().hide()},
			addButton:       (btnName, button) => {return this.lazyGetView().addButton(btnName, button)},
			getButton:       (btnName) => {return this.lazyGetView().getButton(btnName)},
			removeButton:    (btnName) => {return this.lazyGetView().removeButton(btnName)},
			isButtonEnabled: (btnName) => {return this.lazyGetView().isButtonEnabled(btnName)},
			toggleButton:    (btnName, state) => {return this.lazyGetView().toggleButton(btnName, state)}
		};
	}
};

// this is the config schema that describes the settings that settings-view will make a UI for
TreeToolbarAtomPlugin.config =  {
	"buttons": {
	"type": "object",
	"title": "Choose which builtin buttons you want to use",
	"properties": {
		"btnBarCfg": {
			"order": 1,
			"type": "boolean",
			"default": true,
			"title": "Gear button for configuring the toolbar",
			"description": "This button takes you to this page in the settings view to configure it and learn how to customize it"
		},
		"btnHidden": {
			"order": 20,
			"type": "boolean",
			"default": true,
			"title": "Hidden Files Toggle",
			"description": "When this button is depressed, hidden files and folders will be shown in the tree"
		},
		"btnColAll": {
			"order": 30,
			"type": "boolean",
			"default": true,
			"title": "Enhanced Collapse All (Collapse To Root Level) Button",
			"description": "Click this to tidy up your tree. Its like collaspe all except the first level remains open"
		},
		"btnReveal": {
			"order": 40,
			"type": "boolean",
			"default": true,
			"title": "Auto Reveal Toggle",
			"description": "When this is depressed, the tree selection will automatically change to reflect the active editor.<br/> Note that if you dont see this button even though its enabled, its because the tree-view patch that supports it is not present. If you are fully updated and still dont see it, go vote for the [PR #1336](https://github.com/atom/tree-view/pull/1336)"
		},
		"fontGroup": {
			"order": 50,
			"type": "boolean",
			"default": true,
			"title": "Font Size Control Group (zoom in/out)",
			"description": "Zoom the the tree in and out. <br/>If you do not see these buttons, you need to install the bg-atom-ui-font-sizer package which provides the underlying commands that these buttons invoke."
		}
	}}
}


export default BGAtomPlugin.Export(TreeToolbarAtomPlugin);
