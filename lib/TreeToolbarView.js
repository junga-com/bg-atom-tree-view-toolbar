import { Disposables } from 'bg-atom-utils';
import { Component, getEl } from 'bg-dom';
import { mount, unmount } from 'bg-dom'; // TODO: replace this with Componet::attatchToDom or similar
import { PackageConfigButton, HiddenFilesToggle, TreeViewAutoTrackToggle, CollapseToRootLevelButton, FontSizeButtonGroup } from './treeViewButtons.js';

// This is a panel-heading view for the tree-view. It provides controls to change commons tree-view settings and new actions.
export class TreeToolbarView extends Component {
	constructor(plugin, isShown, ...p) {
		super('$div.bg-tree-view-toolbar.bg-toolbar.tool-panel.panel-heading', ...p);
		this.plugin = plugin;
		this.shouldBeShown = (isShown == undefined) ? true : isShown;
		this.treeView = undefined;   // the real treeView object
		this.treeViewEl = undefined; // the DOM element of the treeView object

		this.mount([
			new PackageConfigButton(      'btnBarCfg:', 'bg-tree-view-toolbar', this.btnGetConfigEnabled('btnBarCfg') ? null : {display:'none'}),
			new HiddenFilesToggle(        'btnHidden:.inline-block-tight',      this.btnGetConfigEnabled('btnHidden') ? null : {display:'none'}),
			new CollapseToRootLevelButton('btnColAll:.inline-block-tight',      this.btnGetConfigEnabled('btnColAll') ? null : {display:'none'}),
			new TreeViewAutoTrackToggle(  'btnTrack:.inline-block-tight',      this.btnGetConfigEnabled('btnTrack') ? null : {display:'none'}),
			new FontSizeButtonGroup(      'fontGroup:.inline-block-tight',      this.btnGetConfigEnabled('fontGroup') ? null : {display:'none'})
		]);

		// register cmds that just push our buttons so that they are garanteed to to exactly what the user button click does
		this.plugin.addCommand("bg-tree-view:toggle-hidden",          ()=>this.btnHidden.onClick());
		this.plugin.addCommand("bg-tree-view:collapse-to-root-level", ()=>this.btnColAll.onClick());
		this.plugin.addCommand("bg-tree-view:toggle-auto-reveal",     ()=>this.btnTrack.onClick());

		this.plugin.addCommand("bg-tree-view:edit-hidden-list",       ()=>this.btnHidden.editHiddenList());
		this.plugin.addCommand("bg-tree-view:edit-toolbar-config",    ()=>this.btnBarCfg.onClick());

		// if the tree-view is not openned when atom starts but later is openned, we need to install ourselves
		atom.workspace.addDep_item("atom://tree-view", this, (...p)=>{this.onTreeViewStateChange(...p);});

		// remove the 'Split ...' context menu items from our toolbar
		// the remove function is patched in by the Context-Menu-Remove package
		if (atom.contextMenu.remove)
			this.disposables.add(atom.contextMenu.remove({".bg-tree-view-toolbar": ["Split Up", "Split Down", "Split Right", "Split Left", "Close Pane"]}))

		// add conext menu to edit config
		this.disposables.add(atom.contextMenu.add({".bg-tree-view-toolbar":[{label:"configure toolbar", command:"bg-tree-view:edit-toolbar-config"}]}))


		//  watch for changes to our config button visibility
		atom.config.addDep('bg-tree-view-toolbar.buttons', this, ({key,newValue})=>{this.toggleButton(key.replace(/^.*buttons./,''), newValue)});

		// the keyMaps might not be read yet so make the tooltips after a delay
		setTimeout(()=>{this.registerTooltips()}, 1000);

		this.syncWithDOM();
	}

	destroy() {
		// force removal from DOM
		this.syncWithDOM(true);
		super.destroy();
	}

	addButton(btnName, button) {
		return this.mount(btnName, button);
	}

	getButton(btnName) {
		return this[btnName];
	}

	removeButton(btnName) {
		if (!this[btnName]) return false;
		return this.unmount(btnName);
	}

	isButtonEnabled(btnName) {
		return (this[btnName]) && (getEl(this[btnName]).style.display != 'none')
	}

	toggleButton(btnName, state) {
		if (!this[btnName]) return;
		if (state == null)
			state = ! this.isButtonEnabled(btnName);
		getEl(this[btnName]).style.display = (state) ? '' : 'none';
	}

