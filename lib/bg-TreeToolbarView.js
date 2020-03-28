
import { CompositeDisposable } from 'atom';
import { Component, ToggleButton, CommandButton, Button, ToolGroup } from 'bg-atom-redom-ui';
import { el, list, mount, unmount, setAttr } from 'redom';

class BoolConfigToggle extends ToggleButton {
	constructor(tagIDClasses, configKey, ...p) {
		super(tagIDClasses, ' '+configKey, (state)=>this.toggleConfig(state), ...p);
		// when nagate is false, (state!=negate) will have the same value as state. When its true, it will be negated.
		this.negate = false;
		this.configKey = configKey;
		let rematch;
		if (rematch = /^!(?<key>.*)$/.exec(this.configKey)) {
			this.configKey = rematch.groups.key;
			this.negate = true;
		}
		this.setPressedState(atom.config.get(this.configKey) != this.negate);
	}
	toggleConfig(state) {
		var currentVal = atom.config.get(this.configKey);
		if (currentVal != (state != this.negate)) {
			atom.config.set(this.configKey, (state != this.negate));
			if (state != this.negate)
				this.onConfigChangedToTrue();
			else
				this.onConfigChangedToFalse();
		}
	}
	onConfigChangedToTrue() {}
	onConfigChangedToFalse() {}
}


class AutoRevealToggle extends BoolConfigToggle {
	constructor(tagIDClasses, ...p) {
		super(tagIDClasses,
			  'tree-view.autoTrackActivePane.enabled',
			  'Auto Reveal',
			  (AutoRevealToggle.isSupported()) ? {} : {display:'none'},
			  ...p);
	}
	onConfigChangedToTrue() {
		atom.commands.dispatch(
			atom.workspace.getElement(), 
			'tree-view:reveal-active-file'
		);
	}

	// I submitted a PR to add 'tree-view.autoTrackActivePane.enabled' but I am releasing the tree-view-toolbar before it is available
	// so this determines if the running version of atom has it or not.
	static isSupported() {
		return atom.config.getSchema('tree-view.autoTrackActivePane.enabled').type == 'boolean';
	}
}


// This is a panel-heading view for the tree-view. It provides controls to change commons tree-view settings and new actions.
export class TreeToolbarView extends Component {
	constructor(isShown, ...p) {
		super('$div.bg-tree-view-toolbar.bg-toolbar.tool-panel.panel-heading', ...p);
		this.shouldInitiallyBeShown = isShown;

		this.disposables = new CompositeDisposable();

		this.mount([
			new BoolConfigToggle( 'btnHidden: .*'        ,  '!tree-view.hideIgnoredNames',               {class: 'inline-block-tight'}),
			new Button(           'btnColAll:1st Lvl'    ,  (state)=>{this.collapseToRootLevel(state);}, {class: 'inline-block-tight'}),
			new AutoRevealToggle( 'btnReveal:auto reveal',                                               {class: 'inline-block-tight'}),
			new ToolGroup(   'fontGroup:.inline-block-tight', [
				new CommandButton('bg-tree-view:reset-font-size'   ,  "icon-text-size" ),
				new CommandButton('bg-tree-view:decrease-font-size',  "-", {paddingLeft:"0.5em", paddingRight:"0.5em"}),
				new CommandButton('bg-tree-view:increase-font-size',  "+", {paddingLeft:"0.5em", paddingRight:"0.5em"})
			])
		]);

		// register cmds that just push our buttons so that they are garanteed to to exactly what the user button click does
		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:toggle-hidden",          ()=>this.btnHidden.onClick()));
		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:collapse-to-root-level", ()=>this.btnColAll.onClick()));
		this.disposables.add(atom.commands.add('atom-workspace', "bg-tree-view:toggle-auto-reveal",     ()=>this.btnReveal.onClick()));

		// register our onTreeViewActivate method to get call when the tree-view tab becomes active (see onTreeViewActivate comment)
		this.disposables.add(atom.workspace.onDidStopChangingActivePaneItem((item)=>{
			if (item && item.constructor.name == "TreeView" )
				this.onTreeViewActivate();
		}))

		this.getTreeView();

		// the keyMaps might not be read yet so make the tooltips after a delay
		setTimeout(()=>{this.registerTooltips()}, 1000);

		if (this.shouldInitiallyBeShown)
			this.show();
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

	collapseToRootLevel() {
		if (!this.isMounted()) return
		atom.commands.dispatch(this.treeViewEl, 'tree-view:collapse-all');
		atom.commands.dispatch(this.treeViewEl, 'core:move-to-top');
		atom.commands.dispatch(this.treeViewEl, 'tree-view:expand-item');
	}


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
	show() {
		if (!this.getTreeView()) return
		mount(this.treeViewEl.parentNode, this.el, this.treeViewEl);
		// tool-panels are positioned absolute so we need to move down the top to make room for us
		this.treeViewEl.style.top = this.getHeight();
	}

	// remove us from the DOM
	hide() {
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
		if (this.shouldInitiallyBeShown && !this.isMounted()) {
			this.show();
			this.shouldInitiallyBeShown = null;
		}
		this.el.style.display = 'inherit';
	}

	dispose() {
		this.disposables.dispose();
	}
}
