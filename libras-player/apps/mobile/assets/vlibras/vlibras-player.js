var VLibras = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // window-shim.js
  var require_window_shim = __commonJS({
    "window-shim.js"(exports, module) {
      module.exports = typeof window !== "undefined" ? window : globalThis;
    }
  });

  // node_modules/object-assign/index.js
  var require_object_assign = __commonJS({
    "node_modules/object-assign/index.js"(exports, module) {
      "use strict";
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var propIsEnumerable = Object.prototype.propertyIsEnumerable;
      function toObject(val) {
        if (val === null || val === void 0) {
          throw new TypeError("Object.assign cannot be called with null or undefined");
        }
        return Object(val);
      }
      module.exports = Object.assign || function(target, source) {
        var from;
        var to = toObject(target);
        var symbols;
        for (var s = 1; s < arguments.length; s++) {
          from = Object(arguments[s]);
          for (var key in from) {
            if (hasOwnProperty.call(from, key)) {
              to[key] = from[key];
            }
          }
          if (Object.getOwnPropertySymbols) {
            symbols = Object.getOwnPropertySymbols(from);
            for (var i = 0; i < symbols.length; i++) {
              if (propIsEnumerable.call(from, symbols[i])) {
                to[symbols[i]] = from[symbols[i]];
              }
            }
          }
        }
        return to;
      };
    }
  });

  // node_modules/inherits/inherits_browser.js
  var require_inherits_browser = __commonJS({
    "node_modules/inherits/inherits_browser.js"(exports, module) {
      if (typeof Object.create === "function") {
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        };
      } else {
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        };
      }
    }
  });

  // ../esbuild-iso/node_modules/path-browserify/index.js
  var require_path_browserify = __commonJS({
    "../esbuild-iso/node_modules/path-browserify/index.js"(exports, module) {
      "use strict";
      function assertPath(path) {
        if (typeof path !== "string") {
          throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
        }
      }
      function normalizeStringPosix(path, allowAboveRoot) {
        var res = "";
        var lastSegmentLength = 0;
        var lastSlash = -1;
        var dots = 0;
        var code;
        for (var i = 0; i <= path.length; ++i) {
          if (i < path.length)
            code = path.charCodeAt(i);
          else if (code === 47)
            break;
          else
            code = 47;
          if (code === 47) {
            if (lastSlash === i - 1 || dots === 1) {
            } else if (lastSlash !== i - 1 && dots === 2) {
              if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                if (res.length > 2) {
                  var lastSlashIndex = res.lastIndexOf("/");
                  if (lastSlashIndex !== res.length - 1) {
                    if (lastSlashIndex === -1) {
                      res = "";
                      lastSegmentLength = 0;
                    } else {
                      res = res.slice(0, lastSlashIndex);
                      lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
                    }
                    lastSlash = i;
                    dots = 0;
                    continue;
                  }
                } else if (res.length === 2 || res.length === 1) {
                  res = "";
                  lastSegmentLength = 0;
                  lastSlash = i;
                  dots = 0;
                  continue;
                }
              }
              if (allowAboveRoot) {
                if (res.length > 0)
                  res += "/..";
                else
                  res = "..";
                lastSegmentLength = 2;
              }
            } else {
              if (res.length > 0)
                res += "/" + path.slice(lastSlash + 1, i);
              else
                res = path.slice(lastSlash + 1, i);
              lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
          } else if (code === 46 && dots !== -1) {
            ++dots;
          } else {
            dots = -1;
          }
        }
        return res;
      }
      function _format(sep, pathObject) {
        var dir = pathObject.dir || pathObject.root;
        var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
        if (!dir) {
          return base;
        }
        if (dir === pathObject.root) {
          return dir + base;
        }
        return dir + sep + base;
      }
      var posix = {
        // path.resolve([from ...], to)
        resolve: function resolve() {
          var resolvedPath = "";
          var resolvedAbsolute = false;
          var cwd;
          for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path;
            if (i >= 0)
              path = arguments[i];
            else {
              if (cwd === void 0)
                cwd = process.cwd();
              path = cwd;
            }
            assertPath(path);
            if (path.length === 0) {
              continue;
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charCodeAt(0) === 47;
          }
          resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
          if (resolvedAbsolute) {
            if (resolvedPath.length > 0)
              return "/" + resolvedPath;
            else
              return "/";
          } else if (resolvedPath.length > 0) {
            return resolvedPath;
          } else {
            return ".";
          }
        },
        normalize: function normalize(path) {
          assertPath(path);
          if (path.length === 0) return ".";
          var isAbsolute = path.charCodeAt(0) === 47;
          var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
          path = normalizeStringPosix(path, !isAbsolute);
          if (path.length === 0 && !isAbsolute) path = ".";
          if (path.length > 0 && trailingSeparator) path += "/";
          if (isAbsolute) return "/" + path;
          return path;
        },
        isAbsolute: function isAbsolute(path) {
          assertPath(path);
          return path.length > 0 && path.charCodeAt(0) === 47;
        },
        join: function join() {
          if (arguments.length === 0)
            return ".";
          var joined;
          for (var i = 0; i < arguments.length; ++i) {
            var arg = arguments[i];
            assertPath(arg);
            if (arg.length > 0) {
              if (joined === void 0)
                joined = arg;
              else
                joined += "/" + arg;
            }
          }
          if (joined === void 0)
            return ".";
          return posix.normalize(joined);
        },
        relative: function relative(from, to) {
          assertPath(from);
          assertPath(to);
          if (from === to) return "";
          from = posix.resolve(from);
          to = posix.resolve(to);
          if (from === to) return "";
          var fromStart = 1;
          for (; fromStart < from.length; ++fromStart) {
            if (from.charCodeAt(fromStart) !== 47)
              break;
          }
          var fromEnd = from.length;
          var fromLen = fromEnd - fromStart;
          var toStart = 1;
          for (; toStart < to.length; ++toStart) {
            if (to.charCodeAt(toStart) !== 47)
              break;
          }
          var toEnd = to.length;
          var toLen = toEnd - toStart;
          var length = fromLen < toLen ? fromLen : toLen;
          var lastCommonSep = -1;
          var i = 0;
          for (; i <= length; ++i) {
            if (i === length) {
              if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                  return to.slice(toStart + i + 1);
                } else if (i === 0) {
                  return to.slice(toStart + i);
                }
              } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                  lastCommonSep = i;
                } else if (i === 0) {
                  lastCommonSep = 0;
                }
              }
              break;
            }
            var fromCode = from.charCodeAt(fromStart + i);
            var toCode = to.charCodeAt(toStart + i);
            if (fromCode !== toCode)
              break;
            else if (fromCode === 47)
              lastCommonSep = i;
          }
          var out = "";
          for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (i === fromEnd || from.charCodeAt(i) === 47) {
              if (out.length === 0)
                out += "..";
              else
                out += "/..";
            }
          }
          if (out.length > 0)
            return out + to.slice(toStart + lastCommonSep);
          else {
            toStart += lastCommonSep;
            if (to.charCodeAt(toStart) === 47)
              ++toStart;
            return to.slice(toStart);
          }
        },
        _makeLong: function _makeLong(path) {
          return path;
        },
        dirname: function dirname(path) {
          assertPath(path);
          if (path.length === 0) return ".";
          var code = path.charCodeAt(0);
          var hasRoot = code === 47;
          var end = -1;
          var matchedSlash = true;
          for (var i = path.length - 1; i >= 1; --i) {
            code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                end = i;
                break;
              }
            } else {
              matchedSlash = false;
            }
          }
          if (end === -1) return hasRoot ? "/" : ".";
          if (hasRoot && end === 1) return "//";
          return path.slice(0, end);
        },
        basename: function basename(path, ext) {
          if (ext !== void 0 && typeof ext !== "string") throw new TypeError('"ext" argument must be a string');
          assertPath(path);
          var start = 0;
          var end = -1;
          var matchedSlash = true;
          var i;
          if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
            if (ext.length === path.length && ext === path) return "";
            var extIdx = ext.length - 1;
            var firstNonSlashEnd = -1;
            for (i = path.length - 1; i >= 0; --i) {
              var code = path.charCodeAt(i);
              if (code === 47) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else {
                if (firstNonSlashEnd === -1) {
                  matchedSlash = false;
                  firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                  if (code === ext.charCodeAt(extIdx)) {
                    if (--extIdx === -1) {
                      end = i;
                    }
                  } else {
                    extIdx = -1;
                    end = firstNonSlashEnd;
                  }
                }
              }
            }
            if (start === end) end = firstNonSlashEnd;
            else if (end === -1) end = path.length;
            return path.slice(start, end);
          } else {
            for (i = path.length - 1; i >= 0; --i) {
              if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
            }
            if (end === -1) return "";
            return path.slice(start, end);
          }
        },
        extname: function extname(path) {
          assertPath(path);
          var startDot = -1;
          var startPart = 0;
          var end = -1;
          var matchedSlash = true;
          var preDotState = 0;
          for (var i = path.length - 1; i >= 0; --i) {
            var code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                startPart = i + 1;
                break;
              }
              continue;
            }
            if (end === -1) {
              matchedSlash = false;
              end = i + 1;
            }
            if (code === 46) {
              if (startDot === -1)
                startDot = i;
              else if (preDotState !== 1)
                preDotState = 1;
            } else if (startDot !== -1) {
              preDotState = -1;
            }
          }
          if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
          preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            return "";
          }
          return path.slice(startDot, end);
        },
        format: function format(pathObject) {
          if (pathObject === null || typeof pathObject !== "object") {
            throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
          }
          return _format("/", pathObject);
        },
        parse: function parse(path) {
          assertPath(path);
          var ret = { root: "", dir: "", base: "", ext: "", name: "" };
          if (path.length === 0) return ret;
          var code = path.charCodeAt(0);
          var isAbsolute = code === 47;
          var start;
          if (isAbsolute) {
            ret.root = "/";
            start = 1;
          } else {
            start = 0;
          }
          var startDot = -1;
          var startPart = 0;
          var end = -1;
          var matchedSlash = true;
          var i = path.length - 1;
          var preDotState = 0;
          for (; i >= start; --i) {
            code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                startPart = i + 1;
                break;
              }
              continue;
            }
            if (end === -1) {
              matchedSlash = false;
              end = i + 1;
            }
            if (code === 46) {
              if (startDot === -1) startDot = i;
              else if (preDotState !== 1) preDotState = 1;
            } else if (startDot !== -1) {
              preDotState = -1;
            }
          }
          if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
          preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            if (end !== -1) {
              if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);
              else ret.base = ret.name = path.slice(startPart, end);
            }
          } else {
            if (startPart === 0 && isAbsolute) {
              ret.name = path.slice(1, startDot);
              ret.base = path.slice(1, end);
            } else {
              ret.name = path.slice(startPart, startDot);
              ret.base = path.slice(startPart, end);
            }
            ret.ext = path.slice(startDot, end);
          }
          if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
          else if (isAbsolute) ret.dir = "/";
          return ret;
        },
        sep: "/",
        delimiter: ":",
        win32: null,
        posix: null
      };
      posix.posix = posix;
      module.exports = posix;
    }
  });

  // node_modules/url-join/lib/url-join.js
  var require_url_join = __commonJS({
    "node_modules/url-join/lib/url-join.js"(exports, module) {
      (function(name, context, definition) {
        if (typeof module !== "undefined" && module.exports) module.exports = definition();
        else if (typeof define === "function" && define.amd) define(definition);
        else context[name] = definition();
      })("urljoin", exports, function() {
        function normalize(strArray) {
          var resultArray = [];
          if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
            var first = strArray.shift();
            strArray[0] = first + strArray[0];
          }
          if (strArray[0].match(/^file:\/\/\//)) {
            strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1:///");
          } else {
            strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1://");
          }
          for (var i = 0; i < strArray.length; i++) {
            var component = strArray[i];
            if (typeof component !== "string") {
              throw new TypeError("Url must be a string. Received " + component);
            }
            if (component === "") {
              continue;
            }
            if (i > 0) {
              component = component.replace(/^[\/]+/, "");
            }
            if (i < strArray.length - 1) {
              component = component.replace(/[\/]+$/, "");
            } else {
              component = component.replace(/[\/]+$/, "/");
            }
            resultArray.push(component);
          }
          var str = resultArray.join("/");
          str = str.replace(/\/(\?|&|#[^!])/g, "$1");
          var parts = str.split("?");
          str = parts.shift() + (parts.length > 0 ? "?" : "") + parts.join("&");
          return str;
        }
        return function() {
          var input;
          if (typeof arguments[0] === "object") {
            input = arguments[0];
          } else {
            input = [].slice.call(arguments);
          }
          return normalize(input);
        };
      });
    }
  });

  // ../esbuild-iso/node_modules/events/events.js
  var require_events = __commonJS({
    "../esbuild-iso/node_modules/events/events.js"(exports, module) {
      "use strict";
      var R = typeof Reflect === "object" ? Reflect : null;
      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      var ReflectOwnKeys;
      if (R && typeof R.ownKeys === "function") {
        ReflectOwnKeys = R.ownKeys;
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target);
        };
      }
      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }
      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
        return value !== value;
      };
      function EventEmitter() {
        EventEmitter.init.call(this);
      }
      module.exports = EventEmitter;
      module.exports.once = once;
      EventEmitter.EventEmitter = EventEmitter;
      EventEmitter.prototype._events = void 0;
      EventEmitter.prototype._eventsCount = 0;
      EventEmitter.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if (typeof listener !== "function") {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }
      Object.defineProperty(EventEmitter, "defaultMaxListeners", {
        enumerable: true,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          }
          defaultMaxListeners = arg;
        }
      });
      EventEmitter.init = function() {
        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        }
        this._maxListeners = this._maxListeners || void 0;
      };
      EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
        if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
        }
        this._maxListeners = n;
        return this;
      };
      function _getMaxListeners(that) {
        if (that._maxListeners === void 0)
          return EventEmitter.defaultMaxListeners;
        return that._maxListeners;
      }
      EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };
      EventEmitter.prototype.emit = function emit(type) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = type === "error";
        var events = this._events;
        if (events !== void 0)
          doError = doError && events.error === void 0;
        else if (!doError)
          return false;
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            throw er;
          }
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          err.context = er;
          throw err;
        }
        var handler = events[type];
        if (handler === void 0)
          return false;
        if (typeof handler === "function") {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i = 0; i < len; ++i)
            ReflectApply(listeners[i], this, args);
        }
        return true;
      };
      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;
        checkListener(listener);
        events = target._events;
        if (events === void 0) {
          events = target._events = /* @__PURE__ */ Object.create(null);
          target._eventsCount = 0;
        } else {
          if (events.newListener !== void 0) {
            target.emit(
              "newListener",
              type,
              listener.listener ? listener.listener : listener
            );
            events = target._events;
          }
          existing = events[type];
        }
        if (existing === void 0) {
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === "function") {
            existing = events[type] = prepend ? [listener, existing] : [existing, listener];
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            w.name = "MaxListenersExceededWarning";
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }
        return target;
      }
      EventEmitter.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };
      EventEmitter.prototype.on = EventEmitter.prototype.addListener;
      EventEmitter.prototype.prependListener = function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }
      function _onceWrap(target, type, listener) {
        var state = { fired: false, wrapFn: void 0, target, type, listener };
        var wrapped = onceWrapper.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped;
      }
      EventEmitter.prototype.once = function once2(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.removeListener = function removeListener(type, listener) {
        var list, events, position, i, originalListener;
        checkListener(listener);
        events = this._events;
        if (events === void 0)
          return this;
        list = events[type];
        if (list === void 0)
          return this;
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit("removeListener", type, list.listener || listener);
          }
        } else if (typeof list !== "function") {
          position = -1;
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
          if (position < 0)
            return this;
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
          if (list.length === 1)
            events[type] = list[0];
          if (events.removeListener !== void 0)
            this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      };
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
      EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
        var listeners, events, i;
        events = this._events;
        if (events === void 0)
          return this;
        if (events.removeListener === void 0) {
          if (arguments.length === 0) {
            this._events = /* @__PURE__ */ Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== void 0) {
            if (--this._eventsCount === 0)
              this._events = /* @__PURE__ */ Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
          return this;
        }
        listeners = events[type];
        if (typeof listeners === "function") {
          this.removeListener(type, listeners);
        } else if (listeners !== void 0) {
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
        return this;
      };
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (events === void 0)
          return [];
        var evlistener = events[type];
        if (evlistener === void 0)
          return [];
        if (typeof evlistener === "function")
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      EventEmitter.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };
      EventEmitter.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };
      EventEmitter.listenerCount = function(emitter, type) {
        if (typeof emitter.listenerCount === "function") {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };
      EventEmitter.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;
        if (events !== void 0) {
          var evlistener = events[type];
          if (typeof evlistener === "function") {
            return 1;
          } else if (evlistener !== void 0) {
            return evlistener.length;
          }
        }
        return 0;
      }
      EventEmitter.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
      function arrayClone(arr, n) {
        var copy = new Array(n);
        for (var i = 0; i < n; ++i)
          copy[i] = arr[i];
        return copy;
      }
      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }
      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i = 0; i < ret.length; ++i) {
          ret[i] = arr[i].listener || arr[i];
        }
        return ret;
      }
      function once(emitter, name) {
        return new Promise(function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
          }
          function resolver() {
            if (typeof emitter.removeListener === "function") {
              emitter.removeListener("error", errorListener);
            }
            resolve([].slice.call(arguments));
          }
          ;
          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
          if (name !== "error") {
            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
          }
        });
      }
      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
        if (typeof emitter.on === "function") {
          eventTargetAgnosticAddListener(emitter, "error", handler, flags);
        }
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if (typeof emitter.on === "function") {
          if (flags.once) {
            emitter.once(name, listener);
          } else {
            emitter.on(name, listener);
          }
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(name, function wrapListener(arg) {
            if (flags.once) {
              emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
          });
        } else {
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
        }
      }
    }
  });

  // src/config.js
  var require_config = __commonJS({
    "src/config.js"(exports) {
      exports.translatorUrl = "https://traducao2.vlibras.gov.br/translate";
      exports.dictionaryUrl = "https://dicionario2.vlibras.gov.br/2018.3.1/WEBGL/";
      exports.dictionaryStaticUrl = "https://dicionario2.vlibras.gov.br/static/BUNDLES/2018.3.1/WEBGL/";
    }
  });

  // src/PlayerManagerAdapter.js
  var require_PlayerManagerAdapter = __commonJS({
    "src/PlayerManagerAdapter.js"(exports, module) {
      var window2 = require_window_shim();
      var inherits = require_inherits_browser();
      var EventEmitter = require_events().EventEmitter;
      var GAME_OBJECT = "PlayerManager";
      function PlayerManagerAdapter() {
        if (PlayerManagerAdapter.instance) return PlayerManagerAdapter.instance;
        this.subtitle = true;
        this.currentBaseUrl = "";
        this.on(
          "load",
          function() {
            this._send("initRandomAnimationsProcess");
          }.bind(this)
        );
        PlayerManagerAdapter.instance = this;
      }
      inherits(PlayerManagerAdapter, EventEmitter);
      PlayerManagerAdapter.prototype.setPlayerReference = function(player) {
        this.player = player;
      };
      PlayerManagerAdapter.prototype._send = function(method, params) {
        this.player.SendMessage(GAME_OBJECT, method, params);
      };
      PlayerManagerAdapter.prototype.play = function(glosa) {
        if (glosa) {
          this._send("playNow", glosa);
        } else {
          this._send("setPauseState", 0);
        }
      };
      PlayerManagerAdapter.prototype.setPersonalization = function(personalization) {
        this.player.SendMessage("CustomizationBridge", "setURL", personalization);
      };
      PlayerManagerAdapter.prototype.pause = function() {
        this._send("setPauseState", 1);
      };
      PlayerManagerAdapter.prototype.stop = function() {
        this._send("stopAll");
      };
      PlayerManagerAdapter.prototype.setSpeed = function(speed) {
        this._send("setSlider", speed);
      };
      PlayerManagerAdapter.prototype.toggleSubtitle = function() {
        this.subtitle = !this.subtitle;
        this._send("setSubtitlesState", toInt(this.subtitle));
      };
      PlayerManagerAdapter.prototype.playWellcome = function() {
        this._send("playWellcome");
      };
      PlayerManagerAdapter.prototype.changeAvatar = function(avatarName) {
        this._send("Change", avatarName);
      };
      PlayerManagerAdapter.prototype.setBaseUrl = function(url) {
        this._send("setBaseUrl", url);
        this.currentBaseUrl = url;
      };
      window2.onLoadPlayer = function() {
        PlayerManagerAdapter.instance.emit("load");
      };
      window2.updateProgress = function(progress) {
        PlayerManagerAdapter.instance.emit("progress", progress);
      };
      window2.onPlayingStateChange = function(isPlaying, isPaused, isPlayingIntervalAnimation, isLoading, isRepeatable) {
        PlayerManagerAdapter.instance.emit(
          "stateChange",
          toBoolean(isPlaying),
          toBoolean(isPaused),
          toBoolean(isLoading)
        );
      };
      window2.CounterGloss = function(counter, glosaLenght) {
        PlayerManagerAdapter.instance.emit("CounterGloss", counter, glosaLenght);
      };
      window2.GetAvatar = function(avatar) {
        PlayerManagerAdapter.instance.emit("GetAvatar", avatar);
      };
      window2.FinishWelcome = function(bool) {
        PlayerManagerAdapter.instance.emit("FinishWelcome", bool);
      };
      function toInt(boolean) {
        return !boolean ? 0 : 1;
      }
      function toBoolean(bool) {
        return bool != "False";
      }
      module.exports = PlayerManagerAdapter;
    }
  });

  // node_modules/component-emitter/index.js
  var require_component_emitter = __commonJS({
    "node_modules/component-emitter/index.js"(exports, module) {
      if (typeof module !== "undefined") {
        module.exports = Emitter;
      }
      function Emitter(obj) {
        if (obj) return mixin(obj);
      }
      function mixin(obj) {
        for (var key in Emitter.prototype) {
          obj[key] = Emitter.prototype[key];
        }
        return obj;
      }
      Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
        return this;
      };
      Emitter.prototype.once = function(event, fn) {
        function on() {
          this.off(event, on);
          fn.apply(this, arguments);
        }
        on.fn = fn;
        this.on(event, on);
        return this;
      };
      Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};
        if (0 == arguments.length) {
          this._callbacks = {};
          return this;
        }
        var callbacks = this._callbacks["$" + event];
        if (!callbacks) return this;
        if (1 == arguments.length) {
          delete this._callbacks["$" + event];
          return this;
        }
        var cb;
        for (var i = 0; i < callbacks.length; i++) {
          cb = callbacks[i];
          if (cb === fn || cb.fn === fn) {
            callbacks.splice(i, 1);
            break;
          }
        }
        return this;
      };
      Emitter.prototype.emit = function(event) {
        this._callbacks = this._callbacks || {};
        var args = [].slice.call(arguments, 1), callbacks = this._callbacks["$" + event];
        if (callbacks) {
          callbacks = callbacks.slice(0);
          for (var i = 0, len = callbacks.length; i < len; ++i) {
            callbacks[i].apply(this, args);
          }
        }
        return this;
      };
      Emitter.prototype.listeners = function(event) {
        this._callbacks = this._callbacks || {};
        return this._callbacks["$" + event] || [];
      };
      Emitter.prototype.hasListeners = function(event) {
        return !!this.listeners(event).length;
      };
    }
  });

  // node_modules/reduce-component/index.js
  var require_reduce_component = __commonJS({
    "node_modules/reduce-component/index.js"(exports, module) {
      module.exports = function(arr, fn, initial) {
        var idx = 0;
        var len = arr.length;
        var curr = arguments.length == 3 ? initial : arr[idx++];
        while (idx < len) {
          curr = fn.call(null, curr, arr[idx], ++idx, arr);
        }
        return curr;
      };
    }
  });

  // node_modules/superagent/lib/client.js
  var require_client = __commonJS({
    "node_modules/superagent/lib/client.js"(exports, module) {
      var Emitter = require_component_emitter();
      var reduce = require_reduce_component();
      var root;
      if (typeof window !== "undefined") {
        root = window;
      } else if (typeof self !== "undefined") {
        root = self;
      } else {
        root = exports;
      }
      function noop() {
      }
      function isHost(obj) {
        var str = {}.toString.call(obj);
        switch (str) {
          case "[object File]":
          case "[object Blob]":
          case "[object FormData]":
            return true;
          default:
            return false;
        }
      }
      request.getXHR = function() {
        if (root.XMLHttpRequest && (!root.location || "file:" != root.location.protocol || !root.ActiveXObject)) {
          return new XMLHttpRequest();
        } else {
          try {
            return new ActiveXObject("Microsoft.XMLHTTP");
          } catch (e) {
          }
          try {
            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
          } catch (e) {
          }
          try {
            return new ActiveXObject("Msxml2.XMLHTTP.3.0");
          } catch (e) {
          }
          try {
            return new ActiveXObject("Msxml2.XMLHTTP");
          } catch (e) {
          }
        }
        return false;
      };
      var trim = "".trim ? function(s) {
        return s.trim();
      } : function(s) {
        return s.replace(/(^\s*|\s*$)/g, "");
      };
      function isObject(obj) {
        return obj === Object(obj);
      }
      function serialize(obj) {
        if (!isObject(obj)) return obj;
        var pairs = [];
        for (var key in obj) {
          if (null != obj[key]) {
            pushEncodedKeyValuePair(pairs, key, obj[key]);
          }
        }
        return pairs.join("&");
      }
      function pushEncodedKeyValuePair(pairs, key, val) {
        if (Array.isArray(val)) {
          return val.forEach(function(v) {
            pushEncodedKeyValuePair(pairs, key, v);
          });
        }
        pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(val));
      }
      request.serializeObject = serialize;
      function parseString(str) {
        var obj = {};
        var pairs = str.split("&");
        var parts;
        var pair;
        for (var i = 0, len = pairs.length; i < len; ++i) {
          pair = pairs[i];
          parts = pair.split("=");
          obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }
        return obj;
      }
      request.parseString = parseString;
      request.types = {
        html: "text/html",
        json: "application/json",
        xml: "application/xml",
        urlencoded: "application/x-www-form-urlencoded",
        "form": "application/x-www-form-urlencoded",
        "form-data": "application/x-www-form-urlencoded"
      };
      request.serialize = {
        "application/x-www-form-urlencoded": serialize,
        "application/json": JSON.stringify
      };
      request.parse = {
        "application/x-www-form-urlencoded": parseString,
        "application/json": JSON.parse
      };
      function parseHeader(str) {
        var lines = str.split(/\r?\n/);
        var fields = {};
        var index;
        var line;
        var field;
        var val;
        lines.pop();
        for (var i = 0, len = lines.length; i < len; ++i) {
          line = lines[i];
          index = line.indexOf(":");
          field = line.slice(0, index).toLowerCase();
          val = trim(line.slice(index + 1));
          fields[field] = val;
        }
        return fields;
      }
      function isJSON(mime) {
        return /[\/+]json\b/.test(mime);
      }
      function type(str) {
        return str.split(/ *; */).shift();
      }
      function params(str) {
        return reduce(str.split(/ *; */), function(obj, str2) {
          var parts = str2.split(/ *= */), key = parts.shift(), val = parts.shift();
          if (key && val) obj[key] = val;
          return obj;
        }, {});
      }
      function Response(req, options) {
        options = options || {};
        this.req = req;
        this.xhr = this.req.xhr;
        this.text = this.req.method != "HEAD" && (this.xhr.responseType === "" || this.xhr.responseType === "text") || typeof this.xhr.responseType === "undefined" ? this.xhr.responseText : null;
        this.statusText = this.req.xhr.statusText;
        this.setStatusProperties(this.xhr.status);
        this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
        this.header["content-type"] = this.xhr.getResponseHeader("content-type");
        this.setHeaderProperties(this.header);
        this.body = this.req.method != "HEAD" ? this.parseBody(this.text ? this.text : this.xhr.response) : null;
      }
      Response.prototype.get = function(field) {
        return this.header[field.toLowerCase()];
      };
      Response.prototype.setHeaderProperties = function(header) {
        var ct = this.header["content-type"] || "";
        this.type = type(ct);
        var obj = params(ct);
        for (var key in obj) this[key] = obj[key];
      };
      Response.prototype.parseBody = function(str) {
        var parse = request.parse[this.type];
        return parse && str && (str.length || str instanceof Object) ? parse(str) : null;
      };
      Response.prototype.setStatusProperties = function(status) {
        if (status === 1223) {
          status = 204;
        }
        var type2 = status / 100 | 0;
        this.status = this.statusCode = status;
        this.statusType = type2;
        this.info = 1 == type2;
        this.ok = 2 == type2;
        this.clientError = 4 == type2;
        this.serverError = 5 == type2;
        this.error = 4 == type2 || 5 == type2 ? this.toError() : false;
        this.accepted = 202 == status;
        this.noContent = 204 == status;
        this.badRequest = 400 == status;
        this.unauthorized = 401 == status;
        this.notAcceptable = 406 == status;
        this.notFound = 404 == status;
        this.forbidden = 403 == status;
      };
      Response.prototype.toError = function() {
        var req = this.req;
        var method = req.method;
        var url = req.url;
        var msg = "cannot " + method + " " + url + " (" + this.status + ")";
        var err = new Error(msg);
        err.status = this.status;
        err.method = method;
        err.url = url;
        return err;
      };
      request.Response = Response;
      function Request(method, url) {
        var self2 = this;
        Emitter.call(this);
        this._query = this._query || [];
        this.method = method;
        this.url = url;
        this.header = {};
        this._header = {};
        this.on("end", function() {
          var err = null;
          var res = null;
          try {
            res = new Response(self2);
          } catch (e) {
            err = new Error("Parser is unable to parse the response");
            err.parse = true;
            err.original = e;
            err.rawResponse = self2.xhr && self2.xhr.responseText ? self2.xhr.responseText : null;
            return self2.callback(err);
          }
          self2.emit("response", res);
          if (err) {
            return self2.callback(err, res);
          }
          if (res.status >= 200 && res.status < 300) {
            return self2.callback(err, res);
          }
          var new_err = new Error(res.statusText || "Unsuccessful HTTP response");
          new_err.original = err;
          new_err.response = res;
          new_err.status = res.status;
          self2.callback(new_err, res);
        });
      }
      Emitter(Request.prototype);
      Request.prototype.use = function(fn) {
        fn(this);
        return this;
      };
      Request.prototype.timeout = function(ms) {
        this._timeout = ms;
        return this;
      };
      Request.prototype.clearTimeout = function() {
        this._timeout = 0;
        clearTimeout(this._timer);
        return this;
      };
      Request.prototype.abort = function() {
        if (this.aborted) return;
        this.aborted = true;
        this.xhr.abort();
        this.clearTimeout();
        this.emit("abort");
        return this;
      };
      Request.prototype.set = function(field, val) {
        if (isObject(field)) {
          for (var key in field) {
            this.set(key, field[key]);
          }
          return this;
        }
        this._header[field.toLowerCase()] = val;
        this.header[field] = val;
        return this;
      };
      Request.prototype.unset = function(field) {
        delete this._header[field.toLowerCase()];
        delete this.header[field];
        return this;
      };
      Request.prototype.getHeader = function(field) {
        return this._header[field.toLowerCase()];
      };
      Request.prototype.type = function(type2) {
        this.set("Content-Type", request.types[type2] || type2);
        return this;
      };
      Request.prototype.parse = function(fn) {
        this._parser = fn;
        return this;
      };
      Request.prototype.accept = function(type2) {
        this.set("Accept", request.types[type2] || type2);
        return this;
      };
      Request.prototype.auth = function(user, pass) {
        var str = btoa(user + ":" + pass);
        this.set("Authorization", "Basic " + str);
        return this;
      };
      Request.prototype.query = function(val) {
        if ("string" != typeof val) val = serialize(val);
        if (val) this._query.push(val);
        return this;
      };
      Request.prototype.field = function(name, val) {
        if (!this._formData) this._formData = new root.FormData();
        this._formData.append(name, val);
        return this;
      };
      Request.prototype.attach = function(field, file, filename) {
        if (!this._formData) this._formData = new root.FormData();
        this._formData.append(field, file, filename || file.name);
        return this;
      };
      Request.prototype.send = function(data) {
        var obj = isObject(data);
        var type2 = this.getHeader("Content-Type");
        if (obj && isObject(this._data)) {
          for (var key in data) {
            this._data[key] = data[key];
          }
        } else if ("string" == typeof data) {
          if (!type2) this.type("form");
          type2 = this.getHeader("Content-Type");
          if ("application/x-www-form-urlencoded" == type2) {
            this._data = this._data ? this._data + "&" + data : data;
          } else {
            this._data = (this._data || "") + data;
          }
        } else {
          this._data = data;
        }
        if (!obj || isHost(data)) return this;
        if (!type2) this.type("json");
        return this;
      };
      Request.prototype.callback = function(err, res) {
        var fn = this._callback;
        this.clearTimeout();
        fn(err, res);
      };
      Request.prototype.crossDomainError = function() {
        var err = new Error("Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.");
        err.crossDomain = true;
        err.status = this.status;
        err.method = this.method;
        err.url = this.url;
        this.callback(err);
      };
      Request.prototype.timeoutError = function() {
        var timeout = this._timeout;
        var err = new Error("timeout of " + timeout + "ms exceeded");
        err.timeout = timeout;
        this.callback(err);
      };
      Request.prototype.withCredentials = function() {
        this._withCredentials = true;
        return this;
      };
      Request.prototype.end = function(fn) {
        var self2 = this;
        var xhr = this.xhr = request.getXHR();
        var query = this._query.join("&");
        var timeout = this._timeout;
        var data = this._formData || this._data;
        this._callback = fn || noop;
        xhr.onreadystatechange = function() {
          if (4 != xhr.readyState) return;
          var status;
          try {
            status = xhr.status;
          } catch (e) {
            status = 0;
          }
          if (0 == status) {
            if (self2.timedout) return self2.timeoutError();
            if (self2.aborted) return;
            return self2.crossDomainError();
          }
          self2.emit("end");
        };
        var handleProgress = function(e) {
          if (e.total > 0) {
            e.percent = e.loaded / e.total * 100;
          }
          e.direction = "download";
          self2.emit("progress", e);
        };
        if (this.hasListeners("progress")) {
          xhr.onprogress = handleProgress;
        }
        try {
          if (xhr.upload && this.hasListeners("progress")) {
            xhr.upload.onprogress = handleProgress;
          }
        } catch (e) {
        }
        if (timeout && !this._timer) {
          this._timer = setTimeout(function() {
            self2.timedout = true;
            self2.abort();
          }, timeout);
        }
        if (query) {
          query = request.serializeObject(query);
          this.url += ~this.url.indexOf("?") ? "&" + query : "?" + query;
        }
        xhr.open(this.method, this.url, true);
        if (this._withCredentials) xhr.withCredentials = true;
        if ("GET" != this.method && "HEAD" != this.method && "string" != typeof data && !isHost(data)) {
          var contentType = this.getHeader("Content-Type");
          var serialize2 = this._parser || request.serialize[contentType ? contentType.split(";")[0] : ""];
          if (!serialize2 && isJSON(contentType)) serialize2 = request.serialize["application/json"];
          if (serialize2) data = serialize2(data);
        }
        for (var field in this.header) {
          if (null == this.header[field]) continue;
          xhr.setRequestHeader(field, this.header[field]);
        }
        this.emit("request", this);
        xhr.send(typeof data !== "undefined" ? data : null);
        return this;
      };
      Request.prototype.then = function(fulfill, reject) {
        return this.end(function(err, res) {
          err ? reject(err) : fulfill(res);
        });
      };
      request.Request = Request;
      function request(method, url) {
        if ("function" == typeof url) {
          return new Request("GET", method).end(url);
        }
        if (1 == arguments.length) {
          return new Request("GET", method);
        }
        return new Request(method, url);
      }
      request.get = function(url, data, fn) {
        var req = request("GET", url);
        if ("function" == typeof data) fn = data, data = null;
        if (data) req.query(data);
        if (fn) req.end(fn);
        return req;
      };
      request.head = function(url, data, fn) {
        var req = request("HEAD", url);
        if ("function" == typeof data) fn = data, data = null;
        if (data) req.send(data);
        if (fn) req.end(fn);
        return req;
      };
      function del(url, fn) {
        var req = request("DELETE", url);
        if (fn) req.end(fn);
        return req;
      }
      request["del"] = del;
      request["delete"] = del;
      request.patch = function(url, data, fn) {
        var req = request("PATCH", url);
        if ("function" == typeof data) fn = data, data = null;
        if (data) req.send(data);
        if (fn) req.end(fn);
        return req;
      };
      request.post = function(url, data, fn) {
        var req = request("POST", url);
        if ("function" == typeof data) fn = data, data = null;
        if (data) req.send(data);
        if (fn) req.end(fn);
        return req;
      };
      request.put = function(url, data, fn) {
        var req = request("PUT", url);
        if ("function" == typeof data) fn = data, data = null;
        if (data) req.send(data);
        if (fn) req.end(fn);
        return req;
      };
      module.exports = request;
    }
  });

  // src/GlosaTranslator.js
  var require_GlosaTranslator = __commonJS({
    "src/GlosaTranslator.js"(exports, module) {
      var request = require_client();
      function GlosaTranslator(endpoint) {
        this.endpoint = endpoint;
      }
      GlosaTranslator.prototype.translate = function(text, domain, callback) {
        let time = 15;
        let hasTimeout = false;
        const size = text.split(" ").length;
        if (size > 50) time += size * 0.4 / 10;
        const timeout = setTimeout(() => {
          hasTimeout = true;
          callback(void 0, "timeout_error");
        }, time * 1e3);
        request.post(this.endpoint, { text, domain }).end(
          function(err, response) {
            if (hasTimeout) return;
            clearTimeout(timeout);
            if (err) callback(void 0, err);
            else callback(response.text);
          }
        );
      };
      module.exports = GlosaTranslator;
    }
  });

  // src/Player.js
  var require_Player = __commonJS({
    "src/Player.js"(exports, module) {
      var window2 = require_window_shim();
      var assign = require_object_assign();
      var inherits = require_inherits_browser();
      var path = require_path_browserify();
      var url = require_url_join();
      var EventEmitter = require_events().EventEmitter;
      var config = require_config();
      var PlayerManagerAdapter = require_PlayerManagerAdapter();
      var GlosaTranslator = require_GlosaTranslator();
      var globalGlosaLenght = "";
      var document = window2.document;
      var location = window2.location;
      var STATUSES = {
        idle: "idle",
        preparing: "preparing",
        playing: "playing"
      };
      function Player(options) {
        this.options = assign(
          {
            translator: config.translatorUrl,
            targetPath: "target"
          },
          options
        );
        this.playerManager = new PlayerManagerAdapter();
        this.translator = new GlosaTranslator(this.options.translator);
        this.translated = false;
        this.text = void 0;
        this.gloss = void 0;
        this.loaded = false;
        this.progress = null;
        this.gameContainer = null;
        this.player = null;
        this.status = STATUSES.idle;
        this.region = "BR";
        this.playerManager.on("load", () => {
          this.loaded = true;
          this.emit("load");
          this.playerManager.setBaseUrl(config.dictionaryUrl);
          if (this.options.onLoad) {
            this.options.onLoad();
          } else {
            this.play(null, { fromTranslation: true });
          }
        });
        this.playerManager.on("progress", (progress) => {
          this.emit("animation:progress", progress);
        });
        this.playerManager.on("stateChange", (isPlaying, isPaused, isLoading) => {
          if (isPaused) {
            this.emit("animation:pause");
          } else if (isPlaying && !isPaused) {
            this.emit("animation:play");
            this.changeStatus(STATUSES.playing);
          } else if (!isPlaying && !isLoading) {
            this.emit("animation:end");
            this.changeStatus(STATUSES.idle);
          }
        });
        this.playerManager.on("CounterGloss", (counter, glosaLenght) => {
          this.emit("response:glosa", counter, glosaLenght);
          globalGlosaLenght = glosaLenght;
        });
        this.playerManager.on("GetAvatar", (avatar) => {
          this.emit("GetAvatar", avatar);
        });
        this.playerManager.on("FinishWelcome", (bool) => {
          this.emit("stop:welcome", bool);
        });
      }
      inherits(Player, EventEmitter);
      Player.prototype.translate = function(text, { isEnabledStats = true } = {}) {
        this.emit("translate:start");
        if (this.loaded) {
          this.stop();
        }
        this.text = text;
        this.translator.translate(text, location.host, (gloss, error) => {
          if (error) {
            this.play(text.toUpperCase());
            this.emit(
              "error",
              error === "timeout_error" ? error : "translation_error"
            );
            return;
          }
          this.play(gloss, { fromTranslation: true, isEnabledStats });
          this.emit("translate:end");
        });
      };
      Player.prototype.play = function(glosa, { fromTranslation = false, isEnabledStats = true } = {}) {
        if (!isEnabledStats && isDefaultUrl.bind(this)()) {
          this.playerManager.setBaseUrl(config.dictionaryStaticUrl + this.region + "/");
        } else if (isEnabledStats && !isDefaultUrl.bind(this)()) {
          this.playerManager.setBaseUrl(config.dictionaryUrl + this.region + "/");
        }
        function isDefaultUrl() {
          return this.playerManager.currentBaseUrl === config.dictionaryUrl + this.region + "/";
        }
        this.translated = fromTranslation;
        this.gloss = glosa || this.gloss;
        if (this.gloss !== void 0 && this.loaded) {
          this.changeStatus(STATUSES.preparing);
          this.playerManager.play(this.gloss);
        }
      };
      Player.prototype.playWellcome = function() {
        this.playerManager.playWellcome();
        this.emit("start:welcome");
      };
      Player.prototype.continue = function() {
        this.playerManager.play();
      };
      Player.prototype.repeat = function() {
        this.play();
      };
      Player.prototype.pause = function() {
        this.playerManager.pause();
      };
      Player.prototype.stop = function() {
        this.playerManager.stop();
      };
      Player.prototype.setSpeed = function(speed) {
        this.playerManager.setSpeed(speed);
      };
      Player.prototype.setPersonalization = function(personalization) {
        this.playerManager.setPersonalization(personalization);
      };
      Player.prototype.changeAvatar = function(avatarName) {
        this.playerManager.changeAvatar(avatarName);
      };
      Player.prototype.toggleSubtitle = function() {
        this.playerManager.toggleSubtitle();
      };
      Player.prototype.setRegion = function(region) {
        this.region = region;
        this.playerManager.setBaseUrl(config.dictionaryUrl + region + "/");
      };
      Player.prototype.load = function(wrapper) {
        this.gameContainer = document.createElement("div");
        this.gameContainer.setAttribute("id", "gameContainer");
        this.gameContainer.classList.add("emscripten");
        if ("function" == typeof this.options.progress) {
          this.progress = new this.options.progress(wrapper);
        }
        wrapper.appendChild(this.gameContainer);
        this._initializeTarget();
      };
      Player.prototype._getTargetScript = function() {
        return url(this.options.targetPath, "UnityLoader.js");
      };
      Player.prototype._initializeTarget = function() {
        const targetSetup = url(this.options.targetPath, "playerweb.json");
        const targetScript = document.createElement("script");
        targetScript.src = this._getTargetScript();
        targetScript.onload = () => {
          this.player = UnityLoader.instantiate("gameContainer", targetSetup, {
            compatibilityCheck: (_, accept, deny) => {
              if (UnityLoader.SystemInfo.hasWebGL) {
                return accept();
              }
              this.onError("unsupported");
              alert("Seu navegador n\xE3o suporta WEBGL");
              console.error("Seu navegador n\xE3o suporta WEBGL");
              deny();
            }
          });
          this.playerManager.setPlayerReference(this.player);
        };
        document.body.appendChild(targetScript);
      };
      Player.prototype.changeStatus = function(status) {
        switch (status) {
          case STATUSES.idle:
            if (this.status === STATUSES.playing) {
              this.status = status;
              this.emit("gloss:end", globalGlosaLenght);
            }
            break;
          case STATUSES.preparing:
            this.status = status;
            break;
          case STATUSES.playing:
            if (this.status === STATUSES.preparing) {
              this.status = status;
              this.emit("gloss:start");
            }
            break;
        }
      };
      module.exports = Player;
    }
  });

  // src/index.js
  var require_src = __commonJS({
    "src/index.js"(exports, module) {
      var window2 = require_window_shim();
      var Player = require_Player();
      var VLibras = {
        Player
      };
      window2.VLibras = VLibras;
      module.exports = VLibras;
    }
  });
  return require_src();
})();