	btnGetConfigEnabled(btnName) {
		return (atom.config.get('bg-tree-view-toolbar.buttons.'+btnName));
	}

	getHeight() {
		var cStyles = window.getComputedStyle(this.el, null);
		var h1 = parseInt(cStyles.height);
		var vertMargin = parseInt(cStyles.marginTop) + parseInt(cStyles.marginBottom);
		return Math.min(h1 + vertMargin, 100) +'px';
	}

	// this inserts our view into the DOM before the .tool-panel.tree-view
	// we do not insert inside .tool-panel.tree-view because we dont want to scroll with the tree data.
	// becuase we are outside .tool-panel.tree-view, we are at the same level as other WorkplaceItems (aka tab items) so switching
	// items automatically display:none 's us.
	show() {
		this.shouldBeShown = true;
		this.syncWithDOM();
	}

	// change state to be not shown
	hide() {
		this.shouldBeShown = null;
		this.syncWithDOM();
	}

	// we register this callback method to be invoked whenever the state of the tree-view item changes. This includes the tree-view
	// package being activated/deactivated, the tree-view item being openned/added or closed/remove from the workspace and when it
	// is focused or blured
	onTreeViewStateChange() {
		this.syncWithDOM();

		// if the treeViewEl is visible, we should be too.
		// As part of the pane behavior, when an item is activated, all the others have display set to 'none' Our element is at the
		// same level so it is hidden also. In the case that the tree-view is the activate item, we clear that display=none
		if (this.treeView && this.treeView.isVisible && this.treeView.isVisible())
			this.el.style.display = 'inherit';
	}

	// This will either mount our element to the DOM, remove it, or move its location in the DOM to reflect the this.shouldBeShown
	// state and whether the treeView's element is in the DOM and where.
	syncWithDOM(uninstall=false) {
		// set treeView and treeViewEl to the tree-view item if its open. Set to null if its not available
		this.getTreeView();

		// shouldBeMounted is shouldBeShown and the tree-view is available in the DOM to mount to and we are not uninstalling the pkg
		const shouldBeMounted = this.shouldBeShown && (this.treeViewEl&&this.treeViewEl.parentNode) && !uninstall;

		if (shouldBeMounted && !this.isMountedNextToTreeView()) {
			// mount it
			mount(this.treeViewEl.parentNode, this.el, this.treeViewEl);

			// tool-panels are positioned absolute so we need to move down the top to make room for us
			this.treeViewEl.style.top = this.getHeight();

		} else if (!shouldBeMounted && this.el.parentNode) {
			// remove it
			unmount(this.el.parentNode, this.el);
			if (this.treeViewEl)
			 	this.treeViewEl.style.top = "0px";
		}
	}

	// set treeView and treeViewEl to the tree-view item if its open. Set to null if its not available
	getTreeView() {
		this.treeView = atom.workspace.itemForURI('atom://tree-view');
		this.treeViewEl = null;
		if (this.treeView)
			this.treeViewEl = this.treeView.element;
		if (!this.treeViewEl)
			this.treeViewEl = document.querySelector('.tree-view.tool-panel');
		return this.treeViewEl;

	}

	// the defintion of whether we are 'mounted' is whether we are attached to the tree-view node in the DOM. It may not be visible
	// even if its mounted because the tree-view is not active/visible
	isMountedNextToTreeView() {
		return this.treeViewEl && this.treeViewEl.parentNode && this.el.parentNode && (this.treeViewEl.parentNode === this.el.parentNode);
	}

	getElement() { return this.el;}


	registerTooltips() {
		if (!this.getTreeView()) return

		this.disposables.add(atom.tooltips.add(this.btnHidden.el, {title: "show hidden files",                            keyBindingCommand: 'bg-tree-view:toggle-hidden',          keyBindingTarget: this.treeViewEl}));
		this.disposables.add(atom.tooltips.add(this.btnColAll.el, {title: "collapse to root level",                       keyBindingCommand: 'bg-tree-view:collapse-to-root-level', keyBindingTarget: this.treeViewEl}));
		this.disposables.add(atom.tooltips.add(this.btnTrack.el, {title: "make selected tree item follow active editor", keyBindingCommand: 'bg-tree-view:toggle-auto-reveal',     keyBindingTarget: this.treeViewEl}));
	}
}
