cordova-promise-fs
==========
> Wraps the Cordova File API in convenient functions (that return a Promise)

Are you entangled in a async callback mess to get even the simplest task done? Wait no longer -- here is **cordova-promise-fs**!

## Getting started

```bash
  # fetch code using bower or npm
  bower install cordova-promise-fs
  npm install cordova-promise-fs

  # install Cordova plugins
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer # optional
```

## Usage

### Initialize & configuration
```javascript
var CordovaFS = require('cordova-fs-promise');
var fs = CordovaFS({
  persistent: true, // or false
  storageSize: 20*1024*1024, // storage size in bytes, default 20MB 
  concurrency: 3 // how many concurrent uploads/downloads?
  Promise: require('promiscuous') // Your favorite Promise/A+ library! 
});
```

*Note:* Concurrent uploads/downloads completely trash your mobile application. That's why I've put a concurrency limit on the number of downloads/uploads. Meteor sets this number on 30. In my experimental testing, I found 3 much more reasonable.

### Browsing files
```javascript
fs.exists(filename)       // checks if file exists. returns fileEntry or false.
fs.file(filename)         // returns a fileEntry
fs.dir(path)              // returns a dirEntry
fs.list(path)             // return array with filenames (including path)
fs.list(path,true)        // return an array with entries.
```

### Reading files
```javascript
fs.read(filename)         // returns text-content of a file
fs.readJSON(filename)     // returns JSON-parsed contents of a file
fs.toUrl(filename)        // returns URL to be used in js/html/css (file://....)
fs.toInternalURL(filename)// returns cordova internal URL (cdvfile://....)
fs.toDataURL(filename)    // returns Base64 encoded Data URI
```

### Writing files
```javascript
fs.write(filename,data)   // writes a Blob, a String, or data (as JSON). Ensures directory exists.
```

### File operations
```javascript
fs.create(filename)       // creates a file
fs.ensure(path)           // ensures directory exists
fs.move(src,dest)         // move from src to dist. Ensures dest directory exists.
fs.copy(src,dest)         // copy from src to dist. Ensures dest directory exists.
fs.remove(src)            // removes file. Resolves even if file was already removed.
fs.remove(src,true)       // removes file. Rejects when file does not exist.
fs.removeDir(path)
```

### Upload and download
```javascript
var promise = fs.upload(source,destination,[options],[onprogress]);
var promise = fs.upload(source,destination,[onprogress]);
var promise = fs.download(source,destination,[options],[onprogress]);
var promise = fs.download(source,destination,[onprogress]);

// upload/download augments the promise with two extra functions:
promise.progress(function(progressEvent){...})
promise.abort();

// Gotcha: progress and abort() are unchainable; 
fs.upload(...).then(...)  // won't return the augmented promise, just an ordinary one!
```

### Utilities
```javascript
fs.fs // returns promise for the FileSystem
fs.filename(path) // converts path to filename (last part after /)
fs.dirname(path) // converts path dirname (everything except part after last /)
```

## Contribute

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen