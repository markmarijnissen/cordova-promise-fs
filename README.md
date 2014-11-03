cordova-promise-fs
==========

Are you entangled in a async callback mess to get even the simplest task done?

Wait no longer -- here is **cordova-promise-fs**!

(Or wait a little bit longer - not fully implemented yet)

## Getting started

Install using bower or npm

```bash
  bower install cordova-promise-fs
  npm install cordova-promise-fs
```

## Usage

```javascript
var CordovaFS = require('cordova-fs-promise');

var fs = CordovaFS({
  persistent: true, // or false
  storageSize: 20*1024*1024, // storage size in bytes, default 20MB 
  Promise: require('promiscuous') // Your favorite Promise/A+ library! 
});

fs.fs // returns promise for the FileSystem
fs.read(filename) // returns text-content of a file
fs.write(filename,BlobOrString) // write a blob or string;
fs.move(src,dest)
fs.copy(src,dest)
fs.list(path) // return array with filenames (including path)
fs.ensure(path) // ensures directory exists
fs.exists(filename) // checks if file exists
fs.toUrl(filename) // returns URL to be used in js/html/css
fs.toDataURI(filename) // returns Base64 encoded Data URI
```

## Contribute

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen