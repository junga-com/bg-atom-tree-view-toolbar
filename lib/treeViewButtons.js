// This file contains BGDOM style Components for each of the buttons included with thi package.

import { Component, ToggleButton, CommandButton, Button, ToolGroup } from 'bg-atom-redom-ui';
import { PackageInstall, OnDependentPackageStateChange } from 'bg-atom-utils';


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
		// when negate is false, (state!=negate) will have the same value as state. When its true, it will be negated.
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
			  ...p);
		if (!AutoRevealToggle.isSupported()) {
			this.el.classList.add('unsupportted')
			this.el.onclick = ()=>{
				let notice = atom.notifications.addWarning(
					`The Auto Reveal feature requires a change to atom's tree-vew. 
					If your atom installation is fully updated consider voting for 
					this Pull Request to get it adopted. [#1336](https://github.com/atom/tree-view/pull/1336)`
					, {
						dismissable: true,
						buttons: [
							{
								text:'remove the Auto Reveal Btn', 
								onDidClick:()=>{
									atom.config.set('bg-tree-view-toolbar.buttons.btnReveal',false);
									notice.dismiss();
								}
							},
							{
								text:'dismiss', 
								onDidClick:()=>{
									notice.dismiss();
								}
							}
						]
					}
				)
			}
		}

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
		return false;
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
		super(tagIDClasses, '.FontSizeButtonGroup', ...p)
		this.mount([
			new CommandButton('icon-text-size', 'bg-tree-view:reset-font-size'   ),
			new CommandButton('<b>-</b>',       'bg-tree-view:decrease-font-size'),
			new CommandButton('<b>+</b>',       'bg-tree-view:increase-font-size'),
			new Component('$span.btn.bgVertical',[
				new CommandButton('icon-arrow-small-up',   'bg-tree-view:decrease-line-height'),
				new CommandButton('icon-arrow-small-down', 'bg-tree-view:increase-line-height')
			])
		]);

		this.dependentPkgs='bg-ui-font-sizer';

		this.setSupportedState();

		// if the package we depend on is installed/uninstalled, or activated/deactivated, then call our setSupportedState method
		// so that we can update accordingly
		OnDependentPackageStateChange(this.dependentPkgs, (pkgName, isActive)=>this.setSupportedState(isActive));
	}

	// If the bg-ui-font-sizer package that this button group depends on is not installed, then this sets the state fo the whole
	// group to unsupportted and sets a onclick that raises a notice that gives the user two options to resovolve the situation.
	// this is called whenever the bg-ui-font-sizer package changes its activation state
	setSupportedState() {
		if (atom.packages.isPackageActive(this.dependentPkgs) {
			this.el.classList.remove('unsupportted')
			this.el.onclick = '';
		} else {
			this.el.classList.add('unsupportted')
			this.el.onclick = ()=>{
				try { PackageInstall(this.dependentPkgs, {
					extraButtons: [
						{	text:'remove the Font Size Group', 
							onDidClick:()=>{atom.config.set('bg-tree-view-toolbar.buttons.fontGroup',false);}}
					]}
				)} catch(e) {
					console.log('error caught installing dependent pkgs',e)
				}
			};
		}
	}
}
