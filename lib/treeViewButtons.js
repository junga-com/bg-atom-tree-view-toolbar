// This file contains BGDOM style Components that implement the builtin buttons included with this package.

import { Component, ToggleButton, CommandButton, Button, ToolGroup, OpenInNewBrowser } from 'bg-dom';

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
		atom.config.addDep(this.configKey, this, ({newValue})=>{this.setPressedState(newValue != this.negate)})
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

	onStateChange(newState) {
		atom.config.set('tree-view.hideVcsIgnoredFiles', !newState);
	}

	async editHiddenList() {
		await atom.workspace.open('atom://config/Core/')
		atom.notifications.addInfo("Edit the 'Ignore Names' setting on the Core tab to affect the files and folders hidden by this button.")
		var settingsView = atom.workspace.getItemByURI('atom://config');
		var editEl = settingsView && settingsView.element.querySelector('#core\\.ignoredNames')
		editEl && editEl.focus()
	}
}




// This toggles the tree view Auto Reveal enabled setting. It relies on PR [#1336](https://github.com/atom/tree-view/pull/1336)
// In addition, it will invoke tree-view:reveal-active-file when its set to true so that the tree view selection will reflect the
// active pane immediately.
export class TreeViewAutoTrackToggle extends BoolConfigToggle {
	constructor(tagIDClasses, ...p) {
		super(tagIDClasses,
			  'tree-view.autoTrackActivePane.enabled',
			  'Auto Track',
			  ...p);

		this.polyfill = bg.PolyfillObjectMixin.get('TreeViewAutoTrackSelection');
		deps.add(this.polyfill, this);
		this.onDepChanged();
	}

	// override the change to true behavior so that we can initialize the sync between the selected editor and the tree cursor
	// a user can toggle the button on and then off again to highlight the active editor in the tree view.
	onConfigChangedToTrue() {
		atom.commands.dispatch(
			atom.workspace.getElement(),
			'tree-view:reveal-active-file'
		);
	}

	// this button depends on the polyfill for the AutoTrack feature. When that polyfill changes state we update the button to be
	// greyed out if the Auto Track feature is not available and clicking on it will open a dialog to give the user options to resolve it
	onDepChanged() {
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
							{	text:'Remove Button',
								onDidClick:()=>{
									atom.config.set('bg-tree-view-toolbar.buttons.btnTrack',false);
									notice.dismiss();
							}},
							{	text:'Install Pollyfill',
								onDidClick:()=>{
									atom.config.set('bg-tree-view-toolbar.polyfills.optionalCursorTracking',true);
									notice.dismiss();
							}},
							{ text:'Status of PR', onDidClick:()=>{OpenInNewBrowser('https://github.com/atom/tree-view/pull/1336');}},
							{ text:'Dismiss', onDidClick:()=>{notice.dismiss();}}
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
		if (this.treeView.roots.length == 1) {
			atom.commands.dispatch(this.treeViewEl, 'core:move-to-top');
			atom.commands.dispatch(this.treeViewEl, 'tree-view:expand-item');
		}
	}
	getTreeView() {
		if (!this.treeViewEl) {
			this.treeView = atom.workspace.itemForURI('atom://tree-view');
			if (this.treeView) this.treeViewEl = this.treeView.element;
		}
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

		this.onDepChanged();

		// if the package we depend on is installed/uninstalled, or activated/deactivated, then call our onDepChanged method
		// so that we can update accordingly
		atom.packages.addDep(this.dependentPkgs, this);
	}

	// If the bg-ui-font-sizer package that this button group depends on is not installed, then this sets the state fo the whole
	// group to unsupportted and sets a onclick that raises a notice that gives the user two options to resovolve the situation.
	// this is called whenever the bg-ui-font-sizer package changes its activation state
	onDepChanged() {
		if (atom.packages.isPackageActive(this.dependentPkgs)) {
			this.el.classList.remove('unsupportted')
			this.el.onclick = '';
		} else {
			this.el.classList.add('unsupportted')
			this.el.onclick = async ()=>{
				try { await atom.packages.installPackage(this.dependentPkgs, {
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
