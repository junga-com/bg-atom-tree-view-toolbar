import { BGAtomPlugin }                       from 'bg-atom-utils';
import { TreeToolbarView }                    from './TreeToolbarView';
import { TreeViewPageUpDnModesPolyfill }      from './polyFill-TreeViewPageUpDnModesPolyfill';
import { TreeViewSingleClickSettingPolyfill } from './polyFill-TreeViewSingleClickSettingPolyfill';
import { TreeViewAutoTrackSelection }         from './polyfill-TreeViewAutoTrackSelection'
import { TreeToolbarTutorial }                from './TreeToolbarTutorial';

// Plugin Class for Atom
export class TreeToolbarAtomPlugin extends BGAtomPlugin {
	constructor(state) {
		super('bg-tree-view-toolbar', (state && 'shouldBeShown' in state) ? state : {shouldBeShown: true}, __filename);

		this.view = null;

		this.addCommand("bg-tree-view-toolbar:show",         ()=>this.lazyGetView().show());
		this.addCommand("bg-tree-view-toolbar:hide",         ()=>this.view && this.view.hide());
		this.addCommand("bg-tree-view-toolbar:run-tutorial", ()=>atom.config.set('bg-tree-view-toolbar.showWelcomeOnActivation'));

		// more commands are registered by the TreeToolbarView

		// These are polyfills that change the behavior of the tree-view package when they are installed.
		this.poyfillPagingModes = new TreeViewPageUpDnModesPolyfill(     'bg-tree-view-toolbar.polyfills.enablePgUpDnPatch');
		this.poyfillSingleClick = new TreeViewSingleClickSettingPolyfill('bg-tree-view-toolbar.polyfills.enableSingleClickPatch');
		this.polyfillAutoTrack  = new TreeViewAutoTrackSelection(        'bg-tree-view-toolbar.polyfills.optionalCursorTracking');

		TreeToolbarTutorial.configure('bg-tree-view-toolbar.showWelcomeOnActivation');
	}

	// lateActivate is registerd by the base class to be called after all packages are loaded.
	// We create the view after all packages have had a chance to activate because we found that we can not reliably lookup keymaps
	// and cmds earlier than that event even if they are from a package that activated before us.
	lateActivate() {
		this.lazyGetView();
	}

	// Everything in this class uses lazyGetView() to get at the this.view so that it can be created on demand. If it gets created
	// too early, the command buttons might not be created correctly so nothing called in the constructor should call this
	lazyGetView() {
		if (!this.view) {
			this.view = new TreeToolbarView(this, this.lastSessionsState.shouldBeShown);
			this.disposables.add(this.view);
		}
		return this.view;
	}

	// save our state so that on the next start its the same.
	serialize() {
		return {'shouldBeShown': (this.view && this.view.shouldBeShown)};
	}

	// getView<Version> returns a service API to work with the toolbar. Its like a public API, exposing only certain parts of this
	// class bound to the singleton plugin instance.
	// this is registered as a service in package.json and also available directly for other pacakges and init.js to use
	getViewV1() {
		return {
			isShown:         () => {return (this.view && this.view.isMounted())},
			show:            () => {return this.lazyGetView().show()},
			hide:            () => {return this.lazyGetView().hide()},
			getTreeView:     () => {return this.lazyGetView().getTreeView()},
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
	"order": 0,
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
		"btnTrack": {
			"order": 40,
			"type": "boolean",
			"default": false,
			"title": "Auto Track Toggle",
			"description": "When this is depressed (the default), the tree selection will automatically change to reflect the active editor.<br/> Note that this feature requires a change ([PR #1336](https://github.com/atom/tree-view/pull/1336)) that has be submitted to the tree-view project."
		},
		"fontGroup": {
			"order": 50,
			"type": "boolean",
			"default": true,
			"title": "Font Size Control Group (zoom in/out)",
			"description": "Zoom the the tree in and out. <br/>If you do not see these buttons, you need to install the bg-atom-ui-font-sizer package which provides the underlying commands that these buttons invoke."
		}
	}},
	"polyfills": {
	"order": 0,
	"type": "object",
	"title": "Dynamic Patches that Enhance the Tree-View",
	"description": "These dynamic patches may or may not work depending on if the atom code has changed since I last updated this package but should do no harm in any case. If there is a pull request (PR) link in the description you can voice your support to get this feature added statically",
	"properties": {
		"enablePgUpDnPatch": {
			"type": "boolean",
			"default": false,
			"title": "Page Up/Dn Patch",
			"description": "This dynamic patch adds an option to the tree-view package settings to select one of several types of PgUp/PgDn behaviors. [PR #NNNN](https://github.com/atom/tree-view/pull/NNNN)  will add this to the tree-view project."
		},
		"optionalCursorTracking": {
			"type": "boolean",
			"default": false,
			"title": "Auto Track Code Patch",
			"description": "This dynamic patch adds an option to the tree-view package settings to turn off the feature that changes the tree view selection to reflect the focused editor tab. [tree-view PR #1336](https://github.com/atom/tree-view/pull/1336) will add this to the tree-view project."
		},
		"enableSingleClickPatch": {
			"type": "boolean",
			"default": false,
			"title": "Single Click Behaior Patch",
			"description": "This dynamic patch adds an option to the tree-view package settings to configure how the single mouse click works. [PR #NNNN](https://github.com/atom/tree-view/pull/NNNN) will add this to the tree-view project."
		}
	}},
	"showWelcomeOnActivation": {
		"type": "boolean",
		"default": true,
		"title": "Show Welcome Tutorial",
		"description": "Checking this will activate the welcome dialog one more time"
	}
}


export default BGAtomPlugin.Export(TreeToolbarAtomPlugin);
