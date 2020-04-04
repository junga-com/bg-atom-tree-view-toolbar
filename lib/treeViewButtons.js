// This file contains BGDOM style Components for each of the buttons included with thi package.

import { Component, ToggleButton, CommandButton, Button, ToolGroup } from 'bg-atom-redom-ui';



export class PackageConfigButton extends Button {
	constructor(tagIDClasses, packageName, ...p) {
		super(tagIDClasses, 'icon-gear', (typeof packageName!='string')?packageName:null , ...p);
		this.packageName = (typeof packageName=='string')
			?packageName
			:'';
	}
	onActivated() {
		atom.workspace.open('atom://config/packages/bg-tree-view-toolbar')
	}
}

// Given an atom configuration key for a boolean, this ToggleButton will allow the user to set it to true/false. Normally, it will
// be pressed when the value is true but prepending a '!' to the configKey will make it appear pressed when its false.   
export class BoolConfigToggle extends ToggleButton {
	constructor(tagIDClasses, configKey, label, ...p) {
		super(tagIDClasses, label, ' '+configKey, (state)=>this.toggleConfig(state), ...p);
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


export class HiddenFilesToggle extends BoolConfigToggle {
	constructor(tagIDClasses, ...p) {
		super(tagIDClasses, '!tree-view.hideIgnoredNames', '  .*', ...p);
	}
}

// This toggles the tree view Auto Reveal enabled setting. In addition, it will invoke tree-view:reveal-active-file when its set to
// true so that the tree view selection will reflect the active pane immediately.
export class AutoRevealToggle extends BoolConfigToggle {
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


export class CollapseToRootLevelButton extends Button {
	constructor(tagIDClasses, ...p) {
		super(tagIDClasses, '1st Lvl',  ()=>{this.collapseToRootLevel();}, ...p)
	}
	collapseToRootLevel() {
		if (!this.getTreeView()) return;
		atom.commands.dispatch(this.treeViewEl, 'tree-view:collapse-all');
		atom.commands.dispatch(this.treeViewEl, 'core:move-to-top');
		atom.commands.dispatch(this.treeViewEl, 'tree-view:expand-item');
	}
	getTreeView() {
		if (!this.treeViewEl)
			this.treeViewEl = document.querySelector('.tree-view.tool-panel');		
		return this.treeViewEl;
	}
}


export class FontSizeButtonGroup extends ToolGroup {
	constructor(tagIDClasses, ...p) {
		super(tagIDClasses, ...p)
		this.mount([
			new CommandButton('icon-text-size',               'bg-tree-view:reset-font-size'   ,   {paddingLeft:"0.5em", paddingRight:"0.5em"}),
			new CommandButton('<b>-</b>',                     'bg-tree-view:decrease-font-size',   {paddingLeft:"0.5em", paddingRight:"0.5em"}),
			new CommandButton('<b>+</b>',                     'bg-tree-view:increase-font-size',   {paddingLeft:"0.5em", paddingRight:"0.5em"}),
			new Component('$span.btn.bgVertical',
				[
					new CommandButton('icon-arrow-small-up',   'bg-tree-view:decrease-line-height', {paddingLeft:"0.5em", paddingRight:"0.5em"}),
					new CommandButton('icon-arrow-small-down', 'bg-tree-view:increase-line-height', {paddingLeft:"0.5em", paddingRight:"0.5em"})
				],
				{
					display: 'flex',
					flexFlow: 'column nowrap',
					padding: '0px'
				}
			)
		]);
	}

	static isSupported() {
		return ;
	}
}
