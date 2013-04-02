var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  value = parseInt(value, 10);
  precision = 0;
  return goog.string.format.demuxes_["f"](value, flags, width, dotp, precision, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6578 = x == null ? null : x;
  if(p[goog.typeOf(x__6578)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6579__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6579 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6579__delegate.call(this, array, i, idxs)
    };
    G__6579.cljs$lang$maxFixedArity = 2;
    G__6579.cljs$lang$applyTo = function(arglist__6580) {
      var array = cljs.core.first(arglist__6580);
      var i = cljs.core.first(cljs.core.next(arglist__6580));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6580));
      return G__6579__delegate(array, i, idxs)
    };
    G__6579.cljs$lang$arity$variadic = G__6579__delegate;
    return G__6579
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6665 = this$;
      if(and__3822__auto____6665) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6665
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2361__auto____6666 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6667 = cljs.core._invoke[goog.typeOf(x__2361__auto____6666)];
        if(or__3824__auto____6667) {
          return or__3824__auto____6667
        }else {
          var or__3824__auto____6668 = cljs.core._invoke["_"];
          if(or__3824__auto____6668) {
            return or__3824__auto____6668
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6669 = this$;
      if(and__3822__auto____6669) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6669
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2361__auto____6670 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6671 = cljs.core._invoke[goog.typeOf(x__2361__auto____6670)];
        if(or__3824__auto____6671) {
          return or__3824__auto____6671
        }else {
          var or__3824__auto____6672 = cljs.core._invoke["_"];
          if(or__3824__auto____6672) {
            return or__3824__auto____6672
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6673 = this$;
      if(and__3822__auto____6673) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6673
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2361__auto____6674 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6675 = cljs.core._invoke[goog.typeOf(x__2361__auto____6674)];
        if(or__3824__auto____6675) {
          return or__3824__auto____6675
        }else {
          var or__3824__auto____6676 = cljs.core._invoke["_"];
          if(or__3824__auto____6676) {
            return or__3824__auto____6676
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6677 = this$;
      if(and__3822__auto____6677) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6677
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2361__auto____6678 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6679 = cljs.core._invoke[goog.typeOf(x__2361__auto____6678)];
        if(or__3824__auto____6679) {
          return or__3824__auto____6679
        }else {
          var or__3824__auto____6680 = cljs.core._invoke["_"];
          if(or__3824__auto____6680) {
            return or__3824__auto____6680
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6681 = this$;
      if(and__3822__auto____6681) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6681
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2361__auto____6682 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6683 = cljs.core._invoke[goog.typeOf(x__2361__auto____6682)];
        if(or__3824__auto____6683) {
          return or__3824__auto____6683
        }else {
          var or__3824__auto____6684 = cljs.core._invoke["_"];
          if(or__3824__auto____6684) {
            return or__3824__auto____6684
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6685 = this$;
      if(and__3822__auto____6685) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6685
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2361__auto____6686 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6687 = cljs.core._invoke[goog.typeOf(x__2361__auto____6686)];
        if(or__3824__auto____6687) {
          return or__3824__auto____6687
        }else {
          var or__3824__auto____6688 = cljs.core._invoke["_"];
          if(or__3824__auto____6688) {
            return or__3824__auto____6688
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6689 = this$;
      if(and__3822__auto____6689) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6689
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2361__auto____6690 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6691 = cljs.core._invoke[goog.typeOf(x__2361__auto____6690)];
        if(or__3824__auto____6691) {
          return or__3824__auto____6691
        }else {
          var or__3824__auto____6692 = cljs.core._invoke["_"];
          if(or__3824__auto____6692) {
            return or__3824__auto____6692
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6693 = this$;
      if(and__3822__auto____6693) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6693
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2361__auto____6694 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6695 = cljs.core._invoke[goog.typeOf(x__2361__auto____6694)];
        if(or__3824__auto____6695) {
          return or__3824__auto____6695
        }else {
          var or__3824__auto____6696 = cljs.core._invoke["_"];
          if(or__3824__auto____6696) {
            return or__3824__auto____6696
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6697 = this$;
      if(and__3822__auto____6697) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6697
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2361__auto____6698 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6699 = cljs.core._invoke[goog.typeOf(x__2361__auto____6698)];
        if(or__3824__auto____6699) {
          return or__3824__auto____6699
        }else {
          var or__3824__auto____6700 = cljs.core._invoke["_"];
          if(or__3824__auto____6700) {
            return or__3824__auto____6700
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6701 = this$;
      if(and__3822__auto____6701) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6701
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2361__auto____6702 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6703 = cljs.core._invoke[goog.typeOf(x__2361__auto____6702)];
        if(or__3824__auto____6703) {
          return or__3824__auto____6703
        }else {
          var or__3824__auto____6704 = cljs.core._invoke["_"];
          if(or__3824__auto____6704) {
            return or__3824__auto____6704
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6705 = this$;
      if(and__3822__auto____6705) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6705
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2361__auto____6706 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6707 = cljs.core._invoke[goog.typeOf(x__2361__auto____6706)];
        if(or__3824__auto____6707) {
          return or__3824__auto____6707
        }else {
          var or__3824__auto____6708 = cljs.core._invoke["_"];
          if(or__3824__auto____6708) {
            return or__3824__auto____6708
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6709 = this$;
      if(and__3822__auto____6709) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6709
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2361__auto____6710 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6711 = cljs.core._invoke[goog.typeOf(x__2361__auto____6710)];
        if(or__3824__auto____6711) {
          return or__3824__auto____6711
        }else {
          var or__3824__auto____6712 = cljs.core._invoke["_"];
          if(or__3824__auto____6712) {
            return or__3824__auto____6712
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6713 = this$;
      if(and__3822__auto____6713) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6713
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2361__auto____6714 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6715 = cljs.core._invoke[goog.typeOf(x__2361__auto____6714)];
        if(or__3824__auto____6715) {
          return or__3824__auto____6715
        }else {
          var or__3824__auto____6716 = cljs.core._invoke["_"];
          if(or__3824__auto____6716) {
            return or__3824__auto____6716
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6717 = this$;
      if(and__3822__auto____6717) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6717
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2361__auto____6718 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6719 = cljs.core._invoke[goog.typeOf(x__2361__auto____6718)];
        if(or__3824__auto____6719) {
          return or__3824__auto____6719
        }else {
          var or__3824__auto____6720 = cljs.core._invoke["_"];
          if(or__3824__auto____6720) {
            return or__3824__auto____6720
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6721 = this$;
      if(and__3822__auto____6721) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6721
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2361__auto____6722 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6723 = cljs.core._invoke[goog.typeOf(x__2361__auto____6722)];
        if(or__3824__auto____6723) {
          return or__3824__auto____6723
        }else {
          var or__3824__auto____6724 = cljs.core._invoke["_"];
          if(or__3824__auto____6724) {
            return or__3824__auto____6724
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6725 = this$;
      if(and__3822__auto____6725) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6725
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2361__auto____6726 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6727 = cljs.core._invoke[goog.typeOf(x__2361__auto____6726)];
        if(or__3824__auto____6727) {
          return or__3824__auto____6727
        }else {
          var or__3824__auto____6728 = cljs.core._invoke["_"];
          if(or__3824__auto____6728) {
            return or__3824__auto____6728
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6729 = this$;
      if(and__3822__auto____6729) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6729
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2361__auto____6730 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6731 = cljs.core._invoke[goog.typeOf(x__2361__auto____6730)];
        if(or__3824__auto____6731) {
          return or__3824__auto____6731
        }else {
          var or__3824__auto____6732 = cljs.core._invoke["_"];
          if(or__3824__auto____6732) {
            return or__3824__auto____6732
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6733 = this$;
      if(and__3822__auto____6733) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6733
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2361__auto____6734 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6735 = cljs.core._invoke[goog.typeOf(x__2361__auto____6734)];
        if(or__3824__auto____6735) {
          return or__3824__auto____6735
        }else {
          var or__3824__auto____6736 = cljs.core._invoke["_"];
          if(or__3824__auto____6736) {
            return or__3824__auto____6736
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6737 = this$;
      if(and__3822__auto____6737) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6737
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2361__auto____6738 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6739 = cljs.core._invoke[goog.typeOf(x__2361__auto____6738)];
        if(or__3824__auto____6739) {
          return or__3824__auto____6739
        }else {
          var or__3824__auto____6740 = cljs.core._invoke["_"];
          if(or__3824__auto____6740) {
            return or__3824__auto____6740
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6741 = this$;
      if(and__3822__auto____6741) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6741
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2361__auto____6742 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6743 = cljs.core._invoke[goog.typeOf(x__2361__auto____6742)];
        if(or__3824__auto____6743) {
          return or__3824__auto____6743
        }else {
          var or__3824__auto____6744 = cljs.core._invoke["_"];
          if(or__3824__auto____6744) {
            return or__3824__auto____6744
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6745 = this$;
      if(and__3822__auto____6745) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6745
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2361__auto____6746 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6747 = cljs.core._invoke[goog.typeOf(x__2361__auto____6746)];
        if(or__3824__auto____6747) {
          return or__3824__auto____6747
        }else {
          var or__3824__auto____6748 = cljs.core._invoke["_"];
          if(or__3824__auto____6748) {
            return or__3824__auto____6748
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6753 = coll;
    if(and__3822__auto____6753) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6753
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2361__auto____6754 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6755 = cljs.core._count[goog.typeOf(x__2361__auto____6754)];
      if(or__3824__auto____6755) {
        return or__3824__auto____6755
      }else {
        var or__3824__auto____6756 = cljs.core._count["_"];
        if(or__3824__auto____6756) {
          return or__3824__auto____6756
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6761 = coll;
    if(and__3822__auto____6761) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6761
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2361__auto____6762 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6763 = cljs.core._empty[goog.typeOf(x__2361__auto____6762)];
      if(or__3824__auto____6763) {
        return or__3824__auto____6763
      }else {
        var or__3824__auto____6764 = cljs.core._empty["_"];
        if(or__3824__auto____6764) {
          return or__3824__auto____6764
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6769 = coll;
    if(and__3822__auto____6769) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6769
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2361__auto____6770 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6771 = cljs.core._conj[goog.typeOf(x__2361__auto____6770)];
      if(or__3824__auto____6771) {
        return or__3824__auto____6771
      }else {
        var or__3824__auto____6772 = cljs.core._conj["_"];
        if(or__3824__auto____6772) {
          return or__3824__auto____6772
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6781 = coll;
      if(and__3822__auto____6781) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6781
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2361__auto____6782 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6783 = cljs.core._nth[goog.typeOf(x__2361__auto____6782)];
        if(or__3824__auto____6783) {
          return or__3824__auto____6783
        }else {
          var or__3824__auto____6784 = cljs.core._nth["_"];
          if(or__3824__auto____6784) {
            return or__3824__auto____6784
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6785 = coll;
      if(and__3822__auto____6785) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6785
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2361__auto____6786 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6787 = cljs.core._nth[goog.typeOf(x__2361__auto____6786)];
        if(or__3824__auto____6787) {
          return or__3824__auto____6787
        }else {
          var or__3824__auto____6788 = cljs.core._nth["_"];
          if(or__3824__auto____6788) {
            return or__3824__auto____6788
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6793 = coll;
    if(and__3822__auto____6793) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6793
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2361__auto____6794 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6795 = cljs.core._first[goog.typeOf(x__2361__auto____6794)];
      if(or__3824__auto____6795) {
        return or__3824__auto____6795
      }else {
        var or__3824__auto____6796 = cljs.core._first["_"];
        if(or__3824__auto____6796) {
          return or__3824__auto____6796
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6801 = coll;
    if(and__3822__auto____6801) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6801
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2361__auto____6802 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6803 = cljs.core._rest[goog.typeOf(x__2361__auto____6802)];
      if(or__3824__auto____6803) {
        return or__3824__auto____6803
      }else {
        var or__3824__auto____6804 = cljs.core._rest["_"];
        if(or__3824__auto____6804) {
          return or__3824__auto____6804
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6809 = coll;
    if(and__3822__auto____6809) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6809
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2361__auto____6810 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6811 = cljs.core._next[goog.typeOf(x__2361__auto____6810)];
      if(or__3824__auto____6811) {
        return or__3824__auto____6811
      }else {
        var or__3824__auto____6812 = cljs.core._next["_"];
        if(or__3824__auto____6812) {
          return or__3824__auto____6812
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6821 = o;
      if(and__3822__auto____6821) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6821
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2361__auto____6822 = o == null ? null : o;
      return function() {
        var or__3824__auto____6823 = cljs.core._lookup[goog.typeOf(x__2361__auto____6822)];
        if(or__3824__auto____6823) {
          return or__3824__auto____6823
        }else {
          var or__3824__auto____6824 = cljs.core._lookup["_"];
          if(or__3824__auto____6824) {
            return or__3824__auto____6824
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6825 = o;
      if(and__3822__auto____6825) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6825
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2361__auto____6826 = o == null ? null : o;
      return function() {
        var or__3824__auto____6827 = cljs.core._lookup[goog.typeOf(x__2361__auto____6826)];
        if(or__3824__auto____6827) {
          return or__3824__auto____6827
        }else {
          var or__3824__auto____6828 = cljs.core._lookup["_"];
          if(or__3824__auto____6828) {
            return or__3824__auto____6828
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6833 = coll;
    if(and__3822__auto____6833) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6833
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2361__auto____6834 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6835 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2361__auto____6834)];
      if(or__3824__auto____6835) {
        return or__3824__auto____6835
      }else {
        var or__3824__auto____6836 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6836) {
          return or__3824__auto____6836
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6841 = coll;
    if(and__3822__auto____6841) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6841
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2361__auto____6842 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6843 = cljs.core._assoc[goog.typeOf(x__2361__auto____6842)];
      if(or__3824__auto____6843) {
        return or__3824__auto____6843
      }else {
        var or__3824__auto____6844 = cljs.core._assoc["_"];
        if(or__3824__auto____6844) {
          return or__3824__auto____6844
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6849 = coll;
    if(and__3822__auto____6849) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6849
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2361__auto____6850 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6851 = cljs.core._dissoc[goog.typeOf(x__2361__auto____6850)];
      if(or__3824__auto____6851) {
        return or__3824__auto____6851
      }else {
        var or__3824__auto____6852 = cljs.core._dissoc["_"];
        if(or__3824__auto____6852) {
          return or__3824__auto____6852
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6857 = coll;
    if(and__3822__auto____6857) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6857
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2361__auto____6858 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6859 = cljs.core._key[goog.typeOf(x__2361__auto____6858)];
      if(or__3824__auto____6859) {
        return or__3824__auto____6859
      }else {
        var or__3824__auto____6860 = cljs.core._key["_"];
        if(or__3824__auto____6860) {
          return or__3824__auto____6860
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6865 = coll;
    if(and__3822__auto____6865) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6865
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2361__auto____6866 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6867 = cljs.core._val[goog.typeOf(x__2361__auto____6866)];
      if(or__3824__auto____6867) {
        return or__3824__auto____6867
      }else {
        var or__3824__auto____6868 = cljs.core._val["_"];
        if(or__3824__auto____6868) {
          return or__3824__auto____6868
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6873 = coll;
    if(and__3822__auto____6873) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6873
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2361__auto____6874 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6875 = cljs.core._disjoin[goog.typeOf(x__2361__auto____6874)];
      if(or__3824__auto____6875) {
        return or__3824__auto____6875
      }else {
        var or__3824__auto____6876 = cljs.core._disjoin["_"];
        if(or__3824__auto____6876) {
          return or__3824__auto____6876
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6881 = coll;
    if(and__3822__auto____6881) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6881
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2361__auto____6882 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6883 = cljs.core._peek[goog.typeOf(x__2361__auto____6882)];
      if(or__3824__auto____6883) {
        return or__3824__auto____6883
      }else {
        var or__3824__auto____6884 = cljs.core._peek["_"];
        if(or__3824__auto____6884) {
          return or__3824__auto____6884
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6889 = coll;
    if(and__3822__auto____6889) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6889
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2361__auto____6890 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6891 = cljs.core._pop[goog.typeOf(x__2361__auto____6890)];
      if(or__3824__auto____6891) {
        return or__3824__auto____6891
      }else {
        var or__3824__auto____6892 = cljs.core._pop["_"];
        if(or__3824__auto____6892) {
          return or__3824__auto____6892
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6897 = coll;
    if(and__3822__auto____6897) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6897
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2361__auto____6898 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6899 = cljs.core._assoc_n[goog.typeOf(x__2361__auto____6898)];
      if(or__3824__auto____6899) {
        return or__3824__auto____6899
      }else {
        var or__3824__auto____6900 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6900) {
          return or__3824__auto____6900
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6905 = o;
    if(and__3822__auto____6905) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6905
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2361__auto____6906 = o == null ? null : o;
    return function() {
      var or__3824__auto____6907 = cljs.core._deref[goog.typeOf(x__2361__auto____6906)];
      if(or__3824__auto____6907) {
        return or__3824__auto____6907
      }else {
        var or__3824__auto____6908 = cljs.core._deref["_"];
        if(or__3824__auto____6908) {
          return or__3824__auto____6908
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6913 = o;
    if(and__3822__auto____6913) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6913
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2361__auto____6914 = o == null ? null : o;
    return function() {
      var or__3824__auto____6915 = cljs.core._deref_with_timeout[goog.typeOf(x__2361__auto____6914)];
      if(or__3824__auto____6915) {
        return or__3824__auto____6915
      }else {
        var or__3824__auto____6916 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6916) {
          return or__3824__auto____6916
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6921 = o;
    if(and__3822__auto____6921) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6921
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2361__auto____6922 = o == null ? null : o;
    return function() {
      var or__3824__auto____6923 = cljs.core._meta[goog.typeOf(x__2361__auto____6922)];
      if(or__3824__auto____6923) {
        return or__3824__auto____6923
      }else {
        var or__3824__auto____6924 = cljs.core._meta["_"];
        if(or__3824__auto____6924) {
          return or__3824__auto____6924
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6929 = o;
    if(and__3822__auto____6929) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6929
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2361__auto____6930 = o == null ? null : o;
    return function() {
      var or__3824__auto____6931 = cljs.core._with_meta[goog.typeOf(x__2361__auto____6930)];
      if(or__3824__auto____6931) {
        return or__3824__auto____6931
      }else {
        var or__3824__auto____6932 = cljs.core._with_meta["_"];
        if(or__3824__auto____6932) {
          return or__3824__auto____6932
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6941 = coll;
      if(and__3822__auto____6941) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6941
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2361__auto____6942 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6943 = cljs.core._reduce[goog.typeOf(x__2361__auto____6942)];
        if(or__3824__auto____6943) {
          return or__3824__auto____6943
        }else {
          var or__3824__auto____6944 = cljs.core._reduce["_"];
          if(or__3824__auto____6944) {
            return or__3824__auto____6944
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6945 = coll;
      if(and__3822__auto____6945) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6945
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2361__auto____6946 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6947 = cljs.core._reduce[goog.typeOf(x__2361__auto____6946)];
        if(or__3824__auto____6947) {
          return or__3824__auto____6947
        }else {
          var or__3824__auto____6948 = cljs.core._reduce["_"];
          if(or__3824__auto____6948) {
            return or__3824__auto____6948
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6953 = coll;
    if(and__3822__auto____6953) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6953
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2361__auto____6954 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6955 = cljs.core._kv_reduce[goog.typeOf(x__2361__auto____6954)];
      if(or__3824__auto____6955) {
        return or__3824__auto____6955
      }else {
        var or__3824__auto____6956 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6956) {
          return or__3824__auto____6956
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6961 = o;
    if(and__3822__auto____6961) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6961
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2361__auto____6962 = o == null ? null : o;
    return function() {
      var or__3824__auto____6963 = cljs.core._equiv[goog.typeOf(x__2361__auto____6962)];
      if(or__3824__auto____6963) {
        return or__3824__auto____6963
      }else {
        var or__3824__auto____6964 = cljs.core._equiv["_"];
        if(or__3824__auto____6964) {
          return or__3824__auto____6964
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6969 = o;
    if(and__3822__auto____6969) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6969
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2361__auto____6970 = o == null ? null : o;
    return function() {
      var or__3824__auto____6971 = cljs.core._hash[goog.typeOf(x__2361__auto____6970)];
      if(or__3824__auto____6971) {
        return or__3824__auto____6971
      }else {
        var or__3824__auto____6972 = cljs.core._hash["_"];
        if(or__3824__auto____6972) {
          return or__3824__auto____6972
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6977 = o;
    if(and__3822__auto____6977) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6977
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2361__auto____6978 = o == null ? null : o;
    return function() {
      var or__3824__auto____6979 = cljs.core._seq[goog.typeOf(x__2361__auto____6978)];
      if(or__3824__auto____6979) {
        return or__3824__auto____6979
      }else {
        var or__3824__auto____6980 = cljs.core._seq["_"];
        if(or__3824__auto____6980) {
          return or__3824__auto____6980
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6985 = coll;
    if(and__3822__auto____6985) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6985
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2361__auto____6986 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6987 = cljs.core._rseq[goog.typeOf(x__2361__auto____6986)];
      if(or__3824__auto____6987) {
        return or__3824__auto____6987
      }else {
        var or__3824__auto____6988 = cljs.core._rseq["_"];
        if(or__3824__auto____6988) {
          return or__3824__auto____6988
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6993 = coll;
    if(and__3822__auto____6993) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6993
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2361__auto____6994 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6995 = cljs.core._sorted_seq[goog.typeOf(x__2361__auto____6994)];
      if(or__3824__auto____6995) {
        return or__3824__auto____6995
      }else {
        var or__3824__auto____6996 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6996) {
          return or__3824__auto____6996
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7001 = coll;
    if(and__3822__auto____7001) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7001
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2361__auto____7002 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7003 = cljs.core._sorted_seq_from[goog.typeOf(x__2361__auto____7002)];
      if(or__3824__auto____7003) {
        return or__3824__auto____7003
      }else {
        var or__3824__auto____7004 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7004) {
          return or__3824__auto____7004
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7009 = coll;
    if(and__3822__auto____7009) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7009
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2361__auto____7010 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7011 = cljs.core._entry_key[goog.typeOf(x__2361__auto____7010)];
      if(or__3824__auto____7011) {
        return or__3824__auto____7011
      }else {
        var or__3824__auto____7012 = cljs.core._entry_key["_"];
        if(or__3824__auto____7012) {
          return or__3824__auto____7012
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7017 = coll;
    if(and__3822__auto____7017) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7017
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2361__auto____7018 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7019 = cljs.core._comparator[goog.typeOf(x__2361__auto____7018)];
      if(or__3824__auto____7019) {
        return or__3824__auto____7019
      }else {
        var or__3824__auto____7020 = cljs.core._comparator["_"];
        if(or__3824__auto____7020) {
          return or__3824__auto____7020
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____7025 = o;
    if(and__3822__auto____7025) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7025
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2361__auto____7026 = o == null ? null : o;
    return function() {
      var or__3824__auto____7027 = cljs.core._pr_seq[goog.typeOf(x__2361__auto____7026)];
      if(or__3824__auto____7027) {
        return or__3824__auto____7027
      }else {
        var or__3824__auto____7028 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7028) {
          return or__3824__auto____7028
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____7033 = d;
    if(and__3822__auto____7033) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7033
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2361__auto____7034 = d == null ? null : d;
    return function() {
      var or__3824__auto____7035 = cljs.core._realized_QMARK_[goog.typeOf(x__2361__auto____7034)];
      if(or__3824__auto____7035) {
        return or__3824__auto____7035
      }else {
        var or__3824__auto____7036 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7036) {
          return or__3824__auto____7036
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____7041 = this$;
    if(and__3822__auto____7041) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7041
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2361__auto____7042 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7043 = cljs.core._notify_watches[goog.typeOf(x__2361__auto____7042)];
      if(or__3824__auto____7043) {
        return or__3824__auto____7043
      }else {
        var or__3824__auto____7044 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7044) {
          return or__3824__auto____7044
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7049 = this$;
    if(and__3822__auto____7049) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7049
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2361__auto____7050 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7051 = cljs.core._add_watch[goog.typeOf(x__2361__auto____7050)];
      if(or__3824__auto____7051) {
        return or__3824__auto____7051
      }else {
        var or__3824__auto____7052 = cljs.core._add_watch["_"];
        if(or__3824__auto____7052) {
          return or__3824__auto____7052
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7057 = this$;
    if(and__3822__auto____7057) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7057
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2361__auto____7058 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7059 = cljs.core._remove_watch[goog.typeOf(x__2361__auto____7058)];
      if(or__3824__auto____7059) {
        return or__3824__auto____7059
      }else {
        var or__3824__auto____7060 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7060) {
          return or__3824__auto____7060
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____7065 = coll;
    if(and__3822__auto____7065) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7065
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2361__auto____7066 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7067 = cljs.core._as_transient[goog.typeOf(x__2361__auto____7066)];
      if(or__3824__auto____7067) {
        return or__3824__auto____7067
      }else {
        var or__3824__auto____7068 = cljs.core._as_transient["_"];
        if(or__3824__auto____7068) {
          return or__3824__auto____7068
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____7073 = tcoll;
    if(and__3822__auto____7073) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7073
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2361__auto____7074 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7075 = cljs.core._conj_BANG_[goog.typeOf(x__2361__auto____7074)];
      if(or__3824__auto____7075) {
        return or__3824__auto____7075
      }else {
        var or__3824__auto____7076 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7076) {
          return or__3824__auto____7076
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7081 = tcoll;
    if(and__3822__auto____7081) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7081
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2361__auto____7082 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7083 = cljs.core._persistent_BANG_[goog.typeOf(x__2361__auto____7082)];
      if(or__3824__auto____7083) {
        return or__3824__auto____7083
      }else {
        var or__3824__auto____7084 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7084) {
          return or__3824__auto____7084
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____7089 = tcoll;
    if(and__3822__auto____7089) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7089
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2361__auto____7090 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7091 = cljs.core._assoc_BANG_[goog.typeOf(x__2361__auto____7090)];
      if(or__3824__auto____7091) {
        return or__3824__auto____7091
      }else {
        var or__3824__auto____7092 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7092) {
          return or__3824__auto____7092
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____7097 = tcoll;
    if(and__3822__auto____7097) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7097
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2361__auto____7098 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7099 = cljs.core._dissoc_BANG_[goog.typeOf(x__2361__auto____7098)];
      if(or__3824__auto____7099) {
        return or__3824__auto____7099
      }else {
        var or__3824__auto____7100 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7100) {
          return or__3824__auto____7100
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____7105 = tcoll;
    if(and__3822__auto____7105) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7105
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2361__auto____7106 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7107 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2361__auto____7106)];
      if(or__3824__auto____7107) {
        return or__3824__auto____7107
      }else {
        var or__3824__auto____7108 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7108) {
          return or__3824__auto____7108
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7113 = tcoll;
    if(and__3822__auto____7113) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7113
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2361__auto____7114 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7115 = cljs.core._pop_BANG_[goog.typeOf(x__2361__auto____7114)];
      if(or__3824__auto____7115) {
        return or__3824__auto____7115
      }else {
        var or__3824__auto____7116 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7116) {
          return or__3824__auto____7116
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____7121 = tcoll;
    if(and__3822__auto____7121) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7121
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2361__auto____7122 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7123 = cljs.core._disjoin_BANG_[goog.typeOf(x__2361__auto____7122)];
      if(or__3824__auto____7123) {
        return or__3824__auto____7123
      }else {
        var or__3824__auto____7124 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7124) {
          return or__3824__auto____7124
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____7129 = x;
    if(and__3822__auto____7129) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7129
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2361__auto____7130 = x == null ? null : x;
    return function() {
      var or__3824__auto____7131 = cljs.core._compare[goog.typeOf(x__2361__auto____7130)];
      if(or__3824__auto____7131) {
        return or__3824__auto____7131
      }else {
        var or__3824__auto____7132 = cljs.core._compare["_"];
        if(or__3824__auto____7132) {
          return or__3824__auto____7132
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____7137 = coll;
    if(and__3822__auto____7137) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7137
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2361__auto____7138 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7139 = cljs.core._drop_first[goog.typeOf(x__2361__auto____7138)];
      if(or__3824__auto____7139) {
        return or__3824__auto____7139
      }else {
        var or__3824__auto____7140 = cljs.core._drop_first["_"];
        if(or__3824__auto____7140) {
          return or__3824__auto____7140
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____7145 = coll;
    if(and__3822__auto____7145) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7145
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2361__auto____7146 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7147 = cljs.core._chunked_first[goog.typeOf(x__2361__auto____7146)];
      if(or__3824__auto____7147) {
        return or__3824__auto____7147
      }else {
        var or__3824__auto____7148 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7148) {
          return or__3824__auto____7148
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7153 = coll;
    if(and__3822__auto____7153) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7153
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2361__auto____7154 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7155 = cljs.core._chunked_rest[goog.typeOf(x__2361__auto____7154)];
      if(or__3824__auto____7155) {
        return or__3824__auto____7155
      }else {
        var or__3824__auto____7156 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7156) {
          return or__3824__auto____7156
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____7161 = coll;
    if(and__3822__auto____7161) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7161
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2361__auto____7162 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7163 = cljs.core._chunked_next[goog.typeOf(x__2361__auto____7162)];
      if(or__3824__auto____7163) {
        return or__3824__auto____7163
      }else {
        var or__3824__auto____7164 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7164) {
          return or__3824__auto____7164
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____7166 = x === y;
    if(or__3824__auto____7166) {
      return or__3824__auto____7166
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7167__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7168 = y;
            var G__7169 = cljs.core.first.call(null, more);
            var G__7170 = cljs.core.next.call(null, more);
            x = G__7168;
            y = G__7169;
            more = G__7170;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7167 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7167__delegate.call(this, x, y, more)
    };
    G__7167.cljs$lang$maxFixedArity = 2;
    G__7167.cljs$lang$applyTo = function(arglist__7171) {
      var x = cljs.core.first(arglist__7171);
      var y = cljs.core.first(cljs.core.next(arglist__7171));
      var more = cljs.core.rest(cljs.core.next(arglist__7171));
      return G__7167__delegate(x, y, more)
    };
    G__7167.cljs$lang$arity$variadic = G__7167__delegate;
    return G__7167
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__7172 = null;
  var G__7172__2 = function(o, k) {
    return null
  };
  var G__7172__3 = function(o, k, not_found) {
    return not_found
  };
  G__7172 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7172__2.call(this, o, k);
      case 3:
        return G__7172__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7172
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__7173 = null;
  var G__7173__2 = function(_, f) {
    return f.call(null)
  };
  var G__7173__3 = function(_, f, start) {
    return start
  };
  G__7173 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7173__2.call(this, _, f);
      case 3:
        return G__7173__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7173
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__7174 = null;
  var G__7174__2 = function(_, n) {
    return null
  };
  var G__7174__3 = function(_, n, not_found) {
    return not_found
  };
  G__7174 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7174__2.call(this, _, n);
      case 3:
        return G__7174__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7174
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____7175 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7175) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7175
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__7188 = cljs.core._count.call(null, cicoll);
    if(cnt__7188 === 0) {
      return f.call(null)
    }else {
      var val__7189 = cljs.core._nth.call(null, cicoll, 0);
      var n__7190 = 1;
      while(true) {
        if(n__7190 < cnt__7188) {
          var nval__7191 = f.call(null, val__7189, cljs.core._nth.call(null, cicoll, n__7190));
          if(cljs.core.reduced_QMARK_.call(null, nval__7191)) {
            return cljs.core.deref.call(null, nval__7191)
          }else {
            var G__7200 = nval__7191;
            var G__7201 = n__7190 + 1;
            val__7189 = G__7200;
            n__7190 = G__7201;
            continue
          }
        }else {
          return val__7189
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7192 = cljs.core._count.call(null, cicoll);
    var val__7193 = val;
    var n__7194 = 0;
    while(true) {
      if(n__7194 < cnt__7192) {
        var nval__7195 = f.call(null, val__7193, cljs.core._nth.call(null, cicoll, n__7194));
        if(cljs.core.reduced_QMARK_.call(null, nval__7195)) {
          return cljs.core.deref.call(null, nval__7195)
        }else {
          var G__7202 = nval__7195;
          var G__7203 = n__7194 + 1;
          val__7193 = G__7202;
          n__7194 = G__7203;
          continue
        }
      }else {
        return val__7193
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7196 = cljs.core._count.call(null, cicoll);
    var val__7197 = val;
    var n__7198 = idx;
    while(true) {
      if(n__7198 < cnt__7196) {
        var nval__7199 = f.call(null, val__7197, cljs.core._nth.call(null, cicoll, n__7198));
        if(cljs.core.reduced_QMARK_.call(null, nval__7199)) {
          return cljs.core.deref.call(null, nval__7199)
        }else {
          var G__7204 = nval__7199;
          var G__7205 = n__7198 + 1;
          val__7197 = G__7204;
          n__7198 = G__7205;
          continue
        }
      }else {
        return val__7197
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__7218 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7219 = arr[0];
      var n__7220 = 1;
      while(true) {
        if(n__7220 < cnt__7218) {
          var nval__7221 = f.call(null, val__7219, arr[n__7220]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7221)) {
            return cljs.core.deref.call(null, nval__7221)
          }else {
            var G__7230 = nval__7221;
            var G__7231 = n__7220 + 1;
            val__7219 = G__7230;
            n__7220 = G__7231;
            continue
          }
        }else {
          return val__7219
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7222 = arr.length;
    var val__7223 = val;
    var n__7224 = 0;
    while(true) {
      if(n__7224 < cnt__7222) {
        var nval__7225 = f.call(null, val__7223, arr[n__7224]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7225)) {
          return cljs.core.deref.call(null, nval__7225)
        }else {
          var G__7232 = nval__7225;
          var G__7233 = n__7224 + 1;
          val__7223 = G__7232;
          n__7224 = G__7233;
          continue
        }
      }else {
        return val__7223
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7226 = arr.length;
    var val__7227 = val;
    var n__7228 = idx;
    while(true) {
      if(n__7228 < cnt__7226) {
        var nval__7229 = f.call(null, val__7227, arr[n__7228]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7229)) {
          return cljs.core.deref.call(null, nval__7229)
        }else {
          var G__7234 = nval__7229;
          var G__7235 = n__7228 + 1;
          val__7227 = G__7234;
          n__7228 = G__7235;
          continue
        }
      }else {
        return val__7227
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7236 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7237 = this;
  if(this__7237.i + 1 < this__7237.a.length) {
    return new cljs.core.IndexedSeq(this__7237.a, this__7237.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7238 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7239 = this;
  var c__7240 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7240 > 0) {
    return new cljs.core.RSeq(coll, c__7240 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7241 = this;
  var this__7242 = this;
  return cljs.core.pr_str.call(null, this__7242)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7243 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7243.a)) {
    return cljs.core.ci_reduce.call(null, this__7243.a, f, this__7243.a[this__7243.i], this__7243.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7243.a[this__7243.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7244 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7244.a)) {
    return cljs.core.ci_reduce.call(null, this__7244.a, f, start, this__7244.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7245 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7246 = this;
  return this__7246.a.length - this__7246.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7247 = this;
  return this__7247.a[this__7247.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7248 = this;
  if(this__7248.i + 1 < this__7248.a.length) {
    return new cljs.core.IndexedSeq(this__7248.a, this__7248.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7249 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7250 = this;
  var i__7251 = n + this__7250.i;
  if(i__7251 < this__7250.a.length) {
    return this__7250.a[i__7251]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7252 = this;
  var i__7253 = n + this__7252.i;
  if(i__7253 < this__7252.a.length) {
    return this__7252.a[i__7253]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__7254 = null;
  var G__7254__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7254__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7254 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7254__2.call(this, array, f);
      case 3:
        return G__7254__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7254
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7255 = null;
  var G__7255__2 = function(array, k) {
    return array[k]
  };
  var G__7255__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7255 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7255__2.call(this, array, k);
      case 3:
        return G__7255__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7255
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7256 = null;
  var G__7256__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7256__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7256 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7256__2.call(this, array, n);
      case 3:
        return G__7256__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7256
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7257 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7258 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7259 = this;
  var this__7260 = this;
  return cljs.core.pr_str.call(null, this__7260)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7261 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7262 = this;
  return this__7262.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7263 = this;
  return cljs.core._nth.call(null, this__7263.ci, this__7263.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7264 = this;
  if(this__7264.i > 0) {
    return new cljs.core.RSeq(this__7264.ci, this__7264.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7265 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7266 = this;
  return new cljs.core.RSeq(this__7266.ci, this__7266.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7267 = this;
  return this__7267.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7271__7272 = coll;
      if(G__7271__7272) {
        if(function() {
          var or__3824__auto____7273 = G__7271__7272.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7273) {
            return or__3824__auto____7273
          }else {
            return G__7271__7272.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7271__7272.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7271__7272)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7271__7272)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7278__7279 = coll;
      if(G__7278__7279) {
        if(function() {
          var or__3824__auto____7280 = G__7278__7279.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7280) {
            return or__3824__auto____7280
          }else {
            return G__7278__7279.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7278__7279.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7278__7279)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7278__7279)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7281 = cljs.core.seq.call(null, coll);
      if(s__7281 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7281)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7286__7287 = coll;
      if(G__7286__7287) {
        if(function() {
          var or__3824__auto____7288 = G__7286__7287.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7288) {
            return or__3824__auto____7288
          }else {
            return G__7286__7287.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7286__7287.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7286__7287)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7286__7287)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7289 = cljs.core.seq.call(null, coll);
      if(!(s__7289 == null)) {
        return cljs.core._rest.call(null, s__7289)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7293__7294 = coll;
      if(G__7293__7294) {
        if(function() {
          var or__3824__auto____7295 = G__7293__7294.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7295) {
            return or__3824__auto____7295
          }else {
            return G__7293__7294.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7293__7294.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7293__7294)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7293__7294)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__7297 = cljs.core.next.call(null, s);
    if(!(sn__7297 == null)) {
      var G__7298 = sn__7297;
      s = G__7298;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__7299__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7300 = conj.call(null, coll, x);
          var G__7301 = cljs.core.first.call(null, xs);
          var G__7302 = cljs.core.next.call(null, xs);
          coll = G__7300;
          x = G__7301;
          xs = G__7302;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7299 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7299__delegate.call(this, coll, x, xs)
    };
    G__7299.cljs$lang$maxFixedArity = 2;
    G__7299.cljs$lang$applyTo = function(arglist__7303) {
      var coll = cljs.core.first(arglist__7303);
      var x = cljs.core.first(cljs.core.next(arglist__7303));
      var xs = cljs.core.rest(cljs.core.next(arglist__7303));
      return G__7299__delegate(coll, x, xs)
    };
    G__7299.cljs$lang$arity$variadic = G__7299__delegate;
    return G__7299
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__7306 = cljs.core.seq.call(null, coll);
  var acc__7307 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7306)) {
      return acc__7307 + cljs.core._count.call(null, s__7306)
    }else {
      var G__7308 = cljs.core.next.call(null, s__7306);
      var G__7309 = acc__7307 + 1;
      s__7306 = G__7308;
      acc__7307 = G__7309;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__7316__7317 = coll;
        if(G__7316__7317) {
          if(function() {
            var or__3824__auto____7318 = G__7316__7317.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7318) {
              return or__3824__auto____7318
            }else {
              return G__7316__7317.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7316__7317.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7316__7317)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7316__7317)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__7319__7320 = coll;
        if(G__7319__7320) {
          if(function() {
            var or__3824__auto____7321 = G__7319__7320.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7321) {
              return or__3824__auto____7321
            }else {
              return G__7319__7320.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7319__7320.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7319__7320)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7319__7320)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__7324__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7323 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7325 = ret__7323;
          var G__7326 = cljs.core.first.call(null, kvs);
          var G__7327 = cljs.core.second.call(null, kvs);
          var G__7328 = cljs.core.nnext.call(null, kvs);
          coll = G__7325;
          k = G__7326;
          v = G__7327;
          kvs = G__7328;
          continue
        }else {
          return ret__7323
        }
        break
      }
    };
    var G__7324 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7324__delegate.call(this, coll, k, v, kvs)
    };
    G__7324.cljs$lang$maxFixedArity = 3;
    G__7324.cljs$lang$applyTo = function(arglist__7329) {
      var coll = cljs.core.first(arglist__7329);
      var k = cljs.core.first(cljs.core.next(arglist__7329));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7329)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7329)));
      return G__7324__delegate(coll, k, v, kvs)
    };
    G__7324.cljs$lang$arity$variadic = G__7324__delegate;
    return G__7324
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__7332__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7331 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7333 = ret__7331;
          var G__7334 = cljs.core.first.call(null, ks);
          var G__7335 = cljs.core.next.call(null, ks);
          coll = G__7333;
          k = G__7334;
          ks = G__7335;
          continue
        }else {
          return ret__7331
        }
        break
      }
    };
    var G__7332 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7332__delegate.call(this, coll, k, ks)
    };
    G__7332.cljs$lang$maxFixedArity = 2;
    G__7332.cljs$lang$applyTo = function(arglist__7336) {
      var coll = cljs.core.first(arglist__7336);
      var k = cljs.core.first(cljs.core.next(arglist__7336));
      var ks = cljs.core.rest(cljs.core.next(arglist__7336));
      return G__7332__delegate(coll, k, ks)
    };
    G__7332.cljs$lang$arity$variadic = G__7332__delegate;
    return G__7332
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__7340__7341 = o;
    if(G__7340__7341) {
      if(function() {
        var or__3824__auto____7342 = G__7340__7341.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7342) {
          return or__3824__auto____7342
        }else {
          return G__7340__7341.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7340__7341.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7340__7341)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7340__7341)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__7345__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7344 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7346 = ret__7344;
          var G__7347 = cljs.core.first.call(null, ks);
          var G__7348 = cljs.core.next.call(null, ks);
          coll = G__7346;
          k = G__7347;
          ks = G__7348;
          continue
        }else {
          return ret__7344
        }
        break
      }
    };
    var G__7345 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7345__delegate.call(this, coll, k, ks)
    };
    G__7345.cljs$lang$maxFixedArity = 2;
    G__7345.cljs$lang$applyTo = function(arglist__7349) {
      var coll = cljs.core.first(arglist__7349);
      var k = cljs.core.first(cljs.core.next(arglist__7349));
      var ks = cljs.core.rest(cljs.core.next(arglist__7349));
      return G__7345__delegate(coll, k, ks)
    };
    G__7345.cljs$lang$arity$variadic = G__7345__delegate;
    return G__7345
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7351 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7351;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7351
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7353 = cljs.core.string_hash_cache[k];
  if(!(h__7353 == null)) {
    return h__7353
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7355 = goog.isString(o);
      if(and__3822__auto____7355) {
        return check_cache
      }else {
        return and__3822__auto____7355
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7359__7360 = x;
    if(G__7359__7360) {
      if(function() {
        var or__3824__auto____7361 = G__7359__7360.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7361) {
          return or__3824__auto____7361
        }else {
          return G__7359__7360.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7359__7360.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7359__7360)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7359__7360)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7365__7366 = x;
    if(G__7365__7366) {
      if(function() {
        var or__3824__auto____7367 = G__7365__7366.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7367) {
          return or__3824__auto____7367
        }else {
          return G__7365__7366.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7365__7366.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7365__7366)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7365__7366)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7371__7372 = x;
  if(G__7371__7372) {
    if(function() {
      var or__3824__auto____7373 = G__7371__7372.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7373) {
        return or__3824__auto____7373
      }else {
        return G__7371__7372.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7371__7372.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7371__7372)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7371__7372)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7377__7378 = x;
  if(G__7377__7378) {
    if(function() {
      var or__3824__auto____7379 = G__7377__7378.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7379) {
        return or__3824__auto____7379
      }else {
        return G__7377__7378.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7377__7378.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7377__7378)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7377__7378)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7383__7384 = x;
  if(G__7383__7384) {
    if(function() {
      var or__3824__auto____7385 = G__7383__7384.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7385) {
        return or__3824__auto____7385
      }else {
        return G__7383__7384.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7383__7384.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7383__7384)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7383__7384)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7389__7390 = x;
  if(G__7389__7390) {
    if(function() {
      var or__3824__auto____7391 = G__7389__7390.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7391) {
        return or__3824__auto____7391
      }else {
        return G__7389__7390.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7389__7390.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7389__7390)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7389__7390)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7395__7396 = x;
  if(G__7395__7396) {
    if(function() {
      var or__3824__auto____7397 = G__7395__7396.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7397) {
        return or__3824__auto____7397
      }else {
        return G__7395__7396.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7395__7396.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7395__7396)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7395__7396)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7401__7402 = x;
    if(G__7401__7402) {
      if(function() {
        var or__3824__auto____7403 = G__7401__7402.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7403) {
          return or__3824__auto____7403
        }else {
          return G__7401__7402.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7401__7402.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7401__7402)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7401__7402)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7407__7408 = x;
  if(G__7407__7408) {
    if(function() {
      var or__3824__auto____7409 = G__7407__7408.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7409) {
        return or__3824__auto____7409
      }else {
        return G__7407__7408.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7407__7408.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7407__7408)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7407__7408)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7413__7414 = x;
  if(G__7413__7414) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7415 = null;
      if(cljs.core.truth_(or__3824__auto____7415)) {
        return or__3824__auto____7415
      }else {
        return G__7413__7414.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7413__7414.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7413__7414)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7413__7414)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7416__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7416 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7416__delegate.call(this, keyvals)
    };
    G__7416.cljs$lang$maxFixedArity = 0;
    G__7416.cljs$lang$applyTo = function(arglist__7417) {
      var keyvals = cljs.core.seq(arglist__7417);
      return G__7416__delegate(keyvals)
    };
    G__7416.cljs$lang$arity$variadic = G__7416__delegate;
    return G__7416
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7419 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7419.push(key)
  });
  return keys__7419
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7423 = i;
  var j__7424 = j;
  var len__7425 = len;
  while(true) {
    if(len__7425 === 0) {
      return to
    }else {
      to[j__7424] = from[i__7423];
      var G__7426 = i__7423 + 1;
      var G__7427 = j__7424 + 1;
      var G__7428 = len__7425 - 1;
      i__7423 = G__7426;
      j__7424 = G__7427;
      len__7425 = G__7428;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7432 = i + (len - 1);
  var j__7433 = j + (len - 1);
  var len__7434 = len;
  while(true) {
    if(len__7434 === 0) {
      return to
    }else {
      to[j__7433] = from[i__7432];
      var G__7435 = i__7432 - 1;
      var G__7436 = j__7433 - 1;
      var G__7437 = len__7434 - 1;
      i__7432 = G__7435;
      j__7433 = G__7436;
      len__7434 = G__7437;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7441__7442 = s;
    if(G__7441__7442) {
      if(function() {
        var or__3824__auto____7443 = G__7441__7442.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7443) {
          return or__3824__auto____7443
        }else {
          return G__7441__7442.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7441__7442.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7441__7442)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7441__7442)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7447__7448 = s;
  if(G__7447__7448) {
    if(function() {
      var or__3824__auto____7449 = G__7447__7448.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7449) {
        return or__3824__auto____7449
      }else {
        return G__7447__7448.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7447__7448.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7447__7448)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7447__7448)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7452 = goog.isString(x);
  if(and__3822__auto____7452) {
    return!function() {
      var or__3824__auto____7453 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7453) {
        return or__3824__auto____7453
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7452
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7455 = goog.isString(x);
  if(and__3822__auto____7455) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7455
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7457 = goog.isString(x);
  if(and__3822__auto____7457) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7457
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7462 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7462) {
    return or__3824__auto____7462
  }else {
    var G__7463__7464 = f;
    if(G__7463__7464) {
      if(function() {
        var or__3824__auto____7465 = G__7463__7464.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7465) {
          return or__3824__auto____7465
        }else {
          return G__7463__7464.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7463__7464.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7463__7464)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7463__7464)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7467 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7467) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7467
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7470 = coll;
    if(cljs.core.truth_(and__3822__auto____7470)) {
      var and__3822__auto____7471 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7471) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7471
      }
    }else {
      return and__3822__auto____7470
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7480__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7476 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7477 = more;
        while(true) {
          var x__7478 = cljs.core.first.call(null, xs__7477);
          var etc__7479 = cljs.core.next.call(null, xs__7477);
          if(cljs.core.truth_(xs__7477)) {
            if(cljs.core.contains_QMARK_.call(null, s__7476, x__7478)) {
              return false
            }else {
              var G__7481 = cljs.core.conj.call(null, s__7476, x__7478);
              var G__7482 = etc__7479;
              s__7476 = G__7481;
              xs__7477 = G__7482;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7480 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7480__delegate.call(this, x, y, more)
    };
    G__7480.cljs$lang$maxFixedArity = 2;
    G__7480.cljs$lang$applyTo = function(arglist__7483) {
      var x = cljs.core.first(arglist__7483);
      var y = cljs.core.first(cljs.core.next(arglist__7483));
      var more = cljs.core.rest(cljs.core.next(arglist__7483));
      return G__7480__delegate(x, y, more)
    };
    G__7480.cljs$lang$arity$variadic = G__7480__delegate;
    return G__7480
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7487__7488 = x;
            if(G__7487__7488) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7489 = null;
                if(cljs.core.truth_(or__3824__auto____7489)) {
                  return or__3824__auto____7489
                }else {
                  return G__7487__7488.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7487__7488.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7487__7488)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7487__7488)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7494 = cljs.core.count.call(null, xs);
    var yl__7495 = cljs.core.count.call(null, ys);
    if(xl__7494 < yl__7495) {
      return-1
    }else {
      if(xl__7494 > yl__7495) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7494, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7496 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7497 = d__7496 === 0;
        if(and__3822__auto____7497) {
          return n + 1 < len
        }else {
          return and__3822__auto____7497
        }
      }()) {
        var G__7498 = xs;
        var G__7499 = ys;
        var G__7500 = len;
        var G__7501 = n + 1;
        xs = G__7498;
        ys = G__7499;
        len = G__7500;
        n = G__7501;
        continue
      }else {
        return d__7496
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7503 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7503)) {
        return r__7503
      }else {
        if(cljs.core.truth_(r__7503)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7505 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7505, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7505)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7511 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7511) {
      var s__7512 = temp__3971__auto____7511;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7512), cljs.core.next.call(null, s__7512))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7513 = val;
    var coll__7514 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7514) {
        var nval__7515 = f.call(null, val__7513, cljs.core.first.call(null, coll__7514));
        if(cljs.core.reduced_QMARK_.call(null, nval__7515)) {
          return cljs.core.deref.call(null, nval__7515)
        }else {
          var G__7516 = nval__7515;
          var G__7517 = cljs.core.next.call(null, coll__7514);
          val__7513 = G__7516;
          coll__7514 = G__7517;
          continue
        }
      }else {
        return val__7513
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7519 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7519);
  return cljs.core.vec.call(null, a__7519)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7526__7527 = coll;
      if(G__7526__7527) {
        if(function() {
          var or__3824__auto____7528 = G__7526__7527.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7528) {
            return or__3824__auto____7528
          }else {
            return G__7526__7527.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7526__7527.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7526__7527)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7526__7527)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7529__7530 = coll;
      if(G__7529__7530) {
        if(function() {
          var or__3824__auto____7531 = G__7529__7530.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7531) {
            return or__3824__auto____7531
          }else {
            return G__7529__7530.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7529__7530.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7529__7530)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7529__7530)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7532 = this;
  return this__7532.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7533__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7533 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7533__delegate.call(this, x, y, more)
    };
    G__7533.cljs$lang$maxFixedArity = 2;
    G__7533.cljs$lang$applyTo = function(arglist__7534) {
      var x = cljs.core.first(arglist__7534);
      var y = cljs.core.first(cljs.core.next(arglist__7534));
      var more = cljs.core.rest(cljs.core.next(arglist__7534));
      return G__7533__delegate(x, y, more)
    };
    G__7533.cljs$lang$arity$variadic = G__7533__delegate;
    return G__7533
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7535__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7535 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7535__delegate.call(this, x, y, more)
    };
    G__7535.cljs$lang$maxFixedArity = 2;
    G__7535.cljs$lang$applyTo = function(arglist__7536) {
      var x = cljs.core.first(arglist__7536);
      var y = cljs.core.first(cljs.core.next(arglist__7536));
      var more = cljs.core.rest(cljs.core.next(arglist__7536));
      return G__7535__delegate(x, y, more)
    };
    G__7535.cljs$lang$arity$variadic = G__7535__delegate;
    return G__7535
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7537__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7537 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7537__delegate.call(this, x, y, more)
    };
    G__7537.cljs$lang$maxFixedArity = 2;
    G__7537.cljs$lang$applyTo = function(arglist__7538) {
      var x = cljs.core.first(arglist__7538);
      var y = cljs.core.first(cljs.core.next(arglist__7538));
      var more = cljs.core.rest(cljs.core.next(arglist__7538));
      return G__7537__delegate(x, y, more)
    };
    G__7537.cljs$lang$arity$variadic = G__7537__delegate;
    return G__7537
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7539__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7539 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7539__delegate.call(this, x, y, more)
    };
    G__7539.cljs$lang$maxFixedArity = 2;
    G__7539.cljs$lang$applyTo = function(arglist__7540) {
      var x = cljs.core.first(arglist__7540);
      var y = cljs.core.first(cljs.core.next(arglist__7540));
      var more = cljs.core.rest(cljs.core.next(arglist__7540));
      return G__7539__delegate(x, y, more)
    };
    G__7539.cljs$lang$arity$variadic = G__7539__delegate;
    return G__7539
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7541__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7542 = y;
            var G__7543 = cljs.core.first.call(null, more);
            var G__7544 = cljs.core.next.call(null, more);
            x = G__7542;
            y = G__7543;
            more = G__7544;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7541 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7541__delegate.call(this, x, y, more)
    };
    G__7541.cljs$lang$maxFixedArity = 2;
    G__7541.cljs$lang$applyTo = function(arglist__7545) {
      var x = cljs.core.first(arglist__7545);
      var y = cljs.core.first(cljs.core.next(arglist__7545));
      var more = cljs.core.rest(cljs.core.next(arglist__7545));
      return G__7541__delegate(x, y, more)
    };
    G__7541.cljs$lang$arity$variadic = G__7541__delegate;
    return G__7541
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7546__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7547 = y;
            var G__7548 = cljs.core.first.call(null, more);
            var G__7549 = cljs.core.next.call(null, more);
            x = G__7547;
            y = G__7548;
            more = G__7549;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7546 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7546__delegate.call(this, x, y, more)
    };
    G__7546.cljs$lang$maxFixedArity = 2;
    G__7546.cljs$lang$applyTo = function(arglist__7550) {
      var x = cljs.core.first(arglist__7550);
      var y = cljs.core.first(cljs.core.next(arglist__7550));
      var more = cljs.core.rest(cljs.core.next(arglist__7550));
      return G__7546__delegate(x, y, more)
    };
    G__7546.cljs$lang$arity$variadic = G__7546__delegate;
    return G__7546
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7551__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7552 = y;
            var G__7553 = cljs.core.first.call(null, more);
            var G__7554 = cljs.core.next.call(null, more);
            x = G__7552;
            y = G__7553;
            more = G__7554;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7551 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7551__delegate.call(this, x, y, more)
    };
    G__7551.cljs$lang$maxFixedArity = 2;
    G__7551.cljs$lang$applyTo = function(arglist__7555) {
      var x = cljs.core.first(arglist__7555);
      var y = cljs.core.first(cljs.core.next(arglist__7555));
      var more = cljs.core.rest(cljs.core.next(arglist__7555));
      return G__7551__delegate(x, y, more)
    };
    G__7551.cljs$lang$arity$variadic = G__7551__delegate;
    return G__7551
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7556__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7557 = y;
            var G__7558 = cljs.core.first.call(null, more);
            var G__7559 = cljs.core.next.call(null, more);
            x = G__7557;
            y = G__7558;
            more = G__7559;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7556 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7556__delegate.call(this, x, y, more)
    };
    G__7556.cljs$lang$maxFixedArity = 2;
    G__7556.cljs$lang$applyTo = function(arglist__7560) {
      var x = cljs.core.first(arglist__7560);
      var y = cljs.core.first(cljs.core.next(arglist__7560));
      var more = cljs.core.rest(cljs.core.next(arglist__7560));
      return G__7556__delegate(x, y, more)
    };
    G__7556.cljs$lang$arity$variadic = G__7556__delegate;
    return G__7556
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7561__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7561 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7561__delegate.call(this, x, y, more)
    };
    G__7561.cljs$lang$maxFixedArity = 2;
    G__7561.cljs$lang$applyTo = function(arglist__7562) {
      var x = cljs.core.first(arglist__7562);
      var y = cljs.core.first(cljs.core.next(arglist__7562));
      var more = cljs.core.rest(cljs.core.next(arglist__7562));
      return G__7561__delegate(x, y, more)
    };
    G__7561.cljs$lang$arity$variadic = G__7561__delegate;
    return G__7561
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7563__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7563 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7563__delegate.call(this, x, y, more)
    };
    G__7563.cljs$lang$maxFixedArity = 2;
    G__7563.cljs$lang$applyTo = function(arglist__7564) {
      var x = cljs.core.first(arglist__7564);
      var y = cljs.core.first(cljs.core.next(arglist__7564));
      var more = cljs.core.rest(cljs.core.next(arglist__7564));
      return G__7563__delegate(x, y, more)
    };
    G__7563.cljs$lang$arity$variadic = G__7563__delegate;
    return G__7563
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7566 = n % d;
  return cljs.core.fix.call(null, (n - rem__7566) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7568 = cljs.core.quot.call(null, n, d);
  return n - d * q__7568
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7571 = v - (v >> 1 & 1431655765);
  var v__7572 = (v__7571 & 858993459) + (v__7571 >> 2 & 858993459);
  return(v__7572 + (v__7572 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7573__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7574 = y;
            var G__7575 = cljs.core.first.call(null, more);
            var G__7576 = cljs.core.next.call(null, more);
            x = G__7574;
            y = G__7575;
            more = G__7576;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7573 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7573__delegate.call(this, x, y, more)
    };
    G__7573.cljs$lang$maxFixedArity = 2;
    G__7573.cljs$lang$applyTo = function(arglist__7577) {
      var x = cljs.core.first(arglist__7577);
      var y = cljs.core.first(cljs.core.next(arglist__7577));
      var more = cljs.core.rest(cljs.core.next(arglist__7577));
      return G__7573__delegate(x, y, more)
    };
    G__7573.cljs$lang$arity$variadic = G__7573__delegate;
    return G__7573
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7581 = n;
  var xs__7582 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7583 = xs__7582;
      if(and__3822__auto____7583) {
        return n__7581 > 0
      }else {
        return and__3822__auto____7583
      }
    }())) {
      var G__7584 = n__7581 - 1;
      var G__7585 = cljs.core.next.call(null, xs__7582);
      n__7581 = G__7584;
      xs__7582 = G__7585;
      continue
    }else {
      return xs__7582
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7586__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7587 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7588 = cljs.core.next.call(null, more);
            sb = G__7587;
            more = G__7588;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7586 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7586__delegate.call(this, x, ys)
    };
    G__7586.cljs$lang$maxFixedArity = 1;
    G__7586.cljs$lang$applyTo = function(arglist__7589) {
      var x = cljs.core.first(arglist__7589);
      var ys = cljs.core.rest(arglist__7589);
      return G__7586__delegate(x, ys)
    };
    G__7586.cljs$lang$arity$variadic = G__7586__delegate;
    return G__7586
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7590__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7591 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7592 = cljs.core.next.call(null, more);
            sb = G__7591;
            more = G__7592;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7590 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7590__delegate.call(this, x, ys)
    };
    G__7590.cljs$lang$maxFixedArity = 1;
    G__7590.cljs$lang$applyTo = function(arglist__7593) {
      var x = cljs.core.first(arglist__7593);
      var ys = cljs.core.rest(arglist__7593);
      return G__7590__delegate(x, ys)
    };
    G__7590.cljs$lang$arity$variadic = G__7590__delegate;
    return G__7590
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7594) {
    var fmt = cljs.core.first(arglist__7594);
    var args = cljs.core.rest(arglist__7594);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7597 = cljs.core.seq.call(null, x);
    var ys__7598 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7597 == null) {
        return ys__7598 == null
      }else {
        if(ys__7598 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7597), cljs.core.first.call(null, ys__7598))) {
            var G__7599 = cljs.core.next.call(null, xs__7597);
            var G__7600 = cljs.core.next.call(null, ys__7598);
            xs__7597 = G__7599;
            ys__7598 = G__7600;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7601_SHARP_, p2__7602_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7601_SHARP_, cljs.core.hash.call(null, p2__7602_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7606 = 0;
  var s__7607 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7607) {
      var e__7608 = cljs.core.first.call(null, s__7607);
      var G__7609 = (h__7606 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7608)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7608)))) % 4503599627370496;
      var G__7610 = cljs.core.next.call(null, s__7607);
      h__7606 = G__7609;
      s__7607 = G__7610;
      continue
    }else {
      return h__7606
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7614 = 0;
  var s__7615 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7615) {
      var e__7616 = cljs.core.first.call(null, s__7615);
      var G__7617 = (h__7614 + cljs.core.hash.call(null, e__7616)) % 4503599627370496;
      var G__7618 = cljs.core.next.call(null, s__7615);
      h__7614 = G__7617;
      s__7615 = G__7618;
      continue
    }else {
      return h__7614
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7639__7640 = cljs.core.seq.call(null, fn_map);
  if(G__7639__7640) {
    var G__7642__7644 = cljs.core.first.call(null, G__7639__7640);
    var vec__7643__7645 = G__7642__7644;
    var key_name__7646 = cljs.core.nth.call(null, vec__7643__7645, 0, null);
    var f__7647 = cljs.core.nth.call(null, vec__7643__7645, 1, null);
    var G__7639__7648 = G__7639__7640;
    var G__7642__7649 = G__7642__7644;
    var G__7639__7650 = G__7639__7648;
    while(true) {
      var vec__7651__7652 = G__7642__7649;
      var key_name__7653 = cljs.core.nth.call(null, vec__7651__7652, 0, null);
      var f__7654 = cljs.core.nth.call(null, vec__7651__7652, 1, null);
      var G__7639__7655 = G__7639__7650;
      var str_name__7656 = cljs.core.name.call(null, key_name__7653);
      obj[str_name__7656] = f__7654;
      var temp__3974__auto____7657 = cljs.core.next.call(null, G__7639__7655);
      if(temp__3974__auto____7657) {
        var G__7639__7658 = temp__3974__auto____7657;
        var G__7659 = cljs.core.first.call(null, G__7639__7658);
        var G__7660 = G__7639__7658;
        G__7642__7649 = G__7659;
        G__7639__7650 = G__7660;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7661 = this;
  var h__2190__auto____7662 = this__7661.__hash;
  if(!(h__2190__auto____7662 == null)) {
    return h__2190__auto____7662
  }else {
    var h__2190__auto____7663 = cljs.core.hash_coll.call(null, coll);
    this__7661.__hash = h__2190__auto____7663;
    return h__2190__auto____7663
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7664 = this;
  if(this__7664.count === 1) {
    return null
  }else {
    return this__7664.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7665 = this;
  return new cljs.core.List(this__7665.meta, o, coll, this__7665.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7666 = this;
  var this__7667 = this;
  return cljs.core.pr_str.call(null, this__7667)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7668 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7669 = this;
  return this__7669.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7670 = this;
  return this__7670.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7671 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7672 = this;
  return this__7672.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7673 = this;
  if(this__7673.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7673.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7674 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7675 = this;
  return new cljs.core.List(meta, this__7675.first, this__7675.rest, this__7675.count, this__7675.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7676 = this;
  return this__7676.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7677 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7678 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7679 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7680 = this;
  return new cljs.core.List(this__7680.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7681 = this;
  var this__7682 = this;
  return cljs.core.pr_str.call(null, this__7682)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7683 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7684 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7685 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7686 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7687 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7688 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7689 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7690 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7691 = this;
  return this__7691.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7692 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7696__7697 = coll;
  if(G__7696__7697) {
    if(function() {
      var or__3824__auto____7698 = G__7696__7697.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7698) {
        return or__3824__auto____7698
      }else {
        return G__7696__7697.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7696__7697.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7696__7697)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7696__7697)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7699__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7699 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7699__delegate.call(this, x, y, z, items)
    };
    G__7699.cljs$lang$maxFixedArity = 3;
    G__7699.cljs$lang$applyTo = function(arglist__7700) {
      var x = cljs.core.first(arglist__7700);
      var y = cljs.core.first(cljs.core.next(arglist__7700));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7700)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7700)));
      return G__7699__delegate(x, y, z, items)
    };
    G__7699.cljs$lang$arity$variadic = G__7699__delegate;
    return G__7699
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7701 = this;
  var h__2190__auto____7702 = this__7701.__hash;
  if(!(h__2190__auto____7702 == null)) {
    return h__2190__auto____7702
  }else {
    var h__2190__auto____7703 = cljs.core.hash_coll.call(null, coll);
    this__7701.__hash = h__2190__auto____7703;
    return h__2190__auto____7703
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7704 = this;
  if(this__7704.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7704.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7705 = this;
  return new cljs.core.Cons(null, o, coll, this__7705.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7706 = this;
  var this__7707 = this;
  return cljs.core.pr_str.call(null, this__7707)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7708 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7709 = this;
  return this__7709.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7710 = this;
  if(this__7710.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7710.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7711 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7712 = this;
  return new cljs.core.Cons(meta, this__7712.first, this__7712.rest, this__7712.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7713 = this;
  return this__7713.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7714 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7714.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7719 = coll == null;
    if(or__3824__auto____7719) {
      return or__3824__auto____7719
    }else {
      var G__7720__7721 = coll;
      if(G__7720__7721) {
        if(function() {
          var or__3824__auto____7722 = G__7720__7721.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7722) {
            return or__3824__auto____7722
          }else {
            return G__7720__7721.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7720__7721.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7720__7721)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7720__7721)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7726__7727 = x;
  if(G__7726__7727) {
    if(function() {
      var or__3824__auto____7728 = G__7726__7727.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7728) {
        return or__3824__auto____7728
      }else {
        return G__7726__7727.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7726__7727.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7726__7727)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7726__7727)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7729 = null;
  var G__7729__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7729__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7729 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7729__2.call(this, string, f);
      case 3:
        return G__7729__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7729
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7730 = null;
  var G__7730__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7730__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7730 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7730__2.call(this, string, k);
      case 3:
        return G__7730__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7730
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7731 = null;
  var G__7731__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7731__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7731 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7731__2.call(this, string, n);
      case 3:
        return G__7731__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7731
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7743 = null;
  var G__7743__2 = function(this_sym7734, coll) {
    var this__7736 = this;
    var this_sym7734__7737 = this;
    var ___7738 = this_sym7734__7737;
    if(coll == null) {
      return null
    }else {
      var strobj__7739 = coll.strobj;
      if(strobj__7739 == null) {
        return cljs.core._lookup.call(null, coll, this__7736.k, null)
      }else {
        return strobj__7739[this__7736.k]
      }
    }
  };
  var G__7743__3 = function(this_sym7735, coll, not_found) {
    var this__7736 = this;
    var this_sym7735__7740 = this;
    var ___7741 = this_sym7735__7740;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7736.k, not_found)
    }
  };
  G__7743 = function(this_sym7735, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7743__2.call(this, this_sym7735, coll);
      case 3:
        return G__7743__3.call(this, this_sym7735, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7743
}();
cljs.core.Keyword.prototype.apply = function(this_sym7732, args7733) {
  var this__7742 = this;
  return this_sym7732.call.apply(this_sym7732, [this_sym7732].concat(args7733.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7752 = null;
  var G__7752__2 = function(this_sym7746, coll) {
    var this_sym7746__7748 = this;
    var this__7749 = this_sym7746__7748;
    return cljs.core._lookup.call(null, coll, this__7749.toString(), null)
  };
  var G__7752__3 = function(this_sym7747, coll, not_found) {
    var this_sym7747__7750 = this;
    var this__7751 = this_sym7747__7750;
    return cljs.core._lookup.call(null, coll, this__7751.toString(), not_found)
  };
  G__7752 = function(this_sym7747, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7752__2.call(this, this_sym7747, coll);
      case 3:
        return G__7752__3.call(this, this_sym7747, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7752
}();
String.prototype.apply = function(this_sym7744, args7745) {
  return this_sym7744.call.apply(this_sym7744, [this_sym7744].concat(args7745.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7754 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7754
  }else {
    lazy_seq.x = x__7754.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7755 = this;
  var h__2190__auto____7756 = this__7755.__hash;
  if(!(h__2190__auto____7756 == null)) {
    return h__2190__auto____7756
  }else {
    var h__2190__auto____7757 = cljs.core.hash_coll.call(null, coll);
    this__7755.__hash = h__2190__auto____7757;
    return h__2190__auto____7757
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7758 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7759 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7760 = this;
  var this__7761 = this;
  return cljs.core.pr_str.call(null, this__7761)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7762 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7763 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7764 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7765 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7766 = this;
  return new cljs.core.LazySeq(meta, this__7766.realized, this__7766.x, this__7766.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7767 = this;
  return this__7767.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7768 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7768.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7769 = this;
  return this__7769.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7770 = this;
  var ___7771 = this;
  this__7770.buf[this__7770.end] = o;
  return this__7770.end = this__7770.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7772 = this;
  var ___7773 = this;
  var ret__7774 = new cljs.core.ArrayChunk(this__7772.buf, 0, this__7772.end);
  this__7772.buf = null;
  return ret__7774
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7775 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7775.arr[this__7775.off], this__7775.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7776 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7776.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7777 = this;
  if(this__7777.off === this__7777.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7777.arr, this__7777.off + 1, this__7777.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7778 = this;
  return this__7778.arr[this__7778.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7779 = this;
  if(function() {
    var and__3822__auto____7780 = i >= 0;
    if(and__3822__auto____7780) {
      return i < this__7779.end - this__7779.off
    }else {
      return and__3822__auto____7780
    }
  }()) {
    return this__7779.arr[this__7779.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7781 = this;
  return this__7781.end - this__7781.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7782 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7783 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7784 = this;
  return cljs.core._nth.call(null, this__7784.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7785 = this;
  if(cljs.core._count.call(null, this__7785.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7785.chunk), this__7785.more, this__7785.meta)
  }else {
    if(this__7785.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7785.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7786 = this;
  if(this__7786.more == null) {
    return null
  }else {
    return this__7786.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7787 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7788 = this;
  return new cljs.core.ChunkedCons(this__7788.chunk, this__7788.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7789 = this;
  return this__7789.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7790 = this;
  return this__7790.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7791 = this;
  if(this__7791.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7791.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7795__7796 = s;
    if(G__7795__7796) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7797 = null;
        if(cljs.core.truth_(or__3824__auto____7797)) {
          return or__3824__auto____7797
        }else {
          return G__7795__7796.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7795__7796.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7795__7796)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7795__7796)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7800 = [];
  var s__7801 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7801)) {
      ary__7800.push(cljs.core.first.call(null, s__7801));
      var G__7802 = cljs.core.next.call(null, s__7801);
      s__7801 = G__7802;
      continue
    }else {
      return ary__7800
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7806 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7807 = 0;
  var xs__7808 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7808) {
      ret__7806[i__7807] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7808));
      var G__7809 = i__7807 + 1;
      var G__7810 = cljs.core.next.call(null, xs__7808);
      i__7807 = G__7809;
      xs__7808 = G__7810;
      continue
    }else {
    }
    break
  }
  return ret__7806
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7818 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7819 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7820 = 0;
      var s__7821 = s__7819;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7822 = s__7821;
          if(and__3822__auto____7822) {
            return i__7820 < size
          }else {
            return and__3822__auto____7822
          }
        }())) {
          a__7818[i__7820] = cljs.core.first.call(null, s__7821);
          var G__7825 = i__7820 + 1;
          var G__7826 = cljs.core.next.call(null, s__7821);
          i__7820 = G__7825;
          s__7821 = G__7826;
          continue
        }else {
          return a__7818
        }
        break
      }
    }else {
      var n__2525__auto____7823 = size;
      var i__7824 = 0;
      while(true) {
        if(i__7824 < n__2525__auto____7823) {
          a__7818[i__7824] = init_val_or_seq;
          var G__7827 = i__7824 + 1;
          i__7824 = G__7827;
          continue
        }else {
        }
        break
      }
      return a__7818
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7835 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7836 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7837 = 0;
      var s__7838 = s__7836;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7839 = s__7838;
          if(and__3822__auto____7839) {
            return i__7837 < size
          }else {
            return and__3822__auto____7839
          }
        }())) {
          a__7835[i__7837] = cljs.core.first.call(null, s__7838);
          var G__7842 = i__7837 + 1;
          var G__7843 = cljs.core.next.call(null, s__7838);
          i__7837 = G__7842;
          s__7838 = G__7843;
          continue
        }else {
          return a__7835
        }
        break
      }
    }else {
      var n__2525__auto____7840 = size;
      var i__7841 = 0;
      while(true) {
        if(i__7841 < n__2525__auto____7840) {
          a__7835[i__7841] = init_val_or_seq;
          var G__7844 = i__7841 + 1;
          i__7841 = G__7844;
          continue
        }else {
        }
        break
      }
      return a__7835
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7852 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7853 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7854 = 0;
      var s__7855 = s__7853;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7856 = s__7855;
          if(and__3822__auto____7856) {
            return i__7854 < size
          }else {
            return and__3822__auto____7856
          }
        }())) {
          a__7852[i__7854] = cljs.core.first.call(null, s__7855);
          var G__7859 = i__7854 + 1;
          var G__7860 = cljs.core.next.call(null, s__7855);
          i__7854 = G__7859;
          s__7855 = G__7860;
          continue
        }else {
          return a__7852
        }
        break
      }
    }else {
      var n__2525__auto____7857 = size;
      var i__7858 = 0;
      while(true) {
        if(i__7858 < n__2525__auto____7857) {
          a__7852[i__7858] = init_val_or_seq;
          var G__7861 = i__7858 + 1;
          i__7858 = G__7861;
          continue
        }else {
        }
        break
      }
      return a__7852
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7866 = s;
    var i__7867 = n;
    var sum__7868 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7869 = i__7867 > 0;
        if(and__3822__auto____7869) {
          return cljs.core.seq.call(null, s__7866)
        }else {
          return and__3822__auto____7869
        }
      }())) {
        var G__7870 = cljs.core.next.call(null, s__7866);
        var G__7871 = i__7867 - 1;
        var G__7872 = sum__7868 + 1;
        s__7866 = G__7870;
        i__7867 = G__7871;
        sum__7868 = G__7872;
        continue
      }else {
        return sum__7868
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7877 = cljs.core.seq.call(null, x);
      if(s__7877) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7877)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7877), concat.call(null, cljs.core.chunk_rest.call(null, s__7877), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7877), concat.call(null, cljs.core.rest.call(null, s__7877), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7881__delegate = function(x, y, zs) {
      var cat__7880 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7879 = cljs.core.seq.call(null, xys);
          if(xys__7879) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7879)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7879), cat.call(null, cljs.core.chunk_rest.call(null, xys__7879), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7879), cat.call(null, cljs.core.rest.call(null, xys__7879), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7880.call(null, concat.call(null, x, y), zs)
    };
    var G__7881 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7881__delegate.call(this, x, y, zs)
    };
    G__7881.cljs$lang$maxFixedArity = 2;
    G__7881.cljs$lang$applyTo = function(arglist__7882) {
      var x = cljs.core.first(arglist__7882);
      var y = cljs.core.first(cljs.core.next(arglist__7882));
      var zs = cljs.core.rest(cljs.core.next(arglist__7882));
      return G__7881__delegate(x, y, zs)
    };
    G__7881.cljs$lang$arity$variadic = G__7881__delegate;
    return G__7881
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7883__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7883 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7883__delegate.call(this, a, b, c, d, more)
    };
    G__7883.cljs$lang$maxFixedArity = 4;
    G__7883.cljs$lang$applyTo = function(arglist__7884) {
      var a = cljs.core.first(arglist__7884);
      var b = cljs.core.first(cljs.core.next(arglist__7884));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7884)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7884))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7884))));
      return G__7883__delegate(a, b, c, d, more)
    };
    G__7883.cljs$lang$arity$variadic = G__7883__delegate;
    return G__7883
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7926 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7927 = cljs.core._first.call(null, args__7926);
    var args__7928 = cljs.core._rest.call(null, args__7926);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7927)
      }else {
        return f.call(null, a__7927)
      }
    }else {
      var b__7929 = cljs.core._first.call(null, args__7928);
      var args__7930 = cljs.core._rest.call(null, args__7928);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7927, b__7929)
        }else {
          return f.call(null, a__7927, b__7929)
        }
      }else {
        var c__7931 = cljs.core._first.call(null, args__7930);
        var args__7932 = cljs.core._rest.call(null, args__7930);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7927, b__7929, c__7931)
          }else {
            return f.call(null, a__7927, b__7929, c__7931)
          }
        }else {
          var d__7933 = cljs.core._first.call(null, args__7932);
          var args__7934 = cljs.core._rest.call(null, args__7932);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7927, b__7929, c__7931, d__7933)
            }else {
              return f.call(null, a__7927, b__7929, c__7931, d__7933)
            }
          }else {
            var e__7935 = cljs.core._first.call(null, args__7934);
            var args__7936 = cljs.core._rest.call(null, args__7934);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7927, b__7929, c__7931, d__7933, e__7935)
              }else {
                return f.call(null, a__7927, b__7929, c__7931, d__7933, e__7935)
              }
            }else {
              var f__7937 = cljs.core._first.call(null, args__7936);
              var args__7938 = cljs.core._rest.call(null, args__7936);
              if(argc === 6) {
                if(f__7937.cljs$lang$arity$6) {
                  return f__7937.cljs$lang$arity$6(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937)
                }else {
                  return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937)
                }
              }else {
                var g__7939 = cljs.core._first.call(null, args__7938);
                var args__7940 = cljs.core._rest.call(null, args__7938);
                if(argc === 7) {
                  if(f__7937.cljs$lang$arity$7) {
                    return f__7937.cljs$lang$arity$7(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939)
                  }else {
                    return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939)
                  }
                }else {
                  var h__7941 = cljs.core._first.call(null, args__7940);
                  var args__7942 = cljs.core._rest.call(null, args__7940);
                  if(argc === 8) {
                    if(f__7937.cljs$lang$arity$8) {
                      return f__7937.cljs$lang$arity$8(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941)
                    }else {
                      return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941)
                    }
                  }else {
                    var i__7943 = cljs.core._first.call(null, args__7942);
                    var args__7944 = cljs.core._rest.call(null, args__7942);
                    if(argc === 9) {
                      if(f__7937.cljs$lang$arity$9) {
                        return f__7937.cljs$lang$arity$9(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943)
                      }else {
                        return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943)
                      }
                    }else {
                      var j__7945 = cljs.core._first.call(null, args__7944);
                      var args__7946 = cljs.core._rest.call(null, args__7944);
                      if(argc === 10) {
                        if(f__7937.cljs$lang$arity$10) {
                          return f__7937.cljs$lang$arity$10(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945)
                        }else {
                          return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945)
                        }
                      }else {
                        var k__7947 = cljs.core._first.call(null, args__7946);
                        var args__7948 = cljs.core._rest.call(null, args__7946);
                        if(argc === 11) {
                          if(f__7937.cljs$lang$arity$11) {
                            return f__7937.cljs$lang$arity$11(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947)
                          }else {
                            return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947)
                          }
                        }else {
                          var l__7949 = cljs.core._first.call(null, args__7948);
                          var args__7950 = cljs.core._rest.call(null, args__7948);
                          if(argc === 12) {
                            if(f__7937.cljs$lang$arity$12) {
                              return f__7937.cljs$lang$arity$12(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949)
                            }else {
                              return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949)
                            }
                          }else {
                            var m__7951 = cljs.core._first.call(null, args__7950);
                            var args__7952 = cljs.core._rest.call(null, args__7950);
                            if(argc === 13) {
                              if(f__7937.cljs$lang$arity$13) {
                                return f__7937.cljs$lang$arity$13(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951)
                              }else {
                                return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951)
                              }
                            }else {
                              var n__7953 = cljs.core._first.call(null, args__7952);
                              var args__7954 = cljs.core._rest.call(null, args__7952);
                              if(argc === 14) {
                                if(f__7937.cljs$lang$arity$14) {
                                  return f__7937.cljs$lang$arity$14(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953)
                                }else {
                                  return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953)
                                }
                              }else {
                                var o__7955 = cljs.core._first.call(null, args__7954);
                                var args__7956 = cljs.core._rest.call(null, args__7954);
                                if(argc === 15) {
                                  if(f__7937.cljs$lang$arity$15) {
                                    return f__7937.cljs$lang$arity$15(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955)
                                  }else {
                                    return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955)
                                  }
                                }else {
                                  var p__7957 = cljs.core._first.call(null, args__7956);
                                  var args__7958 = cljs.core._rest.call(null, args__7956);
                                  if(argc === 16) {
                                    if(f__7937.cljs$lang$arity$16) {
                                      return f__7937.cljs$lang$arity$16(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957)
                                    }else {
                                      return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957)
                                    }
                                  }else {
                                    var q__7959 = cljs.core._first.call(null, args__7958);
                                    var args__7960 = cljs.core._rest.call(null, args__7958);
                                    if(argc === 17) {
                                      if(f__7937.cljs$lang$arity$17) {
                                        return f__7937.cljs$lang$arity$17(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959)
                                      }else {
                                        return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959)
                                      }
                                    }else {
                                      var r__7961 = cljs.core._first.call(null, args__7960);
                                      var args__7962 = cljs.core._rest.call(null, args__7960);
                                      if(argc === 18) {
                                        if(f__7937.cljs$lang$arity$18) {
                                          return f__7937.cljs$lang$arity$18(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959, r__7961)
                                        }else {
                                          return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959, r__7961)
                                        }
                                      }else {
                                        var s__7963 = cljs.core._first.call(null, args__7962);
                                        var args__7964 = cljs.core._rest.call(null, args__7962);
                                        if(argc === 19) {
                                          if(f__7937.cljs$lang$arity$19) {
                                            return f__7937.cljs$lang$arity$19(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959, r__7961, s__7963)
                                          }else {
                                            return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959, r__7961, s__7963)
                                          }
                                        }else {
                                          var t__7965 = cljs.core._first.call(null, args__7964);
                                          var args__7966 = cljs.core._rest.call(null, args__7964);
                                          if(argc === 20) {
                                            if(f__7937.cljs$lang$arity$20) {
                                              return f__7937.cljs$lang$arity$20(a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959, r__7961, s__7963, t__7965)
                                            }else {
                                              return f__7937.call(null, a__7927, b__7929, c__7931, d__7933, e__7935, f__7937, g__7939, h__7941, i__7943, j__7945, k__7947, l__7949, m__7951, n__7953, o__7955, p__7957, q__7959, r__7961, s__7963, t__7965)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7981 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7982 = cljs.core.bounded_count.call(null, args, fixed_arity__7981 + 1);
      if(bc__7982 <= fixed_arity__7981) {
        return cljs.core.apply_to.call(null, f, bc__7982, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7983 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7984 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7985 = cljs.core.bounded_count.call(null, arglist__7983, fixed_arity__7984 + 1);
      if(bc__7985 <= fixed_arity__7984) {
        return cljs.core.apply_to.call(null, f, bc__7985, arglist__7983)
      }else {
        return f.cljs$lang$applyTo(arglist__7983)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7983))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7986 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7987 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7988 = cljs.core.bounded_count.call(null, arglist__7986, fixed_arity__7987 + 1);
      if(bc__7988 <= fixed_arity__7987) {
        return cljs.core.apply_to.call(null, f, bc__7988, arglist__7986)
      }else {
        return f.cljs$lang$applyTo(arglist__7986)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7986))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7989 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7990 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7991 = cljs.core.bounded_count.call(null, arglist__7989, fixed_arity__7990 + 1);
      if(bc__7991 <= fixed_arity__7990) {
        return cljs.core.apply_to.call(null, f, bc__7991, arglist__7989)
      }else {
        return f.cljs$lang$applyTo(arglist__7989)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7989))
    }
  };
  var apply__6 = function() {
    var G__7995__delegate = function(f, a, b, c, d, args) {
      var arglist__7992 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7993 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7994 = cljs.core.bounded_count.call(null, arglist__7992, fixed_arity__7993 + 1);
        if(bc__7994 <= fixed_arity__7993) {
          return cljs.core.apply_to.call(null, f, bc__7994, arglist__7992)
        }else {
          return f.cljs$lang$applyTo(arglist__7992)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7992))
      }
    };
    var G__7995 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7995__delegate.call(this, f, a, b, c, d, args)
    };
    G__7995.cljs$lang$maxFixedArity = 5;
    G__7995.cljs$lang$applyTo = function(arglist__7996) {
      var f = cljs.core.first(arglist__7996);
      var a = cljs.core.first(cljs.core.next(arglist__7996));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7996)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7996))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7996)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7996)))));
      return G__7995__delegate(f, a, b, c, d, args)
    };
    G__7995.cljs$lang$arity$variadic = G__7995__delegate;
    return G__7995
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7997) {
    var obj = cljs.core.first(arglist__7997);
    var f = cljs.core.first(cljs.core.next(arglist__7997));
    var args = cljs.core.rest(cljs.core.next(arglist__7997));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7998__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7998 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7998__delegate.call(this, x, y, more)
    };
    G__7998.cljs$lang$maxFixedArity = 2;
    G__7998.cljs$lang$applyTo = function(arglist__7999) {
      var x = cljs.core.first(arglist__7999);
      var y = cljs.core.first(cljs.core.next(arglist__7999));
      var more = cljs.core.rest(cljs.core.next(arglist__7999));
      return G__7998__delegate(x, y, more)
    };
    G__7998.cljs$lang$arity$variadic = G__7998__delegate;
    return G__7998
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__8000 = pred;
        var G__8001 = cljs.core.next.call(null, coll);
        pred = G__8000;
        coll = G__8001;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____8003 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8003)) {
        return or__3824__auto____8003
      }else {
        var G__8004 = pred;
        var G__8005 = cljs.core.next.call(null, coll);
        pred = G__8004;
        coll = G__8005;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__8006 = null;
    var G__8006__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8006__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8006__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8006__3 = function() {
      var G__8007__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8007 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8007__delegate.call(this, x, y, zs)
      };
      G__8007.cljs$lang$maxFixedArity = 2;
      G__8007.cljs$lang$applyTo = function(arglist__8008) {
        var x = cljs.core.first(arglist__8008);
        var y = cljs.core.first(cljs.core.next(arglist__8008));
        var zs = cljs.core.rest(cljs.core.next(arglist__8008));
        return G__8007__delegate(x, y, zs)
      };
      G__8007.cljs$lang$arity$variadic = G__8007__delegate;
      return G__8007
    }();
    G__8006 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8006__0.call(this);
        case 1:
          return G__8006__1.call(this, x);
        case 2:
          return G__8006__2.call(this, x, y);
        default:
          return G__8006__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8006.cljs$lang$maxFixedArity = 2;
    G__8006.cljs$lang$applyTo = G__8006__3.cljs$lang$applyTo;
    return G__8006
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8009__delegate = function(args) {
      return x
    };
    var G__8009 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8009__delegate.call(this, args)
    };
    G__8009.cljs$lang$maxFixedArity = 0;
    G__8009.cljs$lang$applyTo = function(arglist__8010) {
      var args = cljs.core.seq(arglist__8010);
      return G__8009__delegate(args)
    };
    G__8009.cljs$lang$arity$variadic = G__8009__delegate;
    return G__8009
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__8017 = null;
      var G__8017__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8017__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8017__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8017__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8017__4 = function() {
        var G__8018__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8018 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8018__delegate.call(this, x, y, z, args)
        };
        G__8018.cljs$lang$maxFixedArity = 3;
        G__8018.cljs$lang$applyTo = function(arglist__8019) {
          var x = cljs.core.first(arglist__8019);
          var y = cljs.core.first(cljs.core.next(arglist__8019));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8019)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8019)));
          return G__8018__delegate(x, y, z, args)
        };
        G__8018.cljs$lang$arity$variadic = G__8018__delegate;
        return G__8018
      }();
      G__8017 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8017__0.call(this);
          case 1:
            return G__8017__1.call(this, x);
          case 2:
            return G__8017__2.call(this, x, y);
          case 3:
            return G__8017__3.call(this, x, y, z);
          default:
            return G__8017__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8017.cljs$lang$maxFixedArity = 3;
      G__8017.cljs$lang$applyTo = G__8017__4.cljs$lang$applyTo;
      return G__8017
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8020 = null;
      var G__8020__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8020__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8020__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8020__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8020__4 = function() {
        var G__8021__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8021 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8021__delegate.call(this, x, y, z, args)
        };
        G__8021.cljs$lang$maxFixedArity = 3;
        G__8021.cljs$lang$applyTo = function(arglist__8022) {
          var x = cljs.core.first(arglist__8022);
          var y = cljs.core.first(cljs.core.next(arglist__8022));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8022)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8022)));
          return G__8021__delegate(x, y, z, args)
        };
        G__8021.cljs$lang$arity$variadic = G__8021__delegate;
        return G__8021
      }();
      G__8020 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8020__0.call(this);
          case 1:
            return G__8020__1.call(this, x);
          case 2:
            return G__8020__2.call(this, x, y);
          case 3:
            return G__8020__3.call(this, x, y, z);
          default:
            return G__8020__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8020.cljs$lang$maxFixedArity = 3;
      G__8020.cljs$lang$applyTo = G__8020__4.cljs$lang$applyTo;
      return G__8020
    }()
  };
  var comp__4 = function() {
    var G__8023__delegate = function(f1, f2, f3, fs) {
      var fs__8014 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8024__delegate = function(args) {
          var ret__8015 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8014), args);
          var fs__8016 = cljs.core.next.call(null, fs__8014);
          while(true) {
            if(fs__8016) {
              var G__8025 = cljs.core.first.call(null, fs__8016).call(null, ret__8015);
              var G__8026 = cljs.core.next.call(null, fs__8016);
              ret__8015 = G__8025;
              fs__8016 = G__8026;
              continue
            }else {
              return ret__8015
            }
            break
          }
        };
        var G__8024 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8024__delegate.call(this, args)
        };
        G__8024.cljs$lang$maxFixedArity = 0;
        G__8024.cljs$lang$applyTo = function(arglist__8027) {
          var args = cljs.core.seq(arglist__8027);
          return G__8024__delegate(args)
        };
        G__8024.cljs$lang$arity$variadic = G__8024__delegate;
        return G__8024
      }()
    };
    var G__8023 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8023__delegate.call(this, f1, f2, f3, fs)
    };
    G__8023.cljs$lang$maxFixedArity = 3;
    G__8023.cljs$lang$applyTo = function(arglist__8028) {
      var f1 = cljs.core.first(arglist__8028);
      var f2 = cljs.core.first(cljs.core.next(arglist__8028));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8028)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8028)));
      return G__8023__delegate(f1, f2, f3, fs)
    };
    G__8023.cljs$lang$arity$variadic = G__8023__delegate;
    return G__8023
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__8029__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8029 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8029__delegate.call(this, args)
      };
      G__8029.cljs$lang$maxFixedArity = 0;
      G__8029.cljs$lang$applyTo = function(arglist__8030) {
        var args = cljs.core.seq(arglist__8030);
        return G__8029__delegate(args)
      };
      G__8029.cljs$lang$arity$variadic = G__8029__delegate;
      return G__8029
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8031__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8031 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8031__delegate.call(this, args)
      };
      G__8031.cljs$lang$maxFixedArity = 0;
      G__8031.cljs$lang$applyTo = function(arglist__8032) {
        var args = cljs.core.seq(arglist__8032);
        return G__8031__delegate(args)
      };
      G__8031.cljs$lang$arity$variadic = G__8031__delegate;
      return G__8031
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8033__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8033 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8033__delegate.call(this, args)
      };
      G__8033.cljs$lang$maxFixedArity = 0;
      G__8033.cljs$lang$applyTo = function(arglist__8034) {
        var args = cljs.core.seq(arglist__8034);
        return G__8033__delegate(args)
      };
      G__8033.cljs$lang$arity$variadic = G__8033__delegate;
      return G__8033
    }()
  };
  var partial__5 = function() {
    var G__8035__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8036__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8036 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8036__delegate.call(this, args)
        };
        G__8036.cljs$lang$maxFixedArity = 0;
        G__8036.cljs$lang$applyTo = function(arglist__8037) {
          var args = cljs.core.seq(arglist__8037);
          return G__8036__delegate(args)
        };
        G__8036.cljs$lang$arity$variadic = G__8036__delegate;
        return G__8036
      }()
    };
    var G__8035 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8035__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8035.cljs$lang$maxFixedArity = 4;
    G__8035.cljs$lang$applyTo = function(arglist__8038) {
      var f = cljs.core.first(arglist__8038);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8038));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8038)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8038))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8038))));
      return G__8035__delegate(f, arg1, arg2, arg3, more)
    };
    G__8035.cljs$lang$arity$variadic = G__8035__delegate;
    return G__8035
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__8039 = null;
      var G__8039__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8039__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8039__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8039__4 = function() {
        var G__8040__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8040 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8040__delegate.call(this, a, b, c, ds)
        };
        G__8040.cljs$lang$maxFixedArity = 3;
        G__8040.cljs$lang$applyTo = function(arglist__8041) {
          var a = cljs.core.first(arglist__8041);
          var b = cljs.core.first(cljs.core.next(arglist__8041));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8041)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8041)));
          return G__8040__delegate(a, b, c, ds)
        };
        G__8040.cljs$lang$arity$variadic = G__8040__delegate;
        return G__8040
      }();
      G__8039 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8039__1.call(this, a);
          case 2:
            return G__8039__2.call(this, a, b);
          case 3:
            return G__8039__3.call(this, a, b, c);
          default:
            return G__8039__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8039.cljs$lang$maxFixedArity = 3;
      G__8039.cljs$lang$applyTo = G__8039__4.cljs$lang$applyTo;
      return G__8039
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8042 = null;
      var G__8042__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8042__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8042__4 = function() {
        var G__8043__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8043 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8043__delegate.call(this, a, b, c, ds)
        };
        G__8043.cljs$lang$maxFixedArity = 3;
        G__8043.cljs$lang$applyTo = function(arglist__8044) {
          var a = cljs.core.first(arglist__8044);
          var b = cljs.core.first(cljs.core.next(arglist__8044));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8044)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8044)));
          return G__8043__delegate(a, b, c, ds)
        };
        G__8043.cljs$lang$arity$variadic = G__8043__delegate;
        return G__8043
      }();
      G__8042 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8042__2.call(this, a, b);
          case 3:
            return G__8042__3.call(this, a, b, c);
          default:
            return G__8042__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8042.cljs$lang$maxFixedArity = 3;
      G__8042.cljs$lang$applyTo = G__8042__4.cljs$lang$applyTo;
      return G__8042
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8045 = null;
      var G__8045__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8045__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8045__4 = function() {
        var G__8046__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8046 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8046__delegate.call(this, a, b, c, ds)
        };
        G__8046.cljs$lang$maxFixedArity = 3;
        G__8046.cljs$lang$applyTo = function(arglist__8047) {
          var a = cljs.core.first(arglist__8047);
          var b = cljs.core.first(cljs.core.next(arglist__8047));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8047)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8047)));
          return G__8046__delegate(a, b, c, ds)
        };
        G__8046.cljs$lang$arity$variadic = G__8046__delegate;
        return G__8046
      }();
      G__8045 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8045__2.call(this, a, b);
          case 3:
            return G__8045__3.call(this, a, b, c);
          default:
            return G__8045__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8045.cljs$lang$maxFixedArity = 3;
      G__8045.cljs$lang$applyTo = G__8045__4.cljs$lang$applyTo;
      return G__8045
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__8063 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8071 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8071) {
        var s__8072 = temp__3974__auto____8071;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8072)) {
          var c__8073 = cljs.core.chunk_first.call(null, s__8072);
          var size__8074 = cljs.core.count.call(null, c__8073);
          var b__8075 = cljs.core.chunk_buffer.call(null, size__8074);
          var n__2525__auto____8076 = size__8074;
          var i__8077 = 0;
          while(true) {
            if(i__8077 < n__2525__auto____8076) {
              cljs.core.chunk_append.call(null, b__8075, f.call(null, idx + i__8077, cljs.core._nth.call(null, c__8073, i__8077)));
              var G__8078 = i__8077 + 1;
              i__8077 = G__8078;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8075), mapi.call(null, idx + size__8074, cljs.core.chunk_rest.call(null, s__8072)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8072)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8072)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8063.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8088 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8088) {
      var s__8089 = temp__3974__auto____8088;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8089)) {
        var c__8090 = cljs.core.chunk_first.call(null, s__8089);
        var size__8091 = cljs.core.count.call(null, c__8090);
        var b__8092 = cljs.core.chunk_buffer.call(null, size__8091);
        var n__2525__auto____8093 = size__8091;
        var i__8094 = 0;
        while(true) {
          if(i__8094 < n__2525__auto____8093) {
            var x__8095 = f.call(null, cljs.core._nth.call(null, c__8090, i__8094));
            if(x__8095 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8092, x__8095)
            }
            var G__8097 = i__8094 + 1;
            i__8094 = G__8097;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8092), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8089)))
      }else {
        var x__8096 = f.call(null, cljs.core.first.call(null, s__8089));
        if(x__8096 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8089))
        }else {
          return cljs.core.cons.call(null, x__8096, keep.call(null, f, cljs.core.rest.call(null, s__8089)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8123 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8133 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8133) {
        var s__8134 = temp__3974__auto____8133;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8134)) {
          var c__8135 = cljs.core.chunk_first.call(null, s__8134);
          var size__8136 = cljs.core.count.call(null, c__8135);
          var b__8137 = cljs.core.chunk_buffer.call(null, size__8136);
          var n__2525__auto____8138 = size__8136;
          var i__8139 = 0;
          while(true) {
            if(i__8139 < n__2525__auto____8138) {
              var x__8140 = f.call(null, idx + i__8139, cljs.core._nth.call(null, c__8135, i__8139));
              if(x__8140 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8137, x__8140)
              }
              var G__8142 = i__8139 + 1;
              i__8139 = G__8142;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8137), keepi.call(null, idx + size__8136, cljs.core.chunk_rest.call(null, s__8134)))
        }else {
          var x__8141 = f.call(null, idx, cljs.core.first.call(null, s__8134));
          if(x__8141 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8134))
          }else {
            return cljs.core.cons.call(null, x__8141, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8134)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8123.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8228 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8228)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8228
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8229 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8229)) {
            var and__3822__auto____8230 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8230)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8230
            }
          }else {
            return and__3822__auto____8229
          }
        }())
      };
      var ep1__4 = function() {
        var G__8299__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8231 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8231)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8231
            }
          }())
        };
        var G__8299 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8299__delegate.call(this, x, y, z, args)
        };
        G__8299.cljs$lang$maxFixedArity = 3;
        G__8299.cljs$lang$applyTo = function(arglist__8300) {
          var x = cljs.core.first(arglist__8300);
          var y = cljs.core.first(cljs.core.next(arglist__8300));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8300)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8300)));
          return G__8299__delegate(x, y, z, args)
        };
        G__8299.cljs$lang$arity$variadic = G__8299__delegate;
        return G__8299
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8243 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8243)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8243
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8244 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8244)) {
            var and__3822__auto____8245 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8245)) {
              var and__3822__auto____8246 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8246)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8246
              }
            }else {
              return and__3822__auto____8245
            }
          }else {
            return and__3822__auto____8244
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8247 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8247)) {
            var and__3822__auto____8248 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8248)) {
              var and__3822__auto____8249 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8249)) {
                var and__3822__auto____8250 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8250)) {
                  var and__3822__auto____8251 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8251)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8251
                  }
                }else {
                  return and__3822__auto____8250
                }
              }else {
                return and__3822__auto____8249
              }
            }else {
              return and__3822__auto____8248
            }
          }else {
            return and__3822__auto____8247
          }
        }())
      };
      var ep2__4 = function() {
        var G__8301__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8252 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8252)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8098_SHARP_) {
                var and__3822__auto____8253 = p1.call(null, p1__8098_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8253)) {
                  return p2.call(null, p1__8098_SHARP_)
                }else {
                  return and__3822__auto____8253
                }
              }, args)
            }else {
              return and__3822__auto____8252
            }
          }())
        };
        var G__8301 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8301__delegate.call(this, x, y, z, args)
        };
        G__8301.cljs$lang$maxFixedArity = 3;
        G__8301.cljs$lang$applyTo = function(arglist__8302) {
          var x = cljs.core.first(arglist__8302);
          var y = cljs.core.first(cljs.core.next(arglist__8302));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8302)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8302)));
          return G__8301__delegate(x, y, z, args)
        };
        G__8301.cljs$lang$arity$variadic = G__8301__delegate;
        return G__8301
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8272 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8272)) {
            var and__3822__auto____8273 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8273)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8273
            }
          }else {
            return and__3822__auto____8272
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8274 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8274)) {
            var and__3822__auto____8275 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8275)) {
              var and__3822__auto____8276 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8276)) {
                var and__3822__auto____8277 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8277)) {
                  var and__3822__auto____8278 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8278)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8278
                  }
                }else {
                  return and__3822__auto____8277
                }
              }else {
                return and__3822__auto____8276
              }
            }else {
              return and__3822__auto____8275
            }
          }else {
            return and__3822__auto____8274
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8279 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8279)) {
            var and__3822__auto____8280 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8280)) {
              var and__3822__auto____8281 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8281)) {
                var and__3822__auto____8282 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8282)) {
                  var and__3822__auto____8283 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8283)) {
                    var and__3822__auto____8284 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8284)) {
                      var and__3822__auto____8285 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8285)) {
                        var and__3822__auto____8286 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8286)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8286
                        }
                      }else {
                        return and__3822__auto____8285
                      }
                    }else {
                      return and__3822__auto____8284
                    }
                  }else {
                    return and__3822__auto____8283
                  }
                }else {
                  return and__3822__auto____8282
                }
              }else {
                return and__3822__auto____8281
              }
            }else {
              return and__3822__auto____8280
            }
          }else {
            return and__3822__auto____8279
          }
        }())
      };
      var ep3__4 = function() {
        var G__8303__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8287 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8287)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8099_SHARP_) {
                var and__3822__auto____8288 = p1.call(null, p1__8099_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8288)) {
                  var and__3822__auto____8289 = p2.call(null, p1__8099_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8289)) {
                    return p3.call(null, p1__8099_SHARP_)
                  }else {
                    return and__3822__auto____8289
                  }
                }else {
                  return and__3822__auto____8288
                }
              }, args)
            }else {
              return and__3822__auto____8287
            }
          }())
        };
        var G__8303 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8303__delegate.call(this, x, y, z, args)
        };
        G__8303.cljs$lang$maxFixedArity = 3;
        G__8303.cljs$lang$applyTo = function(arglist__8304) {
          var x = cljs.core.first(arglist__8304);
          var y = cljs.core.first(cljs.core.next(arglist__8304));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8304)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8304)));
          return G__8303__delegate(x, y, z, args)
        };
        G__8303.cljs$lang$arity$variadic = G__8303__delegate;
        return G__8303
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__8305__delegate = function(p1, p2, p3, ps) {
      var ps__8290 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8100_SHARP_) {
            return p1__8100_SHARP_.call(null, x)
          }, ps__8290)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8101_SHARP_) {
            var and__3822__auto____8295 = p1__8101_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8295)) {
              return p1__8101_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8295
            }
          }, ps__8290)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8102_SHARP_) {
            var and__3822__auto____8296 = p1__8102_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8296)) {
              var and__3822__auto____8297 = p1__8102_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8297)) {
                return p1__8102_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8297
              }
            }else {
              return and__3822__auto____8296
            }
          }, ps__8290)
        };
        var epn__4 = function() {
          var G__8306__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8298 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8298)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8103_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8103_SHARP_, args)
                }, ps__8290)
              }else {
                return and__3822__auto____8298
              }
            }())
          };
          var G__8306 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8306__delegate.call(this, x, y, z, args)
          };
          G__8306.cljs$lang$maxFixedArity = 3;
          G__8306.cljs$lang$applyTo = function(arglist__8307) {
            var x = cljs.core.first(arglist__8307);
            var y = cljs.core.first(cljs.core.next(arglist__8307));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8307)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8307)));
            return G__8306__delegate(x, y, z, args)
          };
          G__8306.cljs$lang$arity$variadic = G__8306__delegate;
          return G__8306
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__8305 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8305__delegate.call(this, p1, p2, p3, ps)
    };
    G__8305.cljs$lang$maxFixedArity = 3;
    G__8305.cljs$lang$applyTo = function(arglist__8308) {
      var p1 = cljs.core.first(arglist__8308);
      var p2 = cljs.core.first(cljs.core.next(arglist__8308));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8308)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8308)));
      return G__8305__delegate(p1, p2, p3, ps)
    };
    G__8305.cljs$lang$arity$variadic = G__8305__delegate;
    return G__8305
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____8389 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8389)) {
          return or__3824__auto____8389
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8390 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8390)) {
          return or__3824__auto____8390
        }else {
          var or__3824__auto____8391 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8391)) {
            return or__3824__auto____8391
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8460__delegate = function(x, y, z, args) {
          var or__3824__auto____8392 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8392)) {
            return or__3824__auto____8392
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8460 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8460__delegate.call(this, x, y, z, args)
        };
        G__8460.cljs$lang$maxFixedArity = 3;
        G__8460.cljs$lang$applyTo = function(arglist__8461) {
          var x = cljs.core.first(arglist__8461);
          var y = cljs.core.first(cljs.core.next(arglist__8461));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8461)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8461)));
          return G__8460__delegate(x, y, z, args)
        };
        G__8460.cljs$lang$arity$variadic = G__8460__delegate;
        return G__8460
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____8404 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8404)) {
          return or__3824__auto____8404
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8405 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8405)) {
          return or__3824__auto____8405
        }else {
          var or__3824__auto____8406 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8406)) {
            return or__3824__auto____8406
          }else {
            var or__3824__auto____8407 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8407)) {
              return or__3824__auto____8407
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8408 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8408)) {
          return or__3824__auto____8408
        }else {
          var or__3824__auto____8409 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8409)) {
            return or__3824__auto____8409
          }else {
            var or__3824__auto____8410 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8410)) {
              return or__3824__auto____8410
            }else {
              var or__3824__auto____8411 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8411)) {
                return or__3824__auto____8411
              }else {
                var or__3824__auto____8412 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8412)) {
                  return or__3824__auto____8412
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8462__delegate = function(x, y, z, args) {
          var or__3824__auto____8413 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8413)) {
            return or__3824__auto____8413
          }else {
            return cljs.core.some.call(null, function(p1__8143_SHARP_) {
              var or__3824__auto____8414 = p1.call(null, p1__8143_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8414)) {
                return or__3824__auto____8414
              }else {
                return p2.call(null, p1__8143_SHARP_)
              }
            }, args)
          }
        };
        var G__8462 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8462__delegate.call(this, x, y, z, args)
        };
        G__8462.cljs$lang$maxFixedArity = 3;
        G__8462.cljs$lang$applyTo = function(arglist__8463) {
          var x = cljs.core.first(arglist__8463);
          var y = cljs.core.first(cljs.core.next(arglist__8463));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8463)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8463)));
          return G__8462__delegate(x, y, z, args)
        };
        G__8462.cljs$lang$arity$variadic = G__8462__delegate;
        return G__8462
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8433 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8433)) {
          return or__3824__auto____8433
        }else {
          var or__3824__auto____8434 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8434)) {
            return or__3824__auto____8434
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8435 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8435)) {
          return or__3824__auto____8435
        }else {
          var or__3824__auto____8436 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8436)) {
            return or__3824__auto____8436
          }else {
            var or__3824__auto____8437 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8437)) {
              return or__3824__auto____8437
            }else {
              var or__3824__auto____8438 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8438)) {
                return or__3824__auto____8438
              }else {
                var or__3824__auto____8439 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8439)) {
                  return or__3824__auto____8439
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8440 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8440)) {
          return or__3824__auto____8440
        }else {
          var or__3824__auto____8441 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8441)) {
            return or__3824__auto____8441
          }else {
            var or__3824__auto____8442 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8442)) {
              return or__3824__auto____8442
            }else {
              var or__3824__auto____8443 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8443)) {
                return or__3824__auto____8443
              }else {
                var or__3824__auto____8444 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8444)) {
                  return or__3824__auto____8444
                }else {
                  var or__3824__auto____8445 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8445)) {
                    return or__3824__auto____8445
                  }else {
                    var or__3824__auto____8446 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8446)) {
                      return or__3824__auto____8446
                    }else {
                      var or__3824__auto____8447 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8447)) {
                        return or__3824__auto____8447
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8464__delegate = function(x, y, z, args) {
          var or__3824__auto____8448 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8448)) {
            return or__3824__auto____8448
          }else {
            return cljs.core.some.call(null, function(p1__8144_SHARP_) {
              var or__3824__auto____8449 = p1.call(null, p1__8144_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8449)) {
                return or__3824__auto____8449
              }else {
                var or__3824__auto____8450 = p2.call(null, p1__8144_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8450)) {
                  return or__3824__auto____8450
                }else {
                  return p3.call(null, p1__8144_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8464 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8464__delegate.call(this, x, y, z, args)
        };
        G__8464.cljs$lang$maxFixedArity = 3;
        G__8464.cljs$lang$applyTo = function(arglist__8465) {
          var x = cljs.core.first(arglist__8465);
          var y = cljs.core.first(cljs.core.next(arglist__8465));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8465)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8465)));
          return G__8464__delegate(x, y, z, args)
        };
        G__8464.cljs$lang$arity$variadic = G__8464__delegate;
        return G__8464
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8466__delegate = function(p1, p2, p3, ps) {
      var ps__8451 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8145_SHARP_) {
            return p1__8145_SHARP_.call(null, x)
          }, ps__8451)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8146_SHARP_) {
            var or__3824__auto____8456 = p1__8146_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8456)) {
              return or__3824__auto____8456
            }else {
              return p1__8146_SHARP_.call(null, y)
            }
          }, ps__8451)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8147_SHARP_) {
            var or__3824__auto____8457 = p1__8147_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8457)) {
              return or__3824__auto____8457
            }else {
              var or__3824__auto____8458 = p1__8147_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8458)) {
                return or__3824__auto____8458
              }else {
                return p1__8147_SHARP_.call(null, z)
              }
            }
          }, ps__8451)
        };
        var spn__4 = function() {
          var G__8467__delegate = function(x, y, z, args) {
            var or__3824__auto____8459 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8459)) {
              return or__3824__auto____8459
            }else {
              return cljs.core.some.call(null, function(p1__8148_SHARP_) {
                return cljs.core.some.call(null, p1__8148_SHARP_, args)
              }, ps__8451)
            }
          };
          var G__8467 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8467__delegate.call(this, x, y, z, args)
          };
          G__8467.cljs$lang$maxFixedArity = 3;
          G__8467.cljs$lang$applyTo = function(arglist__8468) {
            var x = cljs.core.first(arglist__8468);
            var y = cljs.core.first(cljs.core.next(arglist__8468));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8468)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8468)));
            return G__8467__delegate(x, y, z, args)
          };
          G__8467.cljs$lang$arity$variadic = G__8467__delegate;
          return G__8467
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8466 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8466__delegate.call(this, p1, p2, p3, ps)
    };
    G__8466.cljs$lang$maxFixedArity = 3;
    G__8466.cljs$lang$applyTo = function(arglist__8469) {
      var p1 = cljs.core.first(arglist__8469);
      var p2 = cljs.core.first(cljs.core.next(arglist__8469));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8469)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8469)));
      return G__8466__delegate(p1, p2, p3, ps)
    };
    G__8466.cljs$lang$arity$variadic = G__8466__delegate;
    return G__8466
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8488 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8488) {
        var s__8489 = temp__3974__auto____8488;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8489)) {
          var c__8490 = cljs.core.chunk_first.call(null, s__8489);
          var size__8491 = cljs.core.count.call(null, c__8490);
          var b__8492 = cljs.core.chunk_buffer.call(null, size__8491);
          var n__2525__auto____8493 = size__8491;
          var i__8494 = 0;
          while(true) {
            if(i__8494 < n__2525__auto____8493) {
              cljs.core.chunk_append.call(null, b__8492, f.call(null, cljs.core._nth.call(null, c__8490, i__8494)));
              var G__8506 = i__8494 + 1;
              i__8494 = G__8506;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8492), map.call(null, f, cljs.core.chunk_rest.call(null, s__8489)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8489)), map.call(null, f, cljs.core.rest.call(null, s__8489)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8495 = cljs.core.seq.call(null, c1);
      var s2__8496 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8497 = s1__8495;
        if(and__3822__auto____8497) {
          return s2__8496
        }else {
          return and__3822__auto____8497
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8495), cljs.core.first.call(null, s2__8496)), map.call(null, f, cljs.core.rest.call(null, s1__8495), cljs.core.rest.call(null, s2__8496)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8498 = cljs.core.seq.call(null, c1);
      var s2__8499 = cljs.core.seq.call(null, c2);
      var s3__8500 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8501 = s1__8498;
        if(and__3822__auto____8501) {
          var and__3822__auto____8502 = s2__8499;
          if(and__3822__auto____8502) {
            return s3__8500
          }else {
            return and__3822__auto____8502
          }
        }else {
          return and__3822__auto____8501
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8498), cljs.core.first.call(null, s2__8499), cljs.core.first.call(null, s3__8500)), map.call(null, f, cljs.core.rest.call(null, s1__8498), cljs.core.rest.call(null, s2__8499), cljs.core.rest.call(null, s3__8500)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8507__delegate = function(f, c1, c2, c3, colls) {
      var step__8505 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8504 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8504)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8504), step.call(null, map.call(null, cljs.core.rest, ss__8504)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8309_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8309_SHARP_)
      }, step__8505.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8507 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8507__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8507.cljs$lang$maxFixedArity = 4;
    G__8507.cljs$lang$applyTo = function(arglist__8508) {
      var f = cljs.core.first(arglist__8508);
      var c1 = cljs.core.first(cljs.core.next(arglist__8508));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8508)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8508))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8508))));
      return G__8507__delegate(f, c1, c2, c3, colls)
    };
    G__8507.cljs$lang$arity$variadic = G__8507__delegate;
    return G__8507
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8511 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8511) {
        var s__8512 = temp__3974__auto____8511;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8512), take.call(null, n - 1, cljs.core.rest.call(null, s__8512)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8518 = function(n, coll) {
    while(true) {
      var s__8516 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8517 = n > 0;
        if(and__3822__auto____8517) {
          return s__8516
        }else {
          return and__3822__auto____8517
        }
      }())) {
        var G__8519 = n - 1;
        var G__8520 = cljs.core.rest.call(null, s__8516);
        n = G__8519;
        coll = G__8520;
        continue
      }else {
        return s__8516
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8518.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8523 = cljs.core.seq.call(null, coll);
  var lead__8524 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8524) {
      var G__8525 = cljs.core.next.call(null, s__8523);
      var G__8526 = cljs.core.next.call(null, lead__8524);
      s__8523 = G__8525;
      lead__8524 = G__8526;
      continue
    }else {
      return s__8523
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8532 = function(pred, coll) {
    while(true) {
      var s__8530 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8531 = s__8530;
        if(and__3822__auto____8531) {
          return pred.call(null, cljs.core.first.call(null, s__8530))
        }else {
          return and__3822__auto____8531
        }
      }())) {
        var G__8533 = pred;
        var G__8534 = cljs.core.rest.call(null, s__8530);
        pred = G__8533;
        coll = G__8534;
        continue
      }else {
        return s__8530
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8532.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8537 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8537) {
      var s__8538 = temp__3974__auto____8537;
      return cljs.core.concat.call(null, s__8538, cycle.call(null, s__8538))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8543 = cljs.core.seq.call(null, c1);
      var s2__8544 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8545 = s1__8543;
        if(and__3822__auto____8545) {
          return s2__8544
        }else {
          return and__3822__auto____8545
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8543), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8544), interleave.call(null, cljs.core.rest.call(null, s1__8543), cljs.core.rest.call(null, s2__8544))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8547__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8546 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8546)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8546), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8546)))
        }else {
          return null
        }
      }, null)
    };
    var G__8547 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8547__delegate.call(this, c1, c2, colls)
    };
    G__8547.cljs$lang$maxFixedArity = 2;
    G__8547.cljs$lang$applyTo = function(arglist__8548) {
      var c1 = cljs.core.first(arglist__8548);
      var c2 = cljs.core.first(cljs.core.next(arglist__8548));
      var colls = cljs.core.rest(cljs.core.next(arglist__8548));
      return G__8547__delegate(c1, c2, colls)
    };
    G__8547.cljs$lang$arity$variadic = G__8547__delegate;
    return G__8547
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8558 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8556 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8556) {
        var coll__8557 = temp__3971__auto____8556;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8557), cat.call(null, cljs.core.rest.call(null, coll__8557), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8558.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8559__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8559 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8559__delegate.call(this, f, coll, colls)
    };
    G__8559.cljs$lang$maxFixedArity = 2;
    G__8559.cljs$lang$applyTo = function(arglist__8560) {
      var f = cljs.core.first(arglist__8560);
      var coll = cljs.core.first(cljs.core.next(arglist__8560));
      var colls = cljs.core.rest(cljs.core.next(arglist__8560));
      return G__8559__delegate(f, coll, colls)
    };
    G__8559.cljs$lang$arity$variadic = G__8559__delegate;
    return G__8559
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8570 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8570) {
      var s__8571 = temp__3974__auto____8570;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8571)) {
        var c__8572 = cljs.core.chunk_first.call(null, s__8571);
        var size__8573 = cljs.core.count.call(null, c__8572);
        var b__8574 = cljs.core.chunk_buffer.call(null, size__8573);
        var n__2525__auto____8575 = size__8573;
        var i__8576 = 0;
        while(true) {
          if(i__8576 < n__2525__auto____8575) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8572, i__8576)))) {
              cljs.core.chunk_append.call(null, b__8574, cljs.core._nth.call(null, c__8572, i__8576))
            }else {
            }
            var G__8579 = i__8576 + 1;
            i__8576 = G__8579;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8574), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8571)))
      }else {
        var f__8577 = cljs.core.first.call(null, s__8571);
        var r__8578 = cljs.core.rest.call(null, s__8571);
        if(cljs.core.truth_(pred.call(null, f__8577))) {
          return cljs.core.cons.call(null, f__8577, filter.call(null, pred, r__8578))
        }else {
          return filter.call(null, pred, r__8578)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8582 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8582.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8580_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8580_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8586__8587 = to;
    if(G__8586__8587) {
      if(function() {
        var or__3824__auto____8588 = G__8586__8587.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8588) {
          return or__3824__auto____8588
        }else {
          return G__8586__8587.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8586__8587.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8586__8587)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8586__8587)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8589__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8589 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8589__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8589.cljs$lang$maxFixedArity = 4;
    G__8589.cljs$lang$applyTo = function(arglist__8590) {
      var f = cljs.core.first(arglist__8590);
      var c1 = cljs.core.first(cljs.core.next(arglist__8590));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8590)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8590))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8590))));
      return G__8589__delegate(f, c1, c2, c3, colls)
    };
    G__8589.cljs$lang$arity$variadic = G__8589__delegate;
    return G__8589
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8597 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8597) {
        var s__8598 = temp__3974__auto____8597;
        var p__8599 = cljs.core.take.call(null, n, s__8598);
        if(n === cljs.core.count.call(null, p__8599)) {
          return cljs.core.cons.call(null, p__8599, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8598)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8600 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8600) {
        var s__8601 = temp__3974__auto____8600;
        var p__8602 = cljs.core.take.call(null, n, s__8601);
        if(n === cljs.core.count.call(null, p__8602)) {
          return cljs.core.cons.call(null, p__8602, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8601)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8602, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8607 = cljs.core.lookup_sentinel;
    var m__8608 = m;
    var ks__8609 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8609) {
        var m__8610 = cljs.core._lookup.call(null, m__8608, cljs.core.first.call(null, ks__8609), sentinel__8607);
        if(sentinel__8607 === m__8610) {
          return not_found
        }else {
          var G__8611 = sentinel__8607;
          var G__8612 = m__8610;
          var G__8613 = cljs.core.next.call(null, ks__8609);
          sentinel__8607 = G__8611;
          m__8608 = G__8612;
          ks__8609 = G__8613;
          continue
        }
      }else {
        return m__8608
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8614, v) {
  var vec__8619__8620 = p__8614;
  var k__8621 = cljs.core.nth.call(null, vec__8619__8620, 0, null);
  var ks__8622 = cljs.core.nthnext.call(null, vec__8619__8620, 1);
  if(cljs.core.truth_(ks__8622)) {
    return cljs.core.assoc.call(null, m, k__8621, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8621, null), ks__8622, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8621, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8623, f, args) {
    var vec__8628__8629 = p__8623;
    var k__8630 = cljs.core.nth.call(null, vec__8628__8629, 0, null);
    var ks__8631 = cljs.core.nthnext.call(null, vec__8628__8629, 1);
    if(cljs.core.truth_(ks__8631)) {
      return cljs.core.assoc.call(null, m, k__8630, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8630, null), ks__8631, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8630, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8630, null), args))
    }
  };
  var update_in = function(m, p__8623, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8623, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8632) {
    var m = cljs.core.first(arglist__8632);
    var p__8623 = cljs.core.first(cljs.core.next(arglist__8632));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8632)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8632)));
    return update_in__delegate(m, p__8623, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8635 = this;
  var h__2190__auto____8636 = this__8635.__hash;
  if(!(h__2190__auto____8636 == null)) {
    return h__2190__auto____8636
  }else {
    var h__2190__auto____8637 = cljs.core.hash_coll.call(null, coll);
    this__8635.__hash = h__2190__auto____8637;
    return h__2190__auto____8637
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8638 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8639 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8640 = this;
  var new_array__8641 = this__8640.array.slice();
  new_array__8641[k] = v;
  return new cljs.core.Vector(this__8640.meta, new_array__8641, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8672 = null;
  var G__8672__2 = function(this_sym8642, k) {
    var this__8644 = this;
    var this_sym8642__8645 = this;
    var coll__8646 = this_sym8642__8645;
    return coll__8646.cljs$core$ILookup$_lookup$arity$2(coll__8646, k)
  };
  var G__8672__3 = function(this_sym8643, k, not_found) {
    var this__8644 = this;
    var this_sym8643__8647 = this;
    var coll__8648 = this_sym8643__8647;
    return coll__8648.cljs$core$ILookup$_lookup$arity$3(coll__8648, k, not_found)
  };
  G__8672 = function(this_sym8643, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8672__2.call(this, this_sym8643, k);
      case 3:
        return G__8672__3.call(this, this_sym8643, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8672
}();
cljs.core.Vector.prototype.apply = function(this_sym8633, args8634) {
  var this__8649 = this;
  return this_sym8633.call.apply(this_sym8633, [this_sym8633].concat(args8634.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8650 = this;
  var new_array__8651 = this__8650.array.slice();
  new_array__8651.push(o);
  return new cljs.core.Vector(this__8650.meta, new_array__8651, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8652 = this;
  var this__8653 = this;
  return cljs.core.pr_str.call(null, this__8653)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8654 = this;
  return cljs.core.ci_reduce.call(null, this__8654.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8655 = this;
  return cljs.core.ci_reduce.call(null, this__8655.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8656 = this;
  if(this__8656.array.length > 0) {
    var vector_seq__8657 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8656.array.length) {
          return cljs.core.cons.call(null, this__8656.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8657.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8658 = this;
  return this__8658.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8659 = this;
  var count__8660 = this__8659.array.length;
  if(count__8660 > 0) {
    return this__8659.array[count__8660 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8661 = this;
  if(this__8661.array.length > 0) {
    var new_array__8662 = this__8661.array.slice();
    new_array__8662.pop();
    return new cljs.core.Vector(this__8661.meta, new_array__8662, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8663 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8664 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8665 = this;
  return new cljs.core.Vector(meta, this__8665.array, this__8665.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8666 = this;
  return this__8666.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8667 = this;
  if(function() {
    var and__3822__auto____8668 = 0 <= n;
    if(and__3822__auto____8668) {
      return n < this__8667.array.length
    }else {
      return and__3822__auto____8668
    }
  }()) {
    return this__8667.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8669 = this;
  if(function() {
    var and__3822__auto____8670 = 0 <= n;
    if(and__3822__auto____8670) {
      return n < this__8669.array.length
    }else {
      return and__3822__auto____8670
    }
  }()) {
    return this__8669.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8671 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8671.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2308__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8674 = pv.cnt;
  if(cnt__8674 < 32) {
    return 0
  }else {
    return cnt__8674 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8680 = level;
  var ret__8681 = node;
  while(true) {
    if(ll__8680 === 0) {
      return ret__8681
    }else {
      var embed__8682 = ret__8681;
      var r__8683 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8684 = cljs.core.pv_aset.call(null, r__8683, 0, embed__8682);
      var G__8685 = ll__8680 - 5;
      var G__8686 = r__8683;
      ll__8680 = G__8685;
      ret__8681 = G__8686;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8692 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8693 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8692, subidx__8693, tailnode);
    return ret__8692
  }else {
    var child__8694 = cljs.core.pv_aget.call(null, parent, subidx__8693);
    if(!(child__8694 == null)) {
      var node_to_insert__8695 = push_tail.call(null, pv, level - 5, child__8694, tailnode);
      cljs.core.pv_aset.call(null, ret__8692, subidx__8693, node_to_insert__8695);
      return ret__8692
    }else {
      var node_to_insert__8696 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8692, subidx__8693, node_to_insert__8696);
      return ret__8692
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8700 = 0 <= i;
    if(and__3822__auto____8700) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8700
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8701 = pv.root;
      var level__8702 = pv.shift;
      while(true) {
        if(level__8702 > 0) {
          var G__8703 = cljs.core.pv_aget.call(null, node__8701, i >>> level__8702 & 31);
          var G__8704 = level__8702 - 5;
          node__8701 = G__8703;
          level__8702 = G__8704;
          continue
        }else {
          return node__8701.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8707 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8707, i & 31, val);
    return ret__8707
  }else {
    var subidx__8708 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8707, subidx__8708, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8708), i, val));
    return ret__8707
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8714 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8715 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8714));
    if(function() {
      var and__3822__auto____8716 = new_child__8715 == null;
      if(and__3822__auto____8716) {
        return subidx__8714 === 0
      }else {
        return and__3822__auto____8716
      }
    }()) {
      return null
    }else {
      var ret__8717 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8717, subidx__8714, new_child__8715);
      return ret__8717
    }
  }else {
    if(subidx__8714 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8718 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8718, subidx__8714, null);
        return ret__8718
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8721 = this;
  return new cljs.core.TransientVector(this__8721.cnt, this__8721.shift, cljs.core.tv_editable_root.call(null, this__8721.root), cljs.core.tv_editable_tail.call(null, this__8721.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8722 = this;
  var h__2190__auto____8723 = this__8722.__hash;
  if(!(h__2190__auto____8723 == null)) {
    return h__2190__auto____8723
  }else {
    var h__2190__auto____8724 = cljs.core.hash_coll.call(null, coll);
    this__8722.__hash = h__2190__auto____8724;
    return h__2190__auto____8724
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8725 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8726 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8727 = this;
  if(function() {
    var and__3822__auto____8728 = 0 <= k;
    if(and__3822__auto____8728) {
      return k < this__8727.cnt
    }else {
      return and__3822__auto____8728
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8729 = this__8727.tail.slice();
      new_tail__8729[k & 31] = v;
      return new cljs.core.PersistentVector(this__8727.meta, this__8727.cnt, this__8727.shift, this__8727.root, new_tail__8729, null)
    }else {
      return new cljs.core.PersistentVector(this__8727.meta, this__8727.cnt, this__8727.shift, cljs.core.do_assoc.call(null, coll, this__8727.shift, this__8727.root, k, v), this__8727.tail, null)
    }
  }else {
    if(k === this__8727.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8727.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8777 = null;
  var G__8777__2 = function(this_sym8730, k) {
    var this__8732 = this;
    var this_sym8730__8733 = this;
    var coll__8734 = this_sym8730__8733;
    return coll__8734.cljs$core$ILookup$_lookup$arity$2(coll__8734, k)
  };
  var G__8777__3 = function(this_sym8731, k, not_found) {
    var this__8732 = this;
    var this_sym8731__8735 = this;
    var coll__8736 = this_sym8731__8735;
    return coll__8736.cljs$core$ILookup$_lookup$arity$3(coll__8736, k, not_found)
  };
  G__8777 = function(this_sym8731, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8777__2.call(this, this_sym8731, k);
      case 3:
        return G__8777__3.call(this, this_sym8731, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8777
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8719, args8720) {
  var this__8737 = this;
  return this_sym8719.call.apply(this_sym8719, [this_sym8719].concat(args8720.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8738 = this;
  var step_init__8739 = [0, init];
  var i__8740 = 0;
  while(true) {
    if(i__8740 < this__8738.cnt) {
      var arr__8741 = cljs.core.array_for.call(null, v, i__8740);
      var len__8742 = arr__8741.length;
      var init__8746 = function() {
        var j__8743 = 0;
        var init__8744 = step_init__8739[1];
        while(true) {
          if(j__8743 < len__8742) {
            var init__8745 = f.call(null, init__8744, j__8743 + i__8740, arr__8741[j__8743]);
            if(cljs.core.reduced_QMARK_.call(null, init__8745)) {
              return init__8745
            }else {
              var G__8778 = j__8743 + 1;
              var G__8779 = init__8745;
              j__8743 = G__8778;
              init__8744 = G__8779;
              continue
            }
          }else {
            step_init__8739[0] = len__8742;
            step_init__8739[1] = init__8744;
            return init__8744
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8746)) {
        return cljs.core.deref.call(null, init__8746)
      }else {
        var G__8780 = i__8740 + step_init__8739[0];
        i__8740 = G__8780;
        continue
      }
    }else {
      return step_init__8739[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8747 = this;
  if(this__8747.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8748 = this__8747.tail.slice();
    new_tail__8748.push(o);
    return new cljs.core.PersistentVector(this__8747.meta, this__8747.cnt + 1, this__8747.shift, this__8747.root, new_tail__8748, null)
  }else {
    var root_overflow_QMARK___8749 = this__8747.cnt >>> 5 > 1 << this__8747.shift;
    var new_shift__8750 = root_overflow_QMARK___8749 ? this__8747.shift + 5 : this__8747.shift;
    var new_root__8752 = root_overflow_QMARK___8749 ? function() {
      var n_r__8751 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8751, 0, this__8747.root);
      cljs.core.pv_aset.call(null, n_r__8751, 1, cljs.core.new_path.call(null, null, this__8747.shift, new cljs.core.VectorNode(null, this__8747.tail)));
      return n_r__8751
    }() : cljs.core.push_tail.call(null, coll, this__8747.shift, this__8747.root, new cljs.core.VectorNode(null, this__8747.tail));
    return new cljs.core.PersistentVector(this__8747.meta, this__8747.cnt + 1, new_shift__8750, new_root__8752, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8753 = this;
  if(this__8753.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8753.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8754 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8755 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8756 = this;
  var this__8757 = this;
  return cljs.core.pr_str.call(null, this__8757)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8758 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8759 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8760 = this;
  if(this__8760.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8761 = this;
  return this__8761.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8762 = this;
  if(this__8762.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8762.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8763 = this;
  if(this__8763.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8763.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8763.meta)
    }else {
      if(1 < this__8763.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8763.meta, this__8763.cnt - 1, this__8763.shift, this__8763.root, this__8763.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8764 = cljs.core.array_for.call(null, coll, this__8763.cnt - 2);
          var nr__8765 = cljs.core.pop_tail.call(null, coll, this__8763.shift, this__8763.root);
          var new_root__8766 = nr__8765 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8765;
          var cnt_1__8767 = this__8763.cnt - 1;
          if(function() {
            var and__3822__auto____8768 = 5 < this__8763.shift;
            if(and__3822__auto____8768) {
              return cljs.core.pv_aget.call(null, new_root__8766, 1) == null
            }else {
              return and__3822__auto____8768
            }
          }()) {
            return new cljs.core.PersistentVector(this__8763.meta, cnt_1__8767, this__8763.shift - 5, cljs.core.pv_aget.call(null, new_root__8766, 0), new_tail__8764, null)
          }else {
            return new cljs.core.PersistentVector(this__8763.meta, cnt_1__8767, this__8763.shift, new_root__8766, new_tail__8764, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8769 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8770 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8771 = this;
  return new cljs.core.PersistentVector(meta, this__8771.cnt, this__8771.shift, this__8771.root, this__8771.tail, this__8771.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8772 = this;
  return this__8772.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8773 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8774 = this;
  if(function() {
    var and__3822__auto____8775 = 0 <= n;
    if(and__3822__auto____8775) {
      return n < this__8774.cnt
    }else {
      return and__3822__auto____8775
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8776 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8776.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8781 = xs.length;
  var xs__8782 = no_clone === true ? xs : xs.slice();
  if(l__8781 < 32) {
    return new cljs.core.PersistentVector(null, l__8781, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8782, null)
  }else {
    var node__8783 = xs__8782.slice(0, 32);
    var v__8784 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8783, null);
    var i__8785 = 32;
    var out__8786 = cljs.core._as_transient.call(null, v__8784);
    while(true) {
      if(i__8785 < l__8781) {
        var G__8787 = i__8785 + 1;
        var G__8788 = cljs.core.conj_BANG_.call(null, out__8786, xs__8782[i__8785]);
        i__8785 = G__8787;
        out__8786 = G__8788;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8786)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8789) {
    var args = cljs.core.seq(arglist__8789);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8790 = this;
  if(this__8790.off + 1 < this__8790.node.length) {
    var s__8791 = cljs.core.chunked_seq.call(null, this__8790.vec, this__8790.node, this__8790.i, this__8790.off + 1);
    if(s__8791 == null) {
      return null
    }else {
      return s__8791
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8792 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8793 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8794 = this;
  return this__8794.node[this__8794.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8795 = this;
  if(this__8795.off + 1 < this__8795.node.length) {
    var s__8796 = cljs.core.chunked_seq.call(null, this__8795.vec, this__8795.node, this__8795.i, this__8795.off + 1);
    if(s__8796 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8796
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8797 = this;
  var l__8798 = this__8797.node.length;
  var s__8799 = this__8797.i + l__8798 < cljs.core._count.call(null, this__8797.vec) ? cljs.core.chunked_seq.call(null, this__8797.vec, this__8797.i + l__8798, 0) : null;
  if(s__8799 == null) {
    return null
  }else {
    return s__8799
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8800 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8801 = this;
  return cljs.core.chunked_seq.call(null, this__8801.vec, this__8801.node, this__8801.i, this__8801.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8802 = this;
  return this__8802.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8803 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8803.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8804 = this;
  return cljs.core.array_chunk.call(null, this__8804.node, this__8804.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8805 = this;
  var l__8806 = this__8805.node.length;
  var s__8807 = this__8805.i + l__8806 < cljs.core._count.call(null, this__8805.vec) ? cljs.core.chunked_seq.call(null, this__8805.vec, this__8805.i + l__8806, 0) : null;
  if(s__8807 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8807
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8810 = this;
  var h__2190__auto____8811 = this__8810.__hash;
  if(!(h__2190__auto____8811 == null)) {
    return h__2190__auto____8811
  }else {
    var h__2190__auto____8812 = cljs.core.hash_coll.call(null, coll);
    this__8810.__hash = h__2190__auto____8812;
    return h__2190__auto____8812
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8813 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8814 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8815 = this;
  var v_pos__8816 = this__8815.start + key;
  return new cljs.core.Subvec(this__8815.meta, cljs.core._assoc.call(null, this__8815.v, v_pos__8816, val), this__8815.start, this__8815.end > v_pos__8816 + 1 ? this__8815.end : v_pos__8816 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8842 = null;
  var G__8842__2 = function(this_sym8817, k) {
    var this__8819 = this;
    var this_sym8817__8820 = this;
    var coll__8821 = this_sym8817__8820;
    return coll__8821.cljs$core$ILookup$_lookup$arity$2(coll__8821, k)
  };
  var G__8842__3 = function(this_sym8818, k, not_found) {
    var this__8819 = this;
    var this_sym8818__8822 = this;
    var coll__8823 = this_sym8818__8822;
    return coll__8823.cljs$core$ILookup$_lookup$arity$3(coll__8823, k, not_found)
  };
  G__8842 = function(this_sym8818, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8842__2.call(this, this_sym8818, k);
      case 3:
        return G__8842__3.call(this, this_sym8818, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8842
}();
cljs.core.Subvec.prototype.apply = function(this_sym8808, args8809) {
  var this__8824 = this;
  return this_sym8808.call.apply(this_sym8808, [this_sym8808].concat(args8809.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8825 = this;
  return new cljs.core.Subvec(this__8825.meta, cljs.core._assoc_n.call(null, this__8825.v, this__8825.end, o), this__8825.start, this__8825.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8826 = this;
  var this__8827 = this;
  return cljs.core.pr_str.call(null, this__8827)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8828 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8829 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8830 = this;
  var subvec_seq__8831 = function subvec_seq(i) {
    if(i === this__8830.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8830.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8831.call(null, this__8830.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8832 = this;
  return this__8832.end - this__8832.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8833 = this;
  return cljs.core._nth.call(null, this__8833.v, this__8833.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8834 = this;
  if(this__8834.start === this__8834.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8834.meta, this__8834.v, this__8834.start, this__8834.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8835 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8836 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8837 = this;
  return new cljs.core.Subvec(meta, this__8837.v, this__8837.start, this__8837.end, this__8837.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8838 = this;
  return this__8838.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8839 = this;
  return cljs.core._nth.call(null, this__8839.v, this__8839.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8840 = this;
  return cljs.core._nth.call(null, this__8840.v, this__8840.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8841 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8841.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8844 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8844, 0, tl.length);
  return ret__8844
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8848 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8849 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8848, subidx__8849, level === 5 ? tail_node : function() {
    var child__8850 = cljs.core.pv_aget.call(null, ret__8848, subidx__8849);
    if(!(child__8850 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8850, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8848
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8855 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8856 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8857 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8855, subidx__8856));
    if(function() {
      var and__3822__auto____8858 = new_child__8857 == null;
      if(and__3822__auto____8858) {
        return subidx__8856 === 0
      }else {
        return and__3822__auto____8858
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8855, subidx__8856, new_child__8857);
      return node__8855
    }
  }else {
    if(subidx__8856 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8855, subidx__8856, null);
        return node__8855
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8863 = 0 <= i;
    if(and__3822__auto____8863) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8863
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8864 = tv.root;
      var node__8865 = root__8864;
      var level__8866 = tv.shift;
      while(true) {
        if(level__8866 > 0) {
          var G__8867 = cljs.core.tv_ensure_editable.call(null, root__8864.edit, cljs.core.pv_aget.call(null, node__8865, i >>> level__8866 & 31));
          var G__8868 = level__8866 - 5;
          node__8865 = G__8867;
          level__8866 = G__8868;
          continue
        }else {
          return node__8865.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8908 = null;
  var G__8908__2 = function(this_sym8871, k) {
    var this__8873 = this;
    var this_sym8871__8874 = this;
    var coll__8875 = this_sym8871__8874;
    return coll__8875.cljs$core$ILookup$_lookup$arity$2(coll__8875, k)
  };
  var G__8908__3 = function(this_sym8872, k, not_found) {
    var this__8873 = this;
    var this_sym8872__8876 = this;
    var coll__8877 = this_sym8872__8876;
    return coll__8877.cljs$core$ILookup$_lookup$arity$3(coll__8877, k, not_found)
  };
  G__8908 = function(this_sym8872, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8908__2.call(this, this_sym8872, k);
      case 3:
        return G__8908__3.call(this, this_sym8872, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8908
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8869, args8870) {
  var this__8878 = this;
  return this_sym8869.call.apply(this_sym8869, [this_sym8869].concat(args8870.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8879 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8880 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8881 = this;
  if(this__8881.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8882 = this;
  if(function() {
    var and__3822__auto____8883 = 0 <= n;
    if(and__3822__auto____8883) {
      return n < this__8882.cnt
    }else {
      return and__3822__auto____8883
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8884 = this;
  if(this__8884.root.edit) {
    return this__8884.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8885 = this;
  if(this__8885.root.edit) {
    if(function() {
      var and__3822__auto____8886 = 0 <= n;
      if(and__3822__auto____8886) {
        return n < this__8885.cnt
      }else {
        return and__3822__auto____8886
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8885.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8891 = function go(level, node) {
          var node__8889 = cljs.core.tv_ensure_editable.call(null, this__8885.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8889, n & 31, val);
            return node__8889
          }else {
            var subidx__8890 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8889, subidx__8890, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8889, subidx__8890)));
            return node__8889
          }
        }.call(null, this__8885.shift, this__8885.root);
        this__8885.root = new_root__8891;
        return tcoll
      }
    }else {
      if(n === this__8885.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8885.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8892 = this;
  if(this__8892.root.edit) {
    if(this__8892.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8892.cnt) {
        this__8892.cnt = 0;
        return tcoll
      }else {
        if((this__8892.cnt - 1 & 31) > 0) {
          this__8892.cnt = this__8892.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8893 = cljs.core.editable_array_for.call(null, tcoll, this__8892.cnt - 2);
            var new_root__8895 = function() {
              var nr__8894 = cljs.core.tv_pop_tail.call(null, tcoll, this__8892.shift, this__8892.root);
              if(!(nr__8894 == null)) {
                return nr__8894
              }else {
                return new cljs.core.VectorNode(this__8892.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8896 = 5 < this__8892.shift;
              if(and__3822__auto____8896) {
                return cljs.core.pv_aget.call(null, new_root__8895, 1) == null
              }else {
                return and__3822__auto____8896
              }
            }()) {
              var new_root__8897 = cljs.core.tv_ensure_editable.call(null, this__8892.root.edit, cljs.core.pv_aget.call(null, new_root__8895, 0));
              this__8892.root = new_root__8897;
              this__8892.shift = this__8892.shift - 5;
              this__8892.cnt = this__8892.cnt - 1;
              this__8892.tail = new_tail__8893;
              return tcoll
            }else {
              this__8892.root = new_root__8895;
              this__8892.cnt = this__8892.cnt - 1;
              this__8892.tail = new_tail__8893;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8898 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8899 = this;
  if(this__8899.root.edit) {
    if(this__8899.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8899.tail[this__8899.cnt & 31] = o;
      this__8899.cnt = this__8899.cnt + 1;
      return tcoll
    }else {
      var tail_node__8900 = new cljs.core.VectorNode(this__8899.root.edit, this__8899.tail);
      var new_tail__8901 = cljs.core.make_array.call(null, 32);
      new_tail__8901[0] = o;
      this__8899.tail = new_tail__8901;
      if(this__8899.cnt >>> 5 > 1 << this__8899.shift) {
        var new_root_array__8902 = cljs.core.make_array.call(null, 32);
        var new_shift__8903 = this__8899.shift + 5;
        new_root_array__8902[0] = this__8899.root;
        new_root_array__8902[1] = cljs.core.new_path.call(null, this__8899.root.edit, this__8899.shift, tail_node__8900);
        this__8899.root = new cljs.core.VectorNode(this__8899.root.edit, new_root_array__8902);
        this__8899.shift = new_shift__8903;
        this__8899.cnt = this__8899.cnt + 1;
        return tcoll
      }else {
        var new_root__8904 = cljs.core.tv_push_tail.call(null, tcoll, this__8899.shift, this__8899.root, tail_node__8900);
        this__8899.root = new_root__8904;
        this__8899.cnt = this__8899.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8905 = this;
  if(this__8905.root.edit) {
    this__8905.root.edit = null;
    var len__8906 = this__8905.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8907 = cljs.core.make_array.call(null, len__8906);
    cljs.core.array_copy.call(null, this__8905.tail, 0, trimmed_tail__8907, 0, len__8906);
    return new cljs.core.PersistentVector(null, this__8905.cnt, this__8905.shift, this__8905.root, trimmed_tail__8907, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8909 = this;
  var h__2190__auto____8910 = this__8909.__hash;
  if(!(h__2190__auto____8910 == null)) {
    return h__2190__auto____8910
  }else {
    var h__2190__auto____8911 = cljs.core.hash_coll.call(null, coll);
    this__8909.__hash = h__2190__auto____8911;
    return h__2190__auto____8911
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8912 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8913 = this;
  var this__8914 = this;
  return cljs.core.pr_str.call(null, this__8914)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8915 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8916 = this;
  return cljs.core._first.call(null, this__8916.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8917 = this;
  var temp__3971__auto____8918 = cljs.core.next.call(null, this__8917.front);
  if(temp__3971__auto____8918) {
    var f1__8919 = temp__3971__auto____8918;
    return new cljs.core.PersistentQueueSeq(this__8917.meta, f1__8919, this__8917.rear, null)
  }else {
    if(this__8917.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8917.meta, this__8917.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8920 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8921 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8921.front, this__8921.rear, this__8921.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8922 = this;
  return this__8922.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8923 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8923.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8924 = this;
  var h__2190__auto____8925 = this__8924.__hash;
  if(!(h__2190__auto____8925 == null)) {
    return h__2190__auto____8925
  }else {
    var h__2190__auto____8926 = cljs.core.hash_coll.call(null, coll);
    this__8924.__hash = h__2190__auto____8926;
    return h__2190__auto____8926
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8927 = this;
  if(cljs.core.truth_(this__8927.front)) {
    return new cljs.core.PersistentQueue(this__8927.meta, this__8927.count + 1, this__8927.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8928 = this__8927.rear;
      if(cljs.core.truth_(or__3824__auto____8928)) {
        return or__3824__auto____8928
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8927.meta, this__8927.count + 1, cljs.core.conj.call(null, this__8927.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8929 = this;
  var this__8930 = this;
  return cljs.core.pr_str.call(null, this__8930)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8931 = this;
  var rear__8932 = cljs.core.seq.call(null, this__8931.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8933 = this__8931.front;
    if(cljs.core.truth_(or__3824__auto____8933)) {
      return or__3824__auto____8933
    }else {
      return rear__8932
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8931.front, cljs.core.seq.call(null, rear__8932), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8934 = this;
  return this__8934.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8935 = this;
  return cljs.core._first.call(null, this__8935.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8936 = this;
  if(cljs.core.truth_(this__8936.front)) {
    var temp__3971__auto____8937 = cljs.core.next.call(null, this__8936.front);
    if(temp__3971__auto____8937) {
      var f1__8938 = temp__3971__auto____8937;
      return new cljs.core.PersistentQueue(this__8936.meta, this__8936.count - 1, f1__8938, this__8936.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8936.meta, this__8936.count - 1, cljs.core.seq.call(null, this__8936.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8939 = this;
  return cljs.core.first.call(null, this__8939.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8940 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8941 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8942 = this;
  return new cljs.core.PersistentQueue(meta, this__8942.count, this__8942.front, this__8942.rear, this__8942.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8943 = this;
  return this__8943.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8944 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8945 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8948 = array.length;
  var i__8949 = 0;
  while(true) {
    if(i__8949 < len__8948) {
      if(k === array[i__8949]) {
        return i__8949
      }else {
        var G__8950 = i__8949 + incr;
        i__8949 = G__8950;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8953 = cljs.core.hash.call(null, a);
  var b__8954 = cljs.core.hash.call(null, b);
  if(a__8953 < b__8954) {
    return-1
  }else {
    if(a__8953 > b__8954) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8962 = m.keys;
  var len__8963 = ks__8962.length;
  var so__8964 = m.strobj;
  var out__8965 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8966 = 0;
  var out__8967 = cljs.core.transient$.call(null, out__8965);
  while(true) {
    if(i__8966 < len__8963) {
      var k__8968 = ks__8962[i__8966];
      var G__8969 = i__8966 + 1;
      var G__8970 = cljs.core.assoc_BANG_.call(null, out__8967, k__8968, so__8964[k__8968]);
      i__8966 = G__8969;
      out__8967 = G__8970;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8967, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8976 = {};
  var l__8977 = ks.length;
  var i__8978 = 0;
  while(true) {
    if(i__8978 < l__8977) {
      var k__8979 = ks[i__8978];
      new_obj__8976[k__8979] = obj[k__8979];
      var G__8980 = i__8978 + 1;
      i__8978 = G__8980;
      continue
    }else {
    }
    break
  }
  return new_obj__8976
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8983 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8984 = this;
  var h__2190__auto____8985 = this__8984.__hash;
  if(!(h__2190__auto____8985 == null)) {
    return h__2190__auto____8985
  }else {
    var h__2190__auto____8986 = cljs.core.hash_imap.call(null, coll);
    this__8984.__hash = h__2190__auto____8986;
    return h__2190__auto____8986
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8987 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8988 = this;
  if(function() {
    var and__3822__auto____8989 = goog.isString(k);
    if(and__3822__auto____8989) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8988.keys) == null)
    }else {
      return and__3822__auto____8989
    }
  }()) {
    return this__8988.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8990 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8991 = this__8990.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8991) {
        return or__3824__auto____8991
      }else {
        return this__8990.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8990.keys) == null)) {
        var new_strobj__8992 = cljs.core.obj_clone.call(null, this__8990.strobj, this__8990.keys);
        new_strobj__8992[k] = v;
        return new cljs.core.ObjMap(this__8990.meta, this__8990.keys, new_strobj__8992, this__8990.update_count + 1, null)
      }else {
        var new_strobj__8993 = cljs.core.obj_clone.call(null, this__8990.strobj, this__8990.keys);
        var new_keys__8994 = this__8990.keys.slice();
        new_strobj__8993[k] = v;
        new_keys__8994.push(k);
        return new cljs.core.ObjMap(this__8990.meta, new_keys__8994, new_strobj__8993, this__8990.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8995 = this;
  if(function() {
    var and__3822__auto____8996 = goog.isString(k);
    if(and__3822__auto____8996) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8995.keys) == null)
    }else {
      return and__3822__auto____8996
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9018 = null;
  var G__9018__2 = function(this_sym8997, k) {
    var this__8999 = this;
    var this_sym8997__9000 = this;
    var coll__9001 = this_sym8997__9000;
    return coll__9001.cljs$core$ILookup$_lookup$arity$2(coll__9001, k)
  };
  var G__9018__3 = function(this_sym8998, k, not_found) {
    var this__8999 = this;
    var this_sym8998__9002 = this;
    var coll__9003 = this_sym8998__9002;
    return coll__9003.cljs$core$ILookup$_lookup$arity$3(coll__9003, k, not_found)
  };
  G__9018 = function(this_sym8998, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9018__2.call(this, this_sym8998, k);
      case 3:
        return G__9018__3.call(this, this_sym8998, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9018
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8981, args8982) {
  var this__9004 = this;
  return this_sym8981.call.apply(this_sym8981, [this_sym8981].concat(args8982.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9005 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9006 = this;
  var this__9007 = this;
  return cljs.core.pr_str.call(null, this__9007)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9008 = this;
  if(this__9008.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8971_SHARP_) {
      return cljs.core.vector.call(null, p1__8971_SHARP_, this__9008.strobj[p1__8971_SHARP_])
    }, this__9008.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9009 = this;
  return this__9009.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9010 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9011 = this;
  return new cljs.core.ObjMap(meta, this__9011.keys, this__9011.strobj, this__9011.update_count, this__9011.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9012 = this;
  return this__9012.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9013 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9013.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9014 = this;
  if(function() {
    var and__3822__auto____9015 = goog.isString(k);
    if(and__3822__auto____9015) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9014.keys) == null)
    }else {
      return and__3822__auto____9015
    }
  }()) {
    var new_keys__9016 = this__9014.keys.slice();
    var new_strobj__9017 = cljs.core.obj_clone.call(null, this__9014.strobj, this__9014.keys);
    new_keys__9016.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9016), 1);
    cljs.core.js_delete.call(null, new_strobj__9017, k);
    return new cljs.core.ObjMap(this__9014.meta, new_keys__9016, new_strobj__9017, this__9014.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9022 = this;
  var h__2190__auto____9023 = this__9022.__hash;
  if(!(h__2190__auto____9023 == null)) {
    return h__2190__auto____9023
  }else {
    var h__2190__auto____9024 = cljs.core.hash_imap.call(null, coll);
    this__9022.__hash = h__2190__auto____9024;
    return h__2190__auto____9024
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9025 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9026 = this;
  var bucket__9027 = this__9026.hashobj[cljs.core.hash.call(null, k)];
  var i__9028 = cljs.core.truth_(bucket__9027) ? cljs.core.scan_array.call(null, 2, k, bucket__9027) : null;
  if(cljs.core.truth_(i__9028)) {
    return bucket__9027[i__9028 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9029 = this;
  var h__9030 = cljs.core.hash.call(null, k);
  var bucket__9031 = this__9029.hashobj[h__9030];
  if(cljs.core.truth_(bucket__9031)) {
    var new_bucket__9032 = bucket__9031.slice();
    var new_hashobj__9033 = goog.object.clone(this__9029.hashobj);
    new_hashobj__9033[h__9030] = new_bucket__9032;
    var temp__3971__auto____9034 = cljs.core.scan_array.call(null, 2, k, new_bucket__9032);
    if(cljs.core.truth_(temp__3971__auto____9034)) {
      var i__9035 = temp__3971__auto____9034;
      new_bucket__9032[i__9035 + 1] = v;
      return new cljs.core.HashMap(this__9029.meta, this__9029.count, new_hashobj__9033, null)
    }else {
      new_bucket__9032.push(k, v);
      return new cljs.core.HashMap(this__9029.meta, this__9029.count + 1, new_hashobj__9033, null)
    }
  }else {
    var new_hashobj__9036 = goog.object.clone(this__9029.hashobj);
    new_hashobj__9036[h__9030] = [k, v];
    return new cljs.core.HashMap(this__9029.meta, this__9029.count + 1, new_hashobj__9036, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9037 = this;
  var bucket__9038 = this__9037.hashobj[cljs.core.hash.call(null, k)];
  var i__9039 = cljs.core.truth_(bucket__9038) ? cljs.core.scan_array.call(null, 2, k, bucket__9038) : null;
  if(cljs.core.truth_(i__9039)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9064 = null;
  var G__9064__2 = function(this_sym9040, k) {
    var this__9042 = this;
    var this_sym9040__9043 = this;
    var coll__9044 = this_sym9040__9043;
    return coll__9044.cljs$core$ILookup$_lookup$arity$2(coll__9044, k)
  };
  var G__9064__3 = function(this_sym9041, k, not_found) {
    var this__9042 = this;
    var this_sym9041__9045 = this;
    var coll__9046 = this_sym9041__9045;
    return coll__9046.cljs$core$ILookup$_lookup$arity$3(coll__9046, k, not_found)
  };
  G__9064 = function(this_sym9041, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9064__2.call(this, this_sym9041, k);
      case 3:
        return G__9064__3.call(this, this_sym9041, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9064
}();
cljs.core.HashMap.prototype.apply = function(this_sym9020, args9021) {
  var this__9047 = this;
  return this_sym9020.call.apply(this_sym9020, [this_sym9020].concat(args9021.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9048 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9049 = this;
  var this__9050 = this;
  return cljs.core.pr_str.call(null, this__9050)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9051 = this;
  if(this__9051.count > 0) {
    var hashes__9052 = cljs.core.js_keys.call(null, this__9051.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9019_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9051.hashobj[p1__9019_SHARP_]))
    }, hashes__9052)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9053 = this;
  return this__9053.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9054 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9055 = this;
  return new cljs.core.HashMap(meta, this__9055.count, this__9055.hashobj, this__9055.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9056 = this;
  return this__9056.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9057 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9057.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9058 = this;
  var h__9059 = cljs.core.hash.call(null, k);
  var bucket__9060 = this__9058.hashobj[h__9059];
  var i__9061 = cljs.core.truth_(bucket__9060) ? cljs.core.scan_array.call(null, 2, k, bucket__9060) : null;
  if(cljs.core.not.call(null, i__9061)) {
    return coll
  }else {
    var new_hashobj__9062 = goog.object.clone(this__9058.hashobj);
    if(3 > bucket__9060.length) {
      cljs.core.js_delete.call(null, new_hashobj__9062, h__9059)
    }else {
      var new_bucket__9063 = bucket__9060.slice();
      new_bucket__9063.splice(i__9061, 2);
      new_hashobj__9062[h__9059] = new_bucket__9063
    }
    return new cljs.core.HashMap(this__9058.meta, this__9058.count - 1, new_hashobj__9062, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9065 = ks.length;
  var i__9066 = 0;
  var out__9067 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9066 < len__9065) {
      var G__9068 = i__9066 + 1;
      var G__9069 = cljs.core.assoc.call(null, out__9067, ks[i__9066], vs[i__9066]);
      i__9066 = G__9068;
      out__9067 = G__9069;
      continue
    }else {
      return out__9067
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9073 = m.arr;
  var len__9074 = arr__9073.length;
  var i__9075 = 0;
  while(true) {
    if(len__9074 <= i__9075) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9073[i__9075], k)) {
        return i__9075
      }else {
        if("\ufdd0'else") {
          var G__9076 = i__9075 + 2;
          i__9075 = G__9076;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9079 = this;
  return new cljs.core.TransientArrayMap({}, this__9079.arr.length, this__9079.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9080 = this;
  var h__2190__auto____9081 = this__9080.__hash;
  if(!(h__2190__auto____9081 == null)) {
    return h__2190__auto____9081
  }else {
    var h__2190__auto____9082 = cljs.core.hash_imap.call(null, coll);
    this__9080.__hash = h__2190__auto____9082;
    return h__2190__auto____9082
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9083 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9084 = this;
  var idx__9085 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9085 === -1) {
    return not_found
  }else {
    return this__9084.arr[idx__9085 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9086 = this;
  var idx__9087 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9087 === -1) {
    if(this__9086.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9086.meta, this__9086.cnt + 1, function() {
        var G__9088__9089 = this__9086.arr.slice();
        G__9088__9089.push(k);
        G__9088__9089.push(v);
        return G__9088__9089
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9086.arr[idx__9087 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9086.meta, this__9086.cnt, function() {
          var G__9090__9091 = this__9086.arr.slice();
          G__9090__9091[idx__9087 + 1] = v;
          return G__9090__9091
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9092 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9124 = null;
  var G__9124__2 = function(this_sym9093, k) {
    var this__9095 = this;
    var this_sym9093__9096 = this;
    var coll__9097 = this_sym9093__9096;
    return coll__9097.cljs$core$ILookup$_lookup$arity$2(coll__9097, k)
  };
  var G__9124__3 = function(this_sym9094, k, not_found) {
    var this__9095 = this;
    var this_sym9094__9098 = this;
    var coll__9099 = this_sym9094__9098;
    return coll__9099.cljs$core$ILookup$_lookup$arity$3(coll__9099, k, not_found)
  };
  G__9124 = function(this_sym9094, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9124__2.call(this, this_sym9094, k);
      case 3:
        return G__9124__3.call(this, this_sym9094, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9124
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9077, args9078) {
  var this__9100 = this;
  return this_sym9077.call.apply(this_sym9077, [this_sym9077].concat(args9078.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9101 = this;
  var len__9102 = this__9101.arr.length;
  var i__9103 = 0;
  var init__9104 = init;
  while(true) {
    if(i__9103 < len__9102) {
      var init__9105 = f.call(null, init__9104, this__9101.arr[i__9103], this__9101.arr[i__9103 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9105)) {
        return cljs.core.deref.call(null, init__9105)
      }else {
        var G__9125 = i__9103 + 2;
        var G__9126 = init__9105;
        i__9103 = G__9125;
        init__9104 = G__9126;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9106 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9107 = this;
  var this__9108 = this;
  return cljs.core.pr_str.call(null, this__9108)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9109 = this;
  if(this__9109.cnt > 0) {
    var len__9110 = this__9109.arr.length;
    var array_map_seq__9111 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9110) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9109.arr[i], this__9109.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9111.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9112 = this;
  return this__9112.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9113 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9114 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9114.cnt, this__9114.arr, this__9114.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9115 = this;
  return this__9115.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9116 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9116.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9117 = this;
  var idx__9118 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9118 >= 0) {
    var len__9119 = this__9117.arr.length;
    var new_len__9120 = len__9119 - 2;
    if(new_len__9120 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9121 = cljs.core.make_array.call(null, new_len__9120);
      var s__9122 = 0;
      var d__9123 = 0;
      while(true) {
        if(s__9122 >= len__9119) {
          return new cljs.core.PersistentArrayMap(this__9117.meta, this__9117.cnt - 1, new_arr__9121, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9117.arr[s__9122])) {
            var G__9127 = s__9122 + 2;
            var G__9128 = d__9123;
            s__9122 = G__9127;
            d__9123 = G__9128;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9121[d__9123] = this__9117.arr[s__9122];
              new_arr__9121[d__9123 + 1] = this__9117.arr[s__9122 + 1];
              var G__9129 = s__9122 + 2;
              var G__9130 = d__9123 + 2;
              s__9122 = G__9129;
              d__9123 = G__9130;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__9131 = cljs.core.count.call(null, ks);
  var i__9132 = 0;
  var out__9133 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9132 < len__9131) {
      var G__9134 = i__9132 + 1;
      var G__9135 = cljs.core.assoc_BANG_.call(null, out__9133, ks[i__9132], vs[i__9132]);
      i__9132 = G__9134;
      out__9133 = G__9135;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9133)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9136 = this;
  if(cljs.core.truth_(this__9136.editable_QMARK_)) {
    var idx__9137 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9137 >= 0) {
      this__9136.arr[idx__9137] = this__9136.arr[this__9136.len - 2];
      this__9136.arr[idx__9137 + 1] = this__9136.arr[this__9136.len - 1];
      var G__9138__9139 = this__9136.arr;
      G__9138__9139.pop();
      G__9138__9139.pop();
      G__9138__9139;
      this__9136.len = this__9136.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9140 = this;
  if(cljs.core.truth_(this__9140.editable_QMARK_)) {
    var idx__9141 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9141 === -1) {
      if(this__9140.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9140.len = this__9140.len + 2;
        this__9140.arr.push(key);
        this__9140.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9140.len, this__9140.arr), key, val)
      }
    }else {
      if(val === this__9140.arr[idx__9141 + 1]) {
        return tcoll
      }else {
        this__9140.arr[idx__9141 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9142 = this;
  if(cljs.core.truth_(this__9142.editable_QMARK_)) {
    if(function() {
      var G__9143__9144 = o;
      if(G__9143__9144) {
        if(function() {
          var or__3824__auto____9145 = G__9143__9144.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9145) {
            return or__3824__auto____9145
          }else {
            return G__9143__9144.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9143__9144.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9143__9144)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9143__9144)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9146 = cljs.core.seq.call(null, o);
      var tcoll__9147 = tcoll;
      while(true) {
        var temp__3971__auto____9148 = cljs.core.first.call(null, es__9146);
        if(cljs.core.truth_(temp__3971__auto____9148)) {
          var e__9149 = temp__3971__auto____9148;
          var G__9155 = cljs.core.next.call(null, es__9146);
          var G__9156 = tcoll__9147.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9147, cljs.core.key.call(null, e__9149), cljs.core.val.call(null, e__9149));
          es__9146 = G__9155;
          tcoll__9147 = G__9156;
          continue
        }else {
          return tcoll__9147
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9150 = this;
  if(cljs.core.truth_(this__9150.editable_QMARK_)) {
    this__9150.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9150.len, 2), this__9150.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9151 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9152 = this;
  if(cljs.core.truth_(this__9152.editable_QMARK_)) {
    var idx__9153 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9153 === -1) {
      return not_found
    }else {
      return this__9152.arr[idx__9153 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9154 = this;
  if(cljs.core.truth_(this__9154.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9154.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9159 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9160 = 0;
  while(true) {
    if(i__9160 < len) {
      var G__9161 = cljs.core.assoc_BANG_.call(null, out__9159, arr[i__9160], arr[i__9160 + 1]);
      var G__9162 = i__9160 + 2;
      out__9159 = G__9161;
      i__9160 = G__9162;
      continue
    }else {
      return out__9159
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2308__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__9167__9168 = arr.slice();
    G__9167__9168[i] = a;
    return G__9167__9168
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9169__9170 = arr.slice();
    G__9169__9170[i] = a;
    G__9169__9170[j] = b;
    return G__9169__9170
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__9172 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9172, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9172, 2 * i, new_arr__9172.length - 2 * i);
  return new_arr__9172
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__9175 = inode.ensure_editable(edit);
    editable__9175.arr[i] = a;
    return editable__9175
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9176 = inode.ensure_editable(edit);
    editable__9176.arr[i] = a;
    editable__9176.arr[j] = b;
    return editable__9176
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__9183 = arr.length;
  var i__9184 = 0;
  var init__9185 = init;
  while(true) {
    if(i__9184 < len__9183) {
      var init__9188 = function() {
        var k__9186 = arr[i__9184];
        if(!(k__9186 == null)) {
          return f.call(null, init__9185, k__9186, arr[i__9184 + 1])
        }else {
          var node__9187 = arr[i__9184 + 1];
          if(!(node__9187 == null)) {
            return node__9187.kv_reduce(f, init__9185)
          }else {
            return init__9185
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9188)) {
        return cljs.core.deref.call(null, init__9188)
      }else {
        var G__9189 = i__9184 + 2;
        var G__9190 = init__9188;
        i__9184 = G__9189;
        init__9185 = G__9190;
        continue
      }
    }else {
      return init__9185
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__9191 = this;
  var inode__9192 = this;
  if(this__9191.bitmap === bit) {
    return null
  }else {
    var editable__9193 = inode__9192.ensure_editable(e);
    var earr__9194 = editable__9193.arr;
    var len__9195 = earr__9194.length;
    editable__9193.bitmap = bit ^ editable__9193.bitmap;
    cljs.core.array_copy.call(null, earr__9194, 2 * (i + 1), earr__9194, 2 * i, len__9195 - 2 * (i + 1));
    earr__9194[len__9195 - 2] = null;
    earr__9194[len__9195 - 1] = null;
    return editable__9193
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9196 = this;
  var inode__9197 = this;
  var bit__9198 = 1 << (hash >>> shift & 31);
  var idx__9199 = cljs.core.bitmap_indexed_node_index.call(null, this__9196.bitmap, bit__9198);
  if((this__9196.bitmap & bit__9198) === 0) {
    var n__9200 = cljs.core.bit_count.call(null, this__9196.bitmap);
    if(2 * n__9200 < this__9196.arr.length) {
      var editable__9201 = inode__9197.ensure_editable(edit);
      var earr__9202 = editable__9201.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9202, 2 * idx__9199, earr__9202, 2 * (idx__9199 + 1), 2 * (n__9200 - idx__9199));
      earr__9202[2 * idx__9199] = key;
      earr__9202[2 * idx__9199 + 1] = val;
      editable__9201.bitmap = editable__9201.bitmap | bit__9198;
      return editable__9201
    }else {
      if(n__9200 >= 16) {
        var nodes__9203 = cljs.core.make_array.call(null, 32);
        var jdx__9204 = hash >>> shift & 31;
        nodes__9203[jdx__9204] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9205 = 0;
        var j__9206 = 0;
        while(true) {
          if(i__9205 < 32) {
            if((this__9196.bitmap >>> i__9205 & 1) === 0) {
              var G__9259 = i__9205 + 1;
              var G__9260 = j__9206;
              i__9205 = G__9259;
              j__9206 = G__9260;
              continue
            }else {
              nodes__9203[i__9205] = !(this__9196.arr[j__9206] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9196.arr[j__9206]), this__9196.arr[j__9206], this__9196.arr[j__9206 + 1], added_leaf_QMARK_) : this__9196.arr[j__9206 + 1];
              var G__9261 = i__9205 + 1;
              var G__9262 = j__9206 + 2;
              i__9205 = G__9261;
              j__9206 = G__9262;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9200 + 1, nodes__9203)
      }else {
        if("\ufdd0'else") {
          var new_arr__9207 = cljs.core.make_array.call(null, 2 * (n__9200 + 4));
          cljs.core.array_copy.call(null, this__9196.arr, 0, new_arr__9207, 0, 2 * idx__9199);
          new_arr__9207[2 * idx__9199] = key;
          new_arr__9207[2 * idx__9199 + 1] = val;
          cljs.core.array_copy.call(null, this__9196.arr, 2 * idx__9199, new_arr__9207, 2 * (idx__9199 + 1), 2 * (n__9200 - idx__9199));
          added_leaf_QMARK_.val = true;
          var editable__9208 = inode__9197.ensure_editable(edit);
          editable__9208.arr = new_arr__9207;
          editable__9208.bitmap = editable__9208.bitmap | bit__9198;
          return editable__9208
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9209 = this__9196.arr[2 * idx__9199];
    var val_or_node__9210 = this__9196.arr[2 * idx__9199 + 1];
    if(key_or_nil__9209 == null) {
      var n__9211 = val_or_node__9210.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9211 === val_or_node__9210) {
        return inode__9197
      }else {
        return cljs.core.edit_and_set.call(null, inode__9197, edit, 2 * idx__9199 + 1, n__9211)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9209)) {
        if(val === val_or_node__9210) {
          return inode__9197
        }else {
          return cljs.core.edit_and_set.call(null, inode__9197, edit, 2 * idx__9199 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9197, edit, 2 * idx__9199, null, 2 * idx__9199 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9209, val_or_node__9210, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9212 = this;
  var inode__9213 = this;
  return cljs.core.create_inode_seq.call(null, this__9212.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9214 = this;
  var inode__9215 = this;
  var bit__9216 = 1 << (hash >>> shift & 31);
  if((this__9214.bitmap & bit__9216) === 0) {
    return inode__9215
  }else {
    var idx__9217 = cljs.core.bitmap_indexed_node_index.call(null, this__9214.bitmap, bit__9216);
    var key_or_nil__9218 = this__9214.arr[2 * idx__9217];
    var val_or_node__9219 = this__9214.arr[2 * idx__9217 + 1];
    if(key_or_nil__9218 == null) {
      var n__9220 = val_or_node__9219.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9220 === val_or_node__9219) {
        return inode__9215
      }else {
        if(!(n__9220 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9215, edit, 2 * idx__9217 + 1, n__9220)
        }else {
          if(this__9214.bitmap === bit__9216) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9215.edit_and_remove_pair(edit, bit__9216, idx__9217)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9218)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9215.edit_and_remove_pair(edit, bit__9216, idx__9217)
      }else {
        if("\ufdd0'else") {
          return inode__9215
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9221 = this;
  var inode__9222 = this;
  if(e === this__9221.edit) {
    return inode__9222
  }else {
    var n__9223 = cljs.core.bit_count.call(null, this__9221.bitmap);
    var new_arr__9224 = cljs.core.make_array.call(null, n__9223 < 0 ? 4 : 2 * (n__9223 + 1));
    cljs.core.array_copy.call(null, this__9221.arr, 0, new_arr__9224, 0, 2 * n__9223);
    return new cljs.core.BitmapIndexedNode(e, this__9221.bitmap, new_arr__9224)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9225 = this;
  var inode__9226 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9225.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9227 = this;
  var inode__9228 = this;
  var bit__9229 = 1 << (hash >>> shift & 31);
  if((this__9227.bitmap & bit__9229) === 0) {
    return not_found
  }else {
    var idx__9230 = cljs.core.bitmap_indexed_node_index.call(null, this__9227.bitmap, bit__9229);
    var key_or_nil__9231 = this__9227.arr[2 * idx__9230];
    var val_or_node__9232 = this__9227.arr[2 * idx__9230 + 1];
    if(key_or_nil__9231 == null) {
      return val_or_node__9232.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9231)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9231, val_or_node__9232], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__9233 = this;
  var inode__9234 = this;
  var bit__9235 = 1 << (hash >>> shift & 31);
  if((this__9233.bitmap & bit__9235) === 0) {
    return inode__9234
  }else {
    var idx__9236 = cljs.core.bitmap_indexed_node_index.call(null, this__9233.bitmap, bit__9235);
    var key_or_nil__9237 = this__9233.arr[2 * idx__9236];
    var val_or_node__9238 = this__9233.arr[2 * idx__9236 + 1];
    if(key_or_nil__9237 == null) {
      var n__9239 = val_or_node__9238.inode_without(shift + 5, hash, key);
      if(n__9239 === val_or_node__9238) {
        return inode__9234
      }else {
        if(!(n__9239 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9233.bitmap, cljs.core.clone_and_set.call(null, this__9233.arr, 2 * idx__9236 + 1, n__9239))
        }else {
          if(this__9233.bitmap === bit__9235) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9233.bitmap ^ bit__9235, cljs.core.remove_pair.call(null, this__9233.arr, idx__9236))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9237)) {
        return new cljs.core.BitmapIndexedNode(null, this__9233.bitmap ^ bit__9235, cljs.core.remove_pair.call(null, this__9233.arr, idx__9236))
      }else {
        if("\ufdd0'else") {
          return inode__9234
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9240 = this;
  var inode__9241 = this;
  var bit__9242 = 1 << (hash >>> shift & 31);
  var idx__9243 = cljs.core.bitmap_indexed_node_index.call(null, this__9240.bitmap, bit__9242);
  if((this__9240.bitmap & bit__9242) === 0) {
    var n__9244 = cljs.core.bit_count.call(null, this__9240.bitmap);
    if(n__9244 >= 16) {
      var nodes__9245 = cljs.core.make_array.call(null, 32);
      var jdx__9246 = hash >>> shift & 31;
      nodes__9245[jdx__9246] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9247 = 0;
      var j__9248 = 0;
      while(true) {
        if(i__9247 < 32) {
          if((this__9240.bitmap >>> i__9247 & 1) === 0) {
            var G__9263 = i__9247 + 1;
            var G__9264 = j__9248;
            i__9247 = G__9263;
            j__9248 = G__9264;
            continue
          }else {
            nodes__9245[i__9247] = !(this__9240.arr[j__9248] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9240.arr[j__9248]), this__9240.arr[j__9248], this__9240.arr[j__9248 + 1], added_leaf_QMARK_) : this__9240.arr[j__9248 + 1];
            var G__9265 = i__9247 + 1;
            var G__9266 = j__9248 + 2;
            i__9247 = G__9265;
            j__9248 = G__9266;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9244 + 1, nodes__9245)
    }else {
      var new_arr__9249 = cljs.core.make_array.call(null, 2 * (n__9244 + 1));
      cljs.core.array_copy.call(null, this__9240.arr, 0, new_arr__9249, 0, 2 * idx__9243);
      new_arr__9249[2 * idx__9243] = key;
      new_arr__9249[2 * idx__9243 + 1] = val;
      cljs.core.array_copy.call(null, this__9240.arr, 2 * idx__9243, new_arr__9249, 2 * (idx__9243 + 1), 2 * (n__9244 - idx__9243));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9240.bitmap | bit__9242, new_arr__9249)
    }
  }else {
    var key_or_nil__9250 = this__9240.arr[2 * idx__9243];
    var val_or_node__9251 = this__9240.arr[2 * idx__9243 + 1];
    if(key_or_nil__9250 == null) {
      var n__9252 = val_or_node__9251.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9252 === val_or_node__9251) {
        return inode__9241
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9240.bitmap, cljs.core.clone_and_set.call(null, this__9240.arr, 2 * idx__9243 + 1, n__9252))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9250)) {
        if(val === val_or_node__9251) {
          return inode__9241
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9240.bitmap, cljs.core.clone_and_set.call(null, this__9240.arr, 2 * idx__9243 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9240.bitmap, cljs.core.clone_and_set.call(null, this__9240.arr, 2 * idx__9243, null, 2 * idx__9243 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9250, val_or_node__9251, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9253 = this;
  var inode__9254 = this;
  var bit__9255 = 1 << (hash >>> shift & 31);
  if((this__9253.bitmap & bit__9255) === 0) {
    return not_found
  }else {
    var idx__9256 = cljs.core.bitmap_indexed_node_index.call(null, this__9253.bitmap, bit__9255);
    var key_or_nil__9257 = this__9253.arr[2 * idx__9256];
    var val_or_node__9258 = this__9253.arr[2 * idx__9256 + 1];
    if(key_or_nil__9257 == null) {
      return val_or_node__9258.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9257)) {
        return val_or_node__9258
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__9274 = array_node.arr;
  var len__9275 = 2 * (array_node.cnt - 1);
  var new_arr__9276 = cljs.core.make_array.call(null, len__9275);
  var i__9277 = 0;
  var j__9278 = 1;
  var bitmap__9279 = 0;
  while(true) {
    if(i__9277 < len__9275) {
      if(function() {
        var and__3822__auto____9280 = !(i__9277 === idx);
        if(and__3822__auto____9280) {
          return!(arr__9274[i__9277] == null)
        }else {
          return and__3822__auto____9280
        }
      }()) {
        new_arr__9276[j__9278] = arr__9274[i__9277];
        var G__9281 = i__9277 + 1;
        var G__9282 = j__9278 + 2;
        var G__9283 = bitmap__9279 | 1 << i__9277;
        i__9277 = G__9281;
        j__9278 = G__9282;
        bitmap__9279 = G__9283;
        continue
      }else {
        var G__9284 = i__9277 + 1;
        var G__9285 = j__9278;
        var G__9286 = bitmap__9279;
        i__9277 = G__9284;
        j__9278 = G__9285;
        bitmap__9279 = G__9286;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9279, new_arr__9276)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9287 = this;
  var inode__9288 = this;
  var idx__9289 = hash >>> shift & 31;
  var node__9290 = this__9287.arr[idx__9289];
  if(node__9290 == null) {
    var editable__9291 = cljs.core.edit_and_set.call(null, inode__9288, edit, idx__9289, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9291.cnt = editable__9291.cnt + 1;
    return editable__9291
  }else {
    var n__9292 = node__9290.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9292 === node__9290) {
      return inode__9288
    }else {
      return cljs.core.edit_and_set.call(null, inode__9288, edit, idx__9289, n__9292)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9293 = this;
  var inode__9294 = this;
  return cljs.core.create_array_node_seq.call(null, this__9293.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9295 = this;
  var inode__9296 = this;
  var idx__9297 = hash >>> shift & 31;
  var node__9298 = this__9295.arr[idx__9297];
  if(node__9298 == null) {
    return inode__9296
  }else {
    var n__9299 = node__9298.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9299 === node__9298) {
      return inode__9296
    }else {
      if(n__9299 == null) {
        if(this__9295.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9296, edit, idx__9297)
        }else {
          var editable__9300 = cljs.core.edit_and_set.call(null, inode__9296, edit, idx__9297, n__9299);
          editable__9300.cnt = editable__9300.cnt - 1;
          return editable__9300
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9296, edit, idx__9297, n__9299)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9301 = this;
  var inode__9302 = this;
  if(e === this__9301.edit) {
    return inode__9302
  }else {
    return new cljs.core.ArrayNode(e, this__9301.cnt, this__9301.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9303 = this;
  var inode__9304 = this;
  var len__9305 = this__9303.arr.length;
  var i__9306 = 0;
  var init__9307 = init;
  while(true) {
    if(i__9306 < len__9305) {
      var node__9308 = this__9303.arr[i__9306];
      if(!(node__9308 == null)) {
        var init__9309 = node__9308.kv_reduce(f, init__9307);
        if(cljs.core.reduced_QMARK_.call(null, init__9309)) {
          return cljs.core.deref.call(null, init__9309)
        }else {
          var G__9328 = i__9306 + 1;
          var G__9329 = init__9309;
          i__9306 = G__9328;
          init__9307 = G__9329;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9307
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9310 = this;
  var inode__9311 = this;
  var idx__9312 = hash >>> shift & 31;
  var node__9313 = this__9310.arr[idx__9312];
  if(!(node__9313 == null)) {
    return node__9313.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9314 = this;
  var inode__9315 = this;
  var idx__9316 = hash >>> shift & 31;
  var node__9317 = this__9314.arr[idx__9316];
  if(!(node__9317 == null)) {
    var n__9318 = node__9317.inode_without(shift + 5, hash, key);
    if(n__9318 === node__9317) {
      return inode__9315
    }else {
      if(n__9318 == null) {
        if(this__9314.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9315, null, idx__9316)
        }else {
          return new cljs.core.ArrayNode(null, this__9314.cnt - 1, cljs.core.clone_and_set.call(null, this__9314.arr, idx__9316, n__9318))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9314.cnt, cljs.core.clone_and_set.call(null, this__9314.arr, idx__9316, n__9318))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9315
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9319 = this;
  var inode__9320 = this;
  var idx__9321 = hash >>> shift & 31;
  var node__9322 = this__9319.arr[idx__9321];
  if(node__9322 == null) {
    return new cljs.core.ArrayNode(null, this__9319.cnt + 1, cljs.core.clone_and_set.call(null, this__9319.arr, idx__9321, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9323 = node__9322.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9323 === node__9322) {
      return inode__9320
    }else {
      return new cljs.core.ArrayNode(null, this__9319.cnt, cljs.core.clone_and_set.call(null, this__9319.arr, idx__9321, n__9323))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9324 = this;
  var inode__9325 = this;
  var idx__9326 = hash >>> shift & 31;
  var node__9327 = this__9324.arr[idx__9326];
  if(!(node__9327 == null)) {
    return node__9327.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9332 = 2 * cnt;
  var i__9333 = 0;
  while(true) {
    if(i__9333 < lim__9332) {
      if(cljs.core.key_test.call(null, key, arr[i__9333])) {
        return i__9333
      }else {
        var G__9334 = i__9333 + 2;
        i__9333 = G__9334;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9335 = this;
  var inode__9336 = this;
  if(hash === this__9335.collision_hash) {
    var idx__9337 = cljs.core.hash_collision_node_find_index.call(null, this__9335.arr, this__9335.cnt, key);
    if(idx__9337 === -1) {
      if(this__9335.arr.length > 2 * this__9335.cnt) {
        var editable__9338 = cljs.core.edit_and_set.call(null, inode__9336, edit, 2 * this__9335.cnt, key, 2 * this__9335.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9338.cnt = editable__9338.cnt + 1;
        return editable__9338
      }else {
        var len__9339 = this__9335.arr.length;
        var new_arr__9340 = cljs.core.make_array.call(null, len__9339 + 2);
        cljs.core.array_copy.call(null, this__9335.arr, 0, new_arr__9340, 0, len__9339);
        new_arr__9340[len__9339] = key;
        new_arr__9340[len__9339 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9336.ensure_editable_array(edit, this__9335.cnt + 1, new_arr__9340)
      }
    }else {
      if(this__9335.arr[idx__9337 + 1] === val) {
        return inode__9336
      }else {
        return cljs.core.edit_and_set.call(null, inode__9336, edit, idx__9337 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9335.collision_hash >>> shift & 31), [null, inode__9336, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9341 = this;
  var inode__9342 = this;
  return cljs.core.create_inode_seq.call(null, this__9341.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9343 = this;
  var inode__9344 = this;
  var idx__9345 = cljs.core.hash_collision_node_find_index.call(null, this__9343.arr, this__9343.cnt, key);
  if(idx__9345 === -1) {
    return inode__9344
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9343.cnt === 1) {
      return null
    }else {
      var editable__9346 = inode__9344.ensure_editable(edit);
      var earr__9347 = editable__9346.arr;
      earr__9347[idx__9345] = earr__9347[2 * this__9343.cnt - 2];
      earr__9347[idx__9345 + 1] = earr__9347[2 * this__9343.cnt - 1];
      earr__9347[2 * this__9343.cnt - 1] = null;
      earr__9347[2 * this__9343.cnt - 2] = null;
      editable__9346.cnt = editable__9346.cnt - 1;
      return editable__9346
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9348 = this;
  var inode__9349 = this;
  if(e === this__9348.edit) {
    return inode__9349
  }else {
    var new_arr__9350 = cljs.core.make_array.call(null, 2 * (this__9348.cnt + 1));
    cljs.core.array_copy.call(null, this__9348.arr, 0, new_arr__9350, 0, 2 * this__9348.cnt);
    return new cljs.core.HashCollisionNode(e, this__9348.collision_hash, this__9348.cnt, new_arr__9350)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9351 = this;
  var inode__9352 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9351.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9353 = this;
  var inode__9354 = this;
  var idx__9355 = cljs.core.hash_collision_node_find_index.call(null, this__9353.arr, this__9353.cnt, key);
  if(idx__9355 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9353.arr[idx__9355])) {
      return cljs.core.PersistentVector.fromArray([this__9353.arr[idx__9355], this__9353.arr[idx__9355 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__9356 = this;
  var inode__9357 = this;
  var idx__9358 = cljs.core.hash_collision_node_find_index.call(null, this__9356.arr, this__9356.cnt, key);
  if(idx__9358 === -1) {
    return inode__9357
  }else {
    if(this__9356.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9356.collision_hash, this__9356.cnt - 1, cljs.core.remove_pair.call(null, this__9356.arr, cljs.core.quot.call(null, idx__9358, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9359 = this;
  var inode__9360 = this;
  if(hash === this__9359.collision_hash) {
    var idx__9361 = cljs.core.hash_collision_node_find_index.call(null, this__9359.arr, this__9359.cnt, key);
    if(idx__9361 === -1) {
      var len__9362 = this__9359.arr.length;
      var new_arr__9363 = cljs.core.make_array.call(null, len__9362 + 2);
      cljs.core.array_copy.call(null, this__9359.arr, 0, new_arr__9363, 0, len__9362);
      new_arr__9363[len__9362] = key;
      new_arr__9363[len__9362 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9359.collision_hash, this__9359.cnt + 1, new_arr__9363)
    }else {
      if(cljs.core._EQ_.call(null, this__9359.arr[idx__9361], val)) {
        return inode__9360
      }else {
        return new cljs.core.HashCollisionNode(null, this__9359.collision_hash, this__9359.cnt, cljs.core.clone_and_set.call(null, this__9359.arr, idx__9361 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9359.collision_hash >>> shift & 31), [null, inode__9360])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9364 = this;
  var inode__9365 = this;
  var idx__9366 = cljs.core.hash_collision_node_find_index.call(null, this__9364.arr, this__9364.cnt, key);
  if(idx__9366 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9364.arr[idx__9366])) {
      return this__9364.arr[idx__9366 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__9367 = this;
  var inode__9368 = this;
  if(e === this__9367.edit) {
    this__9367.arr = array;
    this__9367.cnt = count;
    return inode__9368
  }else {
    return new cljs.core.HashCollisionNode(this__9367.edit, this__9367.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9373 = cljs.core.hash.call(null, key1);
    if(key1hash__9373 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9373, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9374 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9373, key1, val1, added_leaf_QMARK___9374).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9374)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9375 = cljs.core.hash.call(null, key1);
    if(key1hash__9375 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9375, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9376 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9375, key1, val1, added_leaf_QMARK___9376).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9376)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9377 = this;
  var h__2190__auto____9378 = this__9377.__hash;
  if(!(h__2190__auto____9378 == null)) {
    return h__2190__auto____9378
  }else {
    var h__2190__auto____9379 = cljs.core.hash_coll.call(null, coll);
    this__9377.__hash = h__2190__auto____9379;
    return h__2190__auto____9379
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9380 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9381 = this;
  var this__9382 = this;
  return cljs.core.pr_str.call(null, this__9382)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9383 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9384 = this;
  if(this__9384.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9384.nodes[this__9384.i], this__9384.nodes[this__9384.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9384.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9385 = this;
  if(this__9385.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9385.nodes, this__9385.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9385.nodes, this__9385.i, cljs.core.next.call(null, this__9385.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9386 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9387 = this;
  return new cljs.core.NodeSeq(meta, this__9387.nodes, this__9387.i, this__9387.s, this__9387.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9388 = this;
  return this__9388.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9389 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9389.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9396 = nodes.length;
      var j__9397 = i;
      while(true) {
        if(j__9397 < len__9396) {
          if(!(nodes[j__9397] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9397, null, null)
          }else {
            var temp__3971__auto____9398 = nodes[j__9397 + 1];
            if(cljs.core.truth_(temp__3971__auto____9398)) {
              var node__9399 = temp__3971__auto____9398;
              var temp__3971__auto____9400 = node__9399.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9400)) {
                var node_seq__9401 = temp__3971__auto____9400;
                return new cljs.core.NodeSeq(null, nodes, j__9397 + 2, node_seq__9401, null)
              }else {
                var G__9402 = j__9397 + 2;
                j__9397 = G__9402;
                continue
              }
            }else {
              var G__9403 = j__9397 + 2;
              j__9397 = G__9403;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9404 = this;
  var h__2190__auto____9405 = this__9404.__hash;
  if(!(h__2190__auto____9405 == null)) {
    return h__2190__auto____9405
  }else {
    var h__2190__auto____9406 = cljs.core.hash_coll.call(null, coll);
    this__9404.__hash = h__2190__auto____9406;
    return h__2190__auto____9406
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9407 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9408 = this;
  var this__9409 = this;
  return cljs.core.pr_str.call(null, this__9409)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9410 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9411 = this;
  return cljs.core.first.call(null, this__9411.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9412 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9412.nodes, this__9412.i, cljs.core.next.call(null, this__9412.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9413 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9414 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9414.nodes, this__9414.i, this__9414.s, this__9414.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9415 = this;
  return this__9415.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9416 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9416.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9423 = nodes.length;
      var j__9424 = i;
      while(true) {
        if(j__9424 < len__9423) {
          var temp__3971__auto____9425 = nodes[j__9424];
          if(cljs.core.truth_(temp__3971__auto____9425)) {
            var nj__9426 = temp__3971__auto____9425;
            var temp__3971__auto____9427 = nj__9426.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9427)) {
              var ns__9428 = temp__3971__auto____9427;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9424 + 1, ns__9428, null)
            }else {
              var G__9429 = j__9424 + 1;
              j__9424 = G__9429;
              continue
            }
          }else {
            var G__9430 = j__9424 + 1;
            j__9424 = G__9430;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9433 = this;
  return new cljs.core.TransientHashMap({}, this__9433.root, this__9433.cnt, this__9433.has_nil_QMARK_, this__9433.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9434 = this;
  var h__2190__auto____9435 = this__9434.__hash;
  if(!(h__2190__auto____9435 == null)) {
    return h__2190__auto____9435
  }else {
    var h__2190__auto____9436 = cljs.core.hash_imap.call(null, coll);
    this__9434.__hash = h__2190__auto____9436;
    return h__2190__auto____9436
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9437 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9438 = this;
  if(k == null) {
    if(this__9438.has_nil_QMARK_) {
      return this__9438.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9438.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9438.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9439 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9440 = this__9439.has_nil_QMARK_;
      if(and__3822__auto____9440) {
        return v === this__9439.nil_val
      }else {
        return and__3822__auto____9440
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9439.meta, this__9439.has_nil_QMARK_ ? this__9439.cnt : this__9439.cnt + 1, this__9439.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9441 = new cljs.core.Box(false);
    var new_root__9442 = (this__9439.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9439.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9441);
    if(new_root__9442 === this__9439.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9439.meta, added_leaf_QMARK___9441.val ? this__9439.cnt + 1 : this__9439.cnt, new_root__9442, this__9439.has_nil_QMARK_, this__9439.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9443 = this;
  if(k == null) {
    return this__9443.has_nil_QMARK_
  }else {
    if(this__9443.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9443.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9466 = null;
  var G__9466__2 = function(this_sym9444, k) {
    var this__9446 = this;
    var this_sym9444__9447 = this;
    var coll__9448 = this_sym9444__9447;
    return coll__9448.cljs$core$ILookup$_lookup$arity$2(coll__9448, k)
  };
  var G__9466__3 = function(this_sym9445, k, not_found) {
    var this__9446 = this;
    var this_sym9445__9449 = this;
    var coll__9450 = this_sym9445__9449;
    return coll__9450.cljs$core$ILookup$_lookup$arity$3(coll__9450, k, not_found)
  };
  G__9466 = function(this_sym9445, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9466__2.call(this, this_sym9445, k);
      case 3:
        return G__9466__3.call(this, this_sym9445, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9466
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9431, args9432) {
  var this__9451 = this;
  return this_sym9431.call.apply(this_sym9431, [this_sym9431].concat(args9432.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9452 = this;
  var init__9453 = this__9452.has_nil_QMARK_ ? f.call(null, init, null, this__9452.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9453)) {
    return cljs.core.deref.call(null, init__9453)
  }else {
    if(!(this__9452.root == null)) {
      return this__9452.root.kv_reduce(f, init__9453)
    }else {
      if("\ufdd0'else") {
        return init__9453
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9454 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9455 = this;
  var this__9456 = this;
  return cljs.core.pr_str.call(null, this__9456)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9457 = this;
  if(this__9457.cnt > 0) {
    var s__9458 = !(this__9457.root == null) ? this__9457.root.inode_seq() : null;
    if(this__9457.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9457.nil_val], true), s__9458)
    }else {
      return s__9458
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9459 = this;
  return this__9459.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9460 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9461 = this;
  return new cljs.core.PersistentHashMap(meta, this__9461.cnt, this__9461.root, this__9461.has_nil_QMARK_, this__9461.nil_val, this__9461.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9462 = this;
  return this__9462.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9463 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9463.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9464 = this;
  if(k == null) {
    if(this__9464.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9464.meta, this__9464.cnt - 1, this__9464.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9464.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9465 = this__9464.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9465 === this__9464.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9464.meta, this__9464.cnt - 1, new_root__9465, this__9464.has_nil_QMARK_, this__9464.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9467 = ks.length;
  var i__9468 = 0;
  var out__9469 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9468 < len__9467) {
      var G__9470 = i__9468 + 1;
      var G__9471 = cljs.core.assoc_BANG_.call(null, out__9469, ks[i__9468], vs[i__9468]);
      i__9468 = G__9470;
      out__9469 = G__9471;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9469)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9472 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9473 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9474 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9475 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9476 = this;
  if(k == null) {
    if(this__9476.has_nil_QMARK_) {
      return this__9476.nil_val
    }else {
      return null
    }
  }else {
    if(this__9476.root == null) {
      return null
    }else {
      return this__9476.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9477 = this;
  if(k == null) {
    if(this__9477.has_nil_QMARK_) {
      return this__9477.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9477.root == null) {
      return not_found
    }else {
      return this__9477.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9478 = this;
  if(this__9478.edit) {
    return this__9478.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9479 = this;
  var tcoll__9480 = this;
  if(this__9479.edit) {
    if(function() {
      var G__9481__9482 = o;
      if(G__9481__9482) {
        if(function() {
          var or__3824__auto____9483 = G__9481__9482.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9483) {
            return or__3824__auto____9483
          }else {
            return G__9481__9482.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9481__9482.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9481__9482)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9481__9482)
      }
    }()) {
      return tcoll__9480.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9484 = cljs.core.seq.call(null, o);
      var tcoll__9485 = tcoll__9480;
      while(true) {
        var temp__3971__auto____9486 = cljs.core.first.call(null, es__9484);
        if(cljs.core.truth_(temp__3971__auto____9486)) {
          var e__9487 = temp__3971__auto____9486;
          var G__9498 = cljs.core.next.call(null, es__9484);
          var G__9499 = tcoll__9485.assoc_BANG_(cljs.core.key.call(null, e__9487), cljs.core.val.call(null, e__9487));
          es__9484 = G__9498;
          tcoll__9485 = G__9499;
          continue
        }else {
          return tcoll__9485
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9488 = this;
  var tcoll__9489 = this;
  if(this__9488.edit) {
    if(k == null) {
      if(this__9488.nil_val === v) {
      }else {
        this__9488.nil_val = v
      }
      if(this__9488.has_nil_QMARK_) {
      }else {
        this__9488.count = this__9488.count + 1;
        this__9488.has_nil_QMARK_ = true
      }
      return tcoll__9489
    }else {
      var added_leaf_QMARK___9490 = new cljs.core.Box(false);
      var node__9491 = (this__9488.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9488.root).inode_assoc_BANG_(this__9488.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9490);
      if(node__9491 === this__9488.root) {
      }else {
        this__9488.root = node__9491
      }
      if(added_leaf_QMARK___9490.val) {
        this__9488.count = this__9488.count + 1
      }else {
      }
      return tcoll__9489
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9492 = this;
  var tcoll__9493 = this;
  if(this__9492.edit) {
    if(k == null) {
      if(this__9492.has_nil_QMARK_) {
        this__9492.has_nil_QMARK_ = false;
        this__9492.nil_val = null;
        this__9492.count = this__9492.count - 1;
        return tcoll__9493
      }else {
        return tcoll__9493
      }
    }else {
      if(this__9492.root == null) {
        return tcoll__9493
      }else {
        var removed_leaf_QMARK___9494 = new cljs.core.Box(false);
        var node__9495 = this__9492.root.inode_without_BANG_(this__9492.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9494);
        if(node__9495 === this__9492.root) {
        }else {
          this__9492.root = node__9495
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9494[0])) {
          this__9492.count = this__9492.count - 1
        }else {
        }
        return tcoll__9493
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9496 = this;
  var tcoll__9497 = this;
  if(this__9496.edit) {
    this__9496.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9496.count, this__9496.root, this__9496.has_nil_QMARK_, this__9496.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9502 = node;
  var stack__9503 = stack;
  while(true) {
    if(!(t__9502 == null)) {
      var G__9504 = ascending_QMARK_ ? t__9502.left : t__9502.right;
      var G__9505 = cljs.core.conj.call(null, stack__9503, t__9502);
      t__9502 = G__9504;
      stack__9503 = G__9505;
      continue
    }else {
      return stack__9503
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9506 = this;
  var h__2190__auto____9507 = this__9506.__hash;
  if(!(h__2190__auto____9507 == null)) {
    return h__2190__auto____9507
  }else {
    var h__2190__auto____9508 = cljs.core.hash_coll.call(null, coll);
    this__9506.__hash = h__2190__auto____9508;
    return h__2190__auto____9508
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9509 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9510 = this;
  var this__9511 = this;
  return cljs.core.pr_str.call(null, this__9511)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9512 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9513 = this;
  if(this__9513.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9513.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9514 = this;
  return cljs.core.peek.call(null, this__9514.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9515 = this;
  var t__9516 = cljs.core.first.call(null, this__9515.stack);
  var next_stack__9517 = cljs.core.tree_map_seq_push.call(null, this__9515.ascending_QMARK_ ? t__9516.right : t__9516.left, cljs.core.next.call(null, this__9515.stack), this__9515.ascending_QMARK_);
  if(!(next_stack__9517 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9517, this__9515.ascending_QMARK_, this__9515.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9518 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9519 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9519.stack, this__9519.ascending_QMARK_, this__9519.cnt, this__9519.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9520 = this;
  return this__9520.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9522 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9522) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9522
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9524 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9524) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9524
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9528 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9528)) {
    return cljs.core.deref.call(null, init__9528)
  }else {
    var init__9529 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9528) : init__9528;
    if(cljs.core.reduced_QMARK_.call(null, init__9529)) {
      return cljs.core.deref.call(null, init__9529)
    }else {
      var init__9530 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9529) : init__9529;
      if(cljs.core.reduced_QMARK_.call(null, init__9530)) {
        return cljs.core.deref.call(null, init__9530)
      }else {
        return init__9530
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9533 = this;
  var h__2190__auto____9534 = this__9533.__hash;
  if(!(h__2190__auto____9534 == null)) {
    return h__2190__auto____9534
  }else {
    var h__2190__auto____9535 = cljs.core.hash_coll.call(null, coll);
    this__9533.__hash = h__2190__auto____9535;
    return h__2190__auto____9535
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9536 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9537 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9538 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9538.key, this__9538.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9586 = null;
  var G__9586__2 = function(this_sym9539, k) {
    var this__9541 = this;
    var this_sym9539__9542 = this;
    var node__9543 = this_sym9539__9542;
    return node__9543.cljs$core$ILookup$_lookup$arity$2(node__9543, k)
  };
  var G__9586__3 = function(this_sym9540, k, not_found) {
    var this__9541 = this;
    var this_sym9540__9544 = this;
    var node__9545 = this_sym9540__9544;
    return node__9545.cljs$core$ILookup$_lookup$arity$3(node__9545, k, not_found)
  };
  G__9586 = function(this_sym9540, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9586__2.call(this, this_sym9540, k);
      case 3:
        return G__9586__3.call(this, this_sym9540, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9586
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9531, args9532) {
  var this__9546 = this;
  return this_sym9531.call.apply(this_sym9531, [this_sym9531].concat(args9532.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9547 = this;
  return cljs.core.PersistentVector.fromArray([this__9547.key, this__9547.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9548 = this;
  return this__9548.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9549 = this;
  return this__9549.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9550 = this;
  var node__9551 = this;
  return ins.balance_right(node__9551)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9552 = this;
  var node__9553 = this;
  return new cljs.core.RedNode(this__9552.key, this__9552.val, this__9552.left, this__9552.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9554 = this;
  var node__9555 = this;
  return cljs.core.balance_right_del.call(null, this__9554.key, this__9554.val, this__9554.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9556 = this;
  var node__9557 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9558 = this;
  var node__9559 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9559, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9560 = this;
  var node__9561 = this;
  return cljs.core.balance_left_del.call(null, this__9560.key, this__9560.val, del, this__9560.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9562 = this;
  var node__9563 = this;
  return ins.balance_left(node__9563)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9564 = this;
  var node__9565 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9565, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9587 = null;
  var G__9587__0 = function() {
    var this__9566 = this;
    var this__9568 = this;
    return cljs.core.pr_str.call(null, this__9568)
  };
  G__9587 = function() {
    switch(arguments.length) {
      case 0:
        return G__9587__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9587
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9569 = this;
  var node__9570 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9570, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9571 = this;
  var node__9572 = this;
  return node__9572
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9573 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9574 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9575 = this;
  return cljs.core.list.call(null, this__9575.key, this__9575.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9576 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9577 = this;
  return this__9577.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9578 = this;
  return cljs.core.PersistentVector.fromArray([this__9578.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9579 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9579.key, this__9579.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9580 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9581 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9581.key, this__9581.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9582 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9583 = this;
  if(n === 0) {
    return this__9583.key
  }else {
    if(n === 1) {
      return this__9583.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9584 = this;
  if(n === 0) {
    return this__9584.key
  }else {
    if(n === 1) {
      return this__9584.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9585 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9590 = this;
  var h__2190__auto____9591 = this__9590.__hash;
  if(!(h__2190__auto____9591 == null)) {
    return h__2190__auto____9591
  }else {
    var h__2190__auto____9592 = cljs.core.hash_coll.call(null, coll);
    this__9590.__hash = h__2190__auto____9592;
    return h__2190__auto____9592
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9593 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9594 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9595 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9595.key, this__9595.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9643 = null;
  var G__9643__2 = function(this_sym9596, k) {
    var this__9598 = this;
    var this_sym9596__9599 = this;
    var node__9600 = this_sym9596__9599;
    return node__9600.cljs$core$ILookup$_lookup$arity$2(node__9600, k)
  };
  var G__9643__3 = function(this_sym9597, k, not_found) {
    var this__9598 = this;
    var this_sym9597__9601 = this;
    var node__9602 = this_sym9597__9601;
    return node__9602.cljs$core$ILookup$_lookup$arity$3(node__9602, k, not_found)
  };
  G__9643 = function(this_sym9597, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9643__2.call(this, this_sym9597, k);
      case 3:
        return G__9643__3.call(this, this_sym9597, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9643
}();
cljs.core.RedNode.prototype.apply = function(this_sym9588, args9589) {
  var this__9603 = this;
  return this_sym9588.call.apply(this_sym9588, [this_sym9588].concat(args9589.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9604 = this;
  return cljs.core.PersistentVector.fromArray([this__9604.key, this__9604.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9605 = this;
  return this__9605.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9606 = this;
  return this__9606.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9607 = this;
  var node__9608 = this;
  return new cljs.core.RedNode(this__9607.key, this__9607.val, this__9607.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9609 = this;
  var node__9610 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9611 = this;
  var node__9612 = this;
  return new cljs.core.RedNode(this__9611.key, this__9611.val, this__9611.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9613 = this;
  var node__9614 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9615 = this;
  var node__9616 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9616, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9617 = this;
  var node__9618 = this;
  return new cljs.core.RedNode(this__9617.key, this__9617.val, del, this__9617.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9619 = this;
  var node__9620 = this;
  return new cljs.core.RedNode(this__9619.key, this__9619.val, ins, this__9619.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9621 = this;
  var node__9622 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9621.left)) {
    return new cljs.core.RedNode(this__9621.key, this__9621.val, this__9621.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9621.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9621.right)) {
      return new cljs.core.RedNode(this__9621.right.key, this__9621.right.val, new cljs.core.BlackNode(this__9621.key, this__9621.val, this__9621.left, this__9621.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9621.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9622, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9644 = null;
  var G__9644__0 = function() {
    var this__9623 = this;
    var this__9625 = this;
    return cljs.core.pr_str.call(null, this__9625)
  };
  G__9644 = function() {
    switch(arguments.length) {
      case 0:
        return G__9644__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9644
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9626 = this;
  var node__9627 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9626.right)) {
    return new cljs.core.RedNode(this__9626.key, this__9626.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9626.left, null), this__9626.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9626.left)) {
      return new cljs.core.RedNode(this__9626.left.key, this__9626.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9626.left.left, null), new cljs.core.BlackNode(this__9626.key, this__9626.val, this__9626.left.right, this__9626.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9627, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9628 = this;
  var node__9629 = this;
  return new cljs.core.BlackNode(this__9628.key, this__9628.val, this__9628.left, this__9628.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9630 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9631 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9632 = this;
  return cljs.core.list.call(null, this__9632.key, this__9632.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9633 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9634 = this;
  return this__9634.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9635 = this;
  return cljs.core.PersistentVector.fromArray([this__9635.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9636 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9636.key, this__9636.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9637 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9638 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9638.key, this__9638.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9639 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9640 = this;
  if(n === 0) {
    return this__9640.key
  }else {
    if(n === 1) {
      return this__9640.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9641 = this;
  if(n === 0) {
    return this__9641.key
  }else {
    if(n === 1) {
      return this__9641.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9642 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9648 = comp.call(null, k, tree.key);
    if(c__9648 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9648 < 0) {
        var ins__9649 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9649 == null)) {
          return tree.add_left(ins__9649)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9650 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9650 == null)) {
            return tree.add_right(ins__9650)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9653 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9653)) {
            return new cljs.core.RedNode(app__9653.key, app__9653.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9653.left, null), new cljs.core.RedNode(right.key, right.val, app__9653.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9653, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9654 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9654)) {
              return new cljs.core.RedNode(app__9654.key, app__9654.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9654.left, null), new cljs.core.BlackNode(right.key, right.val, app__9654.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9654, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9660 = comp.call(null, k, tree.key);
    if(c__9660 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9660 < 0) {
        var del__9661 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9662 = !(del__9661 == null);
          if(or__3824__auto____9662) {
            return or__3824__auto____9662
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9661, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9661, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9663 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9664 = !(del__9663 == null);
            if(or__3824__auto____9664) {
              return or__3824__auto____9664
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9663)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9663, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9667 = tree.key;
  var c__9668 = comp.call(null, k, tk__9667);
  if(c__9668 === 0) {
    return tree.replace(tk__9667, v, tree.left, tree.right)
  }else {
    if(c__9668 < 0) {
      return tree.replace(tk__9667, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9667, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9671 = this;
  var h__2190__auto____9672 = this__9671.__hash;
  if(!(h__2190__auto____9672 == null)) {
    return h__2190__auto____9672
  }else {
    var h__2190__auto____9673 = cljs.core.hash_imap.call(null, coll);
    this__9671.__hash = h__2190__auto____9673;
    return h__2190__auto____9673
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9674 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9675 = this;
  var n__9676 = coll.entry_at(k);
  if(!(n__9676 == null)) {
    return n__9676.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9677 = this;
  var found__9678 = [null];
  var t__9679 = cljs.core.tree_map_add.call(null, this__9677.comp, this__9677.tree, k, v, found__9678);
  if(t__9679 == null) {
    var found_node__9680 = cljs.core.nth.call(null, found__9678, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9680.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9677.comp, cljs.core.tree_map_replace.call(null, this__9677.comp, this__9677.tree, k, v), this__9677.cnt, this__9677.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9677.comp, t__9679.blacken(), this__9677.cnt + 1, this__9677.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9681 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9715 = null;
  var G__9715__2 = function(this_sym9682, k) {
    var this__9684 = this;
    var this_sym9682__9685 = this;
    var coll__9686 = this_sym9682__9685;
    return coll__9686.cljs$core$ILookup$_lookup$arity$2(coll__9686, k)
  };
  var G__9715__3 = function(this_sym9683, k, not_found) {
    var this__9684 = this;
    var this_sym9683__9687 = this;
    var coll__9688 = this_sym9683__9687;
    return coll__9688.cljs$core$ILookup$_lookup$arity$3(coll__9688, k, not_found)
  };
  G__9715 = function(this_sym9683, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9715__2.call(this, this_sym9683, k);
      case 3:
        return G__9715__3.call(this, this_sym9683, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9715
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9669, args9670) {
  var this__9689 = this;
  return this_sym9669.call.apply(this_sym9669, [this_sym9669].concat(args9670.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9690 = this;
  if(!(this__9690.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9690.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9691 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9692 = this;
  if(this__9692.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9692.tree, false, this__9692.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9693 = this;
  var this__9694 = this;
  return cljs.core.pr_str.call(null, this__9694)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9695 = this;
  var coll__9696 = this;
  var t__9697 = this__9695.tree;
  while(true) {
    if(!(t__9697 == null)) {
      var c__9698 = this__9695.comp.call(null, k, t__9697.key);
      if(c__9698 === 0) {
        return t__9697
      }else {
        if(c__9698 < 0) {
          var G__9716 = t__9697.left;
          t__9697 = G__9716;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9717 = t__9697.right;
            t__9697 = G__9717;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9699 = this;
  if(this__9699.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9699.tree, ascending_QMARK_, this__9699.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9700 = this;
  if(this__9700.cnt > 0) {
    var stack__9701 = null;
    var t__9702 = this__9700.tree;
    while(true) {
      if(!(t__9702 == null)) {
        var c__9703 = this__9700.comp.call(null, k, t__9702.key);
        if(c__9703 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9701, t__9702), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9703 < 0) {
              var G__9718 = cljs.core.conj.call(null, stack__9701, t__9702);
              var G__9719 = t__9702.left;
              stack__9701 = G__9718;
              t__9702 = G__9719;
              continue
            }else {
              var G__9720 = stack__9701;
              var G__9721 = t__9702.right;
              stack__9701 = G__9720;
              t__9702 = G__9721;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9703 > 0) {
                var G__9722 = cljs.core.conj.call(null, stack__9701, t__9702);
                var G__9723 = t__9702.right;
                stack__9701 = G__9722;
                t__9702 = G__9723;
                continue
              }else {
                var G__9724 = stack__9701;
                var G__9725 = t__9702.left;
                stack__9701 = G__9724;
                t__9702 = G__9725;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9701 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9701, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9704 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9705 = this;
  return this__9705.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9706 = this;
  if(this__9706.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9706.tree, true, this__9706.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9707 = this;
  return this__9707.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9708 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9709 = this;
  return new cljs.core.PersistentTreeMap(this__9709.comp, this__9709.tree, this__9709.cnt, meta, this__9709.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9710 = this;
  return this__9710.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9711 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9711.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9712 = this;
  var found__9713 = [null];
  var t__9714 = cljs.core.tree_map_remove.call(null, this__9712.comp, this__9712.tree, k, found__9713);
  if(t__9714 == null) {
    if(cljs.core.nth.call(null, found__9713, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9712.comp, null, 0, this__9712.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9712.comp, t__9714.blacken(), this__9712.cnt - 1, this__9712.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9728 = cljs.core.seq.call(null, keyvals);
    var out__9729 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9728) {
        var G__9730 = cljs.core.nnext.call(null, in__9728);
        var G__9731 = cljs.core.assoc_BANG_.call(null, out__9729, cljs.core.first.call(null, in__9728), cljs.core.second.call(null, in__9728));
        in__9728 = G__9730;
        out__9729 = G__9731;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9729)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9732) {
    var keyvals = cljs.core.seq(arglist__9732);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9733) {
    var keyvals = cljs.core.seq(arglist__9733);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9737 = [];
    var obj__9738 = {};
    var kvs__9739 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9739) {
        ks__9737.push(cljs.core.first.call(null, kvs__9739));
        obj__9738[cljs.core.first.call(null, kvs__9739)] = cljs.core.second.call(null, kvs__9739);
        var G__9740 = cljs.core.nnext.call(null, kvs__9739);
        kvs__9739 = G__9740;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9737, obj__9738)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9741) {
    var keyvals = cljs.core.seq(arglist__9741);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9744 = cljs.core.seq.call(null, keyvals);
    var out__9745 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9744) {
        var G__9746 = cljs.core.nnext.call(null, in__9744);
        var G__9747 = cljs.core.assoc.call(null, out__9745, cljs.core.first.call(null, in__9744), cljs.core.second.call(null, in__9744));
        in__9744 = G__9746;
        out__9745 = G__9747;
        continue
      }else {
        return out__9745
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9748) {
    var keyvals = cljs.core.seq(arglist__9748);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9751 = cljs.core.seq.call(null, keyvals);
    var out__9752 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9751) {
        var G__9753 = cljs.core.nnext.call(null, in__9751);
        var G__9754 = cljs.core.assoc.call(null, out__9752, cljs.core.first.call(null, in__9751), cljs.core.second.call(null, in__9751));
        in__9751 = G__9753;
        out__9752 = G__9754;
        continue
      }else {
        return out__9752
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9755) {
    var comparator = cljs.core.first(arglist__9755);
    var keyvals = cljs.core.rest(arglist__9755);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9756_SHARP_, p2__9757_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9759 = p1__9756_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9759)) {
            return or__3824__auto____9759
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9757_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9760) {
    var maps = cljs.core.seq(arglist__9760);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9768 = function(m, e) {
        var k__9766 = cljs.core.first.call(null, e);
        var v__9767 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9766)) {
          return cljs.core.assoc.call(null, m, k__9766, f.call(null, cljs.core._lookup.call(null, m, k__9766, null), v__9767))
        }else {
          return cljs.core.assoc.call(null, m, k__9766, v__9767)
        }
      };
      var merge2__9770 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9768, function() {
          var or__3824__auto____9769 = m1;
          if(cljs.core.truth_(or__3824__auto____9769)) {
            return or__3824__auto____9769
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9770, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9771) {
    var f = cljs.core.first(arglist__9771);
    var maps = cljs.core.rest(arglist__9771);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9776 = cljs.core.ObjMap.EMPTY;
  var keys__9777 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9777) {
      var key__9778 = cljs.core.first.call(null, keys__9777);
      var entry__9779 = cljs.core._lookup.call(null, map, key__9778, "\ufdd0'user/not-found");
      var G__9780 = cljs.core.not_EQ_.call(null, entry__9779, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__9776, key__9778, entry__9779) : ret__9776;
      var G__9781 = cljs.core.next.call(null, keys__9777);
      ret__9776 = G__9780;
      keys__9777 = G__9781;
      continue
    }else {
      return ret__9776
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9785 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9785.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9786 = this;
  var h__2190__auto____9787 = this__9786.__hash;
  if(!(h__2190__auto____9787 == null)) {
    return h__2190__auto____9787
  }else {
    var h__2190__auto____9788 = cljs.core.hash_iset.call(null, coll);
    this__9786.__hash = h__2190__auto____9788;
    return h__2190__auto____9788
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9789 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9790 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9790.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9811 = null;
  var G__9811__2 = function(this_sym9791, k) {
    var this__9793 = this;
    var this_sym9791__9794 = this;
    var coll__9795 = this_sym9791__9794;
    return coll__9795.cljs$core$ILookup$_lookup$arity$2(coll__9795, k)
  };
  var G__9811__3 = function(this_sym9792, k, not_found) {
    var this__9793 = this;
    var this_sym9792__9796 = this;
    var coll__9797 = this_sym9792__9796;
    return coll__9797.cljs$core$ILookup$_lookup$arity$3(coll__9797, k, not_found)
  };
  G__9811 = function(this_sym9792, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9811__2.call(this, this_sym9792, k);
      case 3:
        return G__9811__3.call(this, this_sym9792, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9811
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9783, args9784) {
  var this__9798 = this;
  return this_sym9783.call.apply(this_sym9783, [this_sym9783].concat(args9784.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9799 = this;
  return new cljs.core.PersistentHashSet(this__9799.meta, cljs.core.assoc.call(null, this__9799.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9800 = this;
  var this__9801 = this;
  return cljs.core.pr_str.call(null, this__9801)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9802 = this;
  return cljs.core.keys.call(null, this__9802.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9803 = this;
  return new cljs.core.PersistentHashSet(this__9803.meta, cljs.core.dissoc.call(null, this__9803.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9804 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9805 = this;
  var and__3822__auto____9806 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9806) {
    var and__3822__auto____9807 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9807) {
      return cljs.core.every_QMARK_.call(null, function(p1__9782_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9782_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9807
    }
  }else {
    return and__3822__auto____9806
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9808 = this;
  return new cljs.core.PersistentHashSet(meta, this__9808.hash_map, this__9808.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9809 = this;
  return this__9809.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9810 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9810.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9812 = cljs.core.count.call(null, items);
  var i__9813 = 0;
  var out__9814 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9813 < len__9812) {
      var G__9815 = i__9813 + 1;
      var G__9816 = cljs.core.conj_BANG_.call(null, out__9814, items[i__9813]);
      i__9813 = G__9815;
      out__9814 = G__9816;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9814)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9834 = null;
  var G__9834__2 = function(this_sym9820, k) {
    var this__9822 = this;
    var this_sym9820__9823 = this;
    var tcoll__9824 = this_sym9820__9823;
    if(cljs.core._lookup.call(null, this__9822.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9834__3 = function(this_sym9821, k, not_found) {
    var this__9822 = this;
    var this_sym9821__9825 = this;
    var tcoll__9826 = this_sym9821__9825;
    if(cljs.core._lookup.call(null, this__9822.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9834 = function(this_sym9821, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9834__2.call(this, this_sym9821, k);
      case 3:
        return G__9834__3.call(this, this_sym9821, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9834
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9818, args9819) {
  var this__9827 = this;
  return this_sym9818.call.apply(this_sym9818, [this_sym9818].concat(args9819.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9828 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9829 = this;
  if(cljs.core._lookup.call(null, this__9829.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9830 = this;
  return cljs.core.count.call(null, this__9830.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9831 = this;
  this__9831.transient_map = cljs.core.dissoc_BANG_.call(null, this__9831.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9832 = this;
  this__9832.transient_map = cljs.core.assoc_BANG_.call(null, this__9832.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9833 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9833.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9837 = this;
  var h__2190__auto____9838 = this__9837.__hash;
  if(!(h__2190__auto____9838 == null)) {
    return h__2190__auto____9838
  }else {
    var h__2190__auto____9839 = cljs.core.hash_iset.call(null, coll);
    this__9837.__hash = h__2190__auto____9839;
    return h__2190__auto____9839
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9840 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9841 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9841.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9867 = null;
  var G__9867__2 = function(this_sym9842, k) {
    var this__9844 = this;
    var this_sym9842__9845 = this;
    var coll__9846 = this_sym9842__9845;
    return coll__9846.cljs$core$ILookup$_lookup$arity$2(coll__9846, k)
  };
  var G__9867__3 = function(this_sym9843, k, not_found) {
    var this__9844 = this;
    var this_sym9843__9847 = this;
    var coll__9848 = this_sym9843__9847;
    return coll__9848.cljs$core$ILookup$_lookup$arity$3(coll__9848, k, not_found)
  };
  G__9867 = function(this_sym9843, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9867__2.call(this, this_sym9843, k);
      case 3:
        return G__9867__3.call(this, this_sym9843, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9867
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9835, args9836) {
  var this__9849 = this;
  return this_sym9835.call.apply(this_sym9835, [this_sym9835].concat(args9836.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9850 = this;
  return new cljs.core.PersistentTreeSet(this__9850.meta, cljs.core.assoc.call(null, this__9850.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9851 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9851.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9852 = this;
  var this__9853 = this;
  return cljs.core.pr_str.call(null, this__9853)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9854 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9854.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9855 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9855.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9856 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9857 = this;
  return cljs.core._comparator.call(null, this__9857.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9858 = this;
  return cljs.core.keys.call(null, this__9858.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9859 = this;
  return new cljs.core.PersistentTreeSet(this__9859.meta, cljs.core.dissoc.call(null, this__9859.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9860 = this;
  return cljs.core.count.call(null, this__9860.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9861 = this;
  var and__3822__auto____9862 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9862) {
    var and__3822__auto____9863 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9863) {
      return cljs.core.every_QMARK_.call(null, function(p1__9817_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9817_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9863
    }
  }else {
    return and__3822__auto____9862
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9864 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9864.tree_map, this__9864.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9865 = this;
  return this__9865.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9866 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9866.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9872__delegate = function(keys) {
      var in__9870 = cljs.core.seq.call(null, keys);
      var out__9871 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9870)) {
          var G__9873 = cljs.core.next.call(null, in__9870);
          var G__9874 = cljs.core.conj_BANG_.call(null, out__9871, cljs.core.first.call(null, in__9870));
          in__9870 = G__9873;
          out__9871 = G__9874;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9871)
        }
        break
      }
    };
    var G__9872 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9872__delegate.call(this, keys)
    };
    G__9872.cljs$lang$maxFixedArity = 0;
    G__9872.cljs$lang$applyTo = function(arglist__9875) {
      var keys = cljs.core.seq(arglist__9875);
      return G__9872__delegate(keys)
    };
    G__9872.cljs$lang$arity$variadic = G__9872__delegate;
    return G__9872
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9876) {
    var keys = cljs.core.seq(arglist__9876);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9878) {
    var comparator = cljs.core.first(arglist__9878);
    var keys = cljs.core.rest(arglist__9878);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9884 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9885 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9885)) {
        var e__9886 = temp__3971__auto____9885;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9886))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9884, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9877_SHARP_) {
      var temp__3971__auto____9887 = cljs.core.find.call(null, smap, p1__9877_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9887)) {
        var e__9888 = temp__3971__auto____9887;
        return cljs.core.second.call(null, e__9888)
      }else {
        return p1__9877_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9918 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9911, seen) {
        while(true) {
          var vec__9912__9913 = p__9911;
          var f__9914 = cljs.core.nth.call(null, vec__9912__9913, 0, null);
          var xs__9915 = vec__9912__9913;
          var temp__3974__auto____9916 = cljs.core.seq.call(null, xs__9915);
          if(temp__3974__auto____9916) {
            var s__9917 = temp__3974__auto____9916;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9914)) {
              var G__9919 = cljs.core.rest.call(null, s__9917);
              var G__9920 = seen;
              p__9911 = G__9919;
              seen = G__9920;
              continue
            }else {
              return cljs.core.cons.call(null, f__9914, step.call(null, cljs.core.rest.call(null, s__9917), cljs.core.conj.call(null, seen, f__9914)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9918.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9923 = cljs.core.PersistentVector.EMPTY;
  var s__9924 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9924)) {
      var G__9925 = cljs.core.conj.call(null, ret__9923, cljs.core.first.call(null, s__9924));
      var G__9926 = cljs.core.next.call(null, s__9924);
      ret__9923 = G__9925;
      s__9924 = G__9926;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9923)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9929 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9929) {
        return or__3824__auto____9929
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9930 = x.lastIndexOf("/");
      if(i__9930 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9930 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9933 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9933) {
      return or__3824__auto____9933
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9934 = x.lastIndexOf("/");
    if(i__9934 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9934)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9941 = cljs.core.ObjMap.EMPTY;
  var ks__9942 = cljs.core.seq.call(null, keys);
  var vs__9943 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9944 = ks__9942;
      if(and__3822__auto____9944) {
        return vs__9943
      }else {
        return and__3822__auto____9944
      }
    }()) {
      var G__9945 = cljs.core.assoc.call(null, map__9941, cljs.core.first.call(null, ks__9942), cljs.core.first.call(null, vs__9943));
      var G__9946 = cljs.core.next.call(null, ks__9942);
      var G__9947 = cljs.core.next.call(null, vs__9943);
      map__9941 = G__9945;
      ks__9942 = G__9946;
      vs__9943 = G__9947;
      continue
    }else {
      return map__9941
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9950__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9935_SHARP_, p2__9936_SHARP_) {
        return max_key.call(null, k, p1__9935_SHARP_, p2__9936_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9950 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9950__delegate.call(this, k, x, y, more)
    };
    G__9950.cljs$lang$maxFixedArity = 3;
    G__9950.cljs$lang$applyTo = function(arglist__9951) {
      var k = cljs.core.first(arglist__9951);
      var x = cljs.core.first(cljs.core.next(arglist__9951));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9951)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9951)));
      return G__9950__delegate(k, x, y, more)
    };
    G__9950.cljs$lang$arity$variadic = G__9950__delegate;
    return G__9950
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9952__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9948_SHARP_, p2__9949_SHARP_) {
        return min_key.call(null, k, p1__9948_SHARP_, p2__9949_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9952 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9952__delegate.call(this, k, x, y, more)
    };
    G__9952.cljs$lang$maxFixedArity = 3;
    G__9952.cljs$lang$applyTo = function(arglist__9953) {
      var k = cljs.core.first(arglist__9953);
      var x = cljs.core.first(cljs.core.next(arglist__9953));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9953)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9953)));
      return G__9952__delegate(k, x, y, more)
    };
    G__9952.cljs$lang$arity$variadic = G__9952__delegate;
    return G__9952
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9956 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9956) {
        var s__9957 = temp__3974__auto____9956;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9957), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9957)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9960 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9960) {
      var s__9961 = temp__3974__auto____9960;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9961)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9961), take_while.call(null, pred, cljs.core.rest.call(null, s__9961)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9963 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9963.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9975 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9976 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9976)) {
        var vec__9977__9978 = temp__3974__auto____9976;
        var e__9979 = cljs.core.nth.call(null, vec__9977__9978, 0, null);
        var s__9980 = vec__9977__9978;
        if(cljs.core.truth_(include__9975.call(null, e__9979))) {
          return s__9980
        }else {
          return cljs.core.next.call(null, s__9980)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9975, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9981 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9981)) {
      var vec__9982__9983 = temp__3974__auto____9981;
      var e__9984 = cljs.core.nth.call(null, vec__9982__9983, 0, null);
      var s__9985 = vec__9982__9983;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9984)) ? s__9985 : cljs.core.next.call(null, s__9985))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9997 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9998 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9998)) {
        var vec__9999__10000 = temp__3974__auto____9998;
        var e__10001 = cljs.core.nth.call(null, vec__9999__10000, 0, null);
        var s__10002 = vec__9999__10000;
        if(cljs.core.truth_(include__9997.call(null, e__10001))) {
          return s__10002
        }else {
          return cljs.core.next.call(null, s__10002)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9997, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10003 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10003)) {
      var vec__10004__10005 = temp__3974__auto____10003;
      var e__10006 = cljs.core.nth.call(null, vec__10004__10005, 0, null);
      var s__10007 = vec__10004__10005;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10006)) ? s__10007 : cljs.core.next.call(null, s__10007))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__10008 = this;
  var h__2190__auto____10009 = this__10008.__hash;
  if(!(h__2190__auto____10009 == null)) {
    return h__2190__auto____10009
  }else {
    var h__2190__auto____10010 = cljs.core.hash_coll.call(null, rng);
    this__10008.__hash = h__2190__auto____10010;
    return h__2190__auto____10010
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10011 = this;
  if(this__10011.step > 0) {
    if(this__10011.start + this__10011.step < this__10011.end) {
      return new cljs.core.Range(this__10011.meta, this__10011.start + this__10011.step, this__10011.end, this__10011.step, null)
    }else {
      return null
    }
  }else {
    if(this__10011.start + this__10011.step > this__10011.end) {
      return new cljs.core.Range(this__10011.meta, this__10011.start + this__10011.step, this__10011.end, this__10011.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10012 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10013 = this;
  var this__10014 = this;
  return cljs.core.pr_str.call(null, this__10014)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10015 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10016 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10017 = this;
  if(this__10017.step > 0) {
    if(this__10017.start < this__10017.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10017.start > this__10017.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10018 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10018.end - this__10018.start) / this__10018.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10019 = this;
  return this__10019.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10020 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10020.meta, this__10020.start + this__10020.step, this__10020.end, this__10020.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10021 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10022 = this;
  return new cljs.core.Range(meta, this__10022.start, this__10022.end, this__10022.step, this__10022.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10023 = this;
  return this__10023.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10024 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10024.start + n * this__10024.step
  }else {
    if(function() {
      var and__3822__auto____10025 = this__10024.start > this__10024.end;
      if(and__3822__auto____10025) {
        return this__10024.step === 0
      }else {
        return and__3822__auto____10025
      }
    }()) {
      return this__10024.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10026 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10026.start + n * this__10026.step
  }else {
    if(function() {
      var and__3822__auto____10027 = this__10026.start > this__10026.end;
      if(and__3822__auto____10027) {
        return this__10026.step === 0
      }else {
        return and__3822__auto____10027
      }
    }()) {
      return this__10026.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10028 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10028.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10031 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10031) {
      var s__10032 = temp__3974__auto____10031;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10032), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10032)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10039 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10039) {
      var s__10040 = temp__3974__auto____10039;
      var fst__10041 = cljs.core.first.call(null, s__10040);
      var fv__10042 = f.call(null, fst__10041);
      var run__10043 = cljs.core.cons.call(null, fst__10041, cljs.core.take_while.call(null, function(p1__10033_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10042, f.call(null, p1__10033_SHARP_))
      }, cljs.core.next.call(null, s__10040)));
      return cljs.core.cons.call(null, run__10043, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10043), s__10040))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____10058 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10058) {
        var s__10059 = temp__3971__auto____10058;
        return reductions.call(null, f, cljs.core.first.call(null, s__10059), cljs.core.rest.call(null, s__10059))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10060 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10060) {
        var s__10061 = temp__3974__auto____10060;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10061)), cljs.core.rest.call(null, s__10061))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__10064 = null;
      var G__10064__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10064__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10064__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10064__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10064__4 = function() {
        var G__10065__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10065 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10065__delegate.call(this, x, y, z, args)
        };
        G__10065.cljs$lang$maxFixedArity = 3;
        G__10065.cljs$lang$applyTo = function(arglist__10066) {
          var x = cljs.core.first(arglist__10066);
          var y = cljs.core.first(cljs.core.next(arglist__10066));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10066)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10066)));
          return G__10065__delegate(x, y, z, args)
        };
        G__10065.cljs$lang$arity$variadic = G__10065__delegate;
        return G__10065
      }();
      G__10064 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10064__0.call(this);
          case 1:
            return G__10064__1.call(this, x);
          case 2:
            return G__10064__2.call(this, x, y);
          case 3:
            return G__10064__3.call(this, x, y, z);
          default:
            return G__10064__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10064.cljs$lang$maxFixedArity = 3;
      G__10064.cljs$lang$applyTo = G__10064__4.cljs$lang$applyTo;
      return G__10064
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10067 = null;
      var G__10067__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10067__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10067__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10067__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10067__4 = function() {
        var G__10068__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10068 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10068__delegate.call(this, x, y, z, args)
        };
        G__10068.cljs$lang$maxFixedArity = 3;
        G__10068.cljs$lang$applyTo = function(arglist__10069) {
          var x = cljs.core.first(arglist__10069);
          var y = cljs.core.first(cljs.core.next(arglist__10069));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10069)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10069)));
          return G__10068__delegate(x, y, z, args)
        };
        G__10068.cljs$lang$arity$variadic = G__10068__delegate;
        return G__10068
      }();
      G__10067 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10067__0.call(this);
          case 1:
            return G__10067__1.call(this, x);
          case 2:
            return G__10067__2.call(this, x, y);
          case 3:
            return G__10067__3.call(this, x, y, z);
          default:
            return G__10067__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10067.cljs$lang$maxFixedArity = 3;
      G__10067.cljs$lang$applyTo = G__10067__4.cljs$lang$applyTo;
      return G__10067
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10070 = null;
      var G__10070__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10070__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10070__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10070__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10070__4 = function() {
        var G__10071__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10071 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10071__delegate.call(this, x, y, z, args)
        };
        G__10071.cljs$lang$maxFixedArity = 3;
        G__10071.cljs$lang$applyTo = function(arglist__10072) {
          var x = cljs.core.first(arglist__10072);
          var y = cljs.core.first(cljs.core.next(arglist__10072));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10072)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10072)));
          return G__10071__delegate(x, y, z, args)
        };
        G__10071.cljs$lang$arity$variadic = G__10071__delegate;
        return G__10071
      }();
      G__10070 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10070__0.call(this);
          case 1:
            return G__10070__1.call(this, x);
          case 2:
            return G__10070__2.call(this, x, y);
          case 3:
            return G__10070__3.call(this, x, y, z);
          default:
            return G__10070__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10070.cljs$lang$maxFixedArity = 3;
      G__10070.cljs$lang$applyTo = G__10070__4.cljs$lang$applyTo;
      return G__10070
    }()
  };
  var juxt__4 = function() {
    var G__10073__delegate = function(f, g, h, fs) {
      var fs__10063 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10074 = null;
        var G__10074__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10044_SHARP_, p2__10045_SHARP_) {
            return cljs.core.conj.call(null, p1__10044_SHARP_, p2__10045_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10063)
        };
        var G__10074__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10046_SHARP_, p2__10047_SHARP_) {
            return cljs.core.conj.call(null, p1__10046_SHARP_, p2__10047_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10063)
        };
        var G__10074__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10048_SHARP_, p2__10049_SHARP_) {
            return cljs.core.conj.call(null, p1__10048_SHARP_, p2__10049_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10063)
        };
        var G__10074__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10050_SHARP_, p2__10051_SHARP_) {
            return cljs.core.conj.call(null, p1__10050_SHARP_, p2__10051_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10063)
        };
        var G__10074__4 = function() {
          var G__10075__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10052_SHARP_, p2__10053_SHARP_) {
              return cljs.core.conj.call(null, p1__10052_SHARP_, cljs.core.apply.call(null, p2__10053_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10063)
          };
          var G__10075 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10075__delegate.call(this, x, y, z, args)
          };
          G__10075.cljs$lang$maxFixedArity = 3;
          G__10075.cljs$lang$applyTo = function(arglist__10076) {
            var x = cljs.core.first(arglist__10076);
            var y = cljs.core.first(cljs.core.next(arglist__10076));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10076)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10076)));
            return G__10075__delegate(x, y, z, args)
          };
          G__10075.cljs$lang$arity$variadic = G__10075__delegate;
          return G__10075
        }();
        G__10074 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10074__0.call(this);
            case 1:
              return G__10074__1.call(this, x);
            case 2:
              return G__10074__2.call(this, x, y);
            case 3:
              return G__10074__3.call(this, x, y, z);
            default:
              return G__10074__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10074.cljs$lang$maxFixedArity = 3;
        G__10074.cljs$lang$applyTo = G__10074__4.cljs$lang$applyTo;
        return G__10074
      }()
    };
    var G__10073 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10073__delegate.call(this, f, g, h, fs)
    };
    G__10073.cljs$lang$maxFixedArity = 3;
    G__10073.cljs$lang$applyTo = function(arglist__10077) {
      var f = cljs.core.first(arglist__10077);
      var g = cljs.core.first(cljs.core.next(arglist__10077));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10077)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10077)));
      return G__10073__delegate(f, g, h, fs)
    };
    G__10073.cljs$lang$arity$variadic = G__10073__delegate;
    return G__10073
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__10080 = cljs.core.next.call(null, coll);
        coll = G__10080;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____10079 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10079) {
          return n > 0
        }else {
          return and__3822__auto____10079
        }
      }())) {
        var G__10081 = n - 1;
        var G__10082 = cljs.core.next.call(null, coll);
        n = G__10081;
        coll = G__10082;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10084 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10084), s)) {
    if(cljs.core.count.call(null, matches__10084) === 1) {
      return cljs.core.first.call(null, matches__10084)
    }else {
      return cljs.core.vec.call(null, matches__10084)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10086 = re.exec(s);
  if(matches__10086 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10086) === 1) {
      return cljs.core.first.call(null, matches__10086)
    }else {
      return cljs.core.vec.call(null, matches__10086)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10091 = cljs.core.re_find.call(null, re, s);
  var match_idx__10092 = s.search(re);
  var match_str__10093 = cljs.core.coll_QMARK_.call(null, match_data__10091) ? cljs.core.first.call(null, match_data__10091) : match_data__10091;
  var post_match__10094 = cljs.core.subs.call(null, s, match_idx__10092 + cljs.core.count.call(null, match_str__10093));
  if(cljs.core.truth_(match_data__10091)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10091, re_seq.call(null, re, post_match__10094))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10101__10102 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10103 = cljs.core.nth.call(null, vec__10101__10102, 0, null);
  var flags__10104 = cljs.core.nth.call(null, vec__10101__10102, 1, null);
  var pattern__10105 = cljs.core.nth.call(null, vec__10101__10102, 2, null);
  return new RegExp(pattern__10105, flags__10104)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10095_SHARP_) {
    return print_one.call(null, p1__10095_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____10115 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10115)) {
            var and__3822__auto____10119 = function() {
              var G__10116__10117 = obj;
              if(G__10116__10117) {
                if(function() {
                  var or__3824__auto____10118 = G__10116__10117.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10118) {
                    return or__3824__auto____10118
                  }else {
                    return G__10116__10117.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10116__10117.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10116__10117)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10116__10117)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10119)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10119
            }
          }else {
            return and__3822__auto____10115
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10120 = !(obj == null);
          if(and__3822__auto____10120) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10120
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10121__10122 = obj;
          if(G__10121__10122) {
            if(function() {
              var or__3824__auto____10123 = G__10121__10122.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10123) {
                return or__3824__auto____10123
              }else {
                return G__10121__10122.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10121__10122.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10121__10122)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10121__10122)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10143 = new goog.string.StringBuffer;
  var G__10144__10145 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10144__10145) {
    var string__10146 = cljs.core.first.call(null, G__10144__10145);
    var G__10144__10147 = G__10144__10145;
    while(true) {
      sb__10143.append(string__10146);
      var temp__3974__auto____10148 = cljs.core.next.call(null, G__10144__10147);
      if(temp__3974__auto____10148) {
        var G__10144__10149 = temp__3974__auto____10148;
        var G__10162 = cljs.core.first.call(null, G__10144__10149);
        var G__10163 = G__10144__10149;
        string__10146 = G__10162;
        G__10144__10147 = G__10163;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10150__10151 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10150__10151) {
    var obj__10152 = cljs.core.first.call(null, G__10150__10151);
    var G__10150__10153 = G__10150__10151;
    while(true) {
      sb__10143.append(" ");
      var G__10154__10155 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10152, opts));
      if(G__10154__10155) {
        var string__10156 = cljs.core.first.call(null, G__10154__10155);
        var G__10154__10157 = G__10154__10155;
        while(true) {
          sb__10143.append(string__10156);
          var temp__3974__auto____10158 = cljs.core.next.call(null, G__10154__10157);
          if(temp__3974__auto____10158) {
            var G__10154__10159 = temp__3974__auto____10158;
            var G__10164 = cljs.core.first.call(null, G__10154__10159);
            var G__10165 = G__10154__10159;
            string__10156 = G__10164;
            G__10154__10157 = G__10165;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10160 = cljs.core.next.call(null, G__10150__10153);
      if(temp__3974__auto____10160) {
        var G__10150__10161 = temp__3974__auto____10160;
        var G__10166 = cljs.core.first.call(null, G__10150__10161);
        var G__10167 = G__10150__10161;
        obj__10152 = G__10166;
        G__10150__10153 = G__10167;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10143
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10169 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10169.append("\n");
  return[cljs.core.str(sb__10169)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10188__10189 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10188__10189) {
    var string__10190 = cljs.core.first.call(null, G__10188__10189);
    var G__10188__10191 = G__10188__10189;
    while(true) {
      cljs.core.string_print.call(null, string__10190);
      var temp__3974__auto____10192 = cljs.core.next.call(null, G__10188__10191);
      if(temp__3974__auto____10192) {
        var G__10188__10193 = temp__3974__auto____10192;
        var G__10206 = cljs.core.first.call(null, G__10188__10193);
        var G__10207 = G__10188__10193;
        string__10190 = G__10206;
        G__10188__10191 = G__10207;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10194__10195 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10194__10195) {
    var obj__10196 = cljs.core.first.call(null, G__10194__10195);
    var G__10194__10197 = G__10194__10195;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10198__10199 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10196, opts));
      if(G__10198__10199) {
        var string__10200 = cljs.core.first.call(null, G__10198__10199);
        var G__10198__10201 = G__10198__10199;
        while(true) {
          cljs.core.string_print.call(null, string__10200);
          var temp__3974__auto____10202 = cljs.core.next.call(null, G__10198__10201);
          if(temp__3974__auto____10202) {
            var G__10198__10203 = temp__3974__auto____10202;
            var G__10208 = cljs.core.first.call(null, G__10198__10203);
            var G__10209 = G__10198__10203;
            string__10200 = G__10208;
            G__10198__10201 = G__10209;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10204 = cljs.core.next.call(null, G__10194__10197);
      if(temp__3974__auto____10204) {
        var G__10194__10205 = temp__3974__auto____10204;
        var G__10210 = cljs.core.first.call(null, G__10194__10205);
        var G__10211 = G__10194__10205;
        obj__10196 = G__10210;
        G__10194__10197 = G__10211;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__10212) {
    var objs = cljs.core.seq(arglist__10212);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__10213) {
    var objs = cljs.core.seq(arglist__10213);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__10214) {
    var objs = cljs.core.seq(arglist__10214);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__10215) {
    var objs = cljs.core.seq(arglist__10215);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__10216) {
    var objs = cljs.core.seq(arglist__10216);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__10217) {
    var objs = cljs.core.seq(arglist__10217);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__10218) {
    var objs = cljs.core.seq(arglist__10218);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__10219) {
    var objs = cljs.core.seq(arglist__10219);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__10220) {
    var fmt = cljs.core.first(arglist__10220);
    var args = cljs.core.rest(arglist__10220);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10221 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10221, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10222 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10222, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10223 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10223, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____10224 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10224)) {
        var nspc__10225 = temp__3974__auto____10224;
        return[cljs.core.str(nspc__10225), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10226 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10226)) {
          var nspc__10227 = temp__3974__auto____10226;
          return[cljs.core.str(nspc__10227), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10228 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10228, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__10230 = function(n, len) {
    var ns__10229 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10229) < len) {
        var G__10232 = [cljs.core.str("0"), cljs.core.str(ns__10229)].join("");
        ns__10229 = G__10232;
        continue
      }else {
        return ns__10229
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10230.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10230.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10230.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10230.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10230.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10230.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10231 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10231, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10233 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10234 = this;
  var G__10235__10236 = cljs.core.seq.call(null, this__10234.watches);
  if(G__10235__10236) {
    var G__10238__10240 = cljs.core.first.call(null, G__10235__10236);
    var vec__10239__10241 = G__10238__10240;
    var key__10242 = cljs.core.nth.call(null, vec__10239__10241, 0, null);
    var f__10243 = cljs.core.nth.call(null, vec__10239__10241, 1, null);
    var G__10235__10244 = G__10235__10236;
    var G__10238__10245 = G__10238__10240;
    var G__10235__10246 = G__10235__10244;
    while(true) {
      var vec__10247__10248 = G__10238__10245;
      var key__10249 = cljs.core.nth.call(null, vec__10247__10248, 0, null);
      var f__10250 = cljs.core.nth.call(null, vec__10247__10248, 1, null);
      var G__10235__10251 = G__10235__10246;
      f__10250.call(null, key__10249, this$, oldval, newval);
      var temp__3974__auto____10252 = cljs.core.next.call(null, G__10235__10251);
      if(temp__3974__auto____10252) {
        var G__10235__10253 = temp__3974__auto____10252;
        var G__10260 = cljs.core.first.call(null, G__10235__10253);
        var G__10261 = G__10235__10253;
        G__10238__10245 = G__10260;
        G__10235__10246 = G__10261;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__10254 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10254.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10255 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10255.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10256 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10256.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10257 = this;
  return this__10257.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10258 = this;
  return this__10258.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10259 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10273__delegate = function(x, p__10262) {
      var map__10268__10269 = p__10262;
      var map__10268__10270 = cljs.core.seq_QMARK_.call(null, map__10268__10269) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10268__10269) : map__10268__10269;
      var validator__10271 = cljs.core._lookup.call(null, map__10268__10270, "\ufdd0'validator", null);
      var meta__10272 = cljs.core._lookup.call(null, map__10268__10270, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10272, validator__10271, null)
    };
    var G__10273 = function(x, var_args) {
      var p__10262 = null;
      if(goog.isDef(var_args)) {
        p__10262 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10273__delegate.call(this, x, p__10262)
    };
    G__10273.cljs$lang$maxFixedArity = 1;
    G__10273.cljs$lang$applyTo = function(arglist__10274) {
      var x = cljs.core.first(arglist__10274);
      var p__10262 = cljs.core.rest(arglist__10274);
      return G__10273__delegate(x, p__10262)
    };
    G__10273.cljs$lang$arity$variadic = G__10273__delegate;
    return G__10273
  }();
  atom = function(x, var_args) {
    var p__10262 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____10278 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10278)) {
    var validate__10279 = temp__3974__auto____10278;
    if(cljs.core.truth_(validate__10279.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10280 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10280, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__10281__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10281 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10281__delegate.call(this, a, f, x, y, z, more)
    };
    G__10281.cljs$lang$maxFixedArity = 5;
    G__10281.cljs$lang$applyTo = function(arglist__10282) {
      var a = cljs.core.first(arglist__10282);
      var f = cljs.core.first(cljs.core.next(arglist__10282));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10282)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10282))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10282)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10282)))));
      return G__10281__delegate(a, f, x, y, z, more)
    };
    G__10281.cljs$lang$arity$variadic = G__10281__delegate;
    return G__10281
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10283) {
    var iref = cljs.core.first(arglist__10283);
    var f = cljs.core.first(cljs.core.next(arglist__10283));
    var args = cljs.core.rest(cljs.core.next(arglist__10283));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__10284 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10284.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10285 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10285.state, function(p__10286) {
    var map__10287__10288 = p__10286;
    var map__10287__10289 = cljs.core.seq_QMARK_.call(null, map__10287__10288) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10287__10288) : map__10287__10288;
    var curr_state__10290 = map__10287__10289;
    var done__10291 = cljs.core._lookup.call(null, map__10287__10289, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10291)) {
      return curr_state__10290
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10285.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__10312__10313 = options;
    var map__10312__10314 = cljs.core.seq_QMARK_.call(null, map__10312__10313) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10312__10313) : map__10312__10313;
    var keywordize_keys__10315 = cljs.core._lookup.call(null, map__10312__10314, "\ufdd0'keywordize-keys", null);
    var keyfn__10316 = cljs.core.truth_(keywordize_keys__10315) ? cljs.core.keyword : cljs.core.str;
    var f__10331 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2460__auto____10330 = function iter__10324(s__10325) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10325__10328 = s__10325;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10325__10328)) {
                        var k__10329 = cljs.core.first.call(null, s__10325__10328);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10316.call(null, k__10329), thisfn.call(null, x[k__10329])], true), iter__10324.call(null, cljs.core.rest.call(null, s__10325__10328)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2460__auto____10330.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__10331.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10332) {
    var x = cljs.core.first(arglist__10332);
    var options = cljs.core.rest(arglist__10332);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10337 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10341__delegate = function(args) {
      var temp__3971__auto____10338 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10337), args, null);
      if(cljs.core.truth_(temp__3971__auto____10338)) {
        var v__10339 = temp__3971__auto____10338;
        return v__10339
      }else {
        var ret__10340 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10337, cljs.core.assoc, args, ret__10340);
        return ret__10340
      }
    };
    var G__10341 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10341__delegate.call(this, args)
    };
    G__10341.cljs$lang$maxFixedArity = 0;
    G__10341.cljs$lang$applyTo = function(arglist__10342) {
      var args = cljs.core.seq(arglist__10342);
      return G__10341__delegate(args)
    };
    G__10341.cljs$lang$arity$variadic = G__10341__delegate;
    return G__10341
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10344 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10344)) {
        var G__10345 = ret__10344;
        f = G__10345;
        continue
      }else {
        return ret__10344
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10346__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10346 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10346__delegate.call(this, f, args)
    };
    G__10346.cljs$lang$maxFixedArity = 1;
    G__10346.cljs$lang$applyTo = function(arglist__10347) {
      var f = cljs.core.first(arglist__10347);
      var args = cljs.core.rest(arglist__10347);
      return G__10346__delegate(f, args)
    };
    G__10346.cljs$lang$arity$variadic = G__10346__delegate;
    return G__10346
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__10349 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10349, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10349, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____10358 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10358) {
      return or__3824__auto____10358
    }else {
      var or__3824__auto____10359 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10359) {
        return or__3824__auto____10359
      }else {
        var and__3822__auto____10360 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10360) {
          var and__3822__auto____10361 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10361) {
            var and__3822__auto____10362 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10362) {
              var ret__10363 = true;
              var i__10364 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10365 = cljs.core.not.call(null, ret__10363);
                  if(or__3824__auto____10365) {
                    return or__3824__auto____10365
                  }else {
                    return i__10364 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10363
                }else {
                  var G__10366 = isa_QMARK_.call(null, h, child.call(null, i__10364), parent.call(null, i__10364));
                  var G__10367 = i__10364 + 1;
                  ret__10363 = G__10366;
                  i__10364 = G__10367;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10362
            }
          }else {
            return and__3822__auto____10361
          }
        }else {
          return and__3822__auto____10360
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__10376 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10377 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10378 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10379 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10380 = cljs.core.contains_QMARK_.call(null, tp__10376.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10378.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10378.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10376, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10379.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10377, parent, ta__10378), "\ufdd0'descendants":tf__10379.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10378, tag, td__10377)})
    }();
    if(cljs.core.truth_(or__3824__auto____10380)) {
      return or__3824__auto____10380
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10385 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10386 = cljs.core.truth_(parentMap__10385.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10385.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10387 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10386)) ? cljs.core.assoc.call(null, parentMap__10385, tag, childsParents__10386) : cljs.core.dissoc.call(null, parentMap__10385, tag);
    var deriv_seq__10388 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10368_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10368_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10368_SHARP_), cljs.core.second.call(null, p1__10368_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10387)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10385.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10369_SHARP_, p2__10370_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10369_SHARP_, p2__10370_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10388))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10396 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10398 = cljs.core.truth_(function() {
    var and__3822__auto____10397 = xprefs__10396;
    if(cljs.core.truth_(and__3822__auto____10397)) {
      return xprefs__10396.call(null, y)
    }else {
      return and__3822__auto____10397
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10398)) {
    return or__3824__auto____10398
  }else {
    var or__3824__auto____10400 = function() {
      var ps__10399 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10399) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10399), prefer_table))) {
          }else {
          }
          var G__10403 = cljs.core.rest.call(null, ps__10399);
          ps__10399 = G__10403;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10400)) {
      return or__3824__auto____10400
    }else {
      var or__3824__auto____10402 = function() {
        var ps__10401 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10401) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10401), y, prefer_table))) {
            }else {
            }
            var G__10404 = cljs.core.rest.call(null, ps__10401);
            ps__10401 = G__10404;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10402)) {
        return or__3824__auto____10402
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10406 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10406)) {
    return or__3824__auto____10406
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10424 = cljs.core.reduce.call(null, function(be, p__10416) {
    var vec__10417__10418 = p__10416;
    var k__10419 = cljs.core.nth.call(null, vec__10417__10418, 0, null);
    var ___10420 = cljs.core.nth.call(null, vec__10417__10418, 1, null);
    var e__10421 = vec__10417__10418;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10419)) {
      var be2__10423 = cljs.core.truth_(function() {
        var or__3824__auto____10422 = be == null;
        if(or__3824__auto____10422) {
          return or__3824__auto____10422
        }else {
          return cljs.core.dominates.call(null, k__10419, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10421 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10423), k__10419, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10419), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10423)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10423
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10424)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10424));
      return cljs.core.second.call(null, best_entry__10424)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10429 = mf;
    if(and__3822__auto____10429) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10429
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2361__auto____10430 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10431 = cljs.core._reset[goog.typeOf(x__2361__auto____10430)];
      if(or__3824__auto____10431) {
        return or__3824__auto____10431
      }else {
        var or__3824__auto____10432 = cljs.core._reset["_"];
        if(or__3824__auto____10432) {
          return or__3824__auto____10432
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10437 = mf;
    if(and__3822__auto____10437) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10437
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2361__auto____10438 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10439 = cljs.core._add_method[goog.typeOf(x__2361__auto____10438)];
      if(or__3824__auto____10439) {
        return or__3824__auto____10439
      }else {
        var or__3824__auto____10440 = cljs.core._add_method["_"];
        if(or__3824__auto____10440) {
          return or__3824__auto____10440
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10445 = mf;
    if(and__3822__auto____10445) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10445
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2361__auto____10446 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10447 = cljs.core._remove_method[goog.typeOf(x__2361__auto____10446)];
      if(or__3824__auto____10447) {
        return or__3824__auto____10447
      }else {
        var or__3824__auto____10448 = cljs.core._remove_method["_"];
        if(or__3824__auto____10448) {
          return or__3824__auto____10448
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10453 = mf;
    if(and__3822__auto____10453) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10453
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2361__auto____10454 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10455 = cljs.core._prefer_method[goog.typeOf(x__2361__auto____10454)];
      if(or__3824__auto____10455) {
        return or__3824__auto____10455
      }else {
        var or__3824__auto____10456 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10456) {
          return or__3824__auto____10456
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10461 = mf;
    if(and__3822__auto____10461) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10461
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2361__auto____10462 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10463 = cljs.core._get_method[goog.typeOf(x__2361__auto____10462)];
      if(or__3824__auto____10463) {
        return or__3824__auto____10463
      }else {
        var or__3824__auto____10464 = cljs.core._get_method["_"];
        if(or__3824__auto____10464) {
          return or__3824__auto____10464
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10469 = mf;
    if(and__3822__auto____10469) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10469
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2361__auto____10470 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10471 = cljs.core._methods[goog.typeOf(x__2361__auto____10470)];
      if(or__3824__auto____10471) {
        return or__3824__auto____10471
      }else {
        var or__3824__auto____10472 = cljs.core._methods["_"];
        if(or__3824__auto____10472) {
          return or__3824__auto____10472
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10477 = mf;
    if(and__3822__auto____10477) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10477
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2361__auto____10478 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10479 = cljs.core._prefers[goog.typeOf(x__2361__auto____10478)];
      if(or__3824__auto____10479) {
        return or__3824__auto____10479
      }else {
        var or__3824__auto____10480 = cljs.core._prefers["_"];
        if(or__3824__auto____10480) {
          return or__3824__auto____10480
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10485 = mf;
    if(and__3822__auto____10485) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10485
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2361__auto____10486 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10487 = cljs.core._dispatch[goog.typeOf(x__2361__auto____10486)];
      if(or__3824__auto____10487) {
        return or__3824__auto____10487
      }else {
        var or__3824__auto____10488 = cljs.core._dispatch["_"];
        if(or__3824__auto____10488) {
          return or__3824__auto____10488
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10491 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10492 = cljs.core._get_method.call(null, mf, dispatch_val__10491);
  if(cljs.core.truth_(target_fn__10492)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10491)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10492, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10493 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10494 = this;
  cljs.core.swap_BANG_.call(null, this__10494.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10494.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10494.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10494.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10495 = this;
  cljs.core.swap_BANG_.call(null, this__10495.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10495.method_cache, this__10495.method_table, this__10495.cached_hierarchy, this__10495.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10496 = this;
  cljs.core.swap_BANG_.call(null, this__10496.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10496.method_cache, this__10496.method_table, this__10496.cached_hierarchy, this__10496.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10497 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10497.cached_hierarchy), cljs.core.deref.call(null, this__10497.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10497.method_cache, this__10497.method_table, this__10497.cached_hierarchy, this__10497.hierarchy)
  }
  var temp__3971__auto____10498 = cljs.core.deref.call(null, this__10497.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10498)) {
    var target_fn__10499 = temp__3971__auto____10498;
    return target_fn__10499
  }else {
    var temp__3971__auto____10500 = cljs.core.find_and_cache_best_method.call(null, this__10497.name, dispatch_val, this__10497.hierarchy, this__10497.method_table, this__10497.prefer_table, this__10497.method_cache, this__10497.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10500)) {
      var target_fn__10501 = temp__3971__auto____10500;
      return target_fn__10501
    }else {
      return cljs.core.deref.call(null, this__10497.method_table).call(null, this__10497.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10502 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10502.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10502.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10502.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10502.method_cache, this__10502.method_table, this__10502.cached_hierarchy, this__10502.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10503 = this;
  return cljs.core.deref.call(null, this__10503.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10504 = this;
  return cljs.core.deref.call(null, this__10504.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10505 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10505.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10507__delegate = function(_, args) {
    var self__10506 = this;
    return cljs.core._dispatch.call(null, self__10506, args)
  };
  var G__10507 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10507__delegate.call(this, _, args)
  };
  G__10507.cljs$lang$maxFixedArity = 1;
  G__10507.cljs$lang$applyTo = function(arglist__10508) {
    var _ = cljs.core.first(arglist__10508);
    var args = cljs.core.rest(arglist__10508);
    return G__10507__delegate(_, args)
  };
  G__10507.cljs$lang$arity$variadic = G__10507__delegate;
  return G__10507
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10509 = this;
  return cljs.core._dispatch.call(null, self__10509, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10510 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10512, _) {
  var this__10511 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10511.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10513 = this;
  var and__3822__auto____10514 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10514) {
    return this__10513.uuid === other.uuid
  }else {
    return and__3822__auto____10514
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10515 = this;
  var this__10516 = this;
  return cljs.core.pr_str.call(null, this__10516)
};
cljs.core.UUID;
goog.provide("cljs_intro.stories");
goog.require("cljs.core");
cljs_intro.stories.catch_phrases = cljs.core.PersistentVector.fromArray(["adaptive", "advanced", "ameliorated", "assimilated", "automated", "balanced", "business-focused", "centralized", "cloned", "compatible", "configurable", "cross-group", "cross-platform", "customer-focused", "customizable", "decentralized", "de-engineered", "devolved", "digitized", "distributed", "diverse", "down-sized", "enhanced", "enterprise-wide", "ergonomic", "exclusive", "expanded", "extended", "face to face", "focused", 
"front-line", "fully-configurable", "function-based", "fundamental", "future-proofed", "grass-roots", "horizontal", "implemented", "innovative", "integrated", "intuitive", "inverse", "managed", "mandatory", "monitored", "multi-channelled", "multi-lateral", "multi-layered", "multi-tiered", "networked", "object-based", "open-architected", "open-source", "operative", "optimized", "optional", "organic", "organized", "persevering", "persistent", "phased", "polarised", "pre-emptive", "proactive", "profit-focused", 
"profound", "programmable", "progressive", "public-key", "quality-focused", "reactive", "realigned", "re-contextualized", "re-engineered", "reduced", "reverse-engineered", "right-sized", "robust", "seamless", "secured", "self-enabling", "sharable", "stand-alone", "streamlined", "switchable", "synchronised", "synergistic", "synergized", "team-oriented", "total", "triple-buffered", "universal", "up-sized", "upgradable", "user-centric", "user-friendly", "versatile", "virtual", "visionary", "vision-oriented"], 
true);
cljs_intro.stories.catch_phrase_desc = cljs.core.PersistentVector.fromArray(["24 hour", "24/7", "3rd generation", "4th generation", "5th generation", "6th generation", "actuating", "analyzing", "assymetric", "asynchronous", "attitude-oriented", "background", "bandwidth-monitored", "bi-directional", "bifurcated", "bottom-line", "clear-thinking", "client-driven", "client-server", "coherent", "cohesive", "composite", "context-sensitive", "contextually-based", "content-based", "dedicated", "demand-driven", 
"didactic", "directional", "discrete", "disintermediate", "dynamic", "eco-centric", "empowering", "encompassing", "even-keeled", "executive", "explicit", "exuding", "fault-tolerant", "foreground", "fresh-thinking", "full-range", "global", "grid-enabled", "heuristic", "high-level", "holistic", "homogeneous", "human-resource", "hybrid", "impactful", "incremental", "intangible", "interactive", "intermediate", "leading edge", "local", "logistical", "maximized", "methodical", "mission-critical", "mobile", 
"modular", "motivating", "multimedia", "multi-state", "multi-tasking", "national", "needs-based", "neutral", "next generation", "non-volatile", "object-oriented", "optimal", "optimizing", "radical", "real-time", "reciprocal", "regional", "responsive", "scalable", "secondary", "solution-oriented", "stable", "static", "systematic", "systemic", "system-worthy", "tangible", "tertiary", "transitional", "uniform", "upward-trending", "user-facing", "value-added", "web-enabled", "well-modulated", "zero administration", 
"zero defect", "zero tolerance"], true);
cljs_intro.stories.noun = cljs.core.PersistentVector.fromArray(["ability", "access", "adapter", "algorithm", "alliance", "analyzer", "application", "approach", "architecture", "archive", "artificial intelligence", "array", "attitude", "benchmark", "budgetary management", "capability", "capacity", "challenge", "circuit", "collaboration", "complexity", "concept", "conglomeration", "contingency", "core", "customer loyalty", "database", "data-warehouse", "definition", "emulation", "encoding", "encryption", 
"extranet", "firmware", "flexibility", "focus group", "forecast", "frame", "framework", "function", "functionalities", "Graphic Interface", "groupware", "Graphical User Interface", "hardware", "help-desk", "hierarchy", "hub", "implementation", "info-mediaries", "infrastructure", "initiative", "installation", "instruction set", "interface", "internet solution", "intranet", "knowledge user", "knowledge base", "local area network", "leverage", "matrices", "matrix", "methodology", "middleware", "migration", 
"model", "moderator", "monitoring", "moratorium", "neural-net", "open architecture", "open system", "orchestration", "paradigm", "parallelism", "policy", "portal", "pricing structure", "process improvement", "product", "productivity", "project", "projection", "protocol", "secured line", "service-desk", "software", "solution", "standardization", "strategy", "structure", "success", "superstructure", "support", "synergy", "system engine", "task-force", "throughput", "time-frame", "toolset", "utilisation", 
"website", "workforce"], true);
cljs_intro.stories.verbs = cljs.core.PersistentVector.fromArray(["Implement", "Utilize", "Integrate", "Streamline", "Optimize", "Evolve", "Transform", "Embrace", "Enable", "Orchestrate", "Leverage", "Reinvent", "Aggregate", "Architect", "Enhance", "Incentivize", "Morph", "Empower", "Envisioneer", "Monetize", "Harness", "Facilitate", "Seize", "Disintermediate", "Synergize", "Strategize", "Deploy", "Brand", "Grow", "Target", "Syndicate", "Synthesize", "Deliver", "Mesh", "Incubate", "Engage", "Maximize", 
"Benchmark", "Expedite", "Reintermediate", "Whiteboard", "Visualize", "Repurpose", "Innovate", "Scale", "Unleash", "Drive", "Extend", "Engineer", "Revolutionize", "Generate", "Exploit", "Transition", "E-enable", "Iterate", "Cultivate", "Matrix", "Productize", "Redefine", "Recontextualize"], true);
cljs_intro.stories.buzz = cljs.core.PersistentVector.fromArray(["clicks-and-mortar", "value-added", "vertical", "proactive", "robust", "revolutionary", "scalable", "leading-edge", "innovative", "intuitive", "strategic", "e-business", "mission-critical", "sticky", "one-to-one", "24/7", "end-to-end", "global", "B2B", "B2C", "granular", "frictionless", "virtual", "viral", "dynamic", "24/365", "best-of-breed", "killer", "magnetic", "bleeding-edge", "web-enabled", "interactive", "dot-com", "sexy", "back-end", 
"real-time", "efficient", "front-end", "distributed", "seamless", "extensible", "turn-key", "world-class", "open-source", "cross-platform", "cross-media", "synergistic", "bricks-and-clicks", "out-of-the-box", "enterprise", "integrated", "impactful", "wireless", "transparent", "next-generation", "cutting-edge", "user-centric", "visionary", "customized", "ubiquitous", "plug-and-play", "collaborative", "compelling", "holistic", "rich"], true);
cljs_intro.stories.bs_noun = cljs.core.PersistentVector.fromArray(["synergies", "web-readiness", "paradigms", "markets", "partnerships", "infrastructures", "platforms", "initiatives", "channels", "eyeballs", "communities", "ROI", "solutions", "e-tailers", "e-services", "action-items", "portals", "niches", "technologies", "content", "vortals", "supply-chains", "convergence", "relationships", "architectures", "interfaces", "e-markets", "e-commerce", "systems", "bandwidth", "infomediaries", "models", 
"mindshare", "deliverables", "users", "schemas", "networks", "applications", "metrics", "e-business", "functionalities", "experiences", "web services", "methodologies"], true);
cljs_intro.stories.sentence_components = cljs.core.PersistentVector.fromArray([cljs_intro.stories.verbs, cljs_intro.stories.catch_phrases, cljs_intro.stories.catch_phrase_desc, cljs_intro.stories.buzz, cljs_intro.stories.bs_noun], true);
cljs_intro.stories.rand_sentence = function rand_sentence() {
  return clojure.string.join.call(null, " ", cljs.core.map.call(null, cljs.core.rand_nth, cljs_intro.stories.sentence_components))
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__10932 = s;
      var limit__10933 = limit;
      var parts__10934 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__10933, 1)) {
          return cljs.core.conj.call(null, parts__10934, s__10932)
        }else {
          var temp__3971__auto____10935 = cljs.core.re_find.call(null, re, s__10932);
          if(cljs.core.truth_(temp__3971__auto____10935)) {
            var m__10936 = temp__3971__auto____10935;
            var index__10937 = s__10932.indexOf(m__10936);
            var G__10938 = s__10932.substring(index__10937 + cljs.core.count.call(null, m__10936));
            var G__10939 = limit__10933 - 1;
            var G__10940 = cljs.core.conj.call(null, parts__10934, s__10932.substring(0, index__10937));
            s__10932 = G__10938;
            limit__10933 = G__10939;
            parts__10934 = G__10940;
            continue
          }else {
            return cljs.core.conj.call(null, parts__10934, s__10932)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__10944 = s.length;
  while(true) {
    if(index__10944 === 0) {
      return""
    }else {
      var ch__10945 = cljs.core._lookup.call(null, s, index__10944 - 1, null);
      if(function() {
        var or__3824__auto____10946 = cljs.core._EQ_.call(null, ch__10945, "\n");
        if(or__3824__auto____10946) {
          return or__3824__auto____10946
        }else {
          return cljs.core._EQ_.call(null, ch__10945, "\r")
        }
      }()) {
        var G__10947 = index__10944 - 1;
        index__10944 = G__10947;
        continue
      }else {
        return s.substring(0, index__10944)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__10951 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____10952 = cljs.core.not.call(null, s__10951);
    if(or__3824__auto____10952) {
      return or__3824__auto____10952
    }else {
      var or__3824__auto____10953 = cljs.core._EQ_.call(null, "", s__10951);
      if(or__3824__auto____10953) {
        return or__3824__auto____10953
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__10951)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__10960 = new goog.string.StringBuffer;
  var length__10961 = s.length;
  var index__10962 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__10961, index__10962)) {
      return buffer__10960.toString()
    }else {
      var ch__10963 = s.charAt(index__10962);
      var temp__3971__auto____10964 = cljs.core._lookup.call(null, cmap, ch__10963, null);
      if(cljs.core.truth_(temp__3971__auto____10964)) {
        var replacement__10965 = temp__3971__auto____10964;
        buffer__10960.append([cljs.core.str(replacement__10965)].join(""))
      }else {
        buffer__10960.append(ch__10963)
      }
      var G__10966 = index__10962 + 1;
      index__10962 = G__10966;
      continue
    }
    break
  }
};
goog.provide("dommy.attrs");
goog.require("cljs.core");
goog.require("clojure.string");
dommy.attrs.class_match_QMARK_ = function class_match_QMARK_(class_name, class$, idx) {
  var and__3822__auto____14265 = function() {
    var or__3824__auto____14264 = idx === 0;
    if(or__3824__auto____14264) {
      return or__3824__auto____14264
    }else {
      return" " === class_name.charAt(idx - 1)
    }
  }();
  if(cljs.core.truth_(and__3822__auto____14265)) {
    var total_len__14266 = class_name.length;
    var stop__14267 = idx + class$.length;
    if(stop__14267 <= total_len__14266) {
      var or__3824__auto____14268 = stop__14267 === total_len__14266;
      if(or__3824__auto____14268) {
        return or__3824__auto____14268
      }else {
        return" " === class_name.charAt(stop__14267)
      }
    }else {
      return null
    }
  }else {
    return and__3822__auto____14265
  }
};
dommy.attrs.class_index = function class_index(class_name, class$) {
  var start_from__14271 = 0;
  while(true) {
    var i__14272 = class_name.indexOf(class$, start_from__14271);
    if(i__14272 >= 0) {
      if(cljs.core.truth_(dommy.attrs.class_match_QMARK_.call(null, class_name, class$, i__14272))) {
        return i__14272
      }else {
        var G__14273 = i__14272 + class$.length;
        start_from__14271 = G__14273;
        continue
      }
    }else {
      return null
    }
    break
  }
};
dommy.attrs.has_class_QMARK_ = function has_class_QMARK_(elem, class$) {
  var elem__14281 = dommy.template.__GT_node_like.call(null, elem);
  var temp__3971__auto____14282 = elem__14281.classList;
  if(cljs.core.truth_(temp__3971__auto____14282)) {
    var class_list__14283 = temp__3971__auto____14282;
    return class_list__14283.contains(class$)
  }else {
    var temp__3974__auto____14284 = elem__14281.className;
    if(cljs.core.truth_(temp__3974__auto____14284)) {
      var class_name__14285 = temp__3974__auto____14284;
      var temp__3974__auto____14286 = dommy.attrs.class_index.call(null, class_name__14285, class$);
      if(cljs.core.truth_(temp__3974__auto____14286)) {
        var i__14287 = temp__3974__auto____14286;
        return i__14287 >= 0
      }else {
        return null
      }
    }else {
      return null
    }
  }
};
dommy.attrs.add_class_BANG_ = function add_class_BANG_(elem, classes) {
  var elem__14305 = dommy.template.__GT_node_like.call(null, elem);
  var classes__14306 = clojure.string.trim.call(null, classes);
  if(cljs.core.seq.call(null, classes__14306)) {
    var temp__3971__auto____14307 = elem__14305.classList;
    if(cljs.core.truth_(temp__3971__auto____14307)) {
      var class_list__14308 = temp__3971__auto____14307;
      var G__14309__14310 = cljs.core.seq.call(null, classes__14306.split(/\s+/));
      if(G__14309__14310) {
        var class__14311 = cljs.core.first.call(null, G__14309__14310);
        var G__14309__14312 = G__14309__14310;
        while(true) {
          class_list__14308.add(class__14311);
          var temp__3974__auto____14313 = cljs.core.next.call(null, G__14309__14312);
          if(temp__3974__auto____14313) {
            var G__14309__14314 = temp__3974__auto____14313;
            var G__14322 = cljs.core.first.call(null, G__14309__14314);
            var G__14323 = G__14309__14314;
            class__14311 = G__14322;
            G__14309__14312 = G__14323;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }else {
      var class_name__14315 = elem__14305.className;
      var G__14316__14317 = cljs.core.seq.call(null, classes__14306.split(/\s+/));
      if(G__14316__14317) {
        var class__14318 = cljs.core.first.call(null, G__14316__14317);
        var G__14316__14319 = G__14316__14317;
        while(true) {
          if(cljs.core.truth_(dommy.attrs.class_index.call(null, class_name__14315, class__14318))) {
          }else {
            elem__14305.className = class_name__14315 === "" ? class__14318 : [cljs.core.str(class_name__14315), cljs.core.str(" "), cljs.core.str(class__14318)].join("")
          }
          var temp__3974__auto____14320 = cljs.core.next.call(null, G__14316__14319);
          if(temp__3974__auto____14320) {
            var G__14316__14321 = temp__3974__auto____14320;
            var G__14324 = cljs.core.first.call(null, G__14316__14321);
            var G__14325 = G__14316__14321;
            class__14318 = G__14324;
            G__14316__14319 = G__14325;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }
  }else {
  }
  return elem__14305
};
dommy.attrs.remove_class_str = function remove_class_str(init_class_name, class$) {
  var class_name__14331 = init_class_name;
  while(true) {
    var class_len__14332 = class_name__14331.length;
    var temp__3971__auto____14333 = dommy.attrs.class_index.call(null, class_name__14331, class$);
    if(cljs.core.truth_(temp__3971__auto____14333)) {
      var i__14334 = temp__3971__auto____14333;
      var G__14336 = function() {
        var end__14335 = i__14334 + class$.length;
        return[cljs.core.str(end__14335 < class_len__14332 ? [cljs.core.str(class_name__14331.substring(0, i__14334)), cljs.core.str(class_name__14331.substr(end__14335 + 1))].join("") : class_name__14331.substring(0, i__14334 - 1))].join("")
      }();
      class_name__14331 = G__14336;
      continue
    }else {
      return class_name__14331
    }
    break
  }
};
dommy.attrs.remove_class_BANG_ = function remove_class_BANG_(elem, class$) {
  var elem__14342 = dommy.template.__GT_node_like.call(null, elem);
  var temp__3971__auto____14343 = elem__14342.classList;
  if(cljs.core.truth_(temp__3971__auto____14343)) {
    var class_list__14344 = temp__3971__auto____14343;
    class_list__14344.remove(class$)
  }else {
    var class_name__14345 = elem__14342.className;
    var new_class_name__14346 = dommy.attrs.remove_class_str.call(null, class_name__14345, cljs.core.name.call(null, class$));
    if(class_name__14345 === new_class_name__14346) {
    }else {
      elem__14342.className = new_class_name__14346
    }
  }
  return elem__14342
};
dommy.attrs.toggle_class_BANG_ = function() {
  var toggle_class_BANG_ = null;
  var toggle_class_BANG___2 = function(elem, class$) {
    var elem__14351 = dommy.template.__GT_node_like.call(null, elem);
    var temp__3971__auto____14352 = elem__14351.classList;
    if(cljs.core.truth_(temp__3971__auto____14352)) {
      var class_list__14353 = temp__3971__auto____14352;
      class_list__14353.toggle(class$)
    }else {
      toggle_class_BANG_.call(null, elem__14351, class$, cljs.core.not.call(null, dommy.attrs.has_class_QMARK_.call(null, elem__14351, class$)))
    }
    return elem__14351
  };
  var toggle_class_BANG___3 = function(elem, class$, add_QMARK_) {
    var elem__14354 = dommy.template.__GT_node_like.call(null, elem);
    if(cljs.core.truth_(add_QMARK_)) {
      dommy.attrs.add_class_BANG_.call(null, elem__14354, class$)
    }else {
      dommy.attrs.remove_class_BANG_.call(null, elem__14354, class$)
    }
    return elem__14354
  };
  toggle_class_BANG_ = function(elem, class$, add_QMARK_) {
    switch(arguments.length) {
      case 2:
        return toggle_class_BANG___2.call(this, elem, class$);
      case 3:
        return toggle_class_BANG___3.call(this, elem, class$, add_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  toggle_class_BANG_.cljs$lang$arity$2 = toggle_class_BANG___2;
  toggle_class_BANG_.cljs$lang$arity$3 = toggle_class_BANG___3;
  return toggle_class_BANG_
}();
dommy.attrs.style_str = function style_str(m) {
  return clojure.string.join.call(null, " ", cljs.core.map.call(null, function(p__14360) {
    var vec__14361__14362 = p__14360;
    var k__14363 = cljs.core.nth.call(null, vec__14361__14362, 0, null);
    var v__14364 = cljs.core.nth.call(null, vec__14361__14362, 1, null);
    return[cljs.core.str(cljs.core.name.call(null, k__14363)), cljs.core.str(":"), cljs.core.str(cljs.core.name.call(null, v__14364)), cljs.core.str(";")].join("")
  }, m))
};
dommy.attrs.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(elem, kvs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'even?", cljs.core.with_meta(cljs.core.list("\ufdd1'count", "\ufdd1'kvs"), cljs.core.hash_map("\ufdd0'line", 107))), cljs.core.hash_map("\ufdd0'line", 107))))].join(""));
    }
    var elem__14386 = dommy.template.__GT_node_like.call(null, elem);
    var style__14387 = elem__14386.style;
    var G__14388__14389 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, kvs));
    if(G__14388__14389) {
      var G__14391__14393 = cljs.core.first.call(null, G__14388__14389);
      var vec__14392__14394 = G__14391__14393;
      var k__14395 = cljs.core.nth.call(null, vec__14392__14394, 0, null);
      var v__14396 = cljs.core.nth.call(null, vec__14392__14394, 1, null);
      var G__14388__14397 = G__14388__14389;
      var G__14391__14398 = G__14391__14393;
      var G__14388__14399 = G__14388__14397;
      while(true) {
        var vec__14400__14401 = G__14391__14398;
        var k__14402 = cljs.core.nth.call(null, vec__14400__14401, 0, null);
        var v__14403 = cljs.core.nth.call(null, vec__14400__14401, 1, null);
        var G__14388__14404 = G__14388__14399;
        style__14387[cljs.core.name.call(null, k__14402)] = v__14403;
        var temp__3974__auto____14405 = cljs.core.next.call(null, G__14388__14404);
        if(temp__3974__auto____14405) {
          var G__14388__14406 = temp__3974__auto____14405;
          var G__14407 = cljs.core.first.call(null, G__14388__14406);
          var G__14408 = G__14388__14406;
          G__14391__14398 = G__14407;
          G__14388__14399 = G__14408;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return elem__14386
  };
  var set_style_BANG_ = function(elem, var_args) {
    var kvs = null;
    if(goog.isDef(var_args)) {
      kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return set_style_BANG___delegate.call(this, elem, kvs)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 1;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__14409) {
    var elem = cljs.core.first(arglist__14409);
    var kvs = cljs.core.rest(arglist__14409);
    return set_style_BANG___delegate(elem, kvs)
  };
  set_style_BANG_.cljs$lang$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
dommy.attrs.style = function style(elem, k) {
  if(cljs.core.truth_(k)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, "\ufdd1'k"))].join(""));
  }
  return window.getComputedStyle(dommy.template.__GT_node_like.call(null, elem))[cljs.core.name.call(null, k)]
};
dommy.attrs.set_px_BANG_ = function() {
  var set_px_BANG___delegate = function(elem, kvs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'even?", cljs.core.with_meta(cljs.core.list("\ufdd1'count", "\ufdd1'kvs"), cljs.core.hash_map("\ufdd0'line", 119))), cljs.core.hash_map("\ufdd0'line", 119))))].join(""));
    }
    var elem__14430 = dommy.template.__GT_node_like.call(null, elem);
    var G__14431__14432 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, kvs));
    if(G__14431__14432) {
      var G__14434__14436 = cljs.core.first.call(null, G__14431__14432);
      var vec__14435__14437 = G__14434__14436;
      var k__14438 = cljs.core.nth.call(null, vec__14435__14437, 0, null);
      var v__14439 = cljs.core.nth.call(null, vec__14435__14437, 1, null);
      var G__14431__14440 = G__14431__14432;
      var G__14434__14441 = G__14434__14436;
      var G__14431__14442 = G__14431__14440;
      while(true) {
        var vec__14443__14444 = G__14434__14441;
        var k__14445 = cljs.core.nth.call(null, vec__14443__14444, 0, null);
        var v__14446 = cljs.core.nth.call(null, vec__14443__14444, 1, null);
        var G__14431__14447 = G__14431__14442;
        dommy.attrs.set_style_BANG_.call(null, elem__14430, k__14445, [cljs.core.str(v__14446), cljs.core.str("px")].join(""));
        var temp__3974__auto____14448 = cljs.core.next.call(null, G__14431__14447);
        if(temp__3974__auto____14448) {
          var G__14431__14449 = temp__3974__auto____14448;
          var G__14450 = cljs.core.first.call(null, G__14431__14449);
          var G__14451 = G__14431__14449;
          G__14434__14441 = G__14450;
          G__14431__14442 = G__14451;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return elem__14430
  };
  var set_px_BANG_ = function(elem, var_args) {
    var kvs = null;
    if(goog.isDef(var_args)) {
      kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return set_px_BANG___delegate.call(this, elem, kvs)
  };
  set_px_BANG_.cljs$lang$maxFixedArity = 1;
  set_px_BANG_.cljs$lang$applyTo = function(arglist__14452) {
    var elem = cljs.core.first(arglist__14452);
    var kvs = cljs.core.rest(arglist__14452);
    return set_px_BANG___delegate(elem, kvs)
  };
  set_px_BANG_.cljs$lang$arity$variadic = set_px_BANG___delegate;
  return set_px_BANG_
}();
dommy.attrs.px = function px(elem, k) {
  var pixels__14454 = dommy.attrs.style.call(null, dommy.template.__GT_node_like.call(null, elem), k);
  if(cljs.core.seq.call(null, pixels__14454)) {
    return parseInt(pixels__14454)
  }else {
    return null
  }
};
dommy.attrs.set_attr_BANG_ = function() {
  var set_attr_BANG_ = null;
  var set_attr_BANG___2 = function(elem, k) {
    return set_attr_BANG_.call(null, dommy.template.__GT_node_like.call(null, elem), k, "true")
  };
  var set_attr_BANG___3 = function(elem, k, v) {
    if(cljs.core.truth_(v)) {
      var G__14477__14478 = dommy.template.__GT_node_like.call(null, elem);
      G__14477__14478.setAttribute(cljs.core.name.call(null, k), k === "\ufdd0'style" ? dommy.attrs.style_str.call(null, v) : v);
      return G__14477__14478
    }else {
      return null
    }
  };
  var set_attr_BANG___4 = function() {
    var G__14499__delegate = function(elem, k, v, kvs) {
      if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
      }else {
        throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'even?", cljs.core.with_meta(cljs.core.list("\ufdd1'count", "\ufdd1'kvs"), cljs.core.hash_map("\ufdd0'line", 150))), cljs.core.hash_map("\ufdd0'line", 150))))].join(""));
      }
      var elem__14479 = dommy.template.__GT_node_like.call(null, elem);
      var G__14480__14481 = cljs.core.seq.call(null, cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([k, v], true), cljs.core.partition.call(null, 2, kvs)));
      if(G__14480__14481) {
        var G__14483__14485 = cljs.core.first.call(null, G__14480__14481);
        var vec__14484__14486 = G__14483__14485;
        var k__14487 = cljs.core.nth.call(null, vec__14484__14486, 0, null);
        var v__14488 = cljs.core.nth.call(null, vec__14484__14486, 1, null);
        var G__14480__14489 = G__14480__14481;
        var G__14483__14490 = G__14483__14485;
        var G__14480__14491 = G__14480__14489;
        while(true) {
          var vec__14492__14493 = G__14483__14490;
          var k__14494 = cljs.core.nth.call(null, vec__14492__14493, 0, null);
          var v__14495 = cljs.core.nth.call(null, vec__14492__14493, 1, null);
          var G__14480__14496 = G__14480__14491;
          set_attr_BANG_.call(null, elem__14479, k__14494, v__14495);
          var temp__3974__auto____14497 = cljs.core.next.call(null, G__14480__14496);
          if(temp__3974__auto____14497) {
            var G__14480__14498 = temp__3974__auto____14497;
            var G__14500 = cljs.core.first.call(null, G__14480__14498);
            var G__14501 = G__14480__14498;
            G__14483__14490 = G__14500;
            G__14480__14491 = G__14501;
            continue
          }else {
          }
          break
        }
      }else {
      }
      return elem__14479
    };
    var G__14499 = function(elem, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14499__delegate.call(this, elem, k, v, kvs)
    };
    G__14499.cljs$lang$maxFixedArity = 3;
    G__14499.cljs$lang$applyTo = function(arglist__14502) {
      var elem = cljs.core.first(arglist__14502);
      var k = cljs.core.first(cljs.core.next(arglist__14502));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14502)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14502)));
      return G__14499__delegate(elem, k, v, kvs)
    };
    G__14499.cljs$lang$arity$variadic = G__14499__delegate;
    return G__14499
  }();
  set_attr_BANG_ = function(elem, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 2:
        return set_attr_BANG___2.call(this, elem, k);
      case 3:
        return set_attr_BANG___3.call(this, elem, k, v);
      default:
        return set_attr_BANG___4.cljs$lang$arity$variadic(elem, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  set_attr_BANG_.cljs$lang$maxFixedArity = 3;
  set_attr_BANG_.cljs$lang$applyTo = set_attr_BANG___4.cljs$lang$applyTo;
  set_attr_BANG_.cljs$lang$arity$2 = set_attr_BANG___2;
  set_attr_BANG_.cljs$lang$arity$3 = set_attr_BANG___3;
  set_attr_BANG_.cljs$lang$arity$variadic = set_attr_BANG___4.cljs$lang$arity$variadic;
  return set_attr_BANG_
}();
dommy.attrs.remove_attr_BANG_ = function() {
  var remove_attr_BANG_ = null;
  var remove_attr_BANG___2 = function(elem, k) {
    var elem__14511 = dommy.template.__GT_node_like.call(null, elem);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray(["\ufdd0'class", "\ufdd0'classes"]).call(null, k))) {
      elem__14511.className = ""
    }else {
      elem__14511.removeAttribute(cljs.core.name.call(null, k))
    }
    return elem__14511
  };
  var remove_attr_BANG___3 = function() {
    var G__14519__delegate = function(elem, k, ks) {
      var elem__14512 = dommy.template.__GT_node_like.call(null, elem);
      var G__14513__14514 = cljs.core.seq.call(null, cljs.core.cons.call(null, k, ks));
      if(G__14513__14514) {
        var k__14515 = cljs.core.first.call(null, G__14513__14514);
        var G__14513__14516 = G__14513__14514;
        while(true) {
          remove_attr_BANG_.call(null, elem__14512, k__14515);
          var temp__3974__auto____14517 = cljs.core.next.call(null, G__14513__14516);
          if(temp__3974__auto____14517) {
            var G__14513__14518 = temp__3974__auto____14517;
            var G__14520 = cljs.core.first.call(null, G__14513__14518);
            var G__14521 = G__14513__14518;
            k__14515 = G__14520;
            G__14513__14516 = G__14521;
            continue
          }else {
          }
          break
        }
      }else {
      }
      return elem__14512
    };
    var G__14519 = function(elem, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14519__delegate.call(this, elem, k, ks)
    };
    G__14519.cljs$lang$maxFixedArity = 2;
    G__14519.cljs$lang$applyTo = function(arglist__14522) {
      var elem = cljs.core.first(arglist__14522);
      var k = cljs.core.first(cljs.core.next(arglist__14522));
      var ks = cljs.core.rest(cljs.core.next(arglist__14522));
      return G__14519__delegate(elem, k, ks)
    };
    G__14519.cljs$lang$arity$variadic = G__14519__delegate;
    return G__14519
  }();
  remove_attr_BANG_ = function(elem, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 2:
        return remove_attr_BANG___2.call(this, elem, k);
      default:
        return remove_attr_BANG___3.cljs$lang$arity$variadic(elem, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  remove_attr_BANG_.cljs$lang$maxFixedArity = 2;
  remove_attr_BANG_.cljs$lang$applyTo = remove_attr_BANG___3.cljs$lang$applyTo;
  remove_attr_BANG_.cljs$lang$arity$2 = remove_attr_BANG___2;
  remove_attr_BANG_.cljs$lang$arity$variadic = remove_attr_BANG___3.cljs$lang$arity$variadic;
  return remove_attr_BANG_
}();
dommy.attrs.attr = function attr(elem, k) {
  if(cljs.core.truth_(k)) {
    return dommy.template.__GT_node_like.call(null, elem).getAttribute(cljs.core.name.call(null, k))
  }else {
    return null
  }
};
dommy.attrs.hidden_QMARK_ = function hidden_QMARK_(elem) {
  return"none" === dommy.template.__GT_node_like.call(null, elem).style.display
};
dommy.attrs.toggle_BANG_ = function() {
  var toggle_BANG_ = null;
  var toggle_BANG___1 = function(elem) {
    var elem__14528 = dommy.template.__GT_node_like.call(null, elem);
    toggle_BANG_.call(null, elem__14528, dommy.attrs.hidden_QMARK_.call(null, elem__14528));
    return elem__14528
  };
  var toggle_BANG___2 = function(elem, show_QMARK_) {
    var G__14526__14527 = dommy.template.__GT_node_like.call(null, elem);
    G__14526__14527.style.display = cljs.core.truth_(show_QMARK_) ? "" : "none";
    return G__14526__14527
  };
  toggle_BANG_ = function(elem, show_QMARK_) {
    switch(arguments.length) {
      case 1:
        return toggle_BANG___1.call(this, elem);
      case 2:
        return toggle_BANG___2.call(this, elem, show_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  toggle_BANG_.cljs$lang$arity$1 = toggle_BANG___1;
  toggle_BANG_.cljs$lang$arity$2 = toggle_BANG___2;
  return toggle_BANG_
}();
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3822__auto____6563 = this$;
    if(and__3822__auto____6563) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____6563
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2361__auto____6564 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6565 = clojure.browser.event.event_types[goog.typeOf(x__2361__auto____6564)];
      if(or__3824__auto____6565) {
        return or__3824__auto____6565
      }else {
        var or__3824__auto____6566 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____6566) {
          return or__3824__auto____6566
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6567) {
    var vec__6568__6569 = p__6567;
    var k__6570 = cljs.core.nth.call(null, vec__6568__6569, 0, null);
    var v__6571 = cljs.core.nth.call(null, vec__6568__6569, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6570.toLowerCase()), v__6571], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6572) {
    var vec__6573__6574 = p__6572;
    var k__6575 = cljs.core.nth.call(null, vec__6573__6574, 0, null);
    var v__6576 = cljs.core.nth.call(null, vec__6573__6574, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6575.toLowerCase()), v__6576], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen.cljs$lang$arity$3 = listen__3;
  listen.cljs$lang$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once.cljs$lang$arity$3 = listen_once__3;
  listen_once.cljs$lang$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten.cljs$lang$arity$3 = unlisten__3;
  unlisten.cljs$lang$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey(key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent(src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose(e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount()
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("dommy.template");
goog.require("cljs.core");
goog.require("dommy.attrs");
goog.require("clojure.string");
dommy.template.PElement = {};
dommy.template._elem = function _elem(this$) {
  if(function() {
    var and__3822__auto____14113 = this$;
    if(and__3822__auto____14113) {
      return this$.dommy$template$PElement$_elem$arity$1
    }else {
      return and__3822__auto____14113
    }
  }()) {
    return this$.dommy$template$PElement$_elem$arity$1(this$)
  }else {
    var x__2361__auto____14114 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14115 = dommy.template._elem[goog.typeOf(x__2361__auto____14114)];
      if(or__3824__auto____14115) {
        return or__3824__auto____14115
      }else {
        var or__3824__auto____14116 = dommy.template._elem["_"];
        if(or__3824__auto____14116) {
          return or__3824__auto____14116
        }else {
          throw cljs.core.missing_protocol.call(null, "PElement.-elem", this$);
        }
      }
    }().call(null, this$)
  }
};
dommy.template.next_css_index = function next_css_index(s, start_idx) {
  var id_idx__14120 = s.indexOf("#", start_idx);
  var class_idx__14121 = s.indexOf(".", start_idx);
  var idx__14122 = Math.min(id_idx__14120, class_idx__14121);
  if(idx__14122 < 0) {
    return Math.max(id_idx__14120, class_idx__14121)
  }else {
    return idx__14122
  }
};
dommy.template.base_element = function base_element(node_key) {
  var node_str__14132 = cljs.core.name.call(null, node_key);
  var base_idx__14133 = dommy.template.next_css_index.call(null, node_str__14132, 0);
  var tag__14134 = base_idx__14133 > 0 ? node_str__14132.substring(0, base_idx__14133) : base_idx__14133 === 0 ? "div" : "\ufdd0'else" ? node_str__14132 : null;
  var node__14135 = document.createElement(tag__14134);
  if(base_idx__14133 >= 0) {
    var str__14136 = node_str__14132.substring(base_idx__14133);
    while(true) {
      var next_idx__14137 = dommy.template.next_css_index.call(null, str__14136, 1);
      var frag__14138 = next_idx__14137 >= 0 ? str__14136.substring(0, next_idx__14137) : str__14136;
      var G__14139__14140 = frag__14138.charAt(0);
      if(cljs.core._EQ_.call(null, "#", G__14139__14140)) {
        node__14135.setAttribute("id", frag__14138.substring(1))
      }else {
        if(cljs.core._EQ_.call(null, ".", G__14139__14140)) {
          dommy.attrs.add_class_BANG_.call(null, node__14135, frag__14138.substring(1))
        }else {
          if("\ufdd0'else") {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(frag__14138.charAt(0))].join(""));
          }else {
          }
        }
      }
      if(next_idx__14137 >= 0) {
        var G__14141 = str__14136.substring(next_idx__14137);
        str__14136 = G__14141;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return node__14135
};
dommy.template.throw_unable_to_make_node = function throw_unable_to_make_node(node_data) {
  throw[cljs.core.str("Don't know how to make node from: "), cljs.core.str(cljs.core.pr_str.call(null, node_data))].join("");
};
dommy.template.__GT_document_fragment = function() {
  var __GT_document_fragment = null;
  var __GT_document_fragment__1 = function(data) {
    return __GT_document_fragment.call(null, document.createDocumentFragment(), data)
  };
  var __GT_document_fragment__2 = function(result_frag, data) {
    if(function() {
      var G__14151__14152 = data;
      if(G__14151__14152) {
        if(cljs.core.truth_(function() {
          var or__3824__auto____14153 = null;
          if(cljs.core.truth_(or__3824__auto____14153)) {
            return or__3824__auto____14153
          }else {
            return G__14151__14152.dommy$template$PElement$
          }
        }())) {
          return true
        }else {
          if(!G__14151__14152.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14151__14152)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14151__14152)
      }
    }()) {
      result_frag.appendChild(dommy.template._elem.call(null, data));
      return result_frag
    }else {
      if(cljs.core.seq_QMARK_.call(null, data)) {
        var G__14154__14155 = cljs.core.seq.call(null, data);
        if(G__14154__14155) {
          var child__14156 = cljs.core.first.call(null, G__14154__14155);
          var G__14154__14157 = G__14154__14155;
          while(true) {
            __GT_document_fragment.call(null, result_frag, child__14156);
            var temp__3974__auto____14158 = cljs.core.next.call(null, G__14154__14157);
            if(temp__3974__auto____14158) {
              var G__14154__14159 = temp__3974__auto____14158;
              var G__14160 = cljs.core.first.call(null, G__14154__14159);
              var G__14161 = G__14154__14159;
              child__14156 = G__14160;
              G__14154__14157 = G__14161;
              continue
            }else {
            }
            break
          }
        }else {
        }
        return result_frag
      }else {
        if(data == null) {
          return result_frag
        }else {
          if("\ufdd0'else") {
            return dommy.template.throw_unable_to_make_node.call(null, data)
          }else {
            return null
          }
        }
      }
    }
  };
  __GT_document_fragment = function(result_frag, data) {
    switch(arguments.length) {
      case 1:
        return __GT_document_fragment__1.call(this, result_frag);
      case 2:
        return __GT_document_fragment__2.call(this, result_frag, data)
    }
    throw"Invalid arity: " + arguments.length;
  };
  __GT_document_fragment.cljs$lang$arity$1 = __GT_document_fragment__1;
  __GT_document_fragment.cljs$lang$arity$2 = __GT_document_fragment__2;
  return __GT_document_fragment
}();
dommy.template.__GT_node_like = function __GT_node_like(data) {
  if(function() {
    var G__14165__14166 = data;
    if(G__14165__14166) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____14167 = null;
        if(cljs.core.truth_(or__3824__auto____14167)) {
          return or__3824__auto____14167
        }else {
          return G__14165__14166.dommy$template$PElement$
        }
      }())) {
        return true
      }else {
        if(!G__14165__14166.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14165__14166)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14165__14166)
    }
  }()) {
    return dommy.template._elem.call(null, data)
  }else {
    return dommy.template.__GT_document_fragment.call(null, data)
  }
};
dommy.template.compound_element = function compound_element(p__14168) {
  var vec__14208__14209 = p__14168;
  var tag_name__14210 = cljs.core.nth.call(null, vec__14208__14209, 0, null);
  var maybe_attrs__14211 = cljs.core.nth.call(null, vec__14208__14209, 1, null);
  var children__14212 = cljs.core.nthnext.call(null, vec__14208__14209, 2);
  var n__14213 = dommy.template.base_element.call(null, tag_name__14210);
  var attrs__14218 = function() {
    var and__3822__auto____14214 = cljs.core.map_QMARK_.call(null, maybe_attrs__14211);
    if(and__3822__auto____14214) {
      return!function() {
        var G__14215__14216 = maybe_attrs__14211;
        if(G__14215__14216) {
          if(cljs.core.truth_(function() {
            var or__3824__auto____14217 = null;
            if(cljs.core.truth_(or__3824__auto____14217)) {
              return or__3824__auto____14217
            }else {
              return G__14215__14216.dommy$template$PElement$
            }
          }())) {
            return true
          }else {
            if(!G__14215__14216.cljs$lang$protocol_mask$partition$) {
              return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14215__14216)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14215__14216)
        }
      }()
    }else {
      return and__3822__auto____14214
    }
  }() ? maybe_attrs__14211 : null;
  var children__14219 = cljs.core.truth_(attrs__14218) ? children__14212 : cljs.core.cons.call(null, maybe_attrs__14211, children__14212);
  var G__14220__14221 = cljs.core.seq.call(null, attrs__14218);
  if(G__14220__14221) {
    var G__14223__14225 = cljs.core.first.call(null, G__14220__14221);
    var vec__14224__14226 = G__14223__14225;
    var k__14227 = cljs.core.nth.call(null, vec__14224__14226, 0, null);
    var v__14228 = cljs.core.nth.call(null, vec__14224__14226, 1, null);
    var G__14220__14229 = G__14220__14221;
    var G__14223__14230 = G__14223__14225;
    var G__14220__14231 = G__14220__14229;
    while(true) {
      var vec__14232__14233 = G__14223__14230;
      var k__14234 = cljs.core.nth.call(null, vec__14232__14233, 0, null);
      var v__14235 = cljs.core.nth.call(null, vec__14232__14233, 1, null);
      var G__14220__14236 = G__14220__14231;
      var G__14237__14238 = k__14234;
      if(cljs.core._EQ_.call(null, "\ufdd0'classes", G__14237__14238)) {
        var G__14239__14240 = cljs.core.seq.call(null, v__14235);
        if(G__14239__14240) {
          var c__14241 = cljs.core.first.call(null, G__14239__14240);
          var G__14239__14242 = G__14239__14240;
          while(true) {
            dommy.attrs.add_class_BANG_.call(null, n__14213, c__14241);
            var temp__3974__auto____14243 = cljs.core.next.call(null, G__14239__14242);
            if(temp__3974__auto____14243) {
              var G__14239__14244 = temp__3974__auto____14243;
              var G__14247 = cljs.core.first.call(null, G__14239__14244);
              var G__14248 = G__14239__14244;
              c__14241 = G__14247;
              G__14239__14242 = G__14248;
              continue
            }else {
            }
            break
          }
        }else {
        }
      }else {
        if(cljs.core._EQ_.call(null, "\ufdd0'class", G__14237__14238)) {
          dommy.attrs.add_class_BANG_.call(null, n__14213, v__14235)
        }else {
          if("\ufdd0'else") {
            dommy.attrs.set_attr_BANG_.call(null, n__14213, k__14234, v__14235)
          }else {
          }
        }
      }
      var temp__3974__auto____14245 = cljs.core.next.call(null, G__14220__14236);
      if(temp__3974__auto____14245) {
        var G__14220__14246 = temp__3974__auto____14245;
        var G__14249 = cljs.core.first.call(null, G__14220__14246);
        var G__14250 = G__14220__14246;
        G__14223__14230 = G__14249;
        G__14220__14231 = G__14250;
        continue
      }else {
      }
      break
    }
  }else {
  }
  n__14213.appendChild(dommy.template.__GT_node_like.call(null, children__14219));
  return n__14213
};
dommy.template.PElement["string"] = true;
dommy.template._elem["string"] = function(this$) {
  if(cljs.core.keyword_QMARK_.call(null, this$)) {
    return dommy.template.base_element.call(null, this$)
  }else {
    return document.createTextNode([cljs.core.str(this$)].join(""))
  }
};
dommy.template.PElement["number"] = true;
dommy.template._elem["number"] = function(this$) {
  return document.createTextNode([cljs.core.str(this$)].join(""))
};
cljs.core.PersistentVector.prototype.dommy$template$PElement$ = true;
cljs.core.PersistentVector.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return dommy.template.compound_element.call(null, this$)
};
Window.prototype.dommy$template$PElement$ = true;
Window.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
HTMLDocument.prototype.dommy$template$PElement$ = true;
HTMLDocument.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
Text.prototype.dommy$template$PElement$ = true;
Text.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
DocumentFragment.prototype.dommy$template$PElement$ = true;
DocumentFragment.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
HTMLElement.prototype.dommy$template$PElement$ = true;
HTMLElement.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
dommy.template.node = function node(data) {
  if(function() {
    var G__14254__14255 = data;
    if(G__14254__14255) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____14256 = null;
        if(cljs.core.truth_(or__3824__auto____14256)) {
          return or__3824__auto____14256
        }else {
          return G__14254__14255.dommy$template$PElement$
        }
      }())) {
        return true
      }else {
        if(!G__14254__14255.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14254__14255)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__14254__14255)
    }
  }()) {
    return dommy.template._elem.call(null, data)
  }else {
    return dommy.template.throw_unable_to_make_node.call(null, data)
  }
};
dommy.template.html__GT_nodes = function html__GT_nodes(html) {
  var parent__14258 = document.createElement("div");
  parent__14258.insertAdjacentHTML("beforeend", html);
  return Array.prototype.slice.call(parent__14258.childNodes)
};
goog.provide("domina.support");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.dom");
var div__10924 = document.createElement("div");
var test_html__10925 = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
div__10924.innerHTML = test_html__10925;
domina.support.leading_whitespace_QMARK_ = cljs.core._EQ_.call(null, div__10924.firstChild.nodeType, 3);
domina.support.extraneous_tbody_QMARK_ = cljs.core._EQ_.call(null, div__10924.getElementsByTagName("tbody").length, 0);
domina.support.unscoped_html_elements_QMARK_ = cljs.core._EQ_.call(null, div__10924.getElementsByTagName("link").length, 0);
goog.provide("goog.dom.xml");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
goog.dom.xml.createDocument = function(opt_rootTagName, opt_namespaceUri) {
  if(opt_namespaceUri && !opt_rootTagName) {
    throw Error("Can't create document with namespace and no root tag");
  }
  if(document.implementation && document.implementation.createDocument) {
    return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null)
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      if(doc) {
        if(opt_rootTagName) {
          doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT, opt_rootTagName, opt_namespaceUri || ""))
        }
        return doc
      }
    }
  }
  throw Error("Your browser does not support creating new documents");
};
goog.dom.xml.loadXml = function(xml) {
  if(typeof DOMParser != "undefined") {
    return(new DOMParser).parseFromString(xml, "application/xml")
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      doc.loadXML(xml);
      return doc
    }
  }
  throw Error("Your browser does not support loading xml documents");
};
goog.dom.xml.serialize = function(xml) {
  if(typeof XMLSerializer != "undefined") {
    return(new XMLSerializer).serializeToString(xml)
  }
  var text = xml.xml;
  if(text) {
    return text
  }
  throw Error("Your browser does not support serializing XML documents");
};
goog.dom.xml.selectSingleNode = function(node, path) {
  if(typeof node.selectSingleNode != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectSingleNode(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue
    }
  }
  return null
};
goog.dom.xml.selectNodes = function(node, path) {
  if(typeof node.selectNodes != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectNodes(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var results = [];
      var count = nodes.snapshotLength;
      for(var i = 0;i < count;i++) {
        results.push(nodes.snapshotItem(i))
      }
      return results
    }else {
      return[]
    }
  }
};
goog.dom.xml.createMsXmlDocument_ = function() {
  var doc = new ActiveXObject("MSXML2.DOMDocument");
  if(doc) {
    doc.resolveExternals = false;
    doc.validateOnParse = false;
    try {
      doc.setProperty("ProhibitDTD", true);
      doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
      doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
    }catch(e) {
    }
  }
  return doc
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    var type = el.type.toLowerCase();
    switch(type) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
goog.provide("domina");
goog.require("cljs.core");
goog.require("domina.support");
goog.require("goog.dom.classes");
goog.require("goog.events");
goog.require("goog.dom.xml");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("clojure.string");
goog.require("goog.style");
goog.require("cljs.core");
domina.re_html = /<|&#?\w+;/;
domina.re_leading_whitespace = /^\s+/;
domina.re_xhtml_tag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/i;
domina.re_tag_name = /<([\w:]+)/;
domina.re_no_inner_html = /<(?:script|style)/i;
domina.re_tbody = /<tbody/i;
var opt_wrapper__10517 = cljs.core.PersistentVector.fromArray([1, "<select multiple='multiple'>", "</select>"], true);
var table_section_wrapper__10518 = cljs.core.PersistentVector.fromArray([1, "<table>", "</table>"], true);
var cell_wrapper__10519 = cljs.core.PersistentVector.fromArray([3, "<table><tbody><tr>", "</tr></tbody></table>"], true);
domina.wrap_map = cljs.core.ObjMap.fromObject(["col", "\ufdd0'default", "tfoot", "caption", "optgroup", "legend", "area", "td", "thead", "th", "option", "tbody", "tr", "colgroup"], {"col":cljs.core.PersistentVector.fromArray([2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], true), "\ufdd0'default":cljs.core.PersistentVector.fromArray([0, "", ""], true), "tfoot":table_section_wrapper__10518, "caption":table_section_wrapper__10518, "optgroup":opt_wrapper__10517, "legend":cljs.core.PersistentVector.fromArray([1, 
"<fieldset>", "</fieldset>"], true), "area":cljs.core.PersistentVector.fromArray([1, "<map>", "</map>"], true), "td":cell_wrapper__10519, "thead":table_section_wrapper__10518, "th":cell_wrapper__10519, "option":opt_wrapper__10517, "tbody":table_section_wrapper__10518, "tr":cljs.core.PersistentVector.fromArray([2, "<table><tbody>", "</tbody></table>"], true), "colgroup":table_section_wrapper__10518});
domina.remove_extraneous_tbody_BANG_ = function remove_extraneous_tbody_BANG_(div, html) {
  var no_tbody_QMARK___10532 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_tbody, html));
  var tbody__10536 = function() {
    var and__3822__auto____10533 = cljs.core._EQ_.call(null, domina.tag_name, "table");
    if(and__3822__auto____10533) {
      return no_tbody_QMARK___10532
    }else {
      return and__3822__auto____10533
    }
  }() ? function() {
    var and__3822__auto____10534 = div.firstChild;
    if(cljs.core.truth_(and__3822__auto____10534)) {
      return div.firstChild.childNodes
    }else {
      return and__3822__auto____10534
    }
  }() : function() {
    var and__3822__auto____10535 = cljs.core._EQ_.call(null, domina.start_wrap, "<table>");
    if(and__3822__auto____10535) {
      return no_tbody_QMARK___10532
    }else {
      return and__3822__auto____10535
    }
  }() ? divchildNodes : cljs.core.PersistentVector.EMPTY;
  var G__10537__10538 = cljs.core.seq.call(null, tbody__10536);
  if(G__10537__10538) {
    var child__10539 = cljs.core.first.call(null, G__10537__10538);
    var G__10537__10540 = G__10537__10538;
    while(true) {
      if(function() {
        var and__3822__auto____10541 = cljs.core._EQ_.call(null, child__10539.nodeName, "tbody");
        if(and__3822__auto____10541) {
          return cljs.core._EQ_.call(null, child__10539.childNodes.length, 0)
        }else {
          return and__3822__auto____10541
        }
      }()) {
        child__10539.parentNode.removeChild(child__10539)
      }else {
      }
      var temp__3974__auto____10542 = cljs.core.next.call(null, G__10537__10540);
      if(temp__3974__auto____10542) {
        var G__10537__10543 = temp__3974__auto____10542;
        var G__10544 = cljs.core.first.call(null, G__10537__10543);
        var G__10545 = G__10537__10543;
        child__10539 = G__10544;
        G__10537__10540 = G__10545;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
domina.restore_leading_whitespace_BANG_ = function restore_leading_whitespace_BANG_(div, html) {
  return div.insertBefore(document.createTextNode(cljs.core.first.call(null, cljs.core.re_find.call(null, domina.re_leading_whitespace, html))), div.firstChild)
};
domina.html_to_dom = function html_to_dom(html) {
  var html__10559 = clojure.string.replace.call(null, html, domina.re_xhtml_tag, "<$1></$2>");
  var tag_name__10560 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html__10559)))].join("").toLowerCase();
  var vec__10558__10561 = cljs.core._lookup.call(null, domina.wrap_map, tag_name__10560, (new cljs.core.Keyword("\ufdd0'default")).call(null, domina.wrap_map));
  var depth__10562 = cljs.core.nth.call(null, vec__10558__10561, 0, null);
  var start_wrap__10563 = cljs.core.nth.call(null, vec__10558__10561, 1, null);
  var end_wrap__10564 = cljs.core.nth.call(null, vec__10558__10561, 2, null);
  var div__10568 = function() {
    var wrapper__10566 = function() {
      var div__10565 = document.createElement("div");
      div__10565.innerHTML = [cljs.core.str(start_wrap__10563), cljs.core.str(html__10559), cljs.core.str(end_wrap__10564)].join("");
      return div__10565
    }();
    var level__10567 = depth__10562;
    while(true) {
      if(level__10567 > 0) {
        var G__10570 = wrapper__10566.lastChild;
        var G__10571 = level__10567 - 1;
        wrapper__10566 = G__10570;
        level__10567 = G__10571;
        continue
      }else {
        return wrapper__10566
      }
      break
    }
  }();
  if(cljs.core.truth_(domina.support.extraneous_tbody_QMARK_)) {
    domina.remove_extraneous_tbody_BANG_.call(null, div__10568, html__10559)
  }else {
  }
  if(cljs.core.truth_(function() {
    var and__3822__auto____10569 = cljs.core.not.call(null, domina.support.leading_whitespace_QMARK_);
    if(and__3822__auto____10569) {
      return cljs.core.re_find.call(null, domina.re_leading_whitespace, html__10559)
    }else {
      return and__3822__auto____10569
    }
  }())) {
    domina.restore_leading_whitespace_BANG_.call(null, div__10568, html__10559)
  }else {
  }
  return div__10568.childNodes
};
domina.string_to_dom = function string_to_dom(s) {
  if(cljs.core.truth_(cljs.core.re_find.call(null, domina.re_html, s))) {
    return domina.html_to_dom.call(null, s)
  }else {
    return document.createTextNode(s)
  }
};
domina.DomContent = {};
domina.nodes = function nodes(content) {
  if(function() {
    var and__3822__auto____10576 = content;
    if(and__3822__auto____10576) {
      return content.domina$DomContent$nodes$arity$1
    }else {
      return and__3822__auto____10576
    }
  }()) {
    return content.domina$DomContent$nodes$arity$1(content)
  }else {
    var x__2361__auto____10577 = content == null ? null : content;
    return function() {
      var or__3824__auto____10578 = domina.nodes[goog.typeOf(x__2361__auto____10577)];
      if(or__3824__auto____10578) {
        return or__3824__auto____10578
      }else {
        var or__3824__auto____10579 = domina.nodes["_"];
        if(or__3824__auto____10579) {
          return or__3824__auto____10579
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.nodes", content);
        }
      }
    }().call(null, content)
  }
};
domina.single_node = function single_node(nodeseq) {
  if(function() {
    var and__3822__auto____10584 = nodeseq;
    if(and__3822__auto____10584) {
      return nodeseq.domina$DomContent$single_node$arity$1
    }else {
      return and__3822__auto____10584
    }
  }()) {
    return nodeseq.domina$DomContent$single_node$arity$1(nodeseq)
  }else {
    var x__2361__auto____10585 = nodeseq == null ? null : nodeseq;
    return function() {
      var or__3824__auto____10586 = domina.single_node[goog.typeOf(x__2361__auto____10585)];
      if(or__3824__auto____10586) {
        return or__3824__auto____10586
      }else {
        var or__3824__auto____10587 = domina.single_node["_"];
        if(or__3824__auto____10587) {
          return or__3824__auto____10587
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.single-node", nodeseq);
        }
      }
    }().call(null, nodeseq)
  }
};
domina._STAR_debug_STAR_ = true;
domina.log_debug = function() {
  var log_debug__delegate = function(mesg) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10589 = domina._STAR_debug_STAR_;
      if(cljs.core.truth_(and__3822__auto____10589)) {
        return!cljs.core._EQ_.call(null, window.console, undefined)
      }else {
        return and__3822__auto____10589
      }
    }())) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log_debug = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log_debug__delegate.call(this, mesg)
  };
  log_debug.cljs$lang$maxFixedArity = 0;
  log_debug.cljs$lang$applyTo = function(arglist__10590) {
    var mesg = cljs.core.seq(arglist__10590);
    return log_debug__delegate(mesg)
  };
  log_debug.cljs$lang$arity$variadic = log_debug__delegate;
  return log_debug
}();
domina.log = function() {
  var log__delegate = function(mesg) {
    if(cljs.core.truth_(window.console)) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, mesg)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__10591) {
    var mesg = cljs.core.seq(arglist__10591);
    return log__delegate(mesg)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
domina.by_id = function by_id(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
domina.by_class = function by_class(class_name) {
  if(void 0 === domina.t10599) {
    domina.t10599 = function(class_name, by_class, meta10600) {
      this.class_name = class_name;
      this.by_class = by_class;
      this.meta10600 = meta10600;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    domina.t10599.cljs$lang$type = true;
    domina.t10599.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
      return cljs.core.list.call(null, "domina/t10599")
    };
    domina.t10599.prototype.domina$DomContent$ = true;
    domina.t10599.prototype.domina$DomContent$nodes$arity$1 = function(_) {
      var this__10602 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementsByClass(cljs.core.name.call(null, this__10602.class_name)))
    };
    domina.t10599.prototype.domina$DomContent$single_node$arity$1 = function(_) {
      var this__10603 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementByClass(cljs.core.name.call(null, this__10603.class_name)))
    };
    domina.t10599.prototype.cljs$core$IMeta$_meta$arity$1 = function(_10601) {
      var this__10604 = this;
      return this__10604.meta10600
    };
    domina.t10599.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_10601, meta10600) {
      var this__10605 = this;
      return new domina.t10599(this__10605.class_name, this__10605.by_class, meta10600)
    };
    domina.t10599
  }else {
  }
  return new domina.t10599(class_name, by_class, null)
};
domina.children = function children(content) {
  return cljs.core.doall.call(null, cljs.core.mapcat.call(null, goog.dom.getChildren, domina.nodes.call(null, content)))
};
domina.clone = function clone(content) {
  return cljs.core.map.call(null, function(p1__10606_SHARP_) {
    return p1__10606_SHARP_.cloneNode(true)
  }, domina.nodes.call(null, content))
};
domina.append_BANG_ = function append_BANG_(parent_content, child_content) {
  domina.apply_with_cloning.call(null, goog.dom.appendChild, parent_content, child_content);
  return parent_content
};
domina.insert_BANG_ = function insert_BANG_(parent_content, child_content, idx) {
  domina.apply_with_cloning.call(null, function(p1__10607_SHARP_, p2__10608_SHARP_) {
    return goog.dom.insertChildAt(p1__10607_SHARP_, p2__10608_SHARP_, idx)
  }, parent_content, child_content);
  return parent_content
};
domina.prepend_BANG_ = function prepend_BANG_(parent_content, child_content) {
  domina.insert_BANG_.call(null, parent_content, child_content, 0);
  return parent_content
};
domina.insert_before_BANG_ = function insert_before_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10610_SHARP_, p2__10609_SHARP_) {
    return goog.dom.insertSiblingBefore(p2__10609_SHARP_, p1__10610_SHARP_)
  }, content, new_content);
  return content
};
domina.insert_after_BANG_ = function insert_after_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10612_SHARP_, p2__10611_SHARP_) {
    return goog.dom.insertSiblingAfter(p2__10611_SHARP_, p1__10612_SHARP_)
  }, content, new_content);
  return content
};
domina.swap_content_BANG_ = function swap_content_BANG_(old_content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10614_SHARP_, p2__10613_SHARP_) {
    return goog.dom.replaceNode(p2__10613_SHARP_, p1__10614_SHARP_)
  }, old_content, new_content);
  return old_content
};
domina.detach_BANG_ = function detach_BANG_(content) {
  return cljs.core.doall.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_BANG_ = function destroy_BANG_(content) {
  return cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_children_BANG_ = function destroy_children_BANG_(content) {
  cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeChildren, domina.nodes.call(null, content)));
  return content
};
domina.style = function style(content, name) {
  var s__10616 = goog.style.getStyle(domina.single_node.call(null, content), cljs.core.name.call(null, name));
  if(cljs.core.truth_(clojure.string.blank_QMARK_.call(null, s__10616))) {
    return null
  }else {
    return s__10616
  }
};
domina.attr = function attr(content, name) {
  return domina.single_node.call(null, content).getAttribute(cljs.core.name.call(null, name))
};
domina.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(content, name, value) {
    var G__10623__10624 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10623__10624) {
      var n__10625 = cljs.core.first.call(null, G__10623__10624);
      var G__10623__10626 = G__10623__10624;
      while(true) {
        goog.style.setStyle(n__10625, cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____10627 = cljs.core.next.call(null, G__10623__10626);
        if(temp__3974__auto____10627) {
          var G__10623__10628 = temp__3974__auto____10627;
          var G__10629 = cljs.core.first.call(null, G__10623__10628);
          var G__10630 = G__10623__10628;
          n__10625 = G__10629;
          G__10623__10626 = G__10630;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_style_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_style_BANG___delegate.call(this, content, name, value)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 2;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__10631) {
    var content = cljs.core.first(arglist__10631);
    var name = cljs.core.first(cljs.core.next(arglist__10631));
    var value = cljs.core.rest(cljs.core.next(arglist__10631));
    return set_style_BANG___delegate(content, name, value)
  };
  set_style_BANG_.cljs$lang$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
domina.set_attr_BANG_ = function() {
  var set_attr_BANG___delegate = function(content, name, value) {
    var G__10638__10639 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10638__10639) {
      var n__10640 = cljs.core.first.call(null, G__10638__10639);
      var G__10638__10641 = G__10638__10639;
      while(true) {
        n__10640.setAttribute(cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____10642 = cljs.core.next.call(null, G__10638__10641);
        if(temp__3974__auto____10642) {
          var G__10638__10643 = temp__3974__auto____10642;
          var G__10644 = cljs.core.first.call(null, G__10638__10643);
          var G__10645 = G__10638__10643;
          n__10640 = G__10644;
          G__10638__10641 = G__10645;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_attr_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_attr_BANG___delegate.call(this, content, name, value)
  };
  set_attr_BANG_.cljs$lang$maxFixedArity = 2;
  set_attr_BANG_.cljs$lang$applyTo = function(arglist__10646) {
    var content = cljs.core.first(arglist__10646);
    var name = cljs.core.first(cljs.core.next(arglist__10646));
    var value = cljs.core.rest(cljs.core.next(arglist__10646));
    return set_attr_BANG___delegate(content, name, value)
  };
  set_attr_BANG_.cljs$lang$arity$variadic = set_attr_BANG___delegate;
  return set_attr_BANG_
}();
domina.remove_attr_BANG_ = function remove_attr_BANG_(content, name) {
  var G__10653__10654 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10653__10654) {
    var n__10655 = cljs.core.first.call(null, G__10653__10654);
    var G__10653__10656 = G__10653__10654;
    while(true) {
      n__10655.removeAttribute(cljs.core.name.call(null, name));
      var temp__3974__auto____10657 = cljs.core.next.call(null, G__10653__10656);
      if(temp__3974__auto____10657) {
        var G__10653__10658 = temp__3974__auto____10657;
        var G__10659 = cljs.core.first.call(null, G__10653__10658);
        var G__10660 = G__10653__10658;
        n__10655 = G__10659;
        G__10653__10656 = G__10660;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.parse_style_attributes = function parse_style_attributes(style) {
  return cljs.core.reduce.call(null, function(acc, pair) {
    var vec__10666__10667 = pair.split(/\s*:\s*/);
    var k__10668 = cljs.core.nth.call(null, vec__10666__10667, 0, null);
    var v__10669 = cljs.core.nth.call(null, vec__10666__10667, 1, null);
    if(cljs.core.truth_(function() {
      var and__3822__auto____10670 = k__10668;
      if(cljs.core.truth_(and__3822__auto____10670)) {
        return v__10669
      }else {
        return and__3822__auto____10670
      }
    }())) {
      return cljs.core.assoc.call(null, acc, cljs.core.keyword.call(null, k__10668.toLowerCase()), v__10669)
    }else {
      return acc
    }
  }, cljs.core.ObjMap.EMPTY, style.split(/\s*;\s*/))
};
domina.styles = function styles(content) {
  var style__10673 = domina.attr.call(null, content, "style");
  if(cljs.core.string_QMARK_.call(null, style__10673)) {
    return domina.parse_style_attributes.call(null, style__10673)
  }else {
    if(cljs.core.truth_(style__10673.cssText)) {
      return domina.parse_style_attributes.call(null, style__10673.cssText)
    }else {
      return null
    }
  }
};
domina.attrs = function attrs(content) {
  var node__10679 = domina.single_node.call(null, content);
  var attrs__10680 = node__10679.attributes;
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.map.call(null, function(p1__10671_SHARP_) {
    var attr__10681 = attrs__10680.item(p1__10671_SHARP_);
    var value__10682 = attr__10681.nodeValue;
    if(function() {
      var and__3822__auto____10683 = cljs.core.not_EQ_.call(null, null, value__10682);
      if(and__3822__auto____10683) {
        return cljs.core.not_EQ_.call(null, "", value__10682)
      }else {
        return and__3822__auto____10683
      }
    }()) {
      return cljs.core.PersistentArrayMap.fromArrays([cljs.core.keyword.call(null, attr__10681.nodeName.toLowerCase())], [attr__10681.nodeValue])
    }else {
      return null
    }
  }, cljs.core.range.call(null, attrs__10680.length))))
};
domina.set_styles_BANG_ = function set_styles_BANG_(content, styles) {
  var G__10703__10704 = cljs.core.seq.call(null, styles);
  if(G__10703__10704) {
    var G__10706__10708 = cljs.core.first.call(null, G__10703__10704);
    var vec__10707__10709 = G__10706__10708;
    var name__10710 = cljs.core.nth.call(null, vec__10707__10709, 0, null);
    var value__10711 = cljs.core.nth.call(null, vec__10707__10709, 1, null);
    var G__10703__10712 = G__10703__10704;
    var G__10706__10713 = G__10706__10708;
    var G__10703__10714 = G__10703__10712;
    while(true) {
      var vec__10715__10716 = G__10706__10713;
      var name__10717 = cljs.core.nth.call(null, vec__10715__10716, 0, null);
      var value__10718 = cljs.core.nth.call(null, vec__10715__10716, 1, null);
      var G__10703__10719 = G__10703__10714;
      domina.set_style_BANG_.call(null, content, name__10717, value__10718);
      var temp__3974__auto____10720 = cljs.core.next.call(null, G__10703__10719);
      if(temp__3974__auto____10720) {
        var G__10703__10721 = temp__3974__auto____10720;
        var G__10722 = cljs.core.first.call(null, G__10703__10721);
        var G__10723 = G__10703__10721;
        G__10706__10713 = G__10722;
        G__10703__10714 = G__10723;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.set_attrs_BANG_ = function set_attrs_BANG_(content, attrs) {
  var G__10743__10744 = cljs.core.seq.call(null, attrs);
  if(G__10743__10744) {
    var G__10746__10748 = cljs.core.first.call(null, G__10743__10744);
    var vec__10747__10749 = G__10746__10748;
    var name__10750 = cljs.core.nth.call(null, vec__10747__10749, 0, null);
    var value__10751 = cljs.core.nth.call(null, vec__10747__10749, 1, null);
    var G__10743__10752 = G__10743__10744;
    var G__10746__10753 = G__10746__10748;
    var G__10743__10754 = G__10743__10752;
    while(true) {
      var vec__10755__10756 = G__10746__10753;
      var name__10757 = cljs.core.nth.call(null, vec__10755__10756, 0, null);
      var value__10758 = cljs.core.nth.call(null, vec__10755__10756, 1, null);
      var G__10743__10759 = G__10743__10754;
      domina.set_attr_BANG_.call(null, content, name__10757, value__10758);
      var temp__3974__auto____10760 = cljs.core.next.call(null, G__10743__10759);
      if(temp__3974__auto____10760) {
        var G__10743__10761 = temp__3974__auto____10760;
        var G__10762 = cljs.core.first.call(null, G__10743__10761);
        var G__10763 = G__10743__10761;
        G__10746__10753 = G__10762;
        G__10743__10754 = G__10763;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.has_class_QMARK_ = function has_class_QMARK_(content, class$) {
  return goog.dom.classes.has(domina.single_node.call(null, content), class$)
};
domina.add_class_BANG_ = function add_class_BANG_(content, class$) {
  var G__10770__10771 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10770__10771) {
    var node__10772 = cljs.core.first.call(null, G__10770__10771);
    var G__10770__10773 = G__10770__10771;
    while(true) {
      goog.dom.classes.add(node__10772, class$);
      var temp__3974__auto____10774 = cljs.core.next.call(null, G__10770__10773);
      if(temp__3974__auto____10774) {
        var G__10770__10775 = temp__3974__auto____10774;
        var G__10776 = cljs.core.first.call(null, G__10770__10775);
        var G__10777 = G__10770__10775;
        node__10772 = G__10776;
        G__10770__10773 = G__10777;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.remove_class_BANG_ = function remove_class_BANG_(content, class$) {
  var G__10784__10785 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10784__10785) {
    var node__10786 = cljs.core.first.call(null, G__10784__10785);
    var G__10784__10787 = G__10784__10785;
    while(true) {
      goog.dom.classes.remove(node__10786, class$);
      var temp__3974__auto____10788 = cljs.core.next.call(null, G__10784__10787);
      if(temp__3974__auto____10788) {
        var G__10784__10789 = temp__3974__auto____10788;
        var G__10790 = cljs.core.first.call(null, G__10784__10789);
        var G__10791 = G__10784__10789;
        node__10786 = G__10790;
        G__10784__10787 = G__10791;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.classes = function classes(content) {
  return cljs.core.seq.call(null, goog.dom.classes.get(domina.single_node.call(null, content)))
};
domina.set_classes_BANG_ = function set_classes_BANG_(content, classes) {
  var classes__10799 = cljs.core.coll_QMARK_.call(null, classes) ? clojure.string.join.call(null, " ", classes) : classes;
  var G__10800__10801 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10800__10801) {
    var node__10802 = cljs.core.first.call(null, G__10800__10801);
    var G__10800__10803 = G__10800__10801;
    while(true) {
      goog.dom.classes.set(node__10802, classes__10799);
      var temp__3974__auto____10804 = cljs.core.next.call(null, G__10800__10803);
      if(temp__3974__auto____10804) {
        var G__10800__10805 = temp__3974__auto____10804;
        var G__10806 = cljs.core.first.call(null, G__10800__10805);
        var G__10807 = G__10800__10805;
        node__10802 = G__10806;
        G__10800__10803 = G__10807;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.text = function text(content) {
  return goog.string.trim(goog.dom.getTextContent(domina.single_node.call(null, content)))
};
domina.set_text_BANG_ = function set_text_BANG_(content, value) {
  var G__10814__10815 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10814__10815) {
    var node__10816 = cljs.core.first.call(null, G__10814__10815);
    var G__10814__10817 = G__10814__10815;
    while(true) {
      goog.dom.setTextContent(node__10816, value);
      var temp__3974__auto____10818 = cljs.core.next.call(null, G__10814__10817);
      if(temp__3974__auto____10818) {
        var G__10814__10819 = temp__3974__auto____10818;
        var G__10820 = cljs.core.first.call(null, G__10814__10819);
        var G__10821 = G__10814__10819;
        node__10816 = G__10820;
        G__10814__10817 = G__10821;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.value = function value(content) {
  return goog.dom.forms.getValue(domina.single_node.call(null, content))
};
domina.set_value_BANG_ = function set_value_BANG_(content, value) {
  var G__10828__10829 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10828__10829) {
    var node__10830 = cljs.core.first.call(null, G__10828__10829);
    var G__10828__10831 = G__10828__10829;
    while(true) {
      goog.dom.forms.setValue(node__10830, value);
      var temp__3974__auto____10832 = cljs.core.next.call(null, G__10828__10831);
      if(temp__3974__auto____10832) {
        var G__10828__10833 = temp__3974__auto____10832;
        var G__10834 = cljs.core.first.call(null, G__10828__10833);
        var G__10835 = G__10828__10833;
        node__10830 = G__10834;
        G__10828__10831 = G__10835;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.html = function html(content) {
  return domina.single_node.call(null, content).innerHTML
};
domina.replace_children_BANG_ = function replace_children_BANG_(content, inner_content) {
  return domina.append_BANG_.call(null, domina.destroy_children_BANG_.call(null, content), inner_content)
};
domina.set_inner_html_BANG_ = function set_inner_html_BANG_(content, html_string) {
  var allows_inner_html_QMARK___10852 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_no_inner_html, html_string));
  var leading_whitespace_QMARK___10853 = cljs.core.re_find.call(null, domina.re_leading_whitespace, html_string);
  var tag_name__10854 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html_string)))].join("").toLowerCase();
  var special_tag_QMARK___10855 = cljs.core.contains_QMARK_.call(null, domina.wrap_map, tag_name__10854);
  if(cljs.core.truth_(function() {
    var and__3822__auto____10856 = allows_inner_html_QMARK___10852;
    if(and__3822__auto____10856) {
      var and__3822__auto____10858 = function() {
        var or__3824__auto____10857 = domina.support.leading_whitespace_QMARK_;
        if(cljs.core.truth_(or__3824__auto____10857)) {
          return or__3824__auto____10857
        }else {
          return cljs.core.not.call(null, leading_whitespace_QMARK___10853)
        }
      }();
      if(cljs.core.truth_(and__3822__auto____10858)) {
        return!special_tag_QMARK___10855
      }else {
        return and__3822__auto____10858
      }
    }else {
      return and__3822__auto____10856
    }
  }())) {
    var value__10859 = clojure.string.replace.call(null, html_string, domina.re_xhtml_tag, "<$1></$2>");
    try {
      var G__10862__10863 = cljs.core.seq.call(null, domina.nodes.call(null, content));
      if(G__10862__10863) {
        var node__10864 = cljs.core.first.call(null, G__10862__10863);
        var G__10862__10865 = G__10862__10863;
        while(true) {
          goog.events.removeAll(node__10864);
          node__10864.innerHTML = value__10859;
          var temp__3974__auto____10866 = cljs.core.next.call(null, G__10862__10865);
          if(temp__3974__auto____10866) {
            var G__10862__10867 = temp__3974__auto____10866;
            var G__10868 = cljs.core.first.call(null, G__10862__10867);
            var G__10869 = G__10862__10867;
            node__10864 = G__10868;
            G__10862__10865 = G__10869;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }catch(e10860) {
      if(cljs.core.instance_QMARK_.call(null, domina.Exception, e10860)) {
        var e__10861 = e10860;
        domina.replace_children_BANG_.call(null, content, value__10859)
      }else {
        if("\ufdd0'else") {
          throw e10860;
        }else {
        }
      }
    }
  }else {
    domina.replace_children_BANG_.call(null, content, html_string)
  }
  return content
};
domina.set_html_BANG_ = function set_html_BANG_(content, inner_content) {
  if(cljs.core.string_QMARK_.call(null, inner_content)) {
    return domina.set_inner_html_BANG_.call(null, content, inner_content)
  }else {
    return domina.replace_children_BANG_.call(null, content, inner_content)
  }
};
domina.get_data = function() {
  var get_data = null;
  var get_data__2 = function(node, key) {
    return get_data.call(null, node, key, false)
  };
  var get_data__3 = function(node, key, bubble) {
    var m__10875 = domina.single_node.call(null, node).__domina_data;
    var value__10876 = cljs.core.truth_(m__10875) ? cljs.core._lookup.call(null, m__10875, key, null) : null;
    if(cljs.core.truth_(function() {
      var and__3822__auto____10877 = bubble;
      if(cljs.core.truth_(and__3822__auto____10877)) {
        return value__10876 == null
      }else {
        return and__3822__auto____10877
      }
    }())) {
      var temp__3974__auto____10878 = domina.single_node.call(null, node).parentNode;
      if(cljs.core.truth_(temp__3974__auto____10878)) {
        var parent__10879 = temp__3974__auto____10878;
        return get_data.call(null, parent__10879, key, true)
      }else {
        return null
      }
    }else {
      return value__10876
    }
  };
  get_data = function(node, key, bubble) {
    switch(arguments.length) {
      case 2:
        return get_data__2.call(this, node, key);
      case 3:
        return get_data__3.call(this, node, key, bubble)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_data.cljs$lang$arity$2 = get_data__2;
  get_data.cljs$lang$arity$3 = get_data__3;
  return get_data
}();
domina.set_data_BANG_ = function set_data_BANG_(node, key, value) {
  var m__10885 = function() {
    var or__3824__auto____10884 = domina.single_node.call(null, node).__domina_data;
    if(cljs.core.truth_(or__3824__auto____10884)) {
      return or__3824__auto____10884
    }else {
      return cljs.core.ObjMap.EMPTY
    }
  }();
  return domina.single_node.call(null, node).__domina_data = cljs.core.assoc.call(null, m__10885, key, value)
};
domina.apply_with_cloning = function apply_with_cloning(f, parent_content, child_content) {
  var parents__10897 = domina.nodes.call(null, parent_content);
  var children__10898 = domina.nodes.call(null, child_content);
  var first_child__10906 = function() {
    var frag__10899 = document.createDocumentFragment();
    var G__10900__10901 = cljs.core.seq.call(null, children__10898);
    if(G__10900__10901) {
      var child__10902 = cljs.core.first.call(null, G__10900__10901);
      var G__10900__10903 = G__10900__10901;
      while(true) {
        frag__10899.appendChild(child__10902);
        var temp__3974__auto____10904 = cljs.core.next.call(null, G__10900__10903);
        if(temp__3974__auto____10904) {
          var G__10900__10905 = temp__3974__auto____10904;
          var G__10908 = cljs.core.first.call(null, G__10900__10905);
          var G__10909 = G__10900__10905;
          child__10902 = G__10908;
          G__10900__10903 = G__10909;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return frag__10899
  }();
  var other_children__10907 = cljs.core.doall.call(null, cljs.core.repeatedly.call(null, cljs.core.count.call(null, parents__10897) - 1, function() {
    return first_child__10906.cloneNode(true)
  }));
  if(cljs.core.seq.call(null, parents__10897)) {
    f.call(null, cljs.core.first.call(null, parents__10897), first_child__10906);
    return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__10880_SHARP_, p2__10881_SHARP_) {
      return f.call(null, p1__10880_SHARP_, p2__10881_SHARP_)
    }, cljs.core.rest.call(null, parents__10897), other_children__10907))
  }else {
    return null
  }
};
domina.lazy_nl_via_item = function() {
  var lazy_nl_via_item = null;
  var lazy_nl_via_item__1 = function(nl) {
    return lazy_nl_via_item.call(null, nl, 0)
  };
  var lazy_nl_via_item__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl.item(n), lazy_nl_via_item.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_item = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_item__1.call(this, nl);
      case 2:
        return lazy_nl_via_item__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_item.cljs$lang$arity$1 = lazy_nl_via_item__1;
  lazy_nl_via_item.cljs$lang$arity$2 = lazy_nl_via_item__2;
  return lazy_nl_via_item
}();
domina.lazy_nl_via_array_ref = function() {
  var lazy_nl_via_array_ref = null;
  var lazy_nl_via_array_ref__1 = function(nl) {
    return lazy_nl_via_array_ref.call(null, nl, 0)
  };
  var lazy_nl_via_array_ref__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl[n], lazy_nl_via_array_ref.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_array_ref = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_array_ref__1.call(this, nl);
      case 2:
        return lazy_nl_via_array_ref__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_array_ref.cljs$lang$arity$1 = lazy_nl_via_array_ref__1;
  lazy_nl_via_array_ref.cljs$lang$arity$2 = lazy_nl_via_array_ref__2;
  return lazy_nl_via_array_ref
}();
domina.lazy_nodelist = function lazy_nodelist(nl) {
  if(cljs.core.truth_(nl.item)) {
    return domina.lazy_nl_via_item.call(null, nl)
  }else {
    return domina.lazy_nl_via_array_ref.call(null, nl)
  }
};
domina.array_like_QMARK_ = function array_like_QMARK_(obj) {
  var and__3822__auto____10911 = obj;
  if(cljs.core.truth_(and__3822__auto____10911)) {
    return obj.length
  }else {
    return and__3822__auto____10911
  }
};
domina.normalize_seq = function normalize_seq(list_thing) {
  if(list_thing == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10915__10916 = list_thing;
      if(G__10915__10916) {
        if(function() {
          var or__3824__auto____10917 = G__10915__10916.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____10917) {
            return or__3824__auto____10917
          }else {
            return G__10915__10916.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10915__10916.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10915__10916)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10915__10916)
      }
    }()) {
      return cljs.core.seq.call(null, list_thing)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, list_thing))) {
        return domina.lazy_nodelist.call(null, list_thing)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([list_thing], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["_"] = true;
domina.nodes["_"] = function(content) {
  if(content == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10918__10919 = content;
      if(G__10918__10919) {
        if(function() {
          var or__3824__auto____10920 = G__10918__10919.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____10920) {
            return or__3824__auto____10920
          }else {
            return G__10918__10919.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10918__10919.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10918__10919)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10918__10919)
      }
    }()) {
      return cljs.core.seq.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return domina.lazy_nodelist.call(null, content)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([content], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.single_node["_"] = function(content) {
  if(content == null) {
    return null
  }else {
    if(function() {
      var G__10921__10922 = content;
      if(G__10921__10922) {
        if(function() {
          var or__3824__auto____10923 = G__10921__10922.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____10923) {
            return or__3824__auto____10923
          }else {
            return G__10921__10922.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10921__10922.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10921__10922)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10921__10922)
      }
    }()) {
      return cljs.core.first.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return content.item(0)
      }else {
        if("\ufdd0'default") {
          return content
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["string"] = true;
domina.nodes["string"] = function(s) {
  return cljs.core.doall.call(null, domina.nodes.call(null, domina.string_to_dom.call(null, s)))
};
domina.single_node["string"] = function(s) {
  return domina.single_node.call(null, domina.string_to_dom.call(null, s))
};
if(cljs.core.truth_(typeof NodeList != "undefined")) {
  NodeList.prototype.cljs$core$ISeqable$ = true;
  NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  NodeList.prototype.cljs$core$IIndexed$ = true;
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  NodeList.prototype.cljs$core$ICounted$ = true;
  NodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof StaticNodeList != "undefined")) {
  StaticNodeList.prototype.cljs$core$ISeqable$ = true;
  StaticNodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$ = true;
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  StaticNodeList.prototype.cljs$core$ICounted$ = true;
  StaticNodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof HTMLCollection != "undefined")) {
  HTMLCollection.prototype.cljs$core$ISeqable$ = true;
  HTMLCollection.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
    return domina.lazy_nodelist.call(null, coll)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$ = true;
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
    return coll.item(n)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
    if(coll.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, coll, n)
    }
  };
  HTMLCollection.prototype.cljs$core$ICounted$ = true;
  HTMLCollection.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
    return coll.length
  }
}else {
}
;goog.provide("cljs_intro.estimate");
goog.require("cljs.core");
goog.require("dommy.template");
goog.require("clojure.browser.event");
goog.require("domina");
cljs_intro.estimate.stats_button = domina.by_id.call(null, "stats-btn");
cljs_intro.estimate.all_estimate = function all_estimate(amount, point_cap, stories, choices) {
  if(function() {
    var and__3822__auto____120694 = cljs.core._EQ_.call(null, amount, 0);
    if(and__3822__auto____120694) {
      return cljs.core._EQ_.call(null, stories, 0)
    }else {
      return and__3822__auto____120694
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([choices], true)
  }else {
    if(function() {
      var or__3824__auto____120695 = amount < 0;
      if(or__3824__auto____120695) {
        return or__3824__auto____120695
      }else {
        var or__3824__auto____120696 = cljs.core._EQ_.call(null, point_cap, 0);
        if(or__3824__auto____120696) {
          return or__3824__auto____120696
        }else {
          return cljs.core._EQ_.call(null, stories, 0)
        }
      }
    }()) {
      return cljs.core.list.call(null)
    }else {
      if("\ufdd0'else") {
        return cljs.core.into.call(null, all_estimate.call(null, amount - point_cap, point_cap, stories - 1, cljs.core.conj.call(null, choices, point_cap)), all_estimate.call(null, amount, point_cap - 1, stories, choices))
      }else {
        return null
      }
    }
  }
};
cljs_intro.estimate.estimate = function estimate(amount, stories) {
  var coll__120698 = cljs_intro.estimate.all_estimate.call(null, amount, 3, stories, cljs.core.PersistentVector.EMPTY);
  if(cljs.core.empty_QMARK_.call(null, coll__120698)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    return cljs.core.shuffle.call(null, cljs.core.rand_nth.call(null, coll__120698))
  }
};
cljs_intro.estimate.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__120704) {
          var vec__120705__120706 = p__120704;
          var k__120707 = cljs.core.nth.call(null, vec__120705__120706, 0, null);
          var v__120708 = cljs.core.nth.call(null, vec__120705__120706, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__120707), clj__GT_js.call(null, v__120708))
        }, cljs.core.ObjMap.EMPTY, x).strobj()
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
clojure.browser.event.listen.call(null, cljs_intro.estimate.stats_button, "click", function() {
  cljs_intro.estimate.estimates = cljs_intro.estimate.estimate.call(null, domina.value.call(null, domina.by_id.call(null, "velocity")), domina.value.call(null, domina.by_id.call(null, "stories")));
  return domina.set_html_BANG_.call(null, domina.by_id.call(null, "res"), dommy.template.node.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div.stories_table", function() {
    var iter__2460__auto____120715 = function iter__120709(s__120710) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__120710__120713 = s__120710;
        while(true) {
          if(cljs.core.seq.call(null, s__120710__120713)) {
            var est__120714 = cljs.core.first.call(null, s__120710__120713);
            return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div.story", cljs.core.PersistentVector.fromArray(["\ufdd0'img.triangle", cljs.core.ObjMap.fromObject(["\ufdd0'src"], {"\ufdd0'src":"/images/triangle.png"})], true), cljs.core.PersistentVector.fromArray(["\ufdd0'img.star", cljs.core.ObjMap.fromObject(["\ufdd0'src"], {"\ufdd0'src":"/images/star.png"})], true), cljs.core.PersistentVector.fromArray(["\ufdd0'span.text", cljs_intro.stories.rand_sentence.call(null)], 
            true), cljs.core.PersistentVector.fromArray(["\ufdd0'div.estimate", est__120714, cljs.core.PersistentVector.fromArray(["\ufdd0'img.start", cljs.core.ObjMap.fromObject(["\ufdd0'src"], {"\ufdd0'src":"/images/start.png"})], true)], true)], true), iter__120709.call(null, cljs.core.rest.call(null, s__120710__120713)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2460__auto____120715.call(null, cljs_intro.estimate.estimates)
  }()], true)))
});
