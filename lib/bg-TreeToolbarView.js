'use babel';

import { CompositeDisposable } from 'atom';
import { ToggleButton, CommandButton, Button, ToolGroup } from 'bg-atom-redom-ui';
import { el, list, mount, unmount, setAttr } from 'redom';
// import { BGAtomTreeItemFontSizer } from 'bg-atom-utils';

// This is a panel-heading view for the tree-view. It provides controls to change commons tree-view settings and new actions.
export class TreeToolbarView {
	constructor(parent) {
		this.el = el("div.bg-toolbar.tool-panel.panel-heading")
		this.treeViewEl = document.querySelector('.tree-view.tool-panel');

		// this.treeItemFontSizer = new BGAtomTreeItemFontSizer(this.treeViewEl);

		// get notified when the tree-view tab becomes active (see onTreeViewActivate comment)
		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem((item)=>{
			if (item && item.constructor.name == "TreeView" )
				this.onTreeViewActivate()
		}))

		mount(this.el, this.btnHidden  = new ToggleButton(".*",          (state)=>{this.toggleIgnoredFileDisplay(state);},{pressed:!atom.config.get("tree-view.hideIgnoredNames"), attr: {class: 'inline-block-tight'}}));
		mount(this.el, this.btnColAll  = new Button(      "1st Lvl",             ()=>{this.collapseToRootLevel();},                  {attr: {class: 'inline-block-tight'}}));
		mount(this.el, this.btnReveal  = new ToggleButton("auto reveal", (state)=>{this.toggleAutoReveal(state);},        {pressed:atom.config.get("tree-view.autoReveal") != "none", attr: {class: 'inline-block-tight'}}));
		mount(this.el, this.fontGroup = new ToolGroup({
			attr: {class: 'inline-block-tight'},
			children: [
				["btnReset",   new CommandButton("bg-tree-view:reset-font-size",    "icon-text-size" )],
				["btnSmaller", new CommandButton("bg-tree-view:decrease-font-size", "-",              {attr: {style: {paddingLeft:"0.5em", paddingRight:"0.5em"}}})],
				["btnBigger",  new CommandButton("bg-tree-view:increase-font-size", "+",              {attr: {style: {paddingLeft:"0.5em", paddingRight:"0.5em"}}})]
			]
		}));

		this.subscriptions.add(atom.commands.add('atom-workspace', "bg-tree-view:toggle-hidden",          ()=>this.btnHidden.onClick()));
		this.subscriptions.add(atom.commands.add('atom-workspace', "bg-tree-view:collapse-to-root-level", ()=>this.btnHidden.onClick()));
		this.subscriptions.add(atom.commands.add('atom-workspace', "bg-tree-view:toggle-auto-reveal",     ()=>this.btnReveal.onClick()));

		// the keyMaps might not be read yet so make the tooltips after a delay
		setTimeout(()=>{
			this.subscriptions.add(atom.tooltips.add(this.btnHidden.el, {title: "show hidden files",                  keyBindingCommand: 'bg-tree-view:toggle-hidden',          keyBindingTarget: this.treeViewEl}));
			this.subscriptions.add(atom.tooltips.add(this.btnColAll.el, {title: "collapse to root level",             keyBindingCommand: 'bg-tree-view:collapse-to-root-level', keyBindingTarget: this.treeViewEl}));
			this.subscriptions.add(atom.tooltips.add(this.btnReveal.el, {title: "make selected tree item follow active editor", keyBindingCommand: 'bg-tree-view:toggle-auto-reveal',     keyBindingTarget: this.treeViewEl}));
		}, 1000)


		// mount([
		// 	[this.el, new ToggleButton(".*",          (state)=>{this.toggleIgnoredFileDisplay(state);},{pressed:!atom.config.get("tree-view.hideIgnoredNames")})],
		// 	[this.el, new Button(      "collaspe all",     ()=>{this.collapseToRootLevel();},                  {})],
		// 	[this.el, new ToggleButton("auto reveal", (state)=>{this.toggleAutoReveal(state);},        {pressed:atom.config.get("tree-view.autoReveal")})],
		// 	[this.el, new Button(      "bigger",           ()=>{this.increaseTreeViewFontSize();},     {})],
		// 	[this.el, new Button(      "smaller",          ()=>{this.decreaseTreeViewFontSize();},     {})],
		// 	[this.el, new Button(      "reset",            ()=>{this.resetTreeViewFontSize();},        {})]
		// ])
	}

	toggleIgnoredFileDisplay(state) {
		atom.config.set("tree-view.hideIgnoredNames", !state);
	}

	collapseToRootLevel() {
		if (!this.isMounted()) return
		atom.commands.dispatch(this.treeViewEl, 'tree-view:collapse-all');
		atom.commands.dispatch(this.treeViewEl, 'core:move-to-top');
		atom.commands.dispatch(this.treeViewEl, 'tree-view:expand-item');
	}

	toggleAutoReveal(state) {
		var currentVal = atom.config.get("tree-view.autoReveal")
		if (state && currentVal == "none") {
			atom.config.set("tree-view.autoReveal", "selectAndScroll")			
			if (this.isMounted())
				atom.commands.dispatch(this.treeViewEl, 'tree-view:reveal-active-file');
		} else if (!state && currentVal != "none") {
			atom.config.set("tree-view.autoReveal", "none")			
		}
	}

	// increaseTreeViewFontSize() {
	// 	this.treeItemFontSizer.adjustFontSize( 1 );
	// }
	// decreaseTreeViewFontSize() {
	// 	this.treeItemFontSizer.adjustFontSize( -1 );
	// }
	// resetTreeViewFontSize() {
	// 	this.treeItemFontSizer.resetFontSize();
	// }
	// increaseTreeViewLineHeight() {
	// 	this.treeItemFontSizer.adjustItemLineHightPercentage(10);
	// }
	// decreaseTreeViewLineHeight() {
	// 	this.treeItemFontSizer.adjustItemLineHightPercentage(-10);
	// }

	getHeight() {
		var cStyles = window.getComputedStyle(this.el, null);
		var h1 = parseInt(cStyles.height);
		var vertMargin = parseInt(cStyles.marginTop) + parseInt(cStyles.marginBottom);
		return (h1 + vertMargin) +'px';
	}

	// this inserts our view into the DOM before the .tool-panel.tree-view 
	// we do not insert inside .tool-panel.tree-view because we dont want to scroll with the tree data.
	// becuase we are outside .tool-panel.tree-view, we are at the same level as other WorkplaceItems (aka tab items) so switching
	// items automatically display:none 's us.
	mount(treeViewEl) {
		if (this.treeViewEl) {
			mount(this.treeViewEl.parentNode, this.el, this.treeViewEl);
			// tool-panels are positioned absolute so we need to move down the top to make room for us
			this.treeViewEl.style.top = this.getHeight();
		}
	}

	// remove us from the DOM
	unmount() {
		if (!this.isMounted()) return
		unmount(this.el.parentNode, this.el);
		// move the top of the tree-view back where it was
		if (this.treeViewEl)
		 	this.treeViewEl.style.top = "0px";
	}

	// the defintion of whether we are 'mounted' is whether its DOM element is in the DOM. It may not be visible even if its mounted.
	isMounted() {
		return this.el.parentNode != null;
	}

	getElement() { return this.el;}

	// b/c we mount ourselves at the same level as WorkplaceItems (see mount comment), every time the user activates a different
	// tab, the switcher code sets our display to none. When the tree view gets activated, we have to undo that.
	onTreeViewActivate() {
		this.el.style.display = 'inherit';
	}

	dispose() {
		this.subscriptions.dispose();
	}
}
