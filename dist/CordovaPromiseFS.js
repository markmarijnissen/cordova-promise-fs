var CordovaPromiseFS =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

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
  str = str.substr(0,str.lastIndexOf('/')+1);
  if(str[0] === '/') str = str.substr(1);
  return str;
}

function filename(str) {
  return str.substr(str.lastIndexOf('/')+1);
}

function normalize(str){
  str = str || '';
  if(str[0] === '/') str = str.substr(1);

  var tokens = str.split('/'), last = tokens[0];

  // check tokens for instances of .. and .
  for(var i=1;i < tokens.length;i++) {
    last = tokens[i];
    if (tokens[i] === '..') {
      // remove the .. and the previous token
      tokens.splice(i-1,2);
      // rewind 'cursor' 2 tokens
      i = i - 2;
    } else if (tokens[i] === '.') {
      // remove the .. and the previous token
      tokens.splice(i,1);
      // rewind 'cursor' 1 token
      i--;
    }
  }

  str = tokens.join('/');
  if(str === './') {
    str = '';
  } else if(last && last.indexOf('.') < 0 && str[str.length - 1] != '/'){
    str += '/';
  }
  return str;
}

var transferQueue = [], // queued fileTransfers
    inprogress = 0;     // currently active filetransfers

/**
 * Factory function: Create a single instance (based on single FileSystem)
 */
