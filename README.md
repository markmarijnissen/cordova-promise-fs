cordova-promise-fs
==========

Are you entangled in a async callback mess to get even the simplest task done?

Wait no longer -- here is **cordova-promise-fs**!

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
fs.file(filename) // returns a fileEntry
fs.dir(path) // returns a dirEntry
fs.exists(filename) // checks if file exists. returns fileEntry or false.

fs.read(filename) // returns text-content of a file
fs.readJSON(filename) // returns JSON-parsed contents of a file
fs.write(filename,data) // writes a Blob, a String, or data (as JSON). Ensures directory exists.

fs.move(src,dest) // move from src to dist. Ensures dest directory exists.
fs.copy(src,dest) // copy from src to dist. Ensures dest directory exists.
fs.remove(src)    // removes file. Resolves even if file was already removed.
fs.remove(src,true) // removes file. Rejects when file does not exist.
fs.removeDir(path)

fs.list(path) // return array with filenames (including path)
fs.list(path,true) // return an array with entries.

fs.ensure(path) // ensures directory exists

fs.toUrl(filename) // returns URL to be used in js/html/css (file://....)
fs.toInternalURL(filename) // returns cordova internal URL (cdvfile://....)
fs.toDataURL(filename) // returns Base64 encoded Data URI
```

## Contribute

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen