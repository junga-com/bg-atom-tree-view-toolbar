
import { CompositeDisposable } from 'atom';
import { OnDidChangeAnyConfig } from 'bg-atom-utils';
import { Component, getEl } from 'bg-atom-redom-ui';
import { mount, unmount } from 'redom'; // TODO: replace this with Componet::attatchToDom
import { PackageConfigButton, HiddenFilesToggle, AutoRevealToggle, CollapseToRootLevelButton, FontSizeButtonGroup } from './treeViewButtons.js';

// This is a panel-heading view for the tree-view. It provides controls to change commons tree-view settings and new actions.
export class TreeToolbarView extends Component {
	constructor(isShown, ...p) {
		super('$div.bg-tree-view-toolbar.bg-toolbar.tool-panel.panel-heading', ...p);
		this.shouldBeShown = (isShown == undefined) ? true : isShown;

		this.disposables = new CompositeDisposable();

		this.mount([
			new PackageConfigButton(      'btnBarCfg:', 'bg-tree-view-toolbar', this.btnGetConfigEnabled('btnBarCfg') ? null : {display:'none'}),
			new HiddenFilesToggle(        'btnHidden:.inline-block-tight',      this.btnGetConfigEnabled('btnHidden') ? null : {display:'none'}),
			new CollapseToRootLevelButton('btnColAll:.inline-block-tight',      this.btnGetConfigEnabled('btnColAll') ? null : {display:'none'}),
			new AutoRevealToggle(         'btnReveal:.inline-block-tight',      this.btnGetConfigEnabled('btnReveal') ? null : {display:'none'}),
			new FontSizeButtonGroup(      'fontGroup:.inline-block-tight',      this.btnGetConfigEnabled('fontGroup') ? null : {display:'none'})
		]);

		// register cmds that just push our buttons so that they are garanteed to to exactly what the user button click does
		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:toggle-hidden",          ()=>this.btnHidden.onClick()));
		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:collapse-to-root-level", ()=>this.btnColAll.onClick()));
		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:toggle-auto-reveal",     ()=>this.btnReveal.onClick()));

		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:edit-hidden-list",       ()=>this.btnHidden.editHiddenList()));
		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:edit-toolbar-config",    ()=>this.btnBarCfg.onClick()));

		// register our onTreeViewActivate method to get call when the tree-view tab becomes active (see onTreeViewActivate comment)
		this.disposables.add(atom.workspace.onDidStopChangingActivePaneItem((item)=>{
			if (item && item.constructor.name == "TreeView" )
				this.onTreeViewActivate();
		}))

		// remove the 'Split ...' context menu items from our toolbar
		// the remove function is patched in by the Context-Menu-Remove package
		if (atom.contextMenu.remove)
			this.disposables.add(atom.contextMenu.remove({".bg-tree-view-toolbar": ["Split Up", "Split Down", "Split Right", "Split Left", "Close Pane"]}))

		// add conext menu to edit config
		this.disposables.add(atom.contextMenu.add({".bg-tree-view-toolbar":[{label:"configure toolbar", command:"bg-tree-view:edit-toolbar-config"}]}))
		

		//  watch for changes to our config button visibility
		this.disposables.add(OnDidChangeAnyConfig('bg-tree-view-toolbar.buttons', (cfgKey,e)=>{
			this.toggleButton(cfgKey.replace(/^.*buttons./,''), e.newValue)
		}));

		this.getTreeView();

		// the keyMaps might not be read yet so make the tooltips after a delay
		setTimeout(()=>{this.registerTooltips()}, 1000);

		if (this.shouldBeShown)
			this.show();
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
		if (!this.getTreeView()) return
		mount(this.treeViewEl.parentNode, this.el, this.treeViewEl);
		// tool-panels are positioned absolute so we need to move down the top to make room for us
		this.treeViewEl.style.top = this.getHeight();

		if (!this.isMounted())
			atom.notifications.addError("package bg-tree-view-toolbar could not find a tree-view to work with");
	}

	// change state to be not shown
	hide() {
		this.shouldBeShown = null;
		this.removeFromTreeView();
	}

	// remove us from the DOM
	removeFromTreeView() {
		if (!this.isMounted()) return
		unmount(this.el.parentNode, this.el);
		// move the top of the tree-view back where it was
		if (this.treeViewEl)
		 	this.treeViewEl.style.top = "0px";
	}

	// the defintion of whether we are 'mounted' is whether we are attached to the tree-view node in the DOM. It may not be visible
	// even if its mounted because the tree-view is not active/visible
	isMounted() {
		return this.getTreeView() && this.el.parentNode != null;
	}

	getElement() { return this.el;}

	// b/c we mount ourselves at the same level as WorkplaceItems (see mount comment), every time the user activates a different
	// tab, the switcher code sets our display to none. When the tree view gets activated, we have to undo that.
	onTreeViewActivate() {
		if (this.shouldBeShown && !this.isMounted())
			this.show();
		if (this.treeViewEl)
			this.treeViewEl.style.top = this.getHeight();
		this.el.style.display = 'inherit';
	}

	getTreeView() {
		if (!this.treeViewEl)
			this.treeViewEl = document.querySelector('.tree-view.tool-panel');		
		return this.treeViewEl;
	}

	registerTooltips() {
		if (!this.getTreeView()) return

		this.disposables.add(atom.tooltips.add(this.btnHidden.el, {title: "show hidden files",                            keyBindingCommand: 'bg-tree-view:toggle-hidden',          keyBindingTarget: this.treeViewEl}));
		this.disposables.add(atom.tooltips.add(this.btnColAll.el, {title: "collapse to root level",                       keyBindingCommand: 'bg-tree-view:collapse-to-root-level', keyBindingTarget: this.treeViewEl}));
		this.disposables.add(atom.tooltips.add(this.btnReveal.el, {title: "make selected tree item follow active editor", keyBindingCommand: 'bg-tree-view:toggle-auto-reveal',     keyBindingTarget: this.treeViewEl}));
	}

	dispose() {this.destroy()}
	
	destroy() {
		this.removeFromTreeView();
		this.disposables.dispose();
	}
}
