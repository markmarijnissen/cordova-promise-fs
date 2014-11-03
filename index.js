/**
 * Static Private functions
 */

/* createDir, recursively */
function __createDir(rootDirEntry, folders, success,error) {
  rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
    // Recursively add the new subfolder (if we still have another to create).
    if (folders.length > 1) {
      __createDir(dirEntry, folders.slice(1),success,error);
    } else {
      success();
    }
  }, error);
}

function dirname(str) {
  var parts = str.split('/');
  parts.splice(parts.length-1,1);
  return parts.join('/');
}

/* default fileErrorHandler */
var __defaultErrorHandler = function(err) {
    var msg = '';
    switch (err.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = err;
        break;
    }
    console.error(msg);
};

/**
 * Factory function: Create a single instance (based on single FileSystem)
 */
module.exports = function(options){
  /* default error handler */
  var handleError = options.errorHandler;// || __defaultErrorHandler;

  /* Promise implementation */
  var Promise = options.Promise || window.Promise;
  if(!Promise) { handleError(new Error("No Promise library given in options.Promise")); }
  
  /* default options */
  options = options || {};
  options.persistent = options.persistent !== undefined? options.persistent: true;
  options.storageSize = options.storageSize || 20*1024*1024;

  /* Cordova deviceReady promise */
  var deviceReady = new Promise(function(resolve,reject){
    document.addEventListener("deviceready", resolve, false);
    setTimeout(function(){ reject(new Error('deviceready has not fired after 5 seconds.')); },5100);
  });


  /* the filesystem! */
  var fs = deviceReady.then(function(){
    return new Promise(function(resolve,reject){
      window.requestFileSystem(options.persistent? 1: 0, options.storageSize, resolve, reject);
    });
  });

  /* ensure directory exists */
  function ensure(folders) {
    folders = folders.split('/').filter(function(folder) {
      return folder && folder.length > 0 && folder[0] !== '.';
    });

    return fs.then(function(fs){
      return new Promise(function(resolve,reject){
          __createDir(fs.root,folders,resolve,reject);
        });
    });
  }

  /* does file exist? */
  function exists(path){
    console.log('ensure',path);
    return fs.then(function(fs) {
      return new Promise(function(resolve,reject){
        resolve(path);
      });
    });
  }

  /* convert path to URL to be used in JS/CSS/HTML */
  function toUrl(path) {
    return fs.then(function(fs) {
      return new Promise(function(resolve,reject){
        resolve(path);
      });
    });
  }

  /* convert path to base64 date URI */
  function toDataURI(path) {
    return fs.then(function(fs) {
      return new Promise(function(resolve,reject){
        resolve(path);
      });
    });
  }

  /* return contents of a file */
  function read(path) {
    return fs.then(function(fs) {
      return new Promise(function(resolve,reject){
        fs.root.getFile(path,{},function(fileEntry){
          fileEntry.file(function(file){
            var reader = new FileReader();
            reader.onloadend = function(){
              resolve(this.result);
            };
            console.log(reader);
            reader.readAsText(file);
          },reject);
        },reject);
      });
    });
  }

  /* write contents to a file */
  function write(path,blob,mimeType) {
    return ensure(dirname(path))
      .then(function() { return fs; })
      .then(function(fs) {
        return new Promise(function(resolve,reject){
          console.log('write',path,data,fs);
          fs.root.getFile(path,{create:true},function(fileEntry){
            fileEntry.createWriter(function(writer){
              writer.onwriteend = resolve;
              writer.onerror = reject;
              if(typeof data === 'string') {
                data = new Blob([data],{type: mimeType || 'text/plain'});
              }
              writer.write(data);
            },reject);
          },reject);
        });
      });
    }

  /* move a file */
  function move(src,dest) {
    return fs.then(function(fs) {
      return new Promise(function(resolve,reject){
        console.log('resolve',path);
        resolve(path);
      });
    });
  }

  /* copy a file */
  function copy(src,dest) {
    return fs.then(function(fs) {
      return new Promise(function(resolve,reject){
        console.log('resolve',path);
        resolve(path);
      });
    });
  }

  /* list contents of a directory */
  function list(path) {
    return fs.then(function(fs) {
      return new Promise(function(resolve,reject){
        console.log('resolve',path);
        resolve(path);
      });
    });
  }

  return window.fs = {
    fs: fs,
    read: read,
    write: write,
    move: move,
    copy: copy,
    list: list,
    ensure: ensure,
    exists: exists,
    toUrl:toUrl,
    toDataURI:toDataURI
  };
};