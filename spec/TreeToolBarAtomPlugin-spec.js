

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('TreeToolBarAtomPlugin', () => {
  let workspaceElement, activationPromise, activationPromiseTV;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('bg-tree-view-toolbar');
    activationPromiseTV = atom.packages.activatePackage('tree-view');
  });

  describe('when the package is activated and tree view is present', () => {
    it('can show and hide the toolbar', () => {
      waitsForPromise(() => {
        return activationPromise;
      });
      // waitsForPromise(() => {
      //   return activationPromiseTV;
      // });
      atom.commands.dispatch(workspaceElement, 'tree-view:show');

      runs(() => {
        atom.commands.dispatch(workspaceElement, 'bg-tree-view-toolbar:show');
        expect(workspaceElement.querySelector('.bg-tree-view-toolbar')).not.toExist();

        atom.commands.dispatch(workspaceElement, 'bg-tree-view-toolbar:hide');
        expect(workspaceElement.querySelector('.bg-tree-view-toolbar')).not.toExist();
      });
    });

    // it('hides and shows the view', () => {
    //   // This test shows you an integration test testing at the view level.
    // 
    //   // Attaching the workspaceElement to the DOM is required to allow the
    //   // `toBeVisible()` matchers to work. Anything testing visibility or focus
    //   // requires that the workspaceElement is on the DOM. Tests that attach the
    //   // workspaceElement to the DOM are generally slower than those off DOM.
    //   jasmine.attachToDOM(workspaceElement);
    // 
    //   expect(workspaceElement.querySelector('.bg-tree-view-toolbar')).not.toExist();
    // 
    //   // This is an activation event, triggering it causes the package to be
    //   // activated.
    //   atom.commands.dispatch(workspaceElement, 'bg-tree-view-toolbar:toggle');
    // 
    //   waitsForPromise(() => {
    //     return activationPromise;
    //   });
    // 
    //   runs(() => {
    //     // Now we can test for view visibility
    //     let bgTreeViewToolbarElement = workspaceElement.querySelector('.bg-tree-view-toolbar');
    //     expect(bgTreeViewToolbarElement).toBeVisible();
    //     atom.commands.dispatch(workspaceElement, 'bg-tree-view-toolbar:toggle');
    //     expect(bgTreeViewToolbarElement).not.toBeVisible();
    //   });
    // });
  });
});
