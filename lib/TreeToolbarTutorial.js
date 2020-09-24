import { Tutorial } from 'bg-atom-utils';
import dedent from 'dedent';

export class TreeToolbarTutorial extends Tutorial {
	static configure(configKey) {
		TreeToolbarTutorial.configKey = configKey;
		atom.config.addDep(TreeToolbarTutorial.configKey, TreeToolbarTutorial)

		TreeToolbarTutorial.onConfigChanged({});
	}

	static onConfigChanged({newValue}) {
		if (!newValue) newValue=atom.config.get(TreeToolbarTutorial.configKey);
		if (newValue || Tutorial.resumeStateExists()) {
			if (newValue) atom.config.set(TreeToolbarTutorial.configKey, false);
			if (!TreeToolbarTutorial.instance)
				TreeToolbarTutorial.instance = new TreeToolbarTutorial();
		}
	}

	constructor() {
		super('bg-tree-view-toolbar');
		if (!this.doResumeState())
			this.pageStart();
	}

	// <p>There are some buttons in the toolbar already that are bundled with this package. You can turn the builtin buttons
	//    on and off in the settings page for this package.</p>
	// <p>You can also add your own buttons by defining them in your init.js file or by supplying butons in your own package</p>
	// <p>The settings page tells you all about how to do that.</p>
	// <p>This package also includes some dynamic extensions to the tree view that can be enabled in the settings page. These are
	//    features that really should be implemented and maintained in the tree-view project and in some cases a PR already exists.
	//    If you like one of these features, consider voicing your support at the tree-view project for the PR to be adopted.</p>

	pageStart() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Thank you for installing bg-tree-view-toolbar.</h3>
			<p>You should now see a new toolbar at the top of the tree-view pane.
			</p>
			<p>Look in this package's settings page and for commands starting with this package name in the command pallete to descover
			   features. You may also see new features in the tree-view also.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Open Settings', onDidClick: ()=>{this.openSettings()}},
				{text: 'Next',          onDidClick: ()=>{this.page2()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	page2() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Builtin Buttons (1/2)</h3>
			<p>There are a handful of builtin buttons that can be turned on and off in the settings page. Some of
			   them are enabled by default so you should see them in the toolbar now.
			</p>
			<p>If its unclear what a button does, hover on it. The tooltip also shows if a keymap is bound to that function.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Back',          onDidClick: ()=>{this.pageStart()}},
				{text: 'Next',          onDidClick: ()=>{this.page3()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	page3() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Builtin Buttons (2/2)</h3>
			<p>The '.*' button toggles whether hidden files are shown. Right
			   click on it and choose 'edit ignore names' to see which
			   patterns are considered hidden files.
			</p>
			<p>Next open the settings page and enable the 'Auto Track Toggle' button. Notice that it appears greyed out on the toolbar bar.
			   Continue to find out why.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Open Settings', onDidClick: ()=>{this.openSettings()}},
				{text: 'Back',          onDidClick: ()=>{this.page2()}},
				{text: 'Next',          onDidClick: ()=>{this.page4()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	page4() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Dynamic Extensions to Tree-View (1/3)</h3>
			<p>This package also includes some dynamic patches to the tree view that can be enabled in this package's settings page. These are
			   features that really should be implemented and maintained in the tree-view project. If you like one of these features,
			   consider clicking on the link in its setting description to voice your support for it to be adopted.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Back',          onDidClick: ()=>{this.page3()}},
				{text: 'Next',          onDidClick: ()=>{this.page5()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	page5() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Dynamic Extensions to Tree-View (2/3)</h3>
			<p>The Auto Track button is greyed out because it relies on a
			   dynamic patch. Go ahead and click on it and then on
			   'Install Polyfill' and the button should then function.
			</p>
			<p>If you decide that you dont want this feature, go to the
			   'Dynamic Patches' settings section to deselect it.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Open Settings', onDidClick: ()=>{this.openSettings()}},
				{text: 'Back',          onDidClick: ()=>{this.page4()}},
				{text: 'Next',          onDidClick: ()=>{this.page6()}},
				{text: 'Close',         onDidClick: ()=>{this.end()}}
			]
		})
	}

	page6() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Dynamic Extensions to Tree-View (3/3)</h3>
			<p>These Dynamic extensions can stop working if the tree-view package releases an incompatible code change. There is some
			   provision to detect that and do no harm in any case. If you find strange behavior starting that goes away
			   if you disable the patch in the setting page, please report it as a bug on this package.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Back',          onDidClick: ()=>{this.page5()}},
				{text: 'Next',          onDidClick: ()=>{this.page7()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	page7() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Custom Buttons (1/N)</h3>
			<p>In addition to the builtin buttons, you can create buttons for the toolbar.
			</p>
			<p>You could put the button code in an Atom Package or you could put it in your init.js file.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Back',          onDidClick: ()=>{this.page6()}},
				{text: 'Next',          onDidClick: ()=>{this.page8()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	page8() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Custom Buttons (2/N)</h3>
			<p>Click the button below to be guided through adding a button in your init.js file.
			</p>
			<p>The settings page has lots of information about making buttons in various ways and using the toolbar API.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Open Settings and init.js',  onDidClick: ()=>{this.openInitJS()}},
				{text: 'Back',          onDidClick: ()=>{this.page7()}},
				{text: 'Skip',          onDidClick: ()=>{this.page9()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	async openInitJS() {
		await atom.workspace.open('atom://config/packages/'+this.packageName+'/');
		var settingsView = atom.workspace.getItemByURI('atom://config');
		var editEl = settingsView && settingsView.element.querySelector('#init-js-example');
		editEl && editEl.scrollIntoView();

		atom.workspace.open(atom.getConfigDirPath()+'/init.js',{split:'right'});
		this.resumePageSet('openInitJS');
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Custom Buttons (3/N)</h3>
			<p>The settings page and init.js should be opened side by side. Scroll down to the section 'init.js Example' and follow the instructions.
			</p>
			<p>The settings page has lots of information about making buttons in various ways and using the toolbar API.
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Back',          onDidClick: ()=>{this.resumeClear(); this.page8()}},
				{text: 'Next',          onDidClick: ()=>{this.resumeClear(); this.page9()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.resumeClear(); this.end()}}
			]
		})
	}

	page9() {
		if (this.dialog) this.dialog.dismiss();
		this.dialog = atom.notifications.addInfo(dedent`
			<h3>Custom Buttons (2/N)</h3>
			<p>
			</p>
			`, {
			dismissable: true,
			buttons: [
				{text: 'Back',          onDidClick: ()=>{this.page8()}},
				{text: 'Next',          onDidClick: ()=>{this.page10()}},
				{text: 'Ok, got it',    onDidClick: ()=>{this.end()}}
			]
		})
	}

	openSettings() {
		atom.workspace.open('atom://config/packages/'+this.packageName+'/');
	}

	end() {
		this.dialog.dismiss();
		TreeToolbarTutorial.instance = null;
	}
}
