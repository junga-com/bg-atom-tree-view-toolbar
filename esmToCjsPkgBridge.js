// Each JS module folder that uses @stdthings/esm to support ES6 module syntax needs an esm to cjs bridge file like this one.
// This file should be the package.json:main field and the real module entry point file should be identified in the package.json:module
// field. This bridge file needs to do two things differently than the normal one suggested by the esm project.
//    1) it requires the esm module into a global variable so that multple packages that use this pattern will work. Without that,
//       the second package that atom loads will not be able to require('esm') because __global__ will already exist but the 'require'
//       function will not be the esm require that the first package set. A non-atom-package npm module has a similar situation but
//       in that case 'require' is still set to teh esm version so npm modules can just skip requiring esm.
//    2) The pattern used by packages that use BGAtomPlugin results in the exported value of the plugin being in the 'default' property
//       but it needs to be in the top level export object so the code below promotes 'default' to be the whole exported object. 

if (typeof global.__bgEsmModule__ == 'undefined')
	global.__bgEsmModule__ = require("esm")
require = global.__bgEsmModule__(module/* , options */);
module.exports = require(require('./package.json').module).default
