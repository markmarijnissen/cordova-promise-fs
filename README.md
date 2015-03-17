cordova-promise-fs
==========
> Wraps the Cordova (and Chrome) File API in convenient functions (that return a Promise)

Are you entangled in a async callback mess to get even the simplest task done? Wait no longer -- here is **cordova-promise-fs**!

## Getting started

```bash
  # fetch code using bower
  bower install cordova-promise-fs
  bower install bluebird # a library that follows the Promise/A+ spec

  # ...or npm...
  npm install cordova-promise-fs
  npm install bluebird # a library that follows the Promise/A+ spec
  
  # install Cordova and plugins
  cordova platform add ios@3.7.0
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer # optional
```

**IMPORTANT:** For iOS, use Cordova 3.7.0 or higher (due to a [bug](https://github.com/AppGyver/steroids/issues/534) that affects requestFileSystem).

Or just download and include [CordovaPromiseFS.js](https://raw.githubusercontent.com/markmarijnissen/cordova-promise-fs/master/dist/CordovaPromiseFS.js).

## Usage

### Initialize & configuration
```javascript
var fs = CordovaPromiseFS({
  persistent: true, // or false
  storageSize: 20*1024*1024, // storage size in bytes, default 20MB 
  concurrency: 3 // how many concurrent uploads/downloads?
  Promise: require('promiscuous') // Your favorite Promise/A+ library! 
});
```

The Promise option expects a Promise library that follows the [Promise/A+ spec](https://promisesaplus.com/), such as bluebird ([github](https://github.com/petkaantonov/bluebird), [download](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/bluebird.js)), promiscuous ([github](https://github.com/RubenVerborgh/promiscuous),[file](https://raw.githubusercontent.com/RubenVerborgh/promiscuous/master/promiscuous.js)) or [Angular's $q](https://docs.angularjs.org/api/ng/service/$q).

**Note on concurrency:** Concurrent uploads/downloads completely trash your mobile application. That's why I've put a concurrency limit on the number of downloads/uploads. Meteor sets this number on 30. In my experimental testing, I found 3 much more reasonable.

### Browsing files
```javascript
fs.exists(filename)       // checks if file exists. returns fileEntry or false.
fs.file(filename)         // returns a fileEntry
fs.dir(path)              // returns a dirEntry
fs.list(path,optionString)// return array with filenames (including path)

optionString = 'r'        // recursive list
optionString = 'd'        // only list directories
optionString = 'f'        // only list files
optionString = 'e'        // return results as FileEntry/DirectoryEntry (instead as path-string)
optionString = 'rfe'      // mix options! return entries of all files, recursively
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

FileTransfers with automatric retry and concurrency limit!

```javascript
var promise = fs.upload(source,destination,[options],[onprogress]);
var promise = fs.upload(source,destination,[onprogress]);
var promise = fs.download(source,destination,[options],[onprogress]);
var promise = fs.download(source,destination,[onprogress]);

options.trustAllHosts
options.retry = [1000,2000,3000] // retry attemps: millisecond to wait before trying again.
// plus all normal cordova-file-transfer options

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
fs.deviceready // deviceready promise
fs.options // options
fs.isCordova // is Cordova App?
```

### Normalized path

In CordovaPromiseFS, all filenames and paths are normalized:

* Directories should end with a `/`.
* Filenames and directories should never start with a `/`.
* `"./"` is converted to `""`

This allows you to concatenate normalized paths, i.e.
```javascript
normalize('dir1/dir2') === normalize('dir1') + normalize('dir2') === 'dir1/dir2/';
```

If you're storing or saving paths, it is recommended to `normalize` them first to avoid comparison problems. (i.e. paths are not recognized as the same because of a missing trailing slash).

Beware: the original `entry.fullPath` might return a path which starts with a `/`. This causes problems on Android, i.e.

```javascript
var path = filesystem.root.fullPath; // returns something starting with a `/`
filesystem.root.getDirectory(path); // NullPointer error in android. Stupid!
```

This problem is solved in CordovaPromiseFS.

## Changelog

### 0.12.0 (17/03/2015)

* Merged pull request from @jakgra. Now you can write to hidden folders on Android. Thanks!

### 0.11.0 (17/03/2015)

* Minor improvements in upload

### 0.10.0 (21/12/2014)

* Support for other fileSystems (undocumented hack)

### 0.9.0 (28/11/2014)

* Normalize path everywhere.

### 0.8.0 (27/11/2014)

* Added test-suite, fixed few minor bugs.

### 0.7.0 (14/11/2014)

* bugfix toInternalURL functions and fix download argument order

### 0.6.0 (13/11/2014)

* Chrome Support!

### 0.5.0 (06/11/2014)

* Use `webpack` for the build proces
* Fixed many small bugs

### 0.4.0 (06/11/2014)

* Various small changes
* Added `CordovaPromiseFS.js` for everybody who does not use Browserify/Webpack

### 0.3.0 (05/11/2014)

* Added `list` options (list `r`ecursively, only `f`iles, only `d`irectories, return result as `e`ntries)

### 0.2.0 (05/11/2014)

* Added `upload` and `download` methods with concurrency limit

## Contribute

Convert CommonJS to a browser-version:
```bash
npm install webpack -g
npm run-script prepublish
```

Run tests: Navigate to `/test/index.html`, for example:
```bash
npm install static -g
static .
# http://localhost:8080/test/index.html
```

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen