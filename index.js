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
      success(dirEntry);
    }
  }, error);
}

function dirname(str) {
  var parts = str.split('/');
  parts.splice(parts.length-1,1);
  return parts.join('/');
}

function filename(str) {
  var parts = str.split('/');
  return parts[parts.length-1];
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

  /* debug */
  fs.then(function(fs){
    window.__fs = fs;
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

  /* does file exist? If so, resolve with fileEntry, if not, resolve with false. */
  function exists(path){
    return new Promise(function(resolve,reject){
      file.then(
        function(fileEntry){
          resolve(fileEntry);
        },
        function(err){
          if(err.code === 1) {
            resolve(false);
          } else {
            reject(err);
          }
        }
      );
    });
  }

  /* convert path to URL to be used in JS/CSS/HTML */
  function toURL(path) {
    return file.then(function(fileEntry) {
      return fileEntry.toURL();
    });
  }

  /* convert path to URL to be used in JS/CSS/HTML */
  function toInternalURL(path) {
    return file.then(function(fileEntry) {
      return fileEntry.toInternalURL();
    });
  }

  /* convert path to base64 date URI */
  function toDataURL(path) {
    return read(path,'readAsDataURL');
  }

  /* get file file */
  function file(path,options){
    options = options || {};
    return fs.then(function(fs){
      return new Promise(function(resolve,reject){
        fs.root.getFile(path,options,resolve,reject);
      });
    });
  }

  /* get directory entry */
  function dir(path,options){
    options = options || {};
    return fs.then(function(fs){
      return new Promise(function(resolve,reject){
        fs.root.getDirectory(path,options,resolve,reject);
      });
    });
  }

  /* return contents of a file */
  function read(path,method) {
    method = method || 'readAsText';
    return file(path).then(function(fileEntry) {
      return new Promise(function(resolve,reject){
        fileEntry.file(function(file){
          var reader = new FileReader();
          reader.onloadend = function(){
            resolve(this.result);
          };
          reader[method](file);
        },reject);
      });
    });
  }

  function readJSON(path){
    return read(path).then(JSON.parse);
  }

  /* write contents to a file */
  function write(path,blob,mimeType) {
    return ensure(dirname(path))
      .then(function() { return file(path,{create:true}); })
      .then(function(fileEntry) {
        return new Promise(function(resolve,reject){
          fileEntry.createWriter(function(writer){
            writer.onwriteend = resolve;
            writer.onerror = reject;
            if(typeof blob === 'string') {
              blob = new Blob([blob],{type: mimeType || 'text/plain'});
            } else if(blob instanceof Blob !== true){
              blob = new Blob([JSON.stringify(blob,null,4)],{type: mimeType || 'application/json'});
            }
            writer.write(blob);
          },reject);
        });
      });
    }

  /* move a file */
  function move(src,dest) {
    return ensure(dirname(dest))
      .then(function(dir) {
        return file(src).then(function(fileEntry){
          return new Promise(function(resolve,reject){
            fileEntry.moveTo(dir,filename(dest),resolve,reject);
          });
        });
      });
  }

  /* copy a file */
  function copy(src,dest) {
    return ensure(dirname(dest))
      .then(function(dir) {
        return file(src).then(function(fileEntry){
          return new Promise(function(resolve,reject){
            fileEntry.copyTo(dir,filename(dest),resolve,reject);
          });
        });
      });
  }

  /* delete a file */
  function remove(path,mustExist) {
    var method = !!mustExist? file: exists;
    return method(path).then(function(fileEntry){
      return new Promise(function(resolve,reject){
        fileEntry.remove(resolve,reject);
      });
    });
  }

  /* delete a directory */
  function removeDir(path) {
    return dir(path).then(function(dirEntry){
      return new Promise(function(resolve,reject) {
        dirEntry.removeRecursively(resolve,reject);
      });
    });
  }

  /* list contents of a directory */
  function list(path,getAsEntries) {
    return dir(path).then(function(dirEntry){
      return new Promise(function(resolve,reject){
        var dirReader = dirEntry.createReader();
        dirReader.readEntries(function(entries) {
          if(!getAsEntries) entries = entries.map(function(entry) { return entry.fullPath; });
          resolve(entries);
        }, reject);
      });
    });
  }

  return window.fs = {
    fs: fs,
    file: file,
    dir: dir,
    read: read,
    readJSON: readJSON,
    write: write,
    move: move,
    copy: copy,
    remove: remove,
    removeDir: removeDir,
    list: list,
    ensure: ensure,
    exists: exists,
    toURL:toURL,
    toInternalURL:toInternalURL,
    toDataURL:toDataURL
  };
};