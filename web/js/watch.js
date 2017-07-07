/*
* object.watch v0.0.1: Cross-browser object.watch
*
* By Elijah Grey, http://eligrey.com
*
* A shim that partially implements object.watch and object.unwatch
* in browsers that have accessor support.
*
* Public Domain.
* NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
*/

// object.watch
// if (!Object.prototype.caca)
    // Object.prototype.caca = function (prop, handler) {};

// object.unwatch
// if (!Object.prototype.unwatch)
//     Object.prototype.unwatch = function (prop) {
//         var val = this[prop];
//         delete this[prop]; // remove accessors
//         this[prop] = val;
//     };