// This file contains BGDOM style Components that implement the builtin buttons included with this package.

import { Component, ToggleButton, CommandButton, Button, ToolGroup, OpenInNewBrowser } from 'bg-atom-redom-ui';
import { BGFindWorkspaceItemFromURI } from 'bg-atom-utils';
import { TreeViewAutoTrackSelection } from './polyfill-TreeViewAutoTrackSelection'

// BoolConfigToggle is a reusable class that toggles the boolean configuration key that its constructed with
// Normally, it will in the pressed state when the value is true but prepending a '!' to the configKey will make it appear pressed
// when its false.
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
		atom.config.onDidChange(this.configKey, {}, ({newValue})=>{this.setPressedState(newValue != this.negate)})
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




// this is the gear icon displayed on the upper right of the toolbar that opens this package's settings page
export class PackageConfigButton extends Button {
	constructor(tagIDClasses, packageName, ...p) {
		super(tagIDClasses, 'icon-gear', (typeof packageName!='string')?packageName:null , ...p);
		this.packageName = (typeof packageName=='string') ?packageName :'';
	}
	onActivated() {
		atom.workspace.open(`atom://config/packages/${this.packageName}/`)
	}
}




// button for controlling whether hidden files are shown in the tree view.
// TODO: add right-click menu that allows jumping to or changing in place the list of ignored files
export class HiddenFilesToggle extends BoolConfigToggle {
	constructor(tagIDClasses, ...p) {
		super(tagIDClasses, '!tree-view.hideIgnoredNames', '  .*', ...p);
		this.disposables.add(atom.contextMenu.add({".btnHidden":[{label:"edit ignore names", command:"bg-tree-view:edit-hidden-list"}]}))
	}
	async editHiddenList() {
		await atom.workspace.open('atom://config/Core/')
		atom.notifications.addInfo("Edit the 'Ignore Names' setting on the Core tab to affect the files and folders hidden by this button.")
		var settingsView = BGFindWorkspaceItemFromURI('atom://config');
		var editEl = settingsView && settingsView.element.querySelector('#core\\.ignoredNames')
		editEl && editEl.focus()
	}
}




// This toggles the tree view Auto Reveal enabled setting. It relies on PR [#1336](https://github.com/atom/tree-view/pull/1336)
// In addition, it will invoke tree-view:reveal-active-file when its set to true so that the tree view selection will reflect the
// active pane immediately.
export class AutoRevealToggle extends BoolConfigToggle {
	constructor(tagIDClasses, ...p) {
		super(tagIDClasses,
			  'tree-view.autoTrackActivePane.enabled',
			  'Auto Reveal',
			  ...p);

		this.polyfill = new TreeViewAutoTrackSelection();

		atom.config.onDidChange('bg-tree-view-toolbar.buttons.btnRevealCodePatch', {}, ()=>{this.setSupportedState()})

		this.setSupportedState();
	}

	// override the change to true behavior so that we can initialize the sync between the selected editor and the tree cursor
	// a user can toggle the button on and then off again to highlight the active editor in the tree view.
	onConfigChangedToTrue() {
		atom.commands.dispatch(
			atom.workspace.getElement(),
			'tree-view:reveal-active-file'
		);
	}

	// supported state means that if the underlying feature that this button relies on is not available, it gets greyed out and
	// clicking on it opens a dialog to give the user options to resolve it
	setSupportedState() {
		// if the user opts in, we can install a polyfill to patch in the feature we are waiting for
		this.polyfill.enable(atom.config.get('bg-tree-view-toolbar.buttons.btnRevealCodePatch'));

		if (!this.polyfill.isFeatureSupported()) {
			this.el.classList.add('unsupportted')
			this.prevOnClick = this.el.onclick;
			this.el.onclick = ()=>{
				let notice = atom.notifications.addWarning(
					`This button is meant to toggle the feature of the tree view that automatically changes the selected entry to reflect the active editor pane.
					This requires a change to atom's tree-vew which has already been written and submitted.
					If your atom installation is fully updated and you still see this message, consider
					[voicing your support to get Pull Request #1336 adopted.](https://github.com/atom/tree-view/pull/1336)
					If you choose to install the pollyfill, the #1336 patch will be dynamical applied to your tree-view plugin now which may or
					may not work depending on if the tree-view code has changed but probably will do no harm in any case.  `
					, {
						dismissable: true,
						buttons: [
							{	text:'remove the Auto Reveal Btn',
								onDidClick:()=>{
									atom.config.set('bg-tree-view-toolbar.buttons.btnReveal',false);
									notice.dismiss();
							}},
							{	text:'install AutoReveal Pollyfill',
								onDidClick:()=>{
									atom.config.set('bg-tree-view-toolbar.buttons.btnRevealCodePatch',true);
									notice.dismiss();
							}},
							{ text:'status of PR', onDidClick:()=>{OpenInNewBrowser('https://github.com/atom/tree-view/pull/1336');}},
							{ text:'dismiss', onDidClick:()=>{notice.dismiss();}}
						]
					}
				)
			}
		} else {
			this.el.classList.remove('unsupportted')
			if (this.prevOnClick) {
				this.el.onclick = this.prevOnClick;
				this.prevOnClick = null;
			}
		}
	}
}




// This is similar to collapse-all but it expands the first level. When there is only one project folder, collapse-all is not
// very useful because it displays only one item in the tree view.
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




// Control the font size of the tree view. This relies on bg-ui-font-sizer package
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
		atom2.packages.onDidPackageStateChange(this.dependentPkgs, (pkgName, isActive)=>this.setSupportedState(isActive));
	}

	// If the bg-ui-font-sizer package that this button group depends on is not installed, then this sets the state fo the whole
	// group to unsupportted and sets a onclick that raises a notice that gives the user two options to resovolve the situation.
	// this is called whenever the bg-ui-font-sizer package changes its activation state
	setSupportedState() {
		if (atom.packages.isPackageActive(this.dependentPkgs)) {
			this.el.classList.remove('unsupportted')
			this.el.onclick = '';
		} else {
			this.el.classList.add('unsupportted')
			this.el.onclick = async ()=>{
				try { await atom2.packages.installPackage(this.dependentPkgs, {
					extraButtons: [
						{	text:'remove the Font Size Group',
							onDidClick:()=>{atom.config.set('bg-tree-view-toolbar.buttons.fontGroup',false);}}
					]}
				)} catch(e) {
					console.log(e)
				}
			};
		}
	}
}