module.exports = function(options){
  /* Promise implementation */
  var Promise = options.Promise || window.Promise;
  var CDV_INTERNAL_URL_ROOT = 'cdvfile://localhost/'+(options.persistent? 'persistent/':'temporary/');
  var CDV_URL_ROOT = '';
  if(!Promise) { throw new Error("No Promise library given in options.Promise"); }

  /* default options */
  options = options || {};
  options.crosswalk = !!options.crosswalk;
  options.persistent = options.persistent !== undefined? options.persistent: true;
  options.storageSize = options.storageSize || 20*1024*1024;
  options.concurrency = options.concurrency || 3;
  options.retry = options.retry || [];
  options.debug = !!options.debug;

  /* Cordova deviceready promise */
  var deviceready,
      isCordova = typeof cordova !== 'undefined' && !options.crosswalk,
      isCrosswalk = options.crosswalk;
  if(isCordova){
    deviceready = new Promise(function(resolve,reject){
      document.addEventListener("deviceready", resolve, false);
      setTimeout(function(){ reject(new Error('deviceready has not fired after 5 seconds.')); },5100);
    });
  } else if(isCrosswalk) {
    deviceready = ResolvedPromise(true);
  } else {
    /* FileTransfer implementation for Chrome */
    deviceready = ResolvedPromise(true);
    if(typeof webkitRequestFileSystem !== 'undefined'){
      window.requestFileSystem = webkitRequestFileSystem;
    } else {
      window.requestFileSystem = function(x,y,z,fail){
        fail(new Error('requestFileSystem not supported!'));
      };
    }
  }

  // Polyfill Filetransfer
  if(!isCordova){
    window.FileTransfer = function FileTransfer(){};
    FileTransfer.prototype.download = function download(url,file,win,fail) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.responseType = "blob";
      xhr.onreadystatechange = function(onSuccess, onError, cb) {
        if (xhr.readyState == 4) {
          if(xhr.status === 200 && !this._aborted){
            write(file,xhr.response).then(win,fail);
          } else {
            fail(xhr.status);
          }
        }
      };
      xhr.send();
      return xhr;
    };
    FileTransfer.prototype.abort = function(){
      this._aborted = true;
    };
    window.ProgressEvent = function ProgressEvent(){};
    window.FileEntry = function FileEntry(){};
  }

  /* Promise resolve helper */
  function ResolvedPromise(value){
    return new Promise(function(resolve){
      return resolve(value);
    });
  }

  /* the filesystem! */
  var fs = new Promise(function(resolve,reject){
    deviceready.then(function(){
      var type = options.persistent? 1: 0;
      if(options.fileSystem && isCordova){
        type = options.fileSystem;
      }
      // Crosswalk
      if(isCrosswalk){
        var system = options.fileSystem || 'cachedir';
        xwalk.experimental.native_file_system.requestNativeFileSystem(system,resolve,reject);
      // On chrome, request quota to store persistent files
      } else if (!isCordova && type === 1 && navigator.webkitPersistentStorage) {
        navigator.webkitPersistentStorage.requestQuota(options.storageSize, function(grantedBytes) {
          window.requestFileSystem(type, grantedBytes, resolve, reject);
        }, reject);

      // Exotic Cordova Directories (options.fileSystem = string)
      } else if(isNaN(type)) {
        window.resolveLocalFileSystemURL(type,function(directory){
            resolve(directory.filesystem);
        },reject);
      // Normal browser usage
      } else {
        window.requestFileSystem(type, options.storageSize, resolve, reject);
      }

      setTimeout(function(){ reject(new Error('Could not retrieve FileSystem after 5 seconds.')); },5100);
    },reject);
  });

  /* debug */
  fs.then(function(fs){
    CDV_URL_ROOT = fs.root.toURL();
    CDV_INTERNAL_URL_ROOT = isCordova? fs.root.toInternalURL(): CDV_URL_ROOT;
    window.__fs = fs;
  },function(err){
    console.error('Could not get Cordova FileSystem:',err);
  });

  /* ensure directory exists */
  function ensure(folders) {
    return new Promise(function(resolve,reject){
      return fs.then(function(fs){
          if(!folders) {
            resolve(fs.root);
          } else {
            folders = folders.split('/').filter(function(folder) {
              return folder && folder.length > 0 && folder !== '.' && folder !== '..';
            });
            __createDir(fs.root,folders,resolve,reject);
          }
        },reject);
    });
  }

    /* get file file */
  function file(path,options){
    return new Promise(function(resolve,reject){
      if(typeof path === 'object') {
        return resolve(path);
      }
      path = normalize(path);
      options = options || {};
      return fs.then(function(fs){
        fs.root.getFile(path,options,resolve,reject);
      },reject);
    });
  }

  /* get directory entry */
  function dir(path,options){
    path = normalize(path);
    options = options || {};
    return new Promise(function(resolve,reject){
      return fs.then(function(fs){
        if(!path || path === '/') {
          resolve(fs.root);
        } else {
          fs.root.getDirectory(path,options,resolve,reject);
        }
      },reject);
    });
  }

  /* list contents of a directory */
  function list(path,mode) {
    mode = mode || '';
    var recursive = mode.indexOf('r') > -1;
    var getAsEntries = mode.indexOf('e') > -1;
    var onlyFiles = mode.indexOf('f') > -1;
    var onlyDirs = mode.indexOf('d') > -1;
    if(onlyFiles && onlyDirs) {
      onlyFiles = false;
      onlyDirs = false;
    }

    return dir(path)
      .then(function(dirEntry){
        return new Promise(function(resolve, reject){
          var entries = [];
          var dirReader = dirEntry.createReader();
          var fetchEntries = function(){
            dirReader.readEntries(function(newEntries){
              if(newEntries.length === 0) {
                resolve(entries);
              } else {
                var args = [0,0].concat(newEntries);
                entries.splice.apply(entries,args);
                fetchEntries();
              }
            });
          }
          fetchEntries();
        });
      })
      .then(function(entries){
        var promises = [ResolvedPromise(entries)];
        if(recursive) {
          entries
            .filter(function(entry){return entry.isDirectory; })
            .forEach(function(entry){
              promises.push(list(entry.fullPath,'re'));
            });
        }
        return Promise.all(promises);
      })
      .then(function(values){
        var entries = [];
        entries = entries.concat.apply(entries,values);
        if(onlyFiles) entries = entries.filter(function(entry) { return entry.isFile; });
        if(onlyDirs) entries = entries.filter(function(entry) { return entry.isDirectory; });
        if(!getAsEntries) entries = entries.map(function(entry) { return entry.fullPath; });
        return entries;
      });
  }

  /* does file exist? If so, resolve with fileEntry, if not, resolve with false. */
  function exists(path){
    return new Promise(function(resolve,reject){
      file(path).then(
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

  /* does dir exist? If so, resolve with fileEntry, if not, resolve with false. */
  function existsDir(path){
    return new Promise(function(resolve,reject){
      dir(path).then(
        function(dirEntry){
          resolve(dirEntry);
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

  function create(path){
    return ensure(dirname(path)).then(function(){
      return file(path,{create:true});
    });
  }

  /* convert path to URL to be used in JS/CSS/HTML */
  function toURL(path) {
    return file(path).then(function(fileEntry) {
      return fileEntry.toURL();
    });
  }

  /* convert path to URL to be used in JS/CSS/HTML */
  var toInternalURL,toInternalURLSync,toURLSync;
  if(isCordova) {
    /* synchronous helper to get internal URL. */
    toInternalURLSync = function(path){
      path = normalize(path);
      return path.indexOf('://') < 0? CDV_INTERNAL_URL_ROOT + path: path;
    };
    /* synchronous helper to get native URL. */
    toURLSync = function(path){
      path = normalize(path);
      return path.indexOf('://') < 0? CDV_URL_ROOT + path: path;
    };

    toInternalURL = function(path) {
      return file(path).then(function(fileEntry) {
        return fileEntry.toInternalURL();
      });
    };
  } else if(isCrosswalk){
    var system = options.fileSystem || 'cachedir';
    /* synchronous helper to get internal URL. */
    toInternalURLSync = function(path){
      path = normalize(path);
      return path.indexOf(system) < 0? '/'+system+'/' + path: path;
    };
    toInternalURL = function(path) {
      return file(path).then(function(fileEntry) {
        return fileEntry.toURL();
      });
    };
    toURLSync = toInternalURLSync;
  } else {
    /* synchronous helper to get internal URL. */
    toInternalURLSync = function(path){
      path = normalize(path);
      return 'filesystem:'+location.origin+(options.persistent? '/persistent/':'/temporary/') + path;
    };

    toInternalURL = function(path) {
      return file(path).then(function(fileEntry) {
        return fileEntry.toURL();
      });
    };
    toURLSync = toInternalURLSync;
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

  /* convert path to base64 date URI */
  function toDataURL(path) {
    return read(path,'readAsDataURL');
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
              blob = createBlob([blob], mimeType || 'text/plain');
            } else if(blob instanceof Blob !== true){
              blob = createBlob([JSON.stringify(blob,null,4)], mimeType || 'application/json');
            }
            writer.write(blob);
          },reject);
        });
      });
    }

  function createBlob(parts, type) {
    var BlobBuilder,
        bb;
    try {
      return new Blob(parts, {type: type});
    } catch(e) {
      BlobBuilder = window.BlobBuilder ||
        window.WebKitBlobBuilder ||
        window.MozBlobBuilder ||
        window.MSBlobBuilder;
      if(BlobBuilder) {
        bb = new BlobBuilder();
        bb.append(parts);
        return bb.getBlob(type);
      } else {
        throw new Error("Unable to create blob");
      }
    }
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

  /* move a dir */
  function moveDir(src,dest) {
    src = src.replace(/\/$/, '');
    dest = dest.replace(/\/$/, '');
    return ensure(dirname(dest))
      .then(function(destDir) {
        return dir(src).then(function(dirEntry){
          return new Promise(function(resolve,reject){
            dirEntry.moveTo(destDir,filename(dest),resolve,reject);
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
    var method = mustExist? file:exists;
    return new Promise(function(resolve,reject){
        method(path).then(function(fileEntry){
        if(fileEntry !== false) {
          fileEntry.remove(resolve,reject);
        } else {
          resolve(1);
        }
      },reject);
    }).then(function(val){
      return val === 1? false: true;
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

  // Whenever we want to start a transfer, we call popTransferQueue
  function popTransferQueue(){
    // while we are not at max concurrency
    while(transferQueue.length > 0 && inprogress < options.concurrency){
      // increment activity counter
      inprogress++;

      // fetch filetranfer, method-type (isDownload) and arguments
      var args = transferQueue.pop();
	  var ft = args.fileTransfer,
	      isDownload = args.isDownload,
	      serverUrl = args.serverUrl,
	      localPath = args.localPath,
	      trustAllHosts = args.trustAllHosts,
	      transferOptions = args.transferOptions,
	      win = args.win,
	      fail = args.fail;

      if(ft._aborted) {
        inprogress--;
      } else if(isDownload){
        ft.download.call(ft,serverUrl,localPath,win,fail,trustAllHosts,transferOptions);
        if(ft.onprogress) ft.onprogress(new ProgressEvent());
      } else {
        ft.upload.call(ft,localPath,serverUrl,win,fail,transferOptions,trustAllHosts);
      }
    }
    // if we are at max concurrency, popTransferQueue() will be called whenever
    // the transfer is ready and there is space avaialable.
  }

  // Promise callback to check if there are any more queued transfers
  function nextTransfer(result){
    inprogress--; // decrement counter to free up one space to start transfers again!
    popTransferQueue(); // check if there are any queued transfers
    return result;
  }

  function filetransfer(isDownload,serverUrl,localPath,transferOptions,onprogress){
    if(typeof transferOptions === 'function') {
      onprogress = transferOptions;
      transferOptions = {};
    }
    if(isCordova && localPath.indexOf('://') < 0) localPath = toURLSync(localPath);

    transferOptions = transferOptions || {};
    if(!transferOptions.retry || !transferOptions.retry.length) {
      transferOptions.retry = options.retry;
    }
    transferOptions.retry = transferOptions.retry.concat();
    if(!transferOptions.file && !isDownload){
      transferOptions.fileName = filename(localPath);
    }

    var ft = new FileTransfer();
    onprogress = onprogress || transferOptions.onprogress;
    if(typeof onprogress === 'function') ft.onprogress = onprogress;
    var promise = new Promise(function(resolve,reject){
      var attempt = function(err){
        if(transferOptions.retry.length === 0) {
          if(options.debug) console.log('FileTransfer Error: '+serverUrl,err);
          reject(err);
        } else {

    		  var transferJob = {
    		    fileTransfer:ft,
    		    isDownload:isDownload,
    		    serverUrl:serverUrl,
    		    localPath:localPath,
    		    trustAllHosts:transferOptions.trustAllHosts || false,
    		    transferOptions:transferOptions,
    		    win:resolve,
    		    fail:attempt
    		  };
          transferQueue.unshift(transferJob);
          var timeout = transferOptions.retry.shift();
          if(timeout > 0) {
            setTimeout(nextTransfer,timeout);
          } else {
            nextTransfer();
          }
        }
      };
      transferOptions.retry.unshift(0);
      inprogress++;
      attempt();
    });
    promise.then(nextTransfer,nextTransfer);
    promise.progress = function(onprogress){
      ft.onprogress = onprogress;
      return promise;
    };
    promise.abort = function(){
      ft._aborted = true;
      ft.abort();
      return promise;
    };
    return promise;
  }

  function download(url,dest,options,onprogress){
    return filetransfer(true,url,dest,options,onprogress);
  }

  function upload(source,dest,options,onprogress){
    return filetransfer(false,dest,source,options,onprogress);
  }

  return {
    fs: fs,
    normalize: normalize,
    file: file,
    filename: filename,
    dir: dir,
    dirname: dirname,
    create:create,
    read: read,
    readJSON: readJSON,
    write: write,
    move: move,
    moveDir: moveDir,
    copy: copy,
    remove: remove,
    removeDir: removeDir,
    list: list,
    ensure: ensure,
    exists: exists,
    existsDir: existsDir,
    download: download,
    upload: upload,
    toURL:toURL,
    toURLSync: toURLSync,
    isCordova:isCordova,
    toInternalURLSync: toInternalURLSync,
    toInternalURL:toInternalURL,
    toDataURL:toDataURL,
    deviceready: deviceready,
    options: options,
    Promise: Promise
  };
};


/***/ })
/******/ ]);