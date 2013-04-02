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
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
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
  var x__7080 = x == null ? null : x;
  if(p[goog.typeOf(x__7080)]) {
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
    var G__7081__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__7081 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7081__delegate.call(this, array, i, idxs)
    };
    G__7081.cljs$lang$maxFixedArity = 2;
    G__7081.cljs$lang$applyTo = function(arglist__7082) {
      var array = cljs.core.first(arglist__7082);
      var i = cljs.core.first(cljs.core.next(arglist__7082));
      var idxs = cljs.core.rest(cljs.core.next(arglist__7082));
      return G__7081__delegate(array, i, idxs)
    };
    G__7081.cljs$lang$arity$variadic = G__7081__delegate;
    return G__7081
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
      var and__3822__auto____7167 = this$;
      if(and__3822__auto____7167) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____7167
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2361__auto____7168 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7169 = cljs.core._invoke[goog.typeOf(x__2361__auto____7168)];
        if(or__3824__auto____7169) {
          return or__3824__auto____7169
        }else {
          var or__3824__auto____7170 = cljs.core._invoke["_"];
          if(or__3824__auto____7170) {
            return or__3824__auto____7170
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____7171 = this$;
      if(and__3822__auto____7171) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____7171
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2361__auto____7172 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7173 = cljs.core._invoke[goog.typeOf(x__2361__auto____7172)];
        if(or__3824__auto____7173) {
          return or__3824__auto____7173
        }else {
          var or__3824__auto____7174 = cljs.core._invoke["_"];
          if(or__3824__auto____7174) {
            return or__3824__auto____7174
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____7175 = this$;
      if(and__3822__auto____7175) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____7175
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2361__auto____7176 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7177 = cljs.core._invoke[goog.typeOf(x__2361__auto____7176)];
        if(or__3824__auto____7177) {
          return or__3824__auto____7177
        }else {
          var or__3824__auto____7178 = cljs.core._invoke["_"];
          if(or__3824__auto____7178) {
            return or__3824__auto____7178
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____7179 = this$;
      if(and__3822__auto____7179) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____7179
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2361__auto____7180 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7181 = cljs.core._invoke[goog.typeOf(x__2361__auto____7180)];
        if(or__3824__auto____7181) {
          return or__3824__auto____7181
        }else {
          var or__3824__auto____7182 = cljs.core._invoke["_"];
          if(or__3824__auto____7182) {
            return or__3824__auto____7182
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____7183 = this$;
      if(and__3822__auto____7183) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____7183
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2361__auto____7184 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7185 = cljs.core._invoke[goog.typeOf(x__2361__auto____7184)];
        if(or__3824__auto____7185) {
          return or__3824__auto____7185
        }else {
          var or__3824__auto____7186 = cljs.core._invoke["_"];
          if(or__3824__auto____7186) {
            return or__3824__auto____7186
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____7187 = this$;
      if(and__3822__auto____7187) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____7187
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2361__auto____7188 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7189 = cljs.core._invoke[goog.typeOf(x__2361__auto____7188)];
        if(or__3824__auto____7189) {
          return or__3824__auto____7189
        }else {
          var or__3824__auto____7190 = cljs.core._invoke["_"];
          if(or__3824__auto____7190) {
            return or__3824__auto____7190
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____7191 = this$;
      if(and__3822__auto____7191) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____7191
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2361__auto____7192 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7193 = cljs.core._invoke[goog.typeOf(x__2361__auto____7192)];
        if(or__3824__auto____7193) {
          return or__3824__auto____7193
        }else {
          var or__3824__auto____7194 = cljs.core._invoke["_"];
          if(or__3824__auto____7194) {
            return or__3824__auto____7194
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____7195 = this$;
      if(and__3822__auto____7195) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____7195
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2361__auto____7196 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7197 = cljs.core._invoke[goog.typeOf(x__2361__auto____7196)];
        if(or__3824__auto____7197) {
          return or__3824__auto____7197
        }else {
          var or__3824__auto____7198 = cljs.core._invoke["_"];
          if(or__3824__auto____7198) {
            return or__3824__auto____7198
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____7199 = this$;
      if(and__3822__auto____7199) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____7199
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2361__auto____7200 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7201 = cljs.core._invoke[goog.typeOf(x__2361__auto____7200)];
        if(or__3824__auto____7201) {
          return or__3824__auto____7201
        }else {
          var or__3824__auto____7202 = cljs.core._invoke["_"];
          if(or__3824__auto____7202) {
            return or__3824__auto____7202
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____7203 = this$;
      if(and__3822__auto____7203) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____7203
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2361__auto____7204 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7205 = cljs.core._invoke[goog.typeOf(x__2361__auto____7204)];
        if(or__3824__auto____7205) {
          return or__3824__auto____7205
        }else {
          var or__3824__auto____7206 = cljs.core._invoke["_"];
          if(or__3824__auto____7206) {
            return or__3824__auto____7206
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____7207 = this$;
      if(and__3822__auto____7207) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____7207
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2361__auto____7208 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7209 = cljs.core._invoke[goog.typeOf(x__2361__auto____7208)];
        if(or__3824__auto____7209) {
          return or__3824__auto____7209
        }else {
          var or__3824__auto____7210 = cljs.core._invoke["_"];
          if(or__3824__auto____7210) {
            return or__3824__auto____7210
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____7211 = this$;
      if(and__3822__auto____7211) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____7211
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2361__auto____7212 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7213 = cljs.core._invoke[goog.typeOf(x__2361__auto____7212)];
        if(or__3824__auto____7213) {
          return or__3824__auto____7213
        }else {
          var or__3824__auto____7214 = cljs.core._invoke["_"];
          if(or__3824__auto____7214) {
            return or__3824__auto____7214
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____7215 = this$;
      if(and__3822__auto____7215) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____7215
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2361__auto____7216 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7217 = cljs.core._invoke[goog.typeOf(x__2361__auto____7216)];
        if(or__3824__auto____7217) {
          return or__3824__auto____7217
        }else {
          var or__3824__auto____7218 = cljs.core._invoke["_"];
          if(or__3824__auto____7218) {
            return or__3824__auto____7218
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____7219 = this$;
      if(and__3822__auto____7219) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____7219
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2361__auto____7220 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7221 = cljs.core._invoke[goog.typeOf(x__2361__auto____7220)];
        if(or__3824__auto____7221) {
          return or__3824__auto____7221
        }else {
          var or__3824__auto____7222 = cljs.core._invoke["_"];
          if(or__3824__auto____7222) {
            return or__3824__auto____7222
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____7223 = this$;
      if(and__3822__auto____7223) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____7223
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2361__auto____7224 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7225 = cljs.core._invoke[goog.typeOf(x__2361__auto____7224)];
        if(or__3824__auto____7225) {
          return or__3824__auto____7225
        }else {
          var or__3824__auto____7226 = cljs.core._invoke["_"];
          if(or__3824__auto____7226) {
            return or__3824__auto____7226
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____7227 = this$;
      if(and__3822__auto____7227) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____7227
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2361__auto____7228 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7229 = cljs.core._invoke[goog.typeOf(x__2361__auto____7228)];
        if(or__3824__auto____7229) {
          return or__3824__auto____7229
        }else {
          var or__3824__auto____7230 = cljs.core._invoke["_"];
          if(or__3824__auto____7230) {
            return or__3824__auto____7230
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____7231 = this$;
      if(and__3822__auto____7231) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____7231
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2361__auto____7232 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7233 = cljs.core._invoke[goog.typeOf(x__2361__auto____7232)];
        if(or__3824__auto____7233) {
          return or__3824__auto____7233
        }else {
          var or__3824__auto____7234 = cljs.core._invoke["_"];
          if(or__3824__auto____7234) {
            return or__3824__auto____7234
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____7235 = this$;
      if(and__3822__auto____7235) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____7235
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2361__auto____7236 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7237 = cljs.core._invoke[goog.typeOf(x__2361__auto____7236)];
        if(or__3824__auto____7237) {
          return or__3824__auto____7237
        }else {
          var or__3824__auto____7238 = cljs.core._invoke["_"];
          if(or__3824__auto____7238) {
            return or__3824__auto____7238
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____7239 = this$;
      if(and__3822__auto____7239) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____7239
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2361__auto____7240 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7241 = cljs.core._invoke[goog.typeOf(x__2361__auto____7240)];
        if(or__3824__auto____7241) {
          return or__3824__auto____7241
        }else {
          var or__3824__auto____7242 = cljs.core._invoke["_"];
          if(or__3824__auto____7242) {
            return or__3824__auto____7242
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____7243 = this$;
      if(and__3822__auto____7243) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____7243
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2361__auto____7244 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7245 = cljs.core._invoke[goog.typeOf(x__2361__auto____7244)];
        if(or__3824__auto____7245) {
          return or__3824__auto____7245
        }else {
          var or__3824__auto____7246 = cljs.core._invoke["_"];
          if(or__3824__auto____7246) {
            return or__3824__auto____7246
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____7247 = this$;
      if(and__3822__auto____7247) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____7247
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2361__auto____7248 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7249 = cljs.core._invoke[goog.typeOf(x__2361__auto____7248)];
        if(or__3824__auto____7249) {
          return or__3824__auto____7249
        }else {
          var or__3824__auto____7250 = cljs.core._invoke["_"];
          if(or__3824__auto____7250) {
            return or__3824__auto____7250
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
    var and__3822__auto____7255 = coll;
    if(and__3822__auto____7255) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____7255
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2361__auto____7256 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7257 = cljs.core._count[goog.typeOf(x__2361__auto____7256)];
      if(or__3824__auto____7257) {
        return or__3824__auto____7257
      }else {
        var or__3824__auto____7258 = cljs.core._count["_"];
        if(or__3824__auto____7258) {
          return or__3824__auto____7258
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
    var and__3822__auto____7263 = coll;
    if(and__3822__auto____7263) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____7263
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2361__auto____7264 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7265 = cljs.core._empty[goog.typeOf(x__2361__auto____7264)];
      if(or__3824__auto____7265) {
        return or__3824__auto____7265
      }else {
        var or__3824__auto____7266 = cljs.core._empty["_"];
        if(or__3824__auto____7266) {
          return or__3824__auto____7266
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
    var and__3822__auto____7271 = coll;
    if(and__3822__auto____7271) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____7271
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2361__auto____7272 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7273 = cljs.core._conj[goog.typeOf(x__2361__auto____7272)];
      if(or__3824__auto____7273) {
        return or__3824__auto____7273
      }else {
        var or__3824__auto____7274 = cljs.core._conj["_"];
        if(or__3824__auto____7274) {
          return or__3824__auto____7274
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
      var and__3822__auto____7283 = coll;
      if(and__3822__auto____7283) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____7283
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2361__auto____7284 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7285 = cljs.core._nth[goog.typeOf(x__2361__auto____7284)];
        if(or__3824__auto____7285) {
          return or__3824__auto____7285
        }else {
          var or__3824__auto____7286 = cljs.core._nth["_"];
          if(or__3824__auto____7286) {
            return or__3824__auto____7286
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____7287 = coll;
      if(and__3822__auto____7287) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____7287
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2361__auto____7288 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7289 = cljs.core._nth[goog.typeOf(x__2361__auto____7288)];
        if(or__3824__auto____7289) {
          return or__3824__auto____7289
        }else {
          var or__3824__auto____7290 = cljs.core._nth["_"];
          if(or__3824__auto____7290) {
            return or__3824__auto____7290
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
    var and__3822__auto____7295 = coll;
    if(and__3822__auto____7295) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____7295
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2361__auto____7296 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7297 = cljs.core._first[goog.typeOf(x__2361__auto____7296)];
      if(or__3824__auto____7297) {
        return or__3824__auto____7297
      }else {
        var or__3824__auto____7298 = cljs.core._first["_"];
        if(or__3824__auto____7298) {
          return or__3824__auto____7298
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____7303 = coll;
    if(and__3822__auto____7303) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____7303
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2361__auto____7304 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7305 = cljs.core._rest[goog.typeOf(x__2361__auto____7304)];
      if(or__3824__auto____7305) {
        return or__3824__auto____7305
      }else {
        var or__3824__auto____7306 = cljs.core._rest["_"];
        if(or__3824__auto____7306) {
          return or__3824__auto____7306
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
    var and__3822__auto____7311 = coll;
    if(and__3822__auto____7311) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____7311
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2361__auto____7312 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7313 = cljs.core._next[goog.typeOf(x__2361__auto____7312)];
      if(or__3824__auto____7313) {
        return or__3824__auto____7313
      }else {
        var or__3824__auto____7314 = cljs.core._next["_"];
        if(or__3824__auto____7314) {
          return or__3824__auto____7314
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
      var and__3822__auto____7323 = o;
      if(and__3822__auto____7323) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____7323
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2361__auto____7324 = o == null ? null : o;
      return function() {
        var or__3824__auto____7325 = cljs.core._lookup[goog.typeOf(x__2361__auto____7324)];
        if(or__3824__auto____7325) {
          return or__3824__auto____7325
        }else {
          var or__3824__auto____7326 = cljs.core._lookup["_"];
          if(or__3824__auto____7326) {
            return or__3824__auto____7326
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____7327 = o;
      if(and__3822__auto____7327) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____7327
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2361__auto____7328 = o == null ? null : o;
      return function() {
        var or__3824__auto____7329 = cljs.core._lookup[goog.typeOf(x__2361__auto____7328)];
        if(or__3824__auto____7329) {
          return or__3824__auto____7329
        }else {
          var or__3824__auto____7330 = cljs.core._lookup["_"];
          if(or__3824__auto____7330) {
            return or__3824__auto____7330
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
    var and__3822__auto____7335 = coll;
    if(and__3822__auto____7335) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____7335
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2361__auto____7336 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7337 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2361__auto____7336)];
      if(or__3824__auto____7337) {
        return or__3824__auto____7337
      }else {
        var or__3824__auto____7338 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____7338) {
          return or__3824__auto____7338
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____7343 = coll;
    if(and__3822__auto____7343) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____7343
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2361__auto____7344 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7345 = cljs.core._assoc[goog.typeOf(x__2361__auto____7344)];
      if(or__3824__auto____7345) {
        return or__3824__auto____7345
      }else {
        var or__3824__auto____7346 = cljs.core._assoc["_"];
        if(or__3824__auto____7346) {
          return or__3824__auto____7346
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
    var and__3822__auto____7351 = coll;
    if(and__3822__auto____7351) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____7351
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2361__auto____7352 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7353 = cljs.core._dissoc[goog.typeOf(x__2361__auto____7352)];
      if(or__3824__auto____7353) {
        return or__3824__auto____7353
      }else {
        var or__3824__auto____7354 = cljs.core._dissoc["_"];
        if(or__3824__auto____7354) {
          return or__3824__auto____7354
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
    var and__3822__auto____7359 = coll;
    if(and__3822__auto____7359) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____7359
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2361__auto____7360 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7361 = cljs.core._key[goog.typeOf(x__2361__auto____7360)];
      if(or__3824__auto____7361) {
        return or__3824__auto____7361
      }else {
        var or__3824__auto____7362 = cljs.core._key["_"];
        if(or__3824__auto____7362) {
          return or__3824__auto____7362
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____7367 = coll;
    if(and__3822__auto____7367) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____7367
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2361__auto____7368 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7369 = cljs.core._val[goog.typeOf(x__2361__auto____7368)];
      if(or__3824__auto____7369) {
        return or__3824__auto____7369
      }else {
        var or__3824__auto____7370 = cljs.core._val["_"];
        if(or__3824__auto____7370) {
          return or__3824__auto____7370
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
    var and__3822__auto____7375 = coll;
    if(and__3822__auto____7375) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____7375
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2361__auto____7376 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7377 = cljs.core._disjoin[goog.typeOf(x__2361__auto____7376)];
      if(or__3824__auto____7377) {
        return or__3824__auto____7377
      }else {
        var or__3824__auto____7378 = cljs.core._disjoin["_"];
        if(or__3824__auto____7378) {
          return or__3824__auto____7378
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
    var and__3822__auto____7383 = coll;
    if(and__3822__auto____7383) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____7383
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2361__auto____7384 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7385 = cljs.core._peek[goog.typeOf(x__2361__auto____7384)];
      if(or__3824__auto____7385) {
        return or__3824__auto____7385
      }else {
        var or__3824__auto____7386 = cljs.core._peek["_"];
        if(or__3824__auto____7386) {
          return or__3824__auto____7386
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____7391 = coll;
    if(and__3822__auto____7391) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____7391
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2361__auto____7392 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7393 = cljs.core._pop[goog.typeOf(x__2361__auto____7392)];
      if(or__3824__auto____7393) {
        return or__3824__auto____7393
      }else {
        var or__3824__auto____7394 = cljs.core._pop["_"];
        if(or__3824__auto____7394) {
          return or__3824__auto____7394
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
    var and__3822__auto____7399 = coll;
    if(and__3822__auto____7399) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____7399
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2361__auto____7400 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7401 = cljs.core._assoc_n[goog.typeOf(x__2361__auto____7400)];
      if(or__3824__auto____7401) {
        return or__3824__auto____7401
      }else {
        var or__3824__auto____7402 = cljs.core._assoc_n["_"];
        if(or__3824__auto____7402) {
          return or__3824__auto____7402
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
    var and__3822__auto____7407 = o;
    if(and__3822__auto____7407) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____7407
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2361__auto____7408 = o == null ? null : o;
    return function() {
      var or__3824__auto____7409 = cljs.core._deref[goog.typeOf(x__2361__auto____7408)];
      if(or__3824__auto____7409) {
        return or__3824__auto____7409
      }else {
        var or__3824__auto____7410 = cljs.core._deref["_"];
        if(or__3824__auto____7410) {
          return or__3824__auto____7410
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
    var and__3822__auto____7415 = o;
    if(and__3822__auto____7415) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____7415
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2361__auto____7416 = o == null ? null : o;
    return function() {
      var or__3824__auto____7417 = cljs.core._deref_with_timeout[goog.typeOf(x__2361__auto____7416)];
      if(or__3824__auto____7417) {
        return or__3824__auto____7417
      }else {
        var or__3824__auto____7418 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____7418) {
          return or__3824__auto____7418
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
    var and__3822__auto____7423 = o;
    if(and__3822__auto____7423) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____7423
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2361__auto____7424 = o == null ? null : o;
    return function() {
      var or__3824__auto____7425 = cljs.core._meta[goog.typeOf(x__2361__auto____7424)];
      if(or__3824__auto____7425) {
        return or__3824__auto____7425
      }else {
        var or__3824__auto____7426 = cljs.core._meta["_"];
        if(or__3824__auto____7426) {
          return or__3824__auto____7426
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
    var and__3822__auto____7431 = o;
    if(and__3822__auto____7431) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____7431
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2361__auto____7432 = o == null ? null : o;
    return function() {
      var or__3824__auto____7433 = cljs.core._with_meta[goog.typeOf(x__2361__auto____7432)];
      if(or__3824__auto____7433) {
        return or__3824__auto____7433
      }else {
        var or__3824__auto____7434 = cljs.core._with_meta["_"];
        if(or__3824__auto____7434) {
          return or__3824__auto____7434
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
      var and__3822__auto____7443 = coll;
      if(and__3822__auto____7443) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____7443
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2361__auto____7444 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7445 = cljs.core._reduce[goog.typeOf(x__2361__auto____7444)];
        if(or__3824__auto____7445) {
          return or__3824__auto____7445
        }else {
          var or__3824__auto____7446 = cljs.core._reduce["_"];
          if(or__3824__auto____7446) {
            return or__3824__auto____7446
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____7447 = coll;
      if(and__3822__auto____7447) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____7447
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2361__auto____7448 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7449 = cljs.core._reduce[goog.typeOf(x__2361__auto____7448)];
        if(or__3824__auto____7449) {
          return or__3824__auto____7449
        }else {
          var or__3824__auto____7450 = cljs.core._reduce["_"];
          if(or__3824__auto____7450) {
            return or__3824__auto____7450
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
    var and__3822__auto____7455 = coll;
    if(and__3822__auto____7455) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____7455
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2361__auto____7456 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7457 = cljs.core._kv_reduce[goog.typeOf(x__2361__auto____7456)];
      if(or__3824__auto____7457) {
        return or__3824__auto____7457
      }else {
        var or__3824__auto____7458 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____7458) {
          return or__3824__auto____7458
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
    var and__3822__auto____7463 = o;
    if(and__3822__auto____7463) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____7463
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2361__auto____7464 = o == null ? null : o;
    return function() {
      var or__3824__auto____7465 = cljs.core._equiv[goog.typeOf(x__2361__auto____7464)];
      if(or__3824__auto____7465) {
        return or__3824__auto____7465
      }else {
        var or__3824__auto____7466 = cljs.core._equiv["_"];
        if(or__3824__auto____7466) {
          return or__3824__auto____7466
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
    var and__3822__auto____7471 = o;
    if(and__3822__auto____7471) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____7471
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2361__auto____7472 = o == null ? null : o;
    return function() {
      var or__3824__auto____7473 = cljs.core._hash[goog.typeOf(x__2361__auto____7472)];
      if(or__3824__auto____7473) {
        return or__3824__auto____7473
      }else {
        var or__3824__auto____7474 = cljs.core._hash["_"];
        if(or__3824__auto____7474) {
          return or__3824__auto____7474
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
    var and__3822__auto____7479 = o;
    if(and__3822__auto____7479) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____7479
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2361__auto____7480 = o == null ? null : o;
    return function() {
      var or__3824__auto____7481 = cljs.core._seq[goog.typeOf(x__2361__auto____7480)];
      if(or__3824__auto____7481) {
        return or__3824__auto____7481
      }else {
        var or__3824__auto____7482 = cljs.core._seq["_"];
        if(or__3824__auto____7482) {
          return or__3824__auto____7482
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
    var and__3822__auto____7487 = coll;
    if(and__3822__auto____7487) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____7487
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2361__auto____7488 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7489 = cljs.core._rseq[goog.typeOf(x__2361__auto____7488)];
      if(or__3824__auto____7489) {
        return or__3824__auto____7489
      }else {
        var or__3824__auto____7490 = cljs.core._rseq["_"];
        if(or__3824__auto____7490) {
          return or__3824__auto____7490
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
    var and__3822__auto____7495 = coll;
    if(and__3822__auto____7495) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____7495
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2361__auto____7496 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7497 = cljs.core._sorted_seq[goog.typeOf(x__2361__auto____7496)];
      if(or__3824__auto____7497) {
        return or__3824__auto____7497
      }else {
        var or__3824__auto____7498 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____7498) {
          return or__3824__auto____7498
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7503 = coll;
    if(and__3822__auto____7503) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7503
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2361__auto____7504 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7505 = cljs.core._sorted_seq_from[goog.typeOf(x__2361__auto____7504)];
      if(or__3824__auto____7505) {
        return or__3824__auto____7505
      }else {
        var or__3824__auto____7506 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7506) {
          return or__3824__auto____7506
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7511 = coll;
    if(and__3822__auto____7511) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7511
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2361__auto____7512 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7513 = cljs.core._entry_key[goog.typeOf(x__2361__auto____7512)];
      if(or__3824__auto____7513) {
        return or__3824__auto____7513
      }else {
        var or__3824__auto____7514 = cljs.core._entry_key["_"];
        if(or__3824__auto____7514) {
          return or__3824__auto____7514
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7519 = coll;
    if(and__3822__auto____7519) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7519
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2361__auto____7520 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7521 = cljs.core._comparator[goog.typeOf(x__2361__auto____7520)];
      if(or__3824__auto____7521) {
        return or__3824__auto____7521
      }else {
        var or__3824__auto____7522 = cljs.core._comparator["_"];
        if(or__3824__auto____7522) {
          return or__3824__auto____7522
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
    var and__3822__auto____7527 = o;
    if(and__3822__auto____7527) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7527
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2361__auto____7528 = o == null ? null : o;
    return function() {
      var or__3824__auto____7529 = cljs.core._pr_seq[goog.typeOf(x__2361__auto____7528)];
      if(or__3824__auto____7529) {
        return or__3824__auto____7529
      }else {
        var or__3824__auto____7530 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7530) {
          return or__3824__auto____7530
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
    var and__3822__auto____7535 = d;
    if(and__3822__auto____7535) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7535
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2361__auto____7536 = d == null ? null : d;
    return function() {
      var or__3824__auto____7537 = cljs.core._realized_QMARK_[goog.typeOf(x__2361__auto____7536)];
      if(or__3824__auto____7537) {
        return or__3824__auto____7537
      }else {
        var or__3824__auto____7538 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7538) {
          return or__3824__auto____7538
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
    var and__3822__auto____7543 = this$;
    if(and__3822__auto____7543) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7543
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2361__auto____7544 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7545 = cljs.core._notify_watches[goog.typeOf(x__2361__auto____7544)];
      if(or__3824__auto____7545) {
        return or__3824__auto____7545
      }else {
        var or__3824__auto____7546 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7546) {
          return or__3824__auto____7546
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7551 = this$;
    if(and__3822__auto____7551) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7551
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2361__auto____7552 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7553 = cljs.core._add_watch[goog.typeOf(x__2361__auto____7552)];
      if(or__3824__auto____7553) {
        return or__3824__auto____7553
      }else {
        var or__3824__auto____7554 = cljs.core._add_watch["_"];
        if(or__3824__auto____7554) {
          return or__3824__auto____7554
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7559 = this$;
    if(and__3822__auto____7559) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7559
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2361__auto____7560 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7561 = cljs.core._remove_watch[goog.typeOf(x__2361__auto____7560)];
      if(or__3824__auto____7561) {
        return or__3824__auto____7561
      }else {
        var or__3824__auto____7562 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7562) {
          return or__3824__auto____7562
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
    var and__3822__auto____7567 = coll;
    if(and__3822__auto____7567) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7567
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2361__auto____7568 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7569 = cljs.core._as_transient[goog.typeOf(x__2361__auto____7568)];
      if(or__3824__auto____7569) {
        return or__3824__auto____7569
      }else {
        var or__3824__auto____7570 = cljs.core._as_transient["_"];
        if(or__3824__auto____7570) {
          return or__3824__auto____7570
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
    var and__3822__auto____7575 = tcoll;
    if(and__3822__auto____7575) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7575
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2361__auto____7576 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7577 = cljs.core._conj_BANG_[goog.typeOf(x__2361__auto____7576)];
      if(or__3824__auto____7577) {
        return or__3824__auto____7577
      }else {
        var or__3824__auto____7578 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7578) {
          return or__3824__auto____7578
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7583 = tcoll;
    if(and__3822__auto____7583) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7583
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2361__auto____7584 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7585 = cljs.core._persistent_BANG_[goog.typeOf(x__2361__auto____7584)];
      if(or__3824__auto____7585) {
        return or__3824__auto____7585
      }else {
        var or__3824__auto____7586 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7586) {
          return or__3824__auto____7586
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
    var and__3822__auto____7591 = tcoll;
    if(and__3822__auto____7591) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7591
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2361__auto____7592 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7593 = cljs.core._assoc_BANG_[goog.typeOf(x__2361__auto____7592)];
      if(or__3824__auto____7593) {
        return or__3824__auto____7593
      }else {
        var or__3824__auto____7594 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7594) {
          return or__3824__auto____7594
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
    var and__3822__auto____7599 = tcoll;
    if(and__3822__auto____7599) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7599
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2361__auto____7600 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7601 = cljs.core._dissoc_BANG_[goog.typeOf(x__2361__auto____7600)];
      if(or__3824__auto____7601) {
        return or__3824__auto____7601
      }else {
        var or__3824__auto____7602 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7602) {
          return or__3824__auto____7602
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
    var and__3822__auto____7607 = tcoll;
    if(and__3822__auto____7607) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7607
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2361__auto____7608 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7609 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2361__auto____7608)];
      if(or__3824__auto____7609) {
        return or__3824__auto____7609
      }else {
        var or__3824__auto____7610 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7610) {
          return or__3824__auto____7610
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7615 = tcoll;
    if(and__3822__auto____7615) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7615
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2361__auto____7616 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7617 = cljs.core._pop_BANG_[goog.typeOf(x__2361__auto____7616)];
      if(or__3824__auto____7617) {
        return or__3824__auto____7617
      }else {
        var or__3824__auto____7618 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7618) {
          return or__3824__auto____7618
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
    var and__3822__auto____7623 = tcoll;
    if(and__3822__auto____7623) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7623
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2361__auto____7624 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7625 = cljs.core._disjoin_BANG_[goog.typeOf(x__2361__auto____7624)];
      if(or__3824__auto____7625) {
        return or__3824__auto____7625
      }else {
        var or__3824__auto____7626 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7626) {
          return or__3824__auto____7626
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
    var and__3822__auto____7631 = x;
    if(and__3822__auto____7631) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7631
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2361__auto____7632 = x == null ? null : x;
    return function() {
      var or__3824__auto____7633 = cljs.core._compare[goog.typeOf(x__2361__auto____7632)];
      if(or__3824__auto____7633) {
        return or__3824__auto____7633
      }else {
        var or__3824__auto____7634 = cljs.core._compare["_"];
        if(or__3824__auto____7634) {
          return or__3824__auto____7634
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
    var and__3822__auto____7639 = coll;
    if(and__3822__auto____7639) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7639
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2361__auto____7640 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7641 = cljs.core._drop_first[goog.typeOf(x__2361__auto____7640)];
      if(or__3824__auto____7641) {
        return or__3824__auto____7641
      }else {
        var or__3824__auto____7642 = cljs.core._drop_first["_"];
        if(or__3824__auto____7642) {
          return or__3824__auto____7642
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
    var and__3822__auto____7647 = coll;
    if(and__3822__auto____7647) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7647
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2361__auto____7648 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7649 = cljs.core._chunked_first[goog.typeOf(x__2361__auto____7648)];
      if(or__3824__auto____7649) {
        return or__3824__auto____7649
      }else {
        var or__3824__auto____7650 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7650) {
          return or__3824__auto____7650
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7655 = coll;
    if(and__3822__auto____7655) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7655
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2361__auto____7656 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7657 = cljs.core._chunked_rest[goog.typeOf(x__2361__auto____7656)];
      if(or__3824__auto____7657) {
        return or__3824__auto____7657
      }else {
        var or__3824__auto____7658 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7658) {
          return or__3824__auto____7658
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
    var and__3822__auto____7663 = coll;
    if(and__3822__auto____7663) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7663
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2361__auto____7664 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7665 = cljs.core._chunked_next[goog.typeOf(x__2361__auto____7664)];
      if(or__3824__auto____7665) {
        return or__3824__auto____7665
      }else {
        var or__3824__auto____7666 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7666) {
          return or__3824__auto____7666
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
    var or__3824__auto____7668 = x === y;
    if(or__3824__auto____7668) {
      return or__3824__auto____7668
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7669__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7670 = y;
            var G__7671 = cljs.core.first.call(null, more);
            var G__7672 = cljs.core.next.call(null, more);
            x = G__7670;
            y = G__7671;
            more = G__7672;
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
    var G__7669 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7669__delegate.call(this, x, y, more)
    };
    G__7669.cljs$lang$maxFixedArity = 2;
    G__7669.cljs$lang$applyTo = function(arglist__7673) {
      var x = cljs.core.first(arglist__7673);
      var y = cljs.core.first(cljs.core.next(arglist__7673));
      var more = cljs.core.rest(cljs.core.next(arglist__7673));
      return G__7669__delegate(x, y, more)
    };
    G__7669.cljs$lang$arity$variadic = G__7669__delegate;
    return G__7669
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
  var G__7674 = null;
  var G__7674__2 = function(o, k) {
    return null
  };
  var G__7674__3 = function(o, k, not_found) {
    return not_found
  };
  G__7674 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7674__2.call(this, o, k);
      case 3:
        return G__7674__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7674
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
  var G__7675 = null;
  var G__7675__2 = function(_, f) {
    return f.call(null)
  };
  var G__7675__3 = function(_, f, start) {
    return start
  };
  G__7675 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7675__2.call(this, _, f);
      case 3:
        return G__7675__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7675
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
  var G__7676 = null;
  var G__7676__2 = function(_, n) {
    return null
  };
  var G__7676__3 = function(_, n, not_found) {
    return not_found
  };
  G__7676 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7676__2.call(this, _, n);
      case 3:
        return G__7676__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7676
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
  var and__3822__auto____7677 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7677) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7677
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
    var cnt__7690 = cljs.core._count.call(null, cicoll);
    if(cnt__7690 === 0) {
      return f.call(null)
    }else {
      var val__7691 = cljs.core._nth.call(null, cicoll, 0);
      var n__7692 = 1;
      while(true) {
        if(n__7692 < cnt__7690) {
          var nval__7693 = f.call(null, val__7691, cljs.core._nth.call(null, cicoll, n__7692));
          if(cljs.core.reduced_QMARK_.call(null, nval__7693)) {
            return cljs.core.deref.call(null, nval__7693)
          }else {
            var G__7702 = nval__7693;
            var G__7703 = n__7692 + 1;
            val__7691 = G__7702;
            n__7692 = G__7703;
            continue
          }
        }else {
          return val__7691
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7694 = cljs.core._count.call(null, cicoll);
    var val__7695 = val;
    var n__7696 = 0;
    while(true) {
      if(n__7696 < cnt__7694) {
        var nval__7697 = f.call(null, val__7695, cljs.core._nth.call(null, cicoll, n__7696));
        if(cljs.core.reduced_QMARK_.call(null, nval__7697)) {
          return cljs.core.deref.call(null, nval__7697)
        }else {
          var G__7704 = nval__7697;
          var G__7705 = n__7696 + 1;
          val__7695 = G__7704;
          n__7696 = G__7705;
          continue
        }
      }else {
        return val__7695
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7698 = cljs.core._count.call(null, cicoll);
    var val__7699 = val;
    var n__7700 = idx;
    while(true) {
      if(n__7700 < cnt__7698) {
        var nval__7701 = f.call(null, val__7699, cljs.core._nth.call(null, cicoll, n__7700));
        if(cljs.core.reduced_QMARK_.call(null, nval__7701)) {
          return cljs.core.deref.call(null, nval__7701)
        }else {
          var G__7706 = nval__7701;
          var G__7707 = n__7700 + 1;
          val__7699 = G__7706;
          n__7700 = G__7707;
          continue
        }
      }else {
        return val__7699
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
    var cnt__7720 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7721 = arr[0];
      var n__7722 = 1;
      while(true) {
        if(n__7722 < cnt__7720) {
          var nval__7723 = f.call(null, val__7721, arr[n__7722]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7723)) {
            return cljs.core.deref.call(null, nval__7723)
          }else {
            var G__7732 = nval__7723;
            var G__7733 = n__7722 + 1;
            val__7721 = G__7732;
            n__7722 = G__7733;
            continue
          }
        }else {
          return val__7721
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7724 = arr.length;
    var val__7725 = val;
    var n__7726 = 0;
    while(true) {
      if(n__7726 < cnt__7724) {
        var nval__7727 = f.call(null, val__7725, arr[n__7726]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7727)) {
          return cljs.core.deref.call(null, nval__7727)
        }else {
          var G__7734 = nval__7727;
          var G__7735 = n__7726 + 1;
          val__7725 = G__7734;
          n__7726 = G__7735;
          continue
        }
      }else {
        return val__7725
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7728 = arr.length;
    var val__7729 = val;
    var n__7730 = idx;
    while(true) {
      if(n__7730 < cnt__7728) {
        var nval__7731 = f.call(null, val__7729, arr[n__7730]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7731)) {
          return cljs.core.deref.call(null, nval__7731)
        }else {
          var G__7736 = nval__7731;
          var G__7737 = n__7730 + 1;
          val__7729 = G__7736;
          n__7730 = G__7737;
          continue
        }
      }else {
        return val__7729
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
  var this__7738 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7739 = this;
  if(this__7739.i + 1 < this__7739.a.length) {
    return new cljs.core.IndexedSeq(this__7739.a, this__7739.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7740 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7741 = this;
  var c__7742 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7742 > 0) {
    return new cljs.core.RSeq(coll, c__7742 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7743 = this;
  var this__7744 = this;
  return cljs.core.pr_str.call(null, this__7744)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7745 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7745.a)) {
    return cljs.core.ci_reduce.call(null, this__7745.a, f, this__7745.a[this__7745.i], this__7745.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7745.a[this__7745.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7746 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7746.a)) {
    return cljs.core.ci_reduce.call(null, this__7746.a, f, start, this__7746.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7747 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7748 = this;
  return this__7748.a.length - this__7748.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7749 = this;
  return this__7749.a[this__7749.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7750 = this;
  if(this__7750.i + 1 < this__7750.a.length) {
    return new cljs.core.IndexedSeq(this__7750.a, this__7750.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7751 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7752 = this;
  var i__7753 = n + this__7752.i;
  if(i__7753 < this__7752.a.length) {
    return this__7752.a[i__7753]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7754 = this;
  var i__7755 = n + this__7754.i;
  if(i__7755 < this__7754.a.length) {
    return this__7754.a[i__7755]
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
  var G__7756 = null;
  var G__7756__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7756__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7756 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7756__2.call(this, array, f);
      case 3:
        return G__7756__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7756
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7757 = null;
  var G__7757__2 = function(array, k) {
    return array[k]
  };
  var G__7757__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7757 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7757__2.call(this, array, k);
      case 3:
        return G__7757__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7757
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7758 = null;
  var G__7758__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7758__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7758 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7758__2.call(this, array, n);
      case 3:
        return G__7758__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7758
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
  var this__7759 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7760 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7761 = this;
  var this__7762 = this;
  return cljs.core.pr_str.call(null, this__7762)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7763 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7764 = this;
  return this__7764.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7765 = this;
  return cljs.core._nth.call(null, this__7765.ci, this__7765.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7766 = this;
  if(this__7766.i > 0) {
    return new cljs.core.RSeq(this__7766.ci, this__7766.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7767 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7768 = this;
  return new cljs.core.RSeq(this__7768.ci, this__7768.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7769 = this;
  return this__7769.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7773__7774 = coll;
      if(G__7773__7774) {
        if(function() {
          var or__3824__auto____7775 = G__7773__7774.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7775) {
            return or__3824__auto____7775
          }else {
            return G__7773__7774.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7773__7774.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7773__7774)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7773__7774)
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
      var G__7780__7781 = coll;
      if(G__7780__7781) {
        if(function() {
          var or__3824__auto____7782 = G__7780__7781.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7782) {
            return or__3824__auto____7782
          }else {
            return G__7780__7781.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7780__7781.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7780__7781)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7780__7781)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7783 = cljs.core.seq.call(null, coll);
      if(s__7783 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7783)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7788__7789 = coll;
      if(G__7788__7789) {
        if(function() {
          var or__3824__auto____7790 = G__7788__7789.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7790) {
            return or__3824__auto____7790
          }else {
            return G__7788__7789.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7788__7789.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7788__7789)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7788__7789)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7791 = cljs.core.seq.call(null, coll);
      if(!(s__7791 == null)) {
        return cljs.core._rest.call(null, s__7791)
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
      var G__7795__7796 = coll;
      if(G__7795__7796) {
        if(function() {
          var or__3824__auto____7797 = G__7795__7796.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7797) {
            return or__3824__auto____7797
          }else {
            return G__7795__7796.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7795__7796.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7795__7796)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7795__7796)
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
    var sn__7799 = cljs.core.next.call(null, s);
    if(!(sn__7799 == null)) {
      var G__7800 = sn__7799;
      s = G__7800;
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
    var G__7801__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7802 = conj.call(null, coll, x);
          var G__7803 = cljs.core.first.call(null, xs);
          var G__7804 = cljs.core.next.call(null, xs);
          coll = G__7802;
          x = G__7803;
          xs = G__7804;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7801 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7801__delegate.call(this, coll, x, xs)
    };
    G__7801.cljs$lang$maxFixedArity = 2;
    G__7801.cljs$lang$applyTo = function(arglist__7805) {
      var coll = cljs.core.first(arglist__7805);
      var x = cljs.core.first(cljs.core.next(arglist__7805));
      var xs = cljs.core.rest(cljs.core.next(arglist__7805));
      return G__7801__delegate(coll, x, xs)
    };
    G__7801.cljs$lang$arity$variadic = G__7801__delegate;
    return G__7801
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
  var s__7808 = cljs.core.seq.call(null, coll);
  var acc__7809 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7808)) {
      return acc__7809 + cljs.core._count.call(null, s__7808)
    }else {
      var G__7810 = cljs.core.next.call(null, s__7808);
      var G__7811 = acc__7809 + 1;
      s__7808 = G__7810;
      acc__7809 = G__7811;
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
        var G__7818__7819 = coll;
        if(G__7818__7819) {
          if(function() {
            var or__3824__auto____7820 = G__7818__7819.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7820) {
              return or__3824__auto____7820
            }else {
              return G__7818__7819.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7818__7819.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7818__7819)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7818__7819)
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
        var G__7821__7822 = coll;
        if(G__7821__7822) {
          if(function() {
            var or__3824__auto____7823 = G__7821__7822.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7823) {
              return or__3824__auto____7823
            }else {
              return G__7821__7822.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7821__7822.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7821__7822)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7821__7822)
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
    var G__7826__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7825 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7827 = ret__7825;
          var G__7828 = cljs.core.first.call(null, kvs);
          var G__7829 = cljs.core.second.call(null, kvs);
          var G__7830 = cljs.core.nnext.call(null, kvs);
          coll = G__7827;
          k = G__7828;
          v = G__7829;
          kvs = G__7830;
          continue
        }else {
          return ret__7825
        }
        break
      }
    };
    var G__7826 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7826__delegate.call(this, coll, k, v, kvs)
    };
    G__7826.cljs$lang$maxFixedArity = 3;
    G__7826.cljs$lang$applyTo = function(arglist__7831) {
      var coll = cljs.core.first(arglist__7831);
      var k = cljs.core.first(cljs.core.next(arglist__7831));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7831)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7831)));
      return G__7826__delegate(coll, k, v, kvs)
    };
    G__7826.cljs$lang$arity$variadic = G__7826__delegate;
    return G__7826
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
    var G__7834__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7833 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7835 = ret__7833;
          var G__7836 = cljs.core.first.call(null, ks);
          var G__7837 = cljs.core.next.call(null, ks);
          coll = G__7835;
          k = G__7836;
          ks = G__7837;
          continue
        }else {
          return ret__7833
        }
        break
      }
    };
    var G__7834 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7834__delegate.call(this, coll, k, ks)
    };
    G__7834.cljs$lang$maxFixedArity = 2;
    G__7834.cljs$lang$applyTo = function(arglist__7838) {
      var coll = cljs.core.first(arglist__7838);
      var k = cljs.core.first(cljs.core.next(arglist__7838));
      var ks = cljs.core.rest(cljs.core.next(arglist__7838));
      return G__7834__delegate(coll, k, ks)
    };
    G__7834.cljs$lang$arity$variadic = G__7834__delegate;
    return G__7834
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
    var G__7842__7843 = o;
    if(G__7842__7843) {
      if(function() {
        var or__3824__auto____7844 = G__7842__7843.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7844) {
          return or__3824__auto____7844
        }else {
          return G__7842__7843.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7842__7843.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7842__7843)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7842__7843)
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
    var G__7847__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7846 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7848 = ret__7846;
          var G__7849 = cljs.core.first.call(null, ks);
          var G__7850 = cljs.core.next.call(null, ks);
          coll = G__7848;
          k = G__7849;
          ks = G__7850;
          continue
        }else {
          return ret__7846
        }
        break
      }
    };
    var G__7847 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7847__delegate.call(this, coll, k, ks)
    };
    G__7847.cljs$lang$maxFixedArity = 2;
    G__7847.cljs$lang$applyTo = function(arglist__7851) {
      var coll = cljs.core.first(arglist__7851);
      var k = cljs.core.first(cljs.core.next(arglist__7851));
      var ks = cljs.core.rest(cljs.core.next(arglist__7851));
      return G__7847__delegate(coll, k, ks)
    };
    G__7847.cljs$lang$arity$variadic = G__7847__delegate;
    return G__7847
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
  var h__7853 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7853;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7853
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7855 = cljs.core.string_hash_cache[k];
  if(!(h__7855 == null)) {
    return h__7855
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
      var and__3822__auto____7857 = goog.isString(o);
      if(and__3822__auto____7857) {
        return check_cache
      }else {
        return and__3822__auto____7857
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
    var G__7861__7862 = x;
    if(G__7861__7862) {
      if(function() {
        var or__3824__auto____7863 = G__7861__7862.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7863) {
          return or__3824__auto____7863
        }else {
          return G__7861__7862.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7861__7862.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7861__7862)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7861__7862)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7867__7868 = x;
    if(G__7867__7868) {
      if(function() {
        var or__3824__auto____7869 = G__7867__7868.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7869) {
          return or__3824__auto____7869
        }else {
          return G__7867__7868.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7867__7868.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7867__7868)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7867__7868)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7873__7874 = x;
  if(G__7873__7874) {
    if(function() {
      var or__3824__auto____7875 = G__7873__7874.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7875) {
        return or__3824__auto____7875
      }else {
        return G__7873__7874.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7873__7874.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7873__7874)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7873__7874)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7879__7880 = x;
  if(G__7879__7880) {
    if(function() {
      var or__3824__auto____7881 = G__7879__7880.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7881) {
        return or__3824__auto____7881
      }else {
        return G__7879__7880.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7879__7880.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7879__7880)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7879__7880)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7885__7886 = x;
  if(G__7885__7886) {
    if(function() {
      var or__3824__auto____7887 = G__7885__7886.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7887) {
        return or__3824__auto____7887
      }else {
        return G__7885__7886.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7885__7886.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7885__7886)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7885__7886)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7891__7892 = x;
  if(G__7891__7892) {
    if(function() {
      var or__3824__auto____7893 = G__7891__7892.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7893) {
        return or__3824__auto____7893
      }else {
        return G__7891__7892.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7891__7892.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7891__7892)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7891__7892)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7897__7898 = x;
  if(G__7897__7898) {
    if(function() {
      var or__3824__auto____7899 = G__7897__7898.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7899) {
        return or__3824__auto____7899
      }else {
        return G__7897__7898.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7897__7898.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7897__7898)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7897__7898)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7903__7904 = x;
    if(G__7903__7904) {
      if(function() {
        var or__3824__auto____7905 = G__7903__7904.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7905) {
          return or__3824__auto____7905
        }else {
          return G__7903__7904.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7903__7904.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7903__7904)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7903__7904)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7909__7910 = x;
  if(G__7909__7910) {
    if(function() {
      var or__3824__auto____7911 = G__7909__7910.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7911) {
        return or__3824__auto____7911
      }else {
        return G__7909__7910.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7909__7910.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7909__7910)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7909__7910)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7915__7916 = x;
  if(G__7915__7916) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7917 = null;
      if(cljs.core.truth_(or__3824__auto____7917)) {
        return or__3824__auto____7917
      }else {
        return G__7915__7916.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7915__7916.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7915__7916)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7915__7916)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7918__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7918 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7918__delegate.call(this, keyvals)
    };
    G__7918.cljs$lang$maxFixedArity = 0;
    G__7918.cljs$lang$applyTo = function(arglist__7919) {
      var keyvals = cljs.core.seq(arglist__7919);
      return G__7918__delegate(keyvals)
    };
    G__7918.cljs$lang$arity$variadic = G__7918__delegate;
    return G__7918
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
  var keys__7921 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7921.push(key)
  });
  return keys__7921
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7925 = i;
  var j__7926 = j;
  var len__7927 = len;
  while(true) {
    if(len__7927 === 0) {
      return to
    }else {
      to[j__7926] = from[i__7925];
      var G__7928 = i__7925 + 1;
      var G__7929 = j__7926 + 1;
      var G__7930 = len__7927 - 1;
      i__7925 = G__7928;
      j__7926 = G__7929;
      len__7927 = G__7930;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7934 = i + (len - 1);
  var j__7935 = j + (len - 1);
  var len__7936 = len;
  while(true) {
    if(len__7936 === 0) {
      return to
    }else {
      to[j__7935] = from[i__7934];
      var G__7937 = i__7934 - 1;
      var G__7938 = j__7935 - 1;
      var G__7939 = len__7936 - 1;
      i__7934 = G__7937;
      j__7935 = G__7938;
      len__7936 = G__7939;
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
    var G__7943__7944 = s;
    if(G__7943__7944) {
      if(function() {
        var or__3824__auto____7945 = G__7943__7944.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7945) {
          return or__3824__auto____7945
        }else {
          return G__7943__7944.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7943__7944.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7943__7944)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7943__7944)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7949__7950 = s;
  if(G__7949__7950) {
    if(function() {
      var or__3824__auto____7951 = G__7949__7950.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7951) {
        return or__3824__auto____7951
      }else {
        return G__7949__7950.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7949__7950.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7949__7950)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7949__7950)
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
  var and__3822__auto____7954 = goog.isString(x);
  if(and__3822__auto____7954) {
    return!function() {
      var or__3824__auto____7955 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7955) {
        return or__3824__auto____7955
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7954
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7957 = goog.isString(x);
  if(and__3822__auto____7957) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7957
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7959 = goog.isString(x);
  if(and__3822__auto____7959) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7959
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7964 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7964) {
    return or__3824__auto____7964
  }else {
    var G__7965__7966 = f;
    if(G__7965__7966) {
      if(function() {
        var or__3824__auto____7967 = G__7965__7966.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7967) {
          return or__3824__auto____7967
        }else {
          return G__7965__7966.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7965__7966.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7965__7966)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7965__7966)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7969 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7969) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7969
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
    var and__3822__auto____7972 = coll;
    if(cljs.core.truth_(and__3822__auto____7972)) {
      var and__3822__auto____7973 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7973) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7973
      }
    }else {
      return and__3822__auto____7972
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
    var G__7982__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7978 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7979 = more;
        while(true) {
          var x__7980 = cljs.core.first.call(null, xs__7979);
          var etc__7981 = cljs.core.next.call(null, xs__7979);
          if(cljs.core.truth_(xs__7979)) {
            if(cljs.core.contains_QMARK_.call(null, s__7978, x__7980)) {
              return false
            }else {
              var G__7983 = cljs.core.conj.call(null, s__7978, x__7980);
              var G__7984 = etc__7981;
              s__7978 = G__7983;
              xs__7979 = G__7984;
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
    var G__7982 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7982__delegate.call(this, x, y, more)
    };
    G__7982.cljs$lang$maxFixedArity = 2;
    G__7982.cljs$lang$applyTo = function(arglist__7985) {
      var x = cljs.core.first(arglist__7985);
      var y = cljs.core.first(cljs.core.next(arglist__7985));
      var more = cljs.core.rest(cljs.core.next(arglist__7985));
      return G__7982__delegate(x, y, more)
    };
    G__7982.cljs$lang$arity$variadic = G__7982__delegate;
    return G__7982
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
            var G__7989__7990 = x;
            if(G__7989__7990) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7991 = null;
                if(cljs.core.truth_(or__3824__auto____7991)) {
                  return or__3824__auto____7991
                }else {
                  return G__7989__7990.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7989__7990.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7989__7990)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7989__7990)
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
    var xl__7996 = cljs.core.count.call(null, xs);
    var yl__7997 = cljs.core.count.call(null, ys);
    if(xl__7996 < yl__7997) {
      return-1
    }else {
      if(xl__7996 > yl__7997) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7996, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7998 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7999 = d__7998 === 0;
        if(and__3822__auto____7999) {
          return n + 1 < len
        }else {
          return and__3822__auto____7999
        }
      }()) {
        var G__8000 = xs;
        var G__8001 = ys;
        var G__8002 = len;
        var G__8003 = n + 1;
        xs = G__8000;
        ys = G__8001;
        len = G__8002;
        n = G__8003;
        continue
      }else {
        return d__7998
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
      var r__8005 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__8005)) {
        return r__8005
      }else {
        if(cljs.core.truth_(r__8005)) {
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
      var a__8007 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__8007, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__8007)
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
    var temp__3971__auto____8013 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____8013) {
      var s__8014 = temp__3971__auto____8013;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__8014), cljs.core.next.call(null, s__8014))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__8015 = val;
    var coll__8016 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__8016) {
        var nval__8017 = f.call(null, val__8015, cljs.core.first.call(null, coll__8016));
        if(cljs.core.reduced_QMARK_.call(null, nval__8017)) {
          return cljs.core.deref.call(null, nval__8017)
        }else {
          var G__8018 = nval__8017;
          var G__8019 = cljs.core.next.call(null, coll__8016);
          val__8015 = G__8018;
          coll__8016 = G__8019;
          continue
        }
      }else {
        return val__8015
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
  var a__8021 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__8021);
  return cljs.core.vec.call(null, a__8021)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__8028__8029 = coll;
      if(G__8028__8029) {
        if(function() {
          var or__3824__auto____8030 = G__8028__8029.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____8030) {
            return or__3824__auto____8030
          }else {
            return G__8028__8029.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__8028__8029.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8028__8029)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8028__8029)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__8031__8032 = coll;
      if(G__8031__8032) {
        if(function() {
          var or__3824__auto____8033 = G__8031__8032.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____8033) {
            return or__3824__auto____8033
          }else {
            return G__8031__8032.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__8031__8032.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8031__8032)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8031__8032)
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
  var this__8034 = this;
  return this__8034.val
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
    var G__8035__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__8035 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8035__delegate.call(this, x, y, more)
    };
    G__8035.cljs$lang$maxFixedArity = 2;
    G__8035.cljs$lang$applyTo = function(arglist__8036) {
      var x = cljs.core.first(arglist__8036);
      var y = cljs.core.first(cljs.core.next(arglist__8036));
      var more = cljs.core.rest(cljs.core.next(arglist__8036));
      return G__8035__delegate(x, y, more)
    };
    G__8035.cljs$lang$arity$variadic = G__8035__delegate;
    return G__8035
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
    var G__8037__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__8037 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8037__delegate.call(this, x, y, more)
    };
    G__8037.cljs$lang$maxFixedArity = 2;
    G__8037.cljs$lang$applyTo = function(arglist__8038) {
      var x = cljs.core.first(arglist__8038);
      var y = cljs.core.first(cljs.core.next(arglist__8038));
      var more = cljs.core.rest(cljs.core.next(arglist__8038));
      return G__8037__delegate(x, y, more)
    };
    G__8037.cljs$lang$arity$variadic = G__8037__delegate;
    return G__8037
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
    var G__8039__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__8039 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8039__delegate.call(this, x, y, more)
    };
    G__8039.cljs$lang$maxFixedArity = 2;
    G__8039.cljs$lang$applyTo = function(arglist__8040) {
      var x = cljs.core.first(arglist__8040);
      var y = cljs.core.first(cljs.core.next(arglist__8040));
      var more = cljs.core.rest(cljs.core.next(arglist__8040));
      return G__8039__delegate(x, y, more)
    };
    G__8039.cljs$lang$arity$variadic = G__8039__delegate;
    return G__8039
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
    var G__8041__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__8041 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8041__delegate.call(this, x, y, more)
    };
    G__8041.cljs$lang$maxFixedArity = 2;
    G__8041.cljs$lang$applyTo = function(arglist__8042) {
      var x = cljs.core.first(arglist__8042);
      var y = cljs.core.first(cljs.core.next(arglist__8042));
      var more = cljs.core.rest(cljs.core.next(arglist__8042));
      return G__8041__delegate(x, y, more)
    };
    G__8041.cljs$lang$arity$variadic = G__8041__delegate;
    return G__8041
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
    var G__8043__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__8044 = y;
            var G__8045 = cljs.core.first.call(null, more);
            var G__8046 = cljs.core.next.call(null, more);
            x = G__8044;
            y = G__8045;
            more = G__8046;
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
    var G__8043 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8043__delegate.call(this, x, y, more)
    };
    G__8043.cljs$lang$maxFixedArity = 2;
    G__8043.cljs$lang$applyTo = function(arglist__8047) {
      var x = cljs.core.first(arglist__8047);
      var y = cljs.core.first(cljs.core.next(arglist__8047));
      var more = cljs.core.rest(cljs.core.next(arglist__8047));
      return G__8043__delegate(x, y, more)
    };
    G__8043.cljs$lang$arity$variadic = G__8043__delegate;
    return G__8043
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
    var G__8048__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__8049 = y;
            var G__8050 = cljs.core.first.call(null, more);
            var G__8051 = cljs.core.next.call(null, more);
            x = G__8049;
            y = G__8050;
            more = G__8051;
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
    var G__8048 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8048__delegate.call(this, x, y, more)
    };
    G__8048.cljs$lang$maxFixedArity = 2;
    G__8048.cljs$lang$applyTo = function(arglist__8052) {
      var x = cljs.core.first(arglist__8052);
      var y = cljs.core.first(cljs.core.next(arglist__8052));
      var more = cljs.core.rest(cljs.core.next(arglist__8052));
      return G__8048__delegate(x, y, more)
    };
    G__8048.cljs$lang$arity$variadic = G__8048__delegate;
    return G__8048
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
    var G__8053__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__8054 = y;
            var G__8055 = cljs.core.first.call(null, more);
            var G__8056 = cljs.core.next.call(null, more);
            x = G__8054;
            y = G__8055;
            more = G__8056;
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
    var G__8053 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8053__delegate.call(this, x, y, more)
    };
    G__8053.cljs$lang$maxFixedArity = 2;
    G__8053.cljs$lang$applyTo = function(arglist__8057) {
      var x = cljs.core.first(arglist__8057);
      var y = cljs.core.first(cljs.core.next(arglist__8057));
      var more = cljs.core.rest(cljs.core.next(arglist__8057));
      return G__8053__delegate(x, y, more)
    };
    G__8053.cljs$lang$arity$variadic = G__8053__delegate;
    return G__8053
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
    var G__8058__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__8059 = y;
            var G__8060 = cljs.core.first.call(null, more);
            var G__8061 = cljs.core.next.call(null, more);
            x = G__8059;
            y = G__8060;
            more = G__8061;
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
    var G__8058 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8058__delegate.call(this, x, y, more)
    };
    G__8058.cljs$lang$maxFixedArity = 2;
    G__8058.cljs$lang$applyTo = function(arglist__8062) {
      var x = cljs.core.first(arglist__8062);
      var y = cljs.core.first(cljs.core.next(arglist__8062));
      var more = cljs.core.rest(cljs.core.next(arglist__8062));
      return G__8058__delegate(x, y, more)
    };
    G__8058.cljs$lang$arity$variadic = G__8058__delegate;
    return G__8058
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
    var G__8063__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__8063 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8063__delegate.call(this, x, y, more)
    };
    G__8063.cljs$lang$maxFixedArity = 2;
    G__8063.cljs$lang$applyTo = function(arglist__8064) {
      var x = cljs.core.first(arglist__8064);
      var y = cljs.core.first(cljs.core.next(arglist__8064));
      var more = cljs.core.rest(cljs.core.next(arglist__8064));
      return G__8063__delegate(x, y, more)
    };
    G__8063.cljs$lang$arity$variadic = G__8063__delegate;
    return G__8063
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
    var G__8065__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__8065 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8065__delegate.call(this, x, y, more)
    };
    G__8065.cljs$lang$maxFixedArity = 2;
    G__8065.cljs$lang$applyTo = function(arglist__8066) {
      var x = cljs.core.first(arglist__8066);
      var y = cljs.core.first(cljs.core.next(arglist__8066));
      var more = cljs.core.rest(cljs.core.next(arglist__8066));
      return G__8065__delegate(x, y, more)
    };
    G__8065.cljs$lang$arity$variadic = G__8065__delegate;
    return G__8065
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
  var rem__8068 = n % d;
  return cljs.core.fix.call(null, (n - rem__8068) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__8070 = cljs.core.quot.call(null, n, d);
  return n - d * q__8070
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
  var v__8073 = v - (v >> 1 & 1431655765);
  var v__8074 = (v__8073 & 858993459) + (v__8073 >> 2 & 858993459);
  return(v__8074 + (v__8074 >> 4) & 252645135) * 16843009 >> 24
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
    var G__8075__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__8076 = y;
            var G__8077 = cljs.core.first.call(null, more);
            var G__8078 = cljs.core.next.call(null, more);
            x = G__8076;
            y = G__8077;
            more = G__8078;
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
    var G__8075 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8075__delegate.call(this, x, y, more)
    };
    G__8075.cljs$lang$maxFixedArity = 2;
    G__8075.cljs$lang$applyTo = function(arglist__8079) {
      var x = cljs.core.first(arglist__8079);
      var y = cljs.core.first(cljs.core.next(arglist__8079));
      var more = cljs.core.rest(cljs.core.next(arglist__8079));
      return G__8075__delegate(x, y, more)
    };
    G__8075.cljs$lang$arity$variadic = G__8075__delegate;
    return G__8075
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
  var n__8083 = n;
  var xs__8084 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____8085 = xs__8084;
      if(and__3822__auto____8085) {
        return n__8083 > 0
      }else {
        return and__3822__auto____8085
      }
    }())) {
      var G__8086 = n__8083 - 1;
      var G__8087 = cljs.core.next.call(null, xs__8084);
      n__8083 = G__8086;
      xs__8084 = G__8087;
      continue
    }else {
      return xs__8084
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
    var G__8088__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8089 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__8090 = cljs.core.next.call(null, more);
            sb = G__8089;
            more = G__8090;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__8088 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8088__delegate.call(this, x, ys)
    };
    G__8088.cljs$lang$maxFixedArity = 1;
    G__8088.cljs$lang$applyTo = function(arglist__8091) {
      var x = cljs.core.first(arglist__8091);
      var ys = cljs.core.rest(arglist__8091);
      return G__8088__delegate(x, ys)
    };
    G__8088.cljs$lang$arity$variadic = G__8088__delegate;
    return G__8088
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
    var G__8092__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8093 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__8094 = cljs.core.next.call(null, more);
            sb = G__8093;
            more = G__8094;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__8092 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8092__delegate.call(this, x, ys)
    };
    G__8092.cljs$lang$maxFixedArity = 1;
    G__8092.cljs$lang$applyTo = function(arglist__8095) {
      var x = cljs.core.first(arglist__8095);
      var ys = cljs.core.rest(arglist__8095);
      return G__8092__delegate(x, ys)
    };
    G__8092.cljs$lang$arity$variadic = G__8092__delegate;
    return G__8092
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
  format.cljs$lang$applyTo = function(arglist__8096) {
    var fmt = cljs.core.first(arglist__8096);
    var args = cljs.core.rest(arglist__8096);
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
    var xs__8099 = cljs.core.seq.call(null, x);
    var ys__8100 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__8099 == null) {
        return ys__8100 == null
      }else {
        if(ys__8100 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__8099), cljs.core.first.call(null, ys__8100))) {
            var G__8101 = cljs.core.next.call(null, xs__8099);
            var G__8102 = cljs.core.next.call(null, ys__8100);
            xs__8099 = G__8101;
            ys__8100 = G__8102;
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
  return cljs.core.reduce.call(null, function(p1__8103_SHARP_, p2__8104_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__8103_SHARP_, cljs.core.hash.call(null, p2__8104_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__8108 = 0;
  var s__8109 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__8109) {
      var e__8110 = cljs.core.first.call(null, s__8109);
      var G__8111 = (h__8108 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__8110)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__8110)))) % 4503599627370496;
      var G__8112 = cljs.core.next.call(null, s__8109);
      h__8108 = G__8111;
      s__8109 = G__8112;
      continue
    }else {
      return h__8108
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__8116 = 0;
  var s__8117 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__8117) {
      var e__8118 = cljs.core.first.call(null, s__8117);
      var G__8119 = (h__8116 + cljs.core.hash.call(null, e__8118)) % 4503599627370496;
      var G__8120 = cljs.core.next.call(null, s__8117);
      h__8116 = G__8119;
      s__8117 = G__8120;
      continue
    }else {
      return h__8116
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__8141__8142 = cljs.core.seq.call(null, fn_map);
  if(G__8141__8142) {
    var G__8144__8146 = cljs.core.first.call(null, G__8141__8142);
    var vec__8145__8147 = G__8144__8146;
    var key_name__8148 = cljs.core.nth.call(null, vec__8145__8147, 0, null);
    var f__8149 = cljs.core.nth.call(null, vec__8145__8147, 1, null);
    var G__8141__8150 = G__8141__8142;
    var G__8144__8151 = G__8144__8146;
    var G__8141__8152 = G__8141__8150;
    while(true) {
      var vec__8153__8154 = G__8144__8151;
      var key_name__8155 = cljs.core.nth.call(null, vec__8153__8154, 0, null);
      var f__8156 = cljs.core.nth.call(null, vec__8153__8154, 1, null);
      var G__8141__8157 = G__8141__8152;
      var str_name__8158 = cljs.core.name.call(null, key_name__8155);
      obj[str_name__8158] = f__8156;
      var temp__3974__auto____8159 = cljs.core.next.call(null, G__8141__8157);
      if(temp__3974__auto____8159) {
        var G__8141__8160 = temp__3974__auto____8159;
        var G__8161 = cljs.core.first.call(null, G__8141__8160);
        var G__8162 = G__8141__8160;
        G__8144__8151 = G__8161;
        G__8141__8152 = G__8162;
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
  var this__8163 = this;
  var h__2190__auto____8164 = this__8163.__hash;
  if(!(h__2190__auto____8164 == null)) {
    return h__2190__auto____8164
  }else {
    var h__2190__auto____8165 = cljs.core.hash_coll.call(null, coll);
    this__8163.__hash = h__2190__auto____8165;
    return h__2190__auto____8165
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8166 = this;
  if(this__8166.count === 1) {
    return null
  }else {
    return this__8166.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8167 = this;
  return new cljs.core.List(this__8167.meta, o, coll, this__8167.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__8168 = this;
  var this__8169 = this;
  return cljs.core.pr_str.call(null, this__8169)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8170 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8171 = this;
  return this__8171.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8172 = this;
  return this__8172.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8173 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8174 = this;
  return this__8174.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8175 = this;
  if(this__8175.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__8175.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8176 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8177 = this;
  return new cljs.core.List(meta, this__8177.first, this__8177.rest, this__8177.count, this__8177.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8178 = this;
  return this__8178.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8179 = this;
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
  var this__8180 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8181 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8182 = this;
  return new cljs.core.List(this__8182.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__8183 = this;
  var this__8184 = this;
  return cljs.core.pr_str.call(null, this__8184)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8185 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8186 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8187 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8188 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8189 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8190 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8191 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8192 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8193 = this;
  return this__8193.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8194 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__8198__8199 = coll;
  if(G__8198__8199) {
    if(function() {
      var or__3824__auto____8200 = G__8198__8199.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____8200) {
        return or__3824__auto____8200
      }else {
        return G__8198__8199.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__8198__8199.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8198__8199)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8198__8199)
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
    var G__8201__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__8201 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8201__delegate.call(this, x, y, z, items)
    };
    G__8201.cljs$lang$maxFixedArity = 3;
    G__8201.cljs$lang$applyTo = function(arglist__8202) {
      var x = cljs.core.first(arglist__8202);
      var y = cljs.core.first(cljs.core.next(arglist__8202));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8202)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8202)));
      return G__8201__delegate(x, y, z, items)
    };
    G__8201.cljs$lang$arity$variadic = G__8201__delegate;
    return G__8201
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
  var this__8203 = this;
  var h__2190__auto____8204 = this__8203.__hash;
  if(!(h__2190__auto____8204 == null)) {
    return h__2190__auto____8204
  }else {
    var h__2190__auto____8205 = cljs.core.hash_coll.call(null, coll);
    this__8203.__hash = h__2190__auto____8205;
    return h__2190__auto____8205
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8206 = this;
  if(this__8206.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__8206.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8207 = this;
  return new cljs.core.Cons(null, o, coll, this__8207.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__8208 = this;
  var this__8209 = this;
  return cljs.core.pr_str.call(null, this__8209)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8210 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8211 = this;
  return this__8211.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8212 = this;
  if(this__8212.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8212.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8213 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8214 = this;
  return new cljs.core.Cons(meta, this__8214.first, this__8214.rest, this__8214.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8215 = this;
  return this__8215.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8216 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8216.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____8221 = coll == null;
    if(or__3824__auto____8221) {
      return or__3824__auto____8221
    }else {
      var G__8222__8223 = coll;
      if(G__8222__8223) {
        if(function() {
          var or__3824__auto____8224 = G__8222__8223.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8224) {
            return or__3824__auto____8224
          }else {
            return G__8222__8223.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8222__8223.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8222__8223)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8222__8223)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__8228__8229 = x;
  if(G__8228__8229) {
    if(function() {
      var or__3824__auto____8230 = G__8228__8229.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____8230) {
        return or__3824__auto____8230
      }else {
        return G__8228__8229.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__8228__8229.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8228__8229)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8228__8229)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__8231 = null;
  var G__8231__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__8231__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__8231 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8231__2.call(this, string, f);
      case 3:
        return G__8231__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8231
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__8232 = null;
  var G__8232__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__8232__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__8232 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8232__2.call(this, string, k);
      case 3:
        return G__8232__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8232
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__8233 = null;
  var G__8233__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__8233__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__8233 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8233__2.call(this, string, n);
      case 3:
        return G__8233__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8233
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
  var G__8245 = null;
  var G__8245__2 = function(this_sym8236, coll) {
    var this__8238 = this;
    var this_sym8236__8239 = this;
    var ___8240 = this_sym8236__8239;
    if(coll == null) {
      return null
    }else {
      var strobj__8241 = coll.strobj;
      if(strobj__8241 == null) {
        return cljs.core._lookup.call(null, coll, this__8238.k, null)
      }else {
        return strobj__8241[this__8238.k]
      }
    }
  };
  var G__8245__3 = function(this_sym8237, coll, not_found) {
    var this__8238 = this;
    var this_sym8237__8242 = this;
    var ___8243 = this_sym8237__8242;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__8238.k, not_found)
    }
  };
  G__8245 = function(this_sym8237, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8245__2.call(this, this_sym8237, coll);
      case 3:
        return G__8245__3.call(this, this_sym8237, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8245
}();
cljs.core.Keyword.prototype.apply = function(this_sym8234, args8235) {
  var this__8244 = this;
  return this_sym8234.call.apply(this_sym8234, [this_sym8234].concat(args8235.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__8254 = null;
  var G__8254__2 = function(this_sym8248, coll) {
    var this_sym8248__8250 = this;
    var this__8251 = this_sym8248__8250;
    return cljs.core._lookup.call(null, coll, this__8251.toString(), null)
  };
  var G__8254__3 = function(this_sym8249, coll, not_found) {
    var this_sym8249__8252 = this;
    var this__8253 = this_sym8249__8252;
    return cljs.core._lookup.call(null, coll, this__8253.toString(), not_found)
  };
  G__8254 = function(this_sym8249, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8254__2.call(this, this_sym8249, coll);
      case 3:
        return G__8254__3.call(this, this_sym8249, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8254
}();
String.prototype.apply = function(this_sym8246, args8247) {
  return this_sym8246.call.apply(this_sym8246, [this_sym8246].concat(args8247.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__8256 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__8256
  }else {
    lazy_seq.x = x__8256.call(null);
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
  var this__8257 = this;
  var h__2190__auto____8258 = this__8257.__hash;
  if(!(h__2190__auto____8258 == null)) {
    return h__2190__auto____8258
  }else {
    var h__2190__auto____8259 = cljs.core.hash_coll.call(null, coll);
    this__8257.__hash = h__2190__auto____8259;
    return h__2190__auto____8259
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8260 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8261 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__8262 = this;
  var this__8263 = this;
  return cljs.core.pr_str.call(null, this__8263)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8264 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8265 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8266 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8267 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8268 = this;
  return new cljs.core.LazySeq(meta, this__8268.realized, this__8268.x, this__8268.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8269 = this;
  return this__8269.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8270 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8270.meta)
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
  var this__8271 = this;
  return this__8271.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__8272 = this;
  var ___8273 = this;
  this__8272.buf[this__8272.end] = o;
  return this__8272.end = this__8272.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__8274 = this;
  var ___8275 = this;
  var ret__8276 = new cljs.core.ArrayChunk(this__8274.buf, 0, this__8274.end);
  this__8274.buf = null;
  return ret__8276
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
  var this__8277 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__8277.arr[this__8277.off], this__8277.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8278 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__8278.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__8279 = this;
  if(this__8279.off === this__8279.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__8279.arr, this__8279.off + 1, this__8279.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__8280 = this;
  return this__8280.arr[this__8280.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__8281 = this;
  if(function() {
    var and__3822__auto____8282 = i >= 0;
    if(and__3822__auto____8282) {
      return i < this__8281.end - this__8281.off
    }else {
      return and__3822__auto____8282
    }
  }()) {
    return this__8281.arr[this__8281.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8283 = this;
  return this__8283.end - this__8283.off
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
  var this__8284 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8285 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8286 = this;
  return cljs.core._nth.call(null, this__8286.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8287 = this;
  if(cljs.core._count.call(null, this__8287.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__8287.chunk), this__8287.more, this__8287.meta)
  }else {
    if(this__8287.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__8287.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8288 = this;
  if(this__8288.more == null) {
    return null
  }else {
    return this__8288.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8289 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8290 = this;
  return new cljs.core.ChunkedCons(this__8290.chunk, this__8290.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8291 = this;
  return this__8291.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8292 = this;
  return this__8292.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8293 = this;
  if(this__8293.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8293.more
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
    var G__8297__8298 = s;
    if(G__8297__8298) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____8299 = null;
        if(cljs.core.truth_(or__3824__auto____8299)) {
          return or__3824__auto____8299
        }else {
          return G__8297__8298.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__8297__8298.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8297__8298)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8297__8298)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__8302 = [];
  var s__8303 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__8303)) {
      ary__8302.push(cljs.core.first.call(null, s__8303));
      var G__8304 = cljs.core.next.call(null, s__8303);
      s__8303 = G__8304;
      continue
    }else {
      return ary__8302
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__8308 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__8309 = 0;
  var xs__8310 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__8310) {
      ret__8308[i__8309] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__8310));
      var G__8311 = i__8309 + 1;
      var G__8312 = cljs.core.next.call(null, xs__8310);
      i__8309 = G__8311;
      xs__8310 = G__8312;
      continue
    }else {
    }
    break
  }
  return ret__8308
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
    var a__8320 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8321 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8322 = 0;
      var s__8323 = s__8321;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8324 = s__8323;
          if(and__3822__auto____8324) {
            return i__8322 < size
          }else {
            return and__3822__auto____8324
          }
        }())) {
          a__8320[i__8322] = cljs.core.first.call(null, s__8323);
          var G__8327 = i__8322 + 1;
          var G__8328 = cljs.core.next.call(null, s__8323);
          i__8322 = G__8327;
          s__8323 = G__8328;
          continue
        }else {
          return a__8320
        }
        break
      }
    }else {
      var n__2525__auto____8325 = size;
      var i__8326 = 0;
      while(true) {
        if(i__8326 < n__2525__auto____8325) {
          a__8320[i__8326] = init_val_or_seq;
          var G__8329 = i__8326 + 1;
          i__8326 = G__8329;
          continue
        }else {
        }
        break
      }
      return a__8320
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
    var a__8337 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8338 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8339 = 0;
      var s__8340 = s__8338;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8341 = s__8340;
          if(and__3822__auto____8341) {
            return i__8339 < size
          }else {
            return and__3822__auto____8341
          }
        }())) {
          a__8337[i__8339] = cljs.core.first.call(null, s__8340);
          var G__8344 = i__8339 + 1;
          var G__8345 = cljs.core.next.call(null, s__8340);
          i__8339 = G__8344;
          s__8340 = G__8345;
          continue
        }else {
          return a__8337
        }
        break
      }
    }else {
      var n__2525__auto____8342 = size;
      var i__8343 = 0;
      while(true) {
        if(i__8343 < n__2525__auto____8342) {
          a__8337[i__8343] = init_val_or_seq;
          var G__8346 = i__8343 + 1;
          i__8343 = G__8346;
          continue
        }else {
        }
        break
      }
      return a__8337
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
    var a__8354 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8355 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8356 = 0;
      var s__8357 = s__8355;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8358 = s__8357;
          if(and__3822__auto____8358) {
            return i__8356 < size
          }else {
            return and__3822__auto____8358
          }
        }())) {
          a__8354[i__8356] = cljs.core.first.call(null, s__8357);
          var G__8361 = i__8356 + 1;
          var G__8362 = cljs.core.next.call(null, s__8357);
          i__8356 = G__8361;
          s__8357 = G__8362;
          continue
        }else {
          return a__8354
        }
        break
      }
    }else {
      var n__2525__auto____8359 = size;
      var i__8360 = 0;
      while(true) {
        if(i__8360 < n__2525__auto____8359) {
          a__8354[i__8360] = init_val_or_seq;
          var G__8363 = i__8360 + 1;
          i__8360 = G__8363;
          continue
        }else {
        }
        break
      }
      return a__8354
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
    var s__8368 = s;
    var i__8369 = n;
    var sum__8370 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____8371 = i__8369 > 0;
        if(and__3822__auto____8371) {
          return cljs.core.seq.call(null, s__8368)
        }else {
          return and__3822__auto____8371
        }
      }())) {
        var G__8372 = cljs.core.next.call(null, s__8368);
        var G__8373 = i__8369 - 1;
        var G__8374 = sum__8370 + 1;
        s__8368 = G__8372;
        i__8369 = G__8373;
        sum__8370 = G__8374;
        continue
      }else {
        return sum__8370
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
      var s__8379 = cljs.core.seq.call(null, x);
      if(s__8379) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8379)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__8379), concat.call(null, cljs.core.chunk_rest.call(null, s__8379), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__8379), concat.call(null, cljs.core.rest.call(null, s__8379), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__8383__delegate = function(x, y, zs) {
      var cat__8382 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__8381 = cljs.core.seq.call(null, xys);
          if(xys__8381) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__8381)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__8381), cat.call(null, cljs.core.chunk_rest.call(null, xys__8381), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__8381), cat.call(null, cljs.core.rest.call(null, xys__8381), zs))
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
      return cat__8382.call(null, concat.call(null, x, y), zs)
    };
    var G__8383 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8383__delegate.call(this, x, y, zs)
    };
    G__8383.cljs$lang$maxFixedArity = 2;
    G__8383.cljs$lang$applyTo = function(arglist__8384) {
      var x = cljs.core.first(arglist__8384);
      var y = cljs.core.first(cljs.core.next(arglist__8384));
      var zs = cljs.core.rest(cljs.core.next(arglist__8384));
      return G__8383__delegate(x, y, zs)
    };
    G__8383.cljs$lang$arity$variadic = G__8383__delegate;
    return G__8383
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
    var G__8385__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__8385 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8385__delegate.call(this, a, b, c, d, more)
    };
    G__8385.cljs$lang$maxFixedArity = 4;
    G__8385.cljs$lang$applyTo = function(arglist__8386) {
      var a = cljs.core.first(arglist__8386);
      var b = cljs.core.first(cljs.core.next(arglist__8386));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8386)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8386))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8386))));
      return G__8385__delegate(a, b, c, d, more)
    };
    G__8385.cljs$lang$arity$variadic = G__8385__delegate;
    return G__8385
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
  var args__8428 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__8429 = cljs.core._first.call(null, args__8428);
    var args__8430 = cljs.core._rest.call(null, args__8428);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__8429)
      }else {
        return f.call(null, a__8429)
      }
    }else {
      var b__8431 = cljs.core._first.call(null, args__8430);
      var args__8432 = cljs.core._rest.call(null, args__8430);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__8429, b__8431)
        }else {
          return f.call(null, a__8429, b__8431)
        }
      }else {
        var c__8433 = cljs.core._first.call(null, args__8432);
        var args__8434 = cljs.core._rest.call(null, args__8432);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__8429, b__8431, c__8433)
          }else {
            return f.call(null, a__8429, b__8431, c__8433)
          }
        }else {
          var d__8435 = cljs.core._first.call(null, args__8434);
          var args__8436 = cljs.core._rest.call(null, args__8434);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__8429, b__8431, c__8433, d__8435)
            }else {
              return f.call(null, a__8429, b__8431, c__8433, d__8435)
            }
          }else {
            var e__8437 = cljs.core._first.call(null, args__8436);
            var args__8438 = cljs.core._rest.call(null, args__8436);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__8429, b__8431, c__8433, d__8435, e__8437)
              }else {
                return f.call(null, a__8429, b__8431, c__8433, d__8435, e__8437)
              }
            }else {
              var f__8439 = cljs.core._first.call(null, args__8438);
              var args__8440 = cljs.core._rest.call(null, args__8438);
              if(argc === 6) {
                if(f__8439.cljs$lang$arity$6) {
                  return f__8439.cljs$lang$arity$6(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439)
                }else {
                  return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439)
                }
              }else {
                var g__8441 = cljs.core._first.call(null, args__8440);
                var args__8442 = cljs.core._rest.call(null, args__8440);
                if(argc === 7) {
                  if(f__8439.cljs$lang$arity$7) {
                    return f__8439.cljs$lang$arity$7(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441)
                  }else {
                    return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441)
                  }
                }else {
                  var h__8443 = cljs.core._first.call(null, args__8442);
                  var args__8444 = cljs.core._rest.call(null, args__8442);
                  if(argc === 8) {
                    if(f__8439.cljs$lang$arity$8) {
                      return f__8439.cljs$lang$arity$8(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443)
                    }else {
                      return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443)
                    }
                  }else {
                    var i__8445 = cljs.core._first.call(null, args__8444);
                    var args__8446 = cljs.core._rest.call(null, args__8444);
                    if(argc === 9) {
                      if(f__8439.cljs$lang$arity$9) {
                        return f__8439.cljs$lang$arity$9(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445)
                      }else {
                        return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445)
                      }
                    }else {
                      var j__8447 = cljs.core._first.call(null, args__8446);
                      var args__8448 = cljs.core._rest.call(null, args__8446);
                      if(argc === 10) {
                        if(f__8439.cljs$lang$arity$10) {
                          return f__8439.cljs$lang$arity$10(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447)
                        }else {
                          return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447)
                        }
                      }else {
                        var k__8449 = cljs.core._first.call(null, args__8448);
                        var args__8450 = cljs.core._rest.call(null, args__8448);
                        if(argc === 11) {
                          if(f__8439.cljs$lang$arity$11) {
                            return f__8439.cljs$lang$arity$11(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449)
                          }else {
                            return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449)
                          }
                        }else {
                          var l__8451 = cljs.core._first.call(null, args__8450);
                          var args__8452 = cljs.core._rest.call(null, args__8450);
                          if(argc === 12) {
                            if(f__8439.cljs$lang$arity$12) {
                              return f__8439.cljs$lang$arity$12(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451)
                            }else {
                              return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451)
                            }
                          }else {
                            var m__8453 = cljs.core._first.call(null, args__8452);
                            var args__8454 = cljs.core._rest.call(null, args__8452);
                            if(argc === 13) {
                              if(f__8439.cljs$lang$arity$13) {
                                return f__8439.cljs$lang$arity$13(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453)
                              }else {
                                return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453)
                              }
                            }else {
                              var n__8455 = cljs.core._first.call(null, args__8454);
                              var args__8456 = cljs.core._rest.call(null, args__8454);
                              if(argc === 14) {
                                if(f__8439.cljs$lang$arity$14) {
                                  return f__8439.cljs$lang$arity$14(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455)
                                }else {
                                  return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455)
                                }
                              }else {
                                var o__8457 = cljs.core._first.call(null, args__8456);
                                var args__8458 = cljs.core._rest.call(null, args__8456);
                                if(argc === 15) {
                                  if(f__8439.cljs$lang$arity$15) {
                                    return f__8439.cljs$lang$arity$15(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457)
                                  }else {
                                    return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457)
                                  }
                                }else {
                                  var p__8459 = cljs.core._first.call(null, args__8458);
                                  var args__8460 = cljs.core._rest.call(null, args__8458);
                                  if(argc === 16) {
                                    if(f__8439.cljs$lang$arity$16) {
                                      return f__8439.cljs$lang$arity$16(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459)
                                    }else {
                                      return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459)
                                    }
                                  }else {
                                    var q__8461 = cljs.core._first.call(null, args__8460);
                                    var args__8462 = cljs.core._rest.call(null, args__8460);
                                    if(argc === 17) {
                                      if(f__8439.cljs$lang$arity$17) {
                                        return f__8439.cljs$lang$arity$17(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461)
                                      }else {
                                        return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461)
                                      }
                                    }else {
                                      var r__8463 = cljs.core._first.call(null, args__8462);
                                      var args__8464 = cljs.core._rest.call(null, args__8462);
                                      if(argc === 18) {
                                        if(f__8439.cljs$lang$arity$18) {
                                          return f__8439.cljs$lang$arity$18(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461, r__8463)
                                        }else {
                                          return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461, r__8463)
                                        }
                                      }else {
                                        var s__8465 = cljs.core._first.call(null, args__8464);
                                        var args__8466 = cljs.core._rest.call(null, args__8464);
                                        if(argc === 19) {
                                          if(f__8439.cljs$lang$arity$19) {
                                            return f__8439.cljs$lang$arity$19(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461, r__8463, s__8465)
                                          }else {
                                            return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461, r__8463, s__8465)
                                          }
                                        }else {
                                          var t__8467 = cljs.core._first.call(null, args__8466);
                                          var args__8468 = cljs.core._rest.call(null, args__8466);
                                          if(argc === 20) {
                                            if(f__8439.cljs$lang$arity$20) {
                                              return f__8439.cljs$lang$arity$20(a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461, r__8463, s__8465, t__8467)
                                            }else {
                                              return f__8439.call(null, a__8429, b__8431, c__8433, d__8435, e__8437, f__8439, g__8441, h__8443, i__8445, j__8447, k__8449, l__8451, m__8453, n__8455, o__8457, p__8459, q__8461, r__8463, s__8465, t__8467)
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
    var fixed_arity__8483 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8484 = cljs.core.bounded_count.call(null, args, fixed_arity__8483 + 1);
      if(bc__8484 <= fixed_arity__8483) {
        return cljs.core.apply_to.call(null, f, bc__8484, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__8485 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__8486 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8487 = cljs.core.bounded_count.call(null, arglist__8485, fixed_arity__8486 + 1);
      if(bc__8487 <= fixed_arity__8486) {
        return cljs.core.apply_to.call(null, f, bc__8487, arglist__8485)
      }else {
        return f.cljs$lang$applyTo(arglist__8485)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8485))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__8488 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__8489 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8490 = cljs.core.bounded_count.call(null, arglist__8488, fixed_arity__8489 + 1);
      if(bc__8490 <= fixed_arity__8489) {
        return cljs.core.apply_to.call(null, f, bc__8490, arglist__8488)
      }else {
        return f.cljs$lang$applyTo(arglist__8488)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8488))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__8491 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__8492 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8493 = cljs.core.bounded_count.call(null, arglist__8491, fixed_arity__8492 + 1);
      if(bc__8493 <= fixed_arity__8492) {
        return cljs.core.apply_to.call(null, f, bc__8493, arglist__8491)
      }else {
        return f.cljs$lang$applyTo(arglist__8491)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8491))
    }
  };
  var apply__6 = function() {
    var G__8497__delegate = function(f, a, b, c, d, args) {
      var arglist__8494 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__8495 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__8496 = cljs.core.bounded_count.call(null, arglist__8494, fixed_arity__8495 + 1);
        if(bc__8496 <= fixed_arity__8495) {
          return cljs.core.apply_to.call(null, f, bc__8496, arglist__8494)
        }else {
          return f.cljs$lang$applyTo(arglist__8494)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__8494))
      }
    };
    var G__8497 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8497__delegate.call(this, f, a, b, c, d, args)
    };
    G__8497.cljs$lang$maxFixedArity = 5;
    G__8497.cljs$lang$applyTo = function(arglist__8498) {
      var f = cljs.core.first(arglist__8498);
      var a = cljs.core.first(cljs.core.next(arglist__8498));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8498)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8498))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8498)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8498)))));
      return G__8497__delegate(f, a, b, c, d, args)
    };
    G__8497.cljs$lang$arity$variadic = G__8497__delegate;
    return G__8497
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
  vary_meta.cljs$lang$applyTo = function(arglist__8499) {
    var obj = cljs.core.first(arglist__8499);
    var f = cljs.core.first(cljs.core.next(arglist__8499));
    var args = cljs.core.rest(cljs.core.next(arglist__8499));
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
    var G__8500__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__8500 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8500__delegate.call(this, x, y, more)
    };
    G__8500.cljs$lang$maxFixedArity = 2;
    G__8500.cljs$lang$applyTo = function(arglist__8501) {
      var x = cljs.core.first(arglist__8501);
      var y = cljs.core.first(cljs.core.next(arglist__8501));
      var more = cljs.core.rest(cljs.core.next(arglist__8501));
      return G__8500__delegate(x, y, more)
    };
    G__8500.cljs$lang$arity$variadic = G__8500__delegate;
    return G__8500
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
        var G__8502 = pred;
        var G__8503 = cljs.core.next.call(null, coll);
        pred = G__8502;
        coll = G__8503;
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
      var or__3824__auto____8505 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8505)) {
        return or__3824__auto____8505
      }else {
        var G__8506 = pred;
        var G__8507 = cljs.core.next.call(null, coll);
        pred = G__8506;
        coll = G__8507;
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
    var G__8508 = null;
    var G__8508__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8508__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8508__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8508__3 = function() {
      var G__8509__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8509 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8509__delegate.call(this, x, y, zs)
      };
      G__8509.cljs$lang$maxFixedArity = 2;
      G__8509.cljs$lang$applyTo = function(arglist__8510) {
        var x = cljs.core.first(arglist__8510);
        var y = cljs.core.first(cljs.core.next(arglist__8510));
        var zs = cljs.core.rest(cljs.core.next(arglist__8510));
        return G__8509__delegate(x, y, zs)
      };
      G__8509.cljs$lang$arity$variadic = G__8509__delegate;
      return G__8509
    }();
    G__8508 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8508__0.call(this);
        case 1:
          return G__8508__1.call(this, x);
        case 2:
          return G__8508__2.call(this, x, y);
        default:
          return G__8508__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8508.cljs$lang$maxFixedArity = 2;
    G__8508.cljs$lang$applyTo = G__8508__3.cljs$lang$applyTo;
    return G__8508
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8511__delegate = function(args) {
      return x
    };
    var G__8511 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8511__delegate.call(this, args)
    };
    G__8511.cljs$lang$maxFixedArity = 0;
    G__8511.cljs$lang$applyTo = function(arglist__8512) {
      var args = cljs.core.seq(arglist__8512);
      return G__8511__delegate(args)
    };
    G__8511.cljs$lang$arity$variadic = G__8511__delegate;
    return G__8511
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
      var G__8519 = null;
      var G__8519__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8519__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8519__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8519__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8519__4 = function() {
        var G__8520__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8520 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8520__delegate.call(this, x, y, z, args)
        };
        G__8520.cljs$lang$maxFixedArity = 3;
        G__8520.cljs$lang$applyTo = function(arglist__8521) {
          var x = cljs.core.first(arglist__8521);
          var y = cljs.core.first(cljs.core.next(arglist__8521));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8521)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8521)));
          return G__8520__delegate(x, y, z, args)
        };
        G__8520.cljs$lang$arity$variadic = G__8520__delegate;
        return G__8520
      }();
      G__8519 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8519__0.call(this);
          case 1:
            return G__8519__1.call(this, x);
          case 2:
            return G__8519__2.call(this, x, y);
          case 3:
            return G__8519__3.call(this, x, y, z);
          default:
            return G__8519__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8519.cljs$lang$maxFixedArity = 3;
      G__8519.cljs$lang$applyTo = G__8519__4.cljs$lang$applyTo;
      return G__8519
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8522 = null;
      var G__8522__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8522__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8522__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8522__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8522__4 = function() {
        var G__8523__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8523 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8523__delegate.call(this, x, y, z, args)
        };
        G__8523.cljs$lang$maxFixedArity = 3;
        G__8523.cljs$lang$applyTo = function(arglist__8524) {
          var x = cljs.core.first(arglist__8524);
          var y = cljs.core.first(cljs.core.next(arglist__8524));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8524)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8524)));
          return G__8523__delegate(x, y, z, args)
        };
        G__8523.cljs$lang$arity$variadic = G__8523__delegate;
        return G__8523
      }();
      G__8522 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8522__0.call(this);
          case 1:
            return G__8522__1.call(this, x);
          case 2:
            return G__8522__2.call(this, x, y);
          case 3:
            return G__8522__3.call(this, x, y, z);
          default:
            return G__8522__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8522.cljs$lang$maxFixedArity = 3;
      G__8522.cljs$lang$applyTo = G__8522__4.cljs$lang$applyTo;
      return G__8522
    }()
  };
  var comp__4 = function() {
    var G__8525__delegate = function(f1, f2, f3, fs) {
      var fs__8516 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8526__delegate = function(args) {
          var ret__8517 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8516), args);
          var fs__8518 = cljs.core.next.call(null, fs__8516);
          while(true) {
            if(fs__8518) {
              var G__8527 = cljs.core.first.call(null, fs__8518).call(null, ret__8517);
              var G__8528 = cljs.core.next.call(null, fs__8518);
              ret__8517 = G__8527;
              fs__8518 = G__8528;
              continue
            }else {
              return ret__8517
            }
            break
          }
        };
        var G__8526 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8526__delegate.call(this, args)
        };
        G__8526.cljs$lang$maxFixedArity = 0;
        G__8526.cljs$lang$applyTo = function(arglist__8529) {
          var args = cljs.core.seq(arglist__8529);
          return G__8526__delegate(args)
        };
        G__8526.cljs$lang$arity$variadic = G__8526__delegate;
        return G__8526
      }()
    };
    var G__8525 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8525__delegate.call(this, f1, f2, f3, fs)
    };
    G__8525.cljs$lang$maxFixedArity = 3;
    G__8525.cljs$lang$applyTo = function(arglist__8530) {
      var f1 = cljs.core.first(arglist__8530);
      var f2 = cljs.core.first(cljs.core.next(arglist__8530));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8530)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8530)));
      return G__8525__delegate(f1, f2, f3, fs)
    };
    G__8525.cljs$lang$arity$variadic = G__8525__delegate;
    return G__8525
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
      var G__8531__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8531 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8531__delegate.call(this, args)
      };
      G__8531.cljs$lang$maxFixedArity = 0;
      G__8531.cljs$lang$applyTo = function(arglist__8532) {
        var args = cljs.core.seq(arglist__8532);
        return G__8531__delegate(args)
      };
      G__8531.cljs$lang$arity$variadic = G__8531__delegate;
      return G__8531
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8533__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8533 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8533__delegate.call(this, args)
      };
      G__8533.cljs$lang$maxFixedArity = 0;
      G__8533.cljs$lang$applyTo = function(arglist__8534) {
        var args = cljs.core.seq(arglist__8534);
        return G__8533__delegate(args)
      };
      G__8533.cljs$lang$arity$variadic = G__8533__delegate;
      return G__8533
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8535__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8535 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8535__delegate.call(this, args)
      };
      G__8535.cljs$lang$maxFixedArity = 0;
      G__8535.cljs$lang$applyTo = function(arglist__8536) {
        var args = cljs.core.seq(arglist__8536);
        return G__8535__delegate(args)
      };
      G__8535.cljs$lang$arity$variadic = G__8535__delegate;
      return G__8535
    }()
  };
  var partial__5 = function() {
    var G__8537__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8538__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8538 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8538__delegate.call(this, args)
        };
        G__8538.cljs$lang$maxFixedArity = 0;
        G__8538.cljs$lang$applyTo = function(arglist__8539) {
          var args = cljs.core.seq(arglist__8539);
          return G__8538__delegate(args)
        };
        G__8538.cljs$lang$arity$variadic = G__8538__delegate;
        return G__8538
      }()
    };
    var G__8537 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8537__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8537.cljs$lang$maxFixedArity = 4;
    G__8537.cljs$lang$applyTo = function(arglist__8540) {
      var f = cljs.core.first(arglist__8540);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8540));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8540)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8540))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8540))));
      return G__8537__delegate(f, arg1, arg2, arg3, more)
    };
    G__8537.cljs$lang$arity$variadic = G__8537__delegate;
    return G__8537
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
      var G__8541 = null;
      var G__8541__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8541__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8541__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8541__4 = function() {
        var G__8542__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8542 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8542__delegate.call(this, a, b, c, ds)
        };
        G__8542.cljs$lang$maxFixedArity = 3;
        G__8542.cljs$lang$applyTo = function(arglist__8543) {
          var a = cljs.core.first(arglist__8543);
          var b = cljs.core.first(cljs.core.next(arglist__8543));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8543)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8543)));
          return G__8542__delegate(a, b, c, ds)
        };
        G__8542.cljs$lang$arity$variadic = G__8542__delegate;
        return G__8542
      }();
      G__8541 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8541__1.call(this, a);
          case 2:
            return G__8541__2.call(this, a, b);
          case 3:
            return G__8541__3.call(this, a, b, c);
          default:
            return G__8541__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8541.cljs$lang$maxFixedArity = 3;
      G__8541.cljs$lang$applyTo = G__8541__4.cljs$lang$applyTo;
      return G__8541
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8544 = null;
      var G__8544__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8544__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8544__4 = function() {
        var G__8545__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8545 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8545__delegate.call(this, a, b, c, ds)
        };
        G__8545.cljs$lang$maxFixedArity = 3;
        G__8545.cljs$lang$applyTo = function(arglist__8546) {
          var a = cljs.core.first(arglist__8546);
          var b = cljs.core.first(cljs.core.next(arglist__8546));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8546)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8546)));
          return G__8545__delegate(a, b, c, ds)
        };
        G__8545.cljs$lang$arity$variadic = G__8545__delegate;
        return G__8545
      }();
      G__8544 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8544__2.call(this, a, b);
          case 3:
            return G__8544__3.call(this, a, b, c);
          default:
            return G__8544__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8544.cljs$lang$maxFixedArity = 3;
      G__8544.cljs$lang$applyTo = G__8544__4.cljs$lang$applyTo;
      return G__8544
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8547 = null;
      var G__8547__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8547__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8547__4 = function() {
        var G__8548__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8548 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8548__delegate.call(this, a, b, c, ds)
        };
        G__8548.cljs$lang$maxFixedArity = 3;
        G__8548.cljs$lang$applyTo = function(arglist__8549) {
          var a = cljs.core.first(arglist__8549);
          var b = cljs.core.first(cljs.core.next(arglist__8549));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8549)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8549)));
          return G__8548__delegate(a, b, c, ds)
        };
        G__8548.cljs$lang$arity$variadic = G__8548__delegate;
        return G__8548
      }();
      G__8547 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8547__2.call(this, a, b);
          case 3:
            return G__8547__3.call(this, a, b, c);
          default:
            return G__8547__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8547.cljs$lang$maxFixedArity = 3;
      G__8547.cljs$lang$applyTo = G__8547__4.cljs$lang$applyTo;
      return G__8547
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
  var mapi__8565 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8573 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8573) {
        var s__8574 = temp__3974__auto____8573;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8574)) {
          var c__8575 = cljs.core.chunk_first.call(null, s__8574);
          var size__8576 = cljs.core.count.call(null, c__8575);
          var b__8577 = cljs.core.chunk_buffer.call(null, size__8576);
          var n__2525__auto____8578 = size__8576;
          var i__8579 = 0;
          while(true) {
            if(i__8579 < n__2525__auto____8578) {
              cljs.core.chunk_append.call(null, b__8577, f.call(null, idx + i__8579, cljs.core._nth.call(null, c__8575, i__8579)));
              var G__8580 = i__8579 + 1;
              i__8579 = G__8580;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8577), mapi.call(null, idx + size__8576, cljs.core.chunk_rest.call(null, s__8574)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8574)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8574)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8565.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8590 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8590) {
      var s__8591 = temp__3974__auto____8590;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8591)) {
        var c__8592 = cljs.core.chunk_first.call(null, s__8591);
        var size__8593 = cljs.core.count.call(null, c__8592);
        var b__8594 = cljs.core.chunk_buffer.call(null, size__8593);
        var n__2525__auto____8595 = size__8593;
        var i__8596 = 0;
        while(true) {
          if(i__8596 < n__2525__auto____8595) {
            var x__8597 = f.call(null, cljs.core._nth.call(null, c__8592, i__8596));
            if(x__8597 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8594, x__8597)
            }
            var G__8599 = i__8596 + 1;
            i__8596 = G__8599;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8594), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8591)))
      }else {
        var x__8598 = f.call(null, cljs.core.first.call(null, s__8591));
        if(x__8598 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8591))
        }else {
          return cljs.core.cons.call(null, x__8598, keep.call(null, f, cljs.core.rest.call(null, s__8591)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8625 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8635 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8635) {
        var s__8636 = temp__3974__auto____8635;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8636)) {
          var c__8637 = cljs.core.chunk_first.call(null, s__8636);
          var size__8638 = cljs.core.count.call(null, c__8637);
          var b__8639 = cljs.core.chunk_buffer.call(null, size__8638);
          var n__2525__auto____8640 = size__8638;
          var i__8641 = 0;
          while(true) {
            if(i__8641 < n__2525__auto____8640) {
              var x__8642 = f.call(null, idx + i__8641, cljs.core._nth.call(null, c__8637, i__8641));
              if(x__8642 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8639, x__8642)
              }
              var G__8644 = i__8641 + 1;
              i__8641 = G__8644;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8639), keepi.call(null, idx + size__8638, cljs.core.chunk_rest.call(null, s__8636)))
        }else {
          var x__8643 = f.call(null, idx, cljs.core.first.call(null, s__8636));
          if(x__8643 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8636))
          }else {
            return cljs.core.cons.call(null, x__8643, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8636)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8625.call(null, 0, coll)
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
          var and__3822__auto____8730 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8730)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8730
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8731 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8731)) {
            var and__3822__auto____8732 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8732)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8732
            }
          }else {
            return and__3822__auto____8731
          }
        }())
      };
      var ep1__4 = function() {
        var G__8801__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8733 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8733)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8733
            }
          }())
        };
        var G__8801 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8801__delegate.call(this, x, y, z, args)
        };
        G__8801.cljs$lang$maxFixedArity = 3;
        G__8801.cljs$lang$applyTo = function(arglist__8802) {
          var x = cljs.core.first(arglist__8802);
          var y = cljs.core.first(cljs.core.next(arglist__8802));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8802)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8802)));
          return G__8801__delegate(x, y, z, args)
        };
        G__8801.cljs$lang$arity$variadic = G__8801__delegate;
        return G__8801
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
          var and__3822__auto____8745 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8745)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8745
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8746 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8746)) {
            var and__3822__auto____8747 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8747)) {
              var and__3822__auto____8748 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8748)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8748
              }
            }else {
              return and__3822__auto____8747
            }
          }else {
            return and__3822__auto____8746
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8749 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8749)) {
            var and__3822__auto____8750 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8750)) {
              var and__3822__auto____8751 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8751)) {
                var and__3822__auto____8752 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8752)) {
                  var and__3822__auto____8753 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8753)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8753
                  }
                }else {
                  return and__3822__auto____8752
                }
              }else {
                return and__3822__auto____8751
              }
            }else {
              return and__3822__auto____8750
            }
          }else {
            return and__3822__auto____8749
          }
        }())
      };
      var ep2__4 = function() {
        var G__8803__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8754 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8754)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8600_SHARP_) {
                var and__3822__auto____8755 = p1.call(null, p1__8600_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8755)) {
                  return p2.call(null, p1__8600_SHARP_)
                }else {
                  return and__3822__auto____8755
                }
              }, args)
            }else {
              return and__3822__auto____8754
            }
          }())
        };
        var G__8803 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8803__delegate.call(this, x, y, z, args)
        };
        G__8803.cljs$lang$maxFixedArity = 3;
        G__8803.cljs$lang$applyTo = function(arglist__8804) {
          var x = cljs.core.first(arglist__8804);
          var y = cljs.core.first(cljs.core.next(arglist__8804));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8804)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8804)));
          return G__8803__delegate(x, y, z, args)
        };
        G__8803.cljs$lang$arity$variadic = G__8803__delegate;
        return G__8803
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
          var and__3822__auto____8774 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8774)) {
            var and__3822__auto____8775 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8775)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8775
            }
          }else {
            return and__3822__auto____8774
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8776 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8776)) {
            var and__3822__auto____8777 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8777)) {
              var and__3822__auto____8778 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8778)) {
                var and__3822__auto____8779 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8779)) {
                  var and__3822__auto____8780 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8780)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8780
                  }
                }else {
                  return and__3822__auto____8779
                }
              }else {
                return and__3822__auto____8778
              }
            }else {
              return and__3822__auto____8777
            }
          }else {
            return and__3822__auto____8776
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8781 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8781)) {
            var and__3822__auto____8782 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8782)) {
              var and__3822__auto____8783 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8783)) {
                var and__3822__auto____8784 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8784)) {
                  var and__3822__auto____8785 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8785)) {
                    var and__3822__auto____8786 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8786)) {
                      var and__3822__auto____8787 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8787)) {
                        var and__3822__auto____8788 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8788)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8788
                        }
                      }else {
                        return and__3822__auto____8787
                      }
                    }else {
                      return and__3822__auto____8786
                    }
                  }else {
                    return and__3822__auto____8785
                  }
                }else {
                  return and__3822__auto____8784
                }
              }else {
                return and__3822__auto____8783
              }
            }else {
              return and__3822__auto____8782
            }
          }else {
            return and__3822__auto____8781
          }
        }())
      };
      var ep3__4 = function() {
        var G__8805__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8789 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8789)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8601_SHARP_) {
                var and__3822__auto____8790 = p1.call(null, p1__8601_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8790)) {
                  var and__3822__auto____8791 = p2.call(null, p1__8601_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8791)) {
                    return p3.call(null, p1__8601_SHARP_)
                  }else {
                    return and__3822__auto____8791
                  }
                }else {
                  return and__3822__auto____8790
                }
              }, args)
            }else {
              return and__3822__auto____8789
            }
          }())
        };
        var G__8805 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8805__delegate.call(this, x, y, z, args)
        };
        G__8805.cljs$lang$maxFixedArity = 3;
        G__8805.cljs$lang$applyTo = function(arglist__8806) {
          var x = cljs.core.first(arglist__8806);
          var y = cljs.core.first(cljs.core.next(arglist__8806));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8806)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8806)));
          return G__8805__delegate(x, y, z, args)
        };
        G__8805.cljs$lang$arity$variadic = G__8805__delegate;
        return G__8805
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
    var G__8807__delegate = function(p1, p2, p3, ps) {
      var ps__8792 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8602_SHARP_) {
            return p1__8602_SHARP_.call(null, x)
          }, ps__8792)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8603_SHARP_) {
            var and__3822__auto____8797 = p1__8603_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8797)) {
              return p1__8603_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8797
            }
          }, ps__8792)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8604_SHARP_) {
            var and__3822__auto____8798 = p1__8604_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8798)) {
              var and__3822__auto____8799 = p1__8604_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8799)) {
                return p1__8604_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8799
              }
            }else {
              return and__3822__auto____8798
            }
          }, ps__8792)
        };
        var epn__4 = function() {
          var G__8808__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8800 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8800)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8605_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8605_SHARP_, args)
                }, ps__8792)
              }else {
                return and__3822__auto____8800
              }
            }())
          };
          var G__8808 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8808__delegate.call(this, x, y, z, args)
          };
          G__8808.cljs$lang$maxFixedArity = 3;
          G__8808.cljs$lang$applyTo = function(arglist__8809) {
            var x = cljs.core.first(arglist__8809);
            var y = cljs.core.first(cljs.core.next(arglist__8809));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8809)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8809)));
            return G__8808__delegate(x, y, z, args)
          };
          G__8808.cljs$lang$arity$variadic = G__8808__delegate;
          return G__8808
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
    var G__8807 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8807__delegate.call(this, p1, p2, p3, ps)
    };
    G__8807.cljs$lang$maxFixedArity = 3;
    G__8807.cljs$lang$applyTo = function(arglist__8810) {
      var p1 = cljs.core.first(arglist__8810);
      var p2 = cljs.core.first(cljs.core.next(arglist__8810));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8810)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8810)));
      return G__8807__delegate(p1, p2, p3, ps)
    };
    G__8807.cljs$lang$arity$variadic = G__8807__delegate;
    return G__8807
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
        var or__3824__auto____8891 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8891)) {
          return or__3824__auto____8891
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8892 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8892)) {
          return or__3824__auto____8892
        }else {
          var or__3824__auto____8893 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8893)) {
            return or__3824__auto____8893
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8962__delegate = function(x, y, z, args) {
          var or__3824__auto____8894 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8894)) {
            return or__3824__auto____8894
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8962 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8962__delegate.call(this, x, y, z, args)
        };
        G__8962.cljs$lang$maxFixedArity = 3;
        G__8962.cljs$lang$applyTo = function(arglist__8963) {
          var x = cljs.core.first(arglist__8963);
          var y = cljs.core.first(cljs.core.next(arglist__8963));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8963)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8963)));
          return G__8962__delegate(x, y, z, args)
        };
        G__8962.cljs$lang$arity$variadic = G__8962__delegate;
        return G__8962
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
        var or__3824__auto____8906 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8906)) {
          return or__3824__auto____8906
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8907 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8907)) {
          return or__3824__auto____8907
        }else {
          var or__3824__auto____8908 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8908)) {
            return or__3824__auto____8908
          }else {
            var or__3824__auto____8909 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8909)) {
              return or__3824__auto____8909
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8910 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8910)) {
          return or__3824__auto____8910
        }else {
          var or__3824__auto____8911 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8911)) {
            return or__3824__auto____8911
          }else {
            var or__3824__auto____8912 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8912)) {
              return or__3824__auto____8912
            }else {
              var or__3824__auto____8913 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8913)) {
                return or__3824__auto____8913
              }else {
                var or__3824__auto____8914 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8914)) {
                  return or__3824__auto____8914
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8964__delegate = function(x, y, z, args) {
          var or__3824__auto____8915 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8915)) {
            return or__3824__auto____8915
          }else {
            return cljs.core.some.call(null, function(p1__8645_SHARP_) {
              var or__3824__auto____8916 = p1.call(null, p1__8645_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8916)) {
                return or__3824__auto____8916
              }else {
                return p2.call(null, p1__8645_SHARP_)
              }
            }, args)
          }
        };
        var G__8964 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8964__delegate.call(this, x, y, z, args)
        };
        G__8964.cljs$lang$maxFixedArity = 3;
        G__8964.cljs$lang$applyTo = function(arglist__8965) {
          var x = cljs.core.first(arglist__8965);
          var y = cljs.core.first(cljs.core.next(arglist__8965));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8965)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8965)));
          return G__8964__delegate(x, y, z, args)
        };
        G__8964.cljs$lang$arity$variadic = G__8964__delegate;
        return G__8964
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
        var or__3824__auto____8935 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8935)) {
          return or__3824__auto____8935
        }else {
          var or__3824__auto____8936 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8936)) {
            return or__3824__auto____8936
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8937 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8937)) {
          return or__3824__auto____8937
        }else {
          var or__3824__auto____8938 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8938)) {
            return or__3824__auto____8938
          }else {
            var or__3824__auto____8939 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8939)) {
              return or__3824__auto____8939
            }else {
              var or__3824__auto____8940 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8940)) {
                return or__3824__auto____8940
              }else {
                var or__3824__auto____8941 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8941)) {
                  return or__3824__auto____8941
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8942 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8942)) {
          return or__3824__auto____8942
        }else {
          var or__3824__auto____8943 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8943)) {
            return or__3824__auto____8943
          }else {
            var or__3824__auto____8944 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8944)) {
              return or__3824__auto____8944
            }else {
              var or__3824__auto____8945 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8945)) {
                return or__3824__auto____8945
              }else {
                var or__3824__auto____8946 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8946)) {
                  return or__3824__auto____8946
                }else {
                  var or__3824__auto____8947 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8947)) {
                    return or__3824__auto____8947
                  }else {
                    var or__3824__auto____8948 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8948)) {
                      return or__3824__auto____8948
                    }else {
                      var or__3824__auto____8949 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8949)) {
                        return or__3824__auto____8949
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
        var G__8966__delegate = function(x, y, z, args) {
          var or__3824__auto____8950 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8950)) {
            return or__3824__auto____8950
          }else {
            return cljs.core.some.call(null, function(p1__8646_SHARP_) {
              var or__3824__auto____8951 = p1.call(null, p1__8646_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8951)) {
                return or__3824__auto____8951
              }else {
                var or__3824__auto____8952 = p2.call(null, p1__8646_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8952)) {
                  return or__3824__auto____8952
                }else {
                  return p3.call(null, p1__8646_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8966 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8966__delegate.call(this, x, y, z, args)
        };
        G__8966.cljs$lang$maxFixedArity = 3;
        G__8966.cljs$lang$applyTo = function(arglist__8967) {
          var x = cljs.core.first(arglist__8967);
          var y = cljs.core.first(cljs.core.next(arglist__8967));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8967)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8967)));
          return G__8966__delegate(x, y, z, args)
        };
        G__8966.cljs$lang$arity$variadic = G__8966__delegate;
        return G__8966
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
    var G__8968__delegate = function(p1, p2, p3, ps) {
      var ps__8953 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8647_SHARP_) {
            return p1__8647_SHARP_.call(null, x)
          }, ps__8953)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8648_SHARP_) {
            var or__3824__auto____8958 = p1__8648_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8958)) {
              return or__3824__auto____8958
            }else {
              return p1__8648_SHARP_.call(null, y)
            }
          }, ps__8953)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8649_SHARP_) {
            var or__3824__auto____8959 = p1__8649_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8959)) {
              return or__3824__auto____8959
            }else {
              var or__3824__auto____8960 = p1__8649_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8960)) {
                return or__3824__auto____8960
              }else {
                return p1__8649_SHARP_.call(null, z)
              }
            }
          }, ps__8953)
        };
        var spn__4 = function() {
          var G__8969__delegate = function(x, y, z, args) {
            var or__3824__auto____8961 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8961)) {
              return or__3824__auto____8961
            }else {
              return cljs.core.some.call(null, function(p1__8650_SHARP_) {
                return cljs.core.some.call(null, p1__8650_SHARP_, args)
              }, ps__8953)
            }
          };
          var G__8969 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8969__delegate.call(this, x, y, z, args)
          };
          G__8969.cljs$lang$maxFixedArity = 3;
          G__8969.cljs$lang$applyTo = function(arglist__8970) {
            var x = cljs.core.first(arglist__8970);
            var y = cljs.core.first(cljs.core.next(arglist__8970));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8970)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8970)));
            return G__8969__delegate(x, y, z, args)
          };
          G__8969.cljs$lang$arity$variadic = G__8969__delegate;
          return G__8969
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
    var G__8968 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8968__delegate.call(this, p1, p2, p3, ps)
    };
    G__8968.cljs$lang$maxFixedArity = 3;
    G__8968.cljs$lang$applyTo = function(arglist__8971) {
      var p1 = cljs.core.first(arglist__8971);
      var p2 = cljs.core.first(cljs.core.next(arglist__8971));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8971)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8971)));
      return G__8968__delegate(p1, p2, p3, ps)
    };
    G__8968.cljs$lang$arity$variadic = G__8968__delegate;
    return G__8968
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
      var temp__3974__auto____8990 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8990) {
        var s__8991 = temp__3974__auto____8990;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8991)) {
          var c__8992 = cljs.core.chunk_first.call(null, s__8991);
          var size__8993 = cljs.core.count.call(null, c__8992);
          var b__8994 = cljs.core.chunk_buffer.call(null, size__8993);
          var n__2525__auto____8995 = size__8993;
          var i__8996 = 0;
          while(true) {
            if(i__8996 < n__2525__auto____8995) {
              cljs.core.chunk_append.call(null, b__8994, f.call(null, cljs.core._nth.call(null, c__8992, i__8996)));
              var G__9008 = i__8996 + 1;
              i__8996 = G__9008;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8994), map.call(null, f, cljs.core.chunk_rest.call(null, s__8991)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8991)), map.call(null, f, cljs.core.rest.call(null, s__8991)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8997 = cljs.core.seq.call(null, c1);
      var s2__8998 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8999 = s1__8997;
        if(and__3822__auto____8999) {
          return s2__8998
        }else {
          return and__3822__auto____8999
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8997), cljs.core.first.call(null, s2__8998)), map.call(null, f, cljs.core.rest.call(null, s1__8997), cljs.core.rest.call(null, s2__8998)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9000 = cljs.core.seq.call(null, c1);
      var s2__9001 = cljs.core.seq.call(null, c2);
      var s3__9002 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____9003 = s1__9000;
        if(and__3822__auto____9003) {
          var and__3822__auto____9004 = s2__9001;
          if(and__3822__auto____9004) {
            return s3__9002
          }else {
            return and__3822__auto____9004
          }
        }else {
          return and__3822__auto____9003
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9000), cljs.core.first.call(null, s2__9001), cljs.core.first.call(null, s3__9002)), map.call(null, f, cljs.core.rest.call(null, s1__9000), cljs.core.rest.call(null, s2__9001), cljs.core.rest.call(null, s3__9002)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__9009__delegate = function(f, c1, c2, c3, colls) {
      var step__9007 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__9006 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9006)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__9006), step.call(null, map.call(null, cljs.core.rest, ss__9006)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8811_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8811_SHARP_)
      }, step__9007.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__9009 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9009__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9009.cljs$lang$maxFixedArity = 4;
    G__9009.cljs$lang$applyTo = function(arglist__9010) {
      var f = cljs.core.first(arglist__9010);
      var c1 = cljs.core.first(cljs.core.next(arglist__9010));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9010)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9010))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9010))));
      return G__9009__delegate(f, c1, c2, c3, colls)
    };
    G__9009.cljs$lang$arity$variadic = G__9009__delegate;
    return G__9009
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
      var temp__3974__auto____9013 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9013) {
        var s__9014 = temp__3974__auto____9013;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9014), take.call(null, n - 1, cljs.core.rest.call(null, s__9014)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__9020 = function(n, coll) {
    while(true) {
      var s__9018 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9019 = n > 0;
        if(and__3822__auto____9019) {
          return s__9018
        }else {
          return and__3822__auto____9019
        }
      }())) {
        var G__9021 = n - 1;
        var G__9022 = cljs.core.rest.call(null, s__9018);
        n = G__9021;
        coll = G__9022;
        continue
      }else {
        return s__9018
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9020.call(null, n, coll)
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
  var s__9025 = cljs.core.seq.call(null, coll);
  var lead__9026 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__9026) {
      var G__9027 = cljs.core.next.call(null, s__9025);
      var G__9028 = cljs.core.next.call(null, lead__9026);
      s__9025 = G__9027;
      lead__9026 = G__9028;
      continue
    }else {
      return s__9025
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__9034 = function(pred, coll) {
    while(true) {
      var s__9032 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9033 = s__9032;
        if(and__3822__auto____9033) {
          return pred.call(null, cljs.core.first.call(null, s__9032))
        }else {
          return and__3822__auto____9033
        }
      }())) {
        var G__9035 = pred;
        var G__9036 = cljs.core.rest.call(null, s__9032);
        pred = G__9035;
        coll = G__9036;
        continue
      }else {
        return s__9032
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9034.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9039 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9039) {
      var s__9040 = temp__3974__auto____9039;
      return cljs.core.concat.call(null, s__9040, cycle.call(null, s__9040))
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
      var s1__9045 = cljs.core.seq.call(null, c1);
      var s2__9046 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____9047 = s1__9045;
        if(and__3822__auto____9047) {
          return s2__9046
        }else {
          return and__3822__auto____9047
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__9045), cljs.core.cons.call(null, cljs.core.first.call(null, s2__9046), interleave.call(null, cljs.core.rest.call(null, s1__9045), cljs.core.rest.call(null, s2__9046))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__9049__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__9048 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9048)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__9048), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__9048)))
        }else {
          return null
        }
      }, null)
    };
    var G__9049 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9049__delegate.call(this, c1, c2, colls)
    };
    G__9049.cljs$lang$maxFixedArity = 2;
    G__9049.cljs$lang$applyTo = function(arglist__9050) {
      var c1 = cljs.core.first(arglist__9050);
      var c2 = cljs.core.first(cljs.core.next(arglist__9050));
      var colls = cljs.core.rest(cljs.core.next(arglist__9050));
      return G__9049__delegate(c1, c2, colls)
    };
    G__9049.cljs$lang$arity$variadic = G__9049__delegate;
    return G__9049
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
  var cat__9060 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9058 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9058) {
        var coll__9059 = temp__3971__auto____9058;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__9059), cat.call(null, cljs.core.rest.call(null, coll__9059), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__9060.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__9061__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__9061 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9061__delegate.call(this, f, coll, colls)
    };
    G__9061.cljs$lang$maxFixedArity = 2;
    G__9061.cljs$lang$applyTo = function(arglist__9062) {
      var f = cljs.core.first(arglist__9062);
      var coll = cljs.core.first(cljs.core.next(arglist__9062));
      var colls = cljs.core.rest(cljs.core.next(arglist__9062));
      return G__9061__delegate(f, coll, colls)
    };
    G__9061.cljs$lang$arity$variadic = G__9061__delegate;
    return G__9061
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
    var temp__3974__auto____9072 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9072) {
      var s__9073 = temp__3974__auto____9072;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__9073)) {
        var c__9074 = cljs.core.chunk_first.call(null, s__9073);
        var size__9075 = cljs.core.count.call(null, c__9074);
        var b__9076 = cljs.core.chunk_buffer.call(null, size__9075);
        var n__2525__auto____9077 = size__9075;
        var i__9078 = 0;
        while(true) {
          if(i__9078 < n__2525__auto____9077) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__9074, i__9078)))) {
              cljs.core.chunk_append.call(null, b__9076, cljs.core._nth.call(null, c__9074, i__9078))
            }else {
            }
            var G__9081 = i__9078 + 1;
            i__9078 = G__9081;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9076), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__9073)))
      }else {
        var f__9079 = cljs.core.first.call(null, s__9073);
        var r__9080 = cljs.core.rest.call(null, s__9073);
        if(cljs.core.truth_(pred.call(null, f__9079))) {
          return cljs.core.cons.call(null, f__9079, filter.call(null, pred, r__9080))
        }else {
          return filter.call(null, pred, r__9080)
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
  var walk__9084 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__9084.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9082_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__9082_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__9088__9089 = to;
    if(G__9088__9089) {
      if(function() {
        var or__3824__auto____9090 = G__9088__9089.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____9090) {
          return or__3824__auto____9090
        }else {
          return G__9088__9089.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__9088__9089.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9088__9089)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9088__9089)
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
    var G__9091__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__9091 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9091__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9091.cljs$lang$maxFixedArity = 4;
    G__9091.cljs$lang$applyTo = function(arglist__9092) {
      var f = cljs.core.first(arglist__9092);
      var c1 = cljs.core.first(cljs.core.next(arglist__9092));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9092)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9092))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9092))));
      return G__9091__delegate(f, c1, c2, c3, colls)
    };
    G__9091.cljs$lang$arity$variadic = G__9091__delegate;
    return G__9091
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
      var temp__3974__auto____9099 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9099) {
        var s__9100 = temp__3974__auto____9099;
        var p__9101 = cljs.core.take.call(null, n, s__9100);
        if(n === cljs.core.count.call(null, p__9101)) {
          return cljs.core.cons.call(null, p__9101, partition.call(null, n, step, cljs.core.drop.call(null, step, s__9100)))
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
      var temp__3974__auto____9102 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9102) {
        var s__9103 = temp__3974__auto____9102;
        var p__9104 = cljs.core.take.call(null, n, s__9103);
        if(n === cljs.core.count.call(null, p__9104)) {
          return cljs.core.cons.call(null, p__9104, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__9103)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__9104, pad)))
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
    var sentinel__9109 = cljs.core.lookup_sentinel;
    var m__9110 = m;
    var ks__9111 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__9111) {
        var m__9112 = cljs.core._lookup.call(null, m__9110, cljs.core.first.call(null, ks__9111), sentinel__9109);
        if(sentinel__9109 === m__9112) {
          return not_found
        }else {
          var G__9113 = sentinel__9109;
          var G__9114 = m__9112;
          var G__9115 = cljs.core.next.call(null, ks__9111);
          sentinel__9109 = G__9113;
          m__9110 = G__9114;
          ks__9111 = G__9115;
          continue
        }
      }else {
        return m__9110
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
cljs.core.assoc_in = function assoc_in(m, p__9116, v) {
  var vec__9121__9122 = p__9116;
  var k__9123 = cljs.core.nth.call(null, vec__9121__9122, 0, null);
  var ks__9124 = cljs.core.nthnext.call(null, vec__9121__9122, 1);
  if(cljs.core.truth_(ks__9124)) {
    return cljs.core.assoc.call(null, m, k__9123, assoc_in.call(null, cljs.core._lookup.call(null, m, k__9123, null), ks__9124, v))
  }else {
    return cljs.core.assoc.call(null, m, k__9123, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__9125, f, args) {
    var vec__9130__9131 = p__9125;
    var k__9132 = cljs.core.nth.call(null, vec__9130__9131, 0, null);
    var ks__9133 = cljs.core.nthnext.call(null, vec__9130__9131, 1);
    if(cljs.core.truth_(ks__9133)) {
      return cljs.core.assoc.call(null, m, k__9132, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__9132, null), ks__9133, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__9132, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__9132, null), args))
    }
  };
  var update_in = function(m, p__9125, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__9125, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__9134) {
    var m = cljs.core.first(arglist__9134);
    var p__9125 = cljs.core.first(cljs.core.next(arglist__9134));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9134)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9134)));
    return update_in__delegate(m, p__9125, f, args)
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
  var this__9137 = this;
  var h__2190__auto____9138 = this__9137.__hash;
  if(!(h__2190__auto____9138 == null)) {
    return h__2190__auto____9138
  }else {
    var h__2190__auto____9139 = cljs.core.hash_coll.call(null, coll);
    this__9137.__hash = h__2190__auto____9139;
    return h__2190__auto____9139
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9140 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9141 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9142 = this;
  var new_array__9143 = this__9142.array.slice();
  new_array__9143[k] = v;
  return new cljs.core.Vector(this__9142.meta, new_array__9143, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__9174 = null;
  var G__9174__2 = function(this_sym9144, k) {
    var this__9146 = this;
    var this_sym9144__9147 = this;
    var coll__9148 = this_sym9144__9147;
    return coll__9148.cljs$core$ILookup$_lookup$arity$2(coll__9148, k)
  };
  var G__9174__3 = function(this_sym9145, k, not_found) {
    var this__9146 = this;
    var this_sym9145__9149 = this;
    var coll__9150 = this_sym9145__9149;
    return coll__9150.cljs$core$ILookup$_lookup$arity$3(coll__9150, k, not_found)
  };
  G__9174 = function(this_sym9145, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9174__2.call(this, this_sym9145, k);
      case 3:
        return G__9174__3.call(this, this_sym9145, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9174
}();
cljs.core.Vector.prototype.apply = function(this_sym9135, args9136) {
  var this__9151 = this;
  return this_sym9135.call.apply(this_sym9135, [this_sym9135].concat(args9136.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9152 = this;
  var new_array__9153 = this__9152.array.slice();
  new_array__9153.push(o);
  return new cljs.core.Vector(this__9152.meta, new_array__9153, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__9154 = this;
  var this__9155 = this;
  return cljs.core.pr_str.call(null, this__9155)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9156 = this;
  return cljs.core.ci_reduce.call(null, this__9156.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9157 = this;
  return cljs.core.ci_reduce.call(null, this__9157.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9158 = this;
  if(this__9158.array.length > 0) {
    var vector_seq__9159 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__9158.array.length) {
          return cljs.core.cons.call(null, this__9158.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__9159.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9160 = this;
  return this__9160.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9161 = this;
  var count__9162 = this__9161.array.length;
  if(count__9162 > 0) {
    return this__9161.array[count__9162 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9163 = this;
  if(this__9163.array.length > 0) {
    var new_array__9164 = this__9163.array.slice();
    new_array__9164.pop();
    return new cljs.core.Vector(this__9163.meta, new_array__9164, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9165 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9166 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9167 = this;
  return new cljs.core.Vector(meta, this__9167.array, this__9167.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9168 = this;
  return this__9168.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9169 = this;
  if(function() {
    var and__3822__auto____9170 = 0 <= n;
    if(and__3822__auto____9170) {
      return n < this__9169.array.length
    }else {
      return and__3822__auto____9170
    }
  }()) {
    return this__9169.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9171 = this;
  if(function() {
    var and__3822__auto____9172 = 0 <= n;
    if(and__3822__auto____9172) {
      return n < this__9171.array.length
    }else {
      return and__3822__auto____9172
    }
  }()) {
    return this__9171.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9173 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9173.meta)
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
  var cnt__9176 = pv.cnt;
  if(cnt__9176 < 32) {
    return 0
  }else {
    return cnt__9176 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__9182 = level;
  var ret__9183 = node;
  while(true) {
    if(ll__9182 === 0) {
      return ret__9183
    }else {
      var embed__9184 = ret__9183;
      var r__9185 = cljs.core.pv_fresh_node.call(null, edit);
      var ___9186 = cljs.core.pv_aset.call(null, r__9185, 0, embed__9184);
      var G__9187 = ll__9182 - 5;
      var G__9188 = r__9185;
      ll__9182 = G__9187;
      ret__9183 = G__9188;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__9194 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__9195 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__9194, subidx__9195, tailnode);
    return ret__9194
  }else {
    var child__9196 = cljs.core.pv_aget.call(null, parent, subidx__9195);
    if(!(child__9196 == null)) {
      var node_to_insert__9197 = push_tail.call(null, pv, level - 5, child__9196, tailnode);
      cljs.core.pv_aset.call(null, ret__9194, subidx__9195, node_to_insert__9197);
      return ret__9194
    }else {
      var node_to_insert__9198 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__9194, subidx__9195, node_to_insert__9198);
      return ret__9194
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____9202 = 0 <= i;
    if(and__3822__auto____9202) {
      return i < pv.cnt
    }else {
      return and__3822__auto____9202
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__9203 = pv.root;
      var level__9204 = pv.shift;
      while(true) {
        if(level__9204 > 0) {
          var G__9205 = cljs.core.pv_aget.call(null, node__9203, i >>> level__9204 & 31);
          var G__9206 = level__9204 - 5;
          node__9203 = G__9205;
          level__9204 = G__9206;
          continue
        }else {
          return node__9203.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__9209 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__9209, i & 31, val);
    return ret__9209
  }else {
    var subidx__9210 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__9209, subidx__9210, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9210), i, val));
    return ret__9209
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__9216 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9217 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9216));
    if(function() {
      var and__3822__auto____9218 = new_child__9217 == null;
      if(and__3822__auto____9218) {
        return subidx__9216 === 0
      }else {
        return and__3822__auto____9218
      }
    }()) {
      return null
    }else {
      var ret__9219 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__9219, subidx__9216, new_child__9217);
      return ret__9219
    }
  }else {
    if(subidx__9216 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__9220 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__9220, subidx__9216, null);
        return ret__9220
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
  var this__9223 = this;
  return new cljs.core.TransientVector(this__9223.cnt, this__9223.shift, cljs.core.tv_editable_root.call(null, this__9223.root), cljs.core.tv_editable_tail.call(null, this__9223.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9224 = this;
  var h__2190__auto____9225 = this__9224.__hash;
  if(!(h__2190__auto____9225 == null)) {
    return h__2190__auto____9225
  }else {
    var h__2190__auto____9226 = cljs.core.hash_coll.call(null, coll);
    this__9224.__hash = h__2190__auto____9226;
    return h__2190__auto____9226
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9227 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9228 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9229 = this;
  if(function() {
    var and__3822__auto____9230 = 0 <= k;
    if(and__3822__auto____9230) {
      return k < this__9229.cnt
    }else {
      return and__3822__auto____9230
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__9231 = this__9229.tail.slice();
      new_tail__9231[k & 31] = v;
      return new cljs.core.PersistentVector(this__9229.meta, this__9229.cnt, this__9229.shift, this__9229.root, new_tail__9231, null)
    }else {
      return new cljs.core.PersistentVector(this__9229.meta, this__9229.cnt, this__9229.shift, cljs.core.do_assoc.call(null, coll, this__9229.shift, this__9229.root, k, v), this__9229.tail, null)
    }
  }else {
    if(k === this__9229.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__9229.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__9279 = null;
  var G__9279__2 = function(this_sym9232, k) {
    var this__9234 = this;
    var this_sym9232__9235 = this;
    var coll__9236 = this_sym9232__9235;
    return coll__9236.cljs$core$ILookup$_lookup$arity$2(coll__9236, k)
  };
  var G__9279__3 = function(this_sym9233, k, not_found) {
    var this__9234 = this;
    var this_sym9233__9237 = this;
    var coll__9238 = this_sym9233__9237;
    return coll__9238.cljs$core$ILookup$_lookup$arity$3(coll__9238, k, not_found)
  };
  G__9279 = function(this_sym9233, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9279__2.call(this, this_sym9233, k);
      case 3:
        return G__9279__3.call(this, this_sym9233, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9279
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym9221, args9222) {
  var this__9239 = this;
  return this_sym9221.call.apply(this_sym9221, [this_sym9221].concat(args9222.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__9240 = this;
  var step_init__9241 = [0, init];
  var i__9242 = 0;
  while(true) {
    if(i__9242 < this__9240.cnt) {
      var arr__9243 = cljs.core.array_for.call(null, v, i__9242);
      var len__9244 = arr__9243.length;
      var init__9248 = function() {
        var j__9245 = 0;
        var init__9246 = step_init__9241[1];
        while(true) {
          if(j__9245 < len__9244) {
            var init__9247 = f.call(null, init__9246, j__9245 + i__9242, arr__9243[j__9245]);
            if(cljs.core.reduced_QMARK_.call(null, init__9247)) {
              return init__9247
            }else {
              var G__9280 = j__9245 + 1;
              var G__9281 = init__9247;
              j__9245 = G__9280;
              init__9246 = G__9281;
              continue
            }
          }else {
            step_init__9241[0] = len__9244;
            step_init__9241[1] = init__9246;
            return init__9246
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9248)) {
        return cljs.core.deref.call(null, init__9248)
      }else {
        var G__9282 = i__9242 + step_init__9241[0];
        i__9242 = G__9282;
        continue
      }
    }else {
      return step_init__9241[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9249 = this;
  if(this__9249.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__9250 = this__9249.tail.slice();
    new_tail__9250.push(o);
    return new cljs.core.PersistentVector(this__9249.meta, this__9249.cnt + 1, this__9249.shift, this__9249.root, new_tail__9250, null)
  }else {
    var root_overflow_QMARK___9251 = this__9249.cnt >>> 5 > 1 << this__9249.shift;
    var new_shift__9252 = root_overflow_QMARK___9251 ? this__9249.shift + 5 : this__9249.shift;
    var new_root__9254 = root_overflow_QMARK___9251 ? function() {
      var n_r__9253 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__9253, 0, this__9249.root);
      cljs.core.pv_aset.call(null, n_r__9253, 1, cljs.core.new_path.call(null, null, this__9249.shift, new cljs.core.VectorNode(null, this__9249.tail)));
      return n_r__9253
    }() : cljs.core.push_tail.call(null, coll, this__9249.shift, this__9249.root, new cljs.core.VectorNode(null, this__9249.tail));
    return new cljs.core.PersistentVector(this__9249.meta, this__9249.cnt + 1, new_shift__9252, new_root__9254, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9255 = this;
  if(this__9255.cnt > 0) {
    return new cljs.core.RSeq(coll, this__9255.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__9256 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__9257 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__9258 = this;
  var this__9259 = this;
  return cljs.core.pr_str.call(null, this__9259)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9260 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9261 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9262 = this;
  if(this__9262.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9263 = this;
  return this__9263.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9264 = this;
  if(this__9264.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__9264.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9265 = this;
  if(this__9265.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__9265.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9265.meta)
    }else {
      if(1 < this__9265.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__9265.meta, this__9265.cnt - 1, this__9265.shift, this__9265.root, this__9265.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__9266 = cljs.core.array_for.call(null, coll, this__9265.cnt - 2);
          var nr__9267 = cljs.core.pop_tail.call(null, coll, this__9265.shift, this__9265.root);
          var new_root__9268 = nr__9267 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__9267;
          var cnt_1__9269 = this__9265.cnt - 1;
          if(function() {
            var and__3822__auto____9270 = 5 < this__9265.shift;
            if(and__3822__auto____9270) {
              return cljs.core.pv_aget.call(null, new_root__9268, 1) == null
            }else {
              return and__3822__auto____9270
            }
          }()) {
            return new cljs.core.PersistentVector(this__9265.meta, cnt_1__9269, this__9265.shift - 5, cljs.core.pv_aget.call(null, new_root__9268, 0), new_tail__9266, null)
          }else {
            return new cljs.core.PersistentVector(this__9265.meta, cnt_1__9269, this__9265.shift, new_root__9268, new_tail__9266, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9271 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9272 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9273 = this;
  return new cljs.core.PersistentVector(meta, this__9273.cnt, this__9273.shift, this__9273.root, this__9273.tail, this__9273.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9274 = this;
  return this__9274.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9275 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9276 = this;
  if(function() {
    var and__3822__auto____9277 = 0 <= n;
    if(and__3822__auto____9277) {
      return n < this__9276.cnt
    }else {
      return and__3822__auto____9277
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9278 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9278.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__9283 = xs.length;
  var xs__9284 = no_clone === true ? xs : xs.slice();
  if(l__9283 < 32) {
    return new cljs.core.PersistentVector(null, l__9283, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__9284, null)
  }else {
    var node__9285 = xs__9284.slice(0, 32);
    var v__9286 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__9285, null);
    var i__9287 = 32;
    var out__9288 = cljs.core._as_transient.call(null, v__9286);
    while(true) {
      if(i__9287 < l__9283) {
        var G__9289 = i__9287 + 1;
        var G__9290 = cljs.core.conj_BANG_.call(null, out__9288, xs__9284[i__9287]);
        i__9287 = G__9289;
        out__9288 = G__9290;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9288)
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
  vector.cljs$lang$applyTo = function(arglist__9291) {
    var args = cljs.core.seq(arglist__9291);
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
  var this__9292 = this;
  if(this__9292.off + 1 < this__9292.node.length) {
    var s__9293 = cljs.core.chunked_seq.call(null, this__9292.vec, this__9292.node, this__9292.i, this__9292.off + 1);
    if(s__9293 == null) {
      return null
    }else {
      return s__9293
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9294 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9295 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9296 = this;
  return this__9296.node[this__9296.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9297 = this;
  if(this__9297.off + 1 < this__9297.node.length) {
    var s__9298 = cljs.core.chunked_seq.call(null, this__9297.vec, this__9297.node, this__9297.i, this__9297.off + 1);
    if(s__9298 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__9298
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__9299 = this;
  var l__9300 = this__9299.node.length;
  var s__9301 = this__9299.i + l__9300 < cljs.core._count.call(null, this__9299.vec) ? cljs.core.chunked_seq.call(null, this__9299.vec, this__9299.i + l__9300, 0) : null;
  if(s__9301 == null) {
    return null
  }else {
    return s__9301
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9302 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__9303 = this;
  return cljs.core.chunked_seq.call(null, this__9303.vec, this__9303.node, this__9303.i, this__9303.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__9304 = this;
  return this__9304.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9305 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9305.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__9306 = this;
  return cljs.core.array_chunk.call(null, this__9306.node, this__9306.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__9307 = this;
  var l__9308 = this__9307.node.length;
  var s__9309 = this__9307.i + l__9308 < cljs.core._count.call(null, this__9307.vec) ? cljs.core.chunked_seq.call(null, this__9307.vec, this__9307.i + l__9308, 0) : null;
  if(s__9309 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__9309
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
  var this__9312 = this;
  var h__2190__auto____9313 = this__9312.__hash;
  if(!(h__2190__auto____9313 == null)) {
    return h__2190__auto____9313
  }else {
    var h__2190__auto____9314 = cljs.core.hash_coll.call(null, coll);
    this__9312.__hash = h__2190__auto____9314;
    return h__2190__auto____9314
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9315 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9316 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__9317 = this;
  var v_pos__9318 = this__9317.start + key;
  return new cljs.core.Subvec(this__9317.meta, cljs.core._assoc.call(null, this__9317.v, v_pos__9318, val), this__9317.start, this__9317.end > v_pos__9318 + 1 ? this__9317.end : v_pos__9318 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__9344 = null;
  var G__9344__2 = function(this_sym9319, k) {
    var this__9321 = this;
    var this_sym9319__9322 = this;
    var coll__9323 = this_sym9319__9322;
    return coll__9323.cljs$core$ILookup$_lookup$arity$2(coll__9323, k)
  };
  var G__9344__3 = function(this_sym9320, k, not_found) {
    var this__9321 = this;
    var this_sym9320__9324 = this;
    var coll__9325 = this_sym9320__9324;
    return coll__9325.cljs$core$ILookup$_lookup$arity$3(coll__9325, k, not_found)
  };
  G__9344 = function(this_sym9320, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9344__2.call(this, this_sym9320, k);
      case 3:
        return G__9344__3.call(this, this_sym9320, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9344
}();
cljs.core.Subvec.prototype.apply = function(this_sym9310, args9311) {
  var this__9326 = this;
  return this_sym9310.call.apply(this_sym9310, [this_sym9310].concat(args9311.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9327 = this;
  return new cljs.core.Subvec(this__9327.meta, cljs.core._assoc_n.call(null, this__9327.v, this__9327.end, o), this__9327.start, this__9327.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__9328 = this;
  var this__9329 = this;
  return cljs.core.pr_str.call(null, this__9329)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9330 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9331 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9332 = this;
  var subvec_seq__9333 = function subvec_seq(i) {
    if(i === this__9332.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__9332.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__9333.call(null, this__9332.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9334 = this;
  return this__9334.end - this__9334.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9335 = this;
  return cljs.core._nth.call(null, this__9335.v, this__9335.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9336 = this;
  if(this__9336.start === this__9336.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__9336.meta, this__9336.v, this__9336.start, this__9336.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9337 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9338 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9339 = this;
  return new cljs.core.Subvec(meta, this__9339.v, this__9339.start, this__9339.end, this__9339.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9340 = this;
  return this__9340.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9341 = this;
  return cljs.core._nth.call(null, this__9341.v, this__9341.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9342 = this;
  return cljs.core._nth.call(null, this__9342.v, this__9342.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9343 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9343.meta)
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
  var ret__9346 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__9346, 0, tl.length);
  return ret__9346
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__9350 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__9351 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__9350, subidx__9351, level === 5 ? tail_node : function() {
    var child__9352 = cljs.core.pv_aget.call(null, ret__9350, subidx__9351);
    if(!(child__9352 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__9352, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__9350
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__9357 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__9358 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9359 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__9357, subidx__9358));
    if(function() {
      var and__3822__auto____9360 = new_child__9359 == null;
      if(and__3822__auto____9360) {
        return subidx__9358 === 0
      }else {
        return and__3822__auto____9360
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__9357, subidx__9358, new_child__9359);
      return node__9357
    }
  }else {
    if(subidx__9358 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__9357, subidx__9358, null);
        return node__9357
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____9365 = 0 <= i;
    if(and__3822__auto____9365) {
      return i < tv.cnt
    }else {
      return and__3822__auto____9365
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__9366 = tv.root;
      var node__9367 = root__9366;
      var level__9368 = tv.shift;
      while(true) {
        if(level__9368 > 0) {
          var G__9369 = cljs.core.tv_ensure_editable.call(null, root__9366.edit, cljs.core.pv_aget.call(null, node__9367, i >>> level__9368 & 31));
          var G__9370 = level__9368 - 5;
          node__9367 = G__9369;
          level__9368 = G__9370;
          continue
        }else {
          return node__9367.arr
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
  var G__9410 = null;
  var G__9410__2 = function(this_sym9373, k) {
    var this__9375 = this;
    var this_sym9373__9376 = this;
    var coll__9377 = this_sym9373__9376;
    return coll__9377.cljs$core$ILookup$_lookup$arity$2(coll__9377, k)
  };
  var G__9410__3 = function(this_sym9374, k, not_found) {
    var this__9375 = this;
    var this_sym9374__9378 = this;
    var coll__9379 = this_sym9374__9378;
    return coll__9379.cljs$core$ILookup$_lookup$arity$3(coll__9379, k, not_found)
  };
  G__9410 = function(this_sym9374, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9410__2.call(this, this_sym9374, k);
      case 3:
        return G__9410__3.call(this, this_sym9374, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9410
}();
cljs.core.TransientVector.prototype.apply = function(this_sym9371, args9372) {
  var this__9380 = this;
  return this_sym9371.call.apply(this_sym9371, [this_sym9371].concat(args9372.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9381 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9382 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9383 = this;
  if(this__9383.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9384 = this;
  if(function() {
    var and__3822__auto____9385 = 0 <= n;
    if(and__3822__auto____9385) {
      return n < this__9384.cnt
    }else {
      return and__3822__auto____9385
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9386 = this;
  if(this__9386.root.edit) {
    return this__9386.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__9387 = this;
  if(this__9387.root.edit) {
    if(function() {
      var and__3822__auto____9388 = 0 <= n;
      if(and__3822__auto____9388) {
        return n < this__9387.cnt
      }else {
        return and__3822__auto____9388
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__9387.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__9393 = function go(level, node) {
          var node__9391 = cljs.core.tv_ensure_editable.call(null, this__9387.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__9391, n & 31, val);
            return node__9391
          }else {
            var subidx__9392 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__9391, subidx__9392, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__9391, subidx__9392)));
            return node__9391
          }
        }.call(null, this__9387.shift, this__9387.root);
        this__9387.root = new_root__9393;
        return tcoll
      }
    }else {
      if(n === this__9387.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__9387.cnt)].join(""));
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
  var this__9394 = this;
  if(this__9394.root.edit) {
    if(this__9394.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__9394.cnt) {
        this__9394.cnt = 0;
        return tcoll
      }else {
        if((this__9394.cnt - 1 & 31) > 0) {
          this__9394.cnt = this__9394.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__9395 = cljs.core.editable_array_for.call(null, tcoll, this__9394.cnt - 2);
            var new_root__9397 = function() {
              var nr__9396 = cljs.core.tv_pop_tail.call(null, tcoll, this__9394.shift, this__9394.root);
              if(!(nr__9396 == null)) {
                return nr__9396
              }else {
                return new cljs.core.VectorNode(this__9394.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____9398 = 5 < this__9394.shift;
              if(and__3822__auto____9398) {
                return cljs.core.pv_aget.call(null, new_root__9397, 1) == null
              }else {
                return and__3822__auto____9398
              }
            }()) {
              var new_root__9399 = cljs.core.tv_ensure_editable.call(null, this__9394.root.edit, cljs.core.pv_aget.call(null, new_root__9397, 0));
              this__9394.root = new_root__9399;
              this__9394.shift = this__9394.shift - 5;
              this__9394.cnt = this__9394.cnt - 1;
              this__9394.tail = new_tail__9395;
              return tcoll
            }else {
              this__9394.root = new_root__9397;
              this__9394.cnt = this__9394.cnt - 1;
              this__9394.tail = new_tail__9395;
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
  var this__9400 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9401 = this;
  if(this__9401.root.edit) {
    if(this__9401.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__9401.tail[this__9401.cnt & 31] = o;
      this__9401.cnt = this__9401.cnt + 1;
      return tcoll
    }else {
      var tail_node__9402 = new cljs.core.VectorNode(this__9401.root.edit, this__9401.tail);
      var new_tail__9403 = cljs.core.make_array.call(null, 32);
      new_tail__9403[0] = o;
      this__9401.tail = new_tail__9403;
      if(this__9401.cnt >>> 5 > 1 << this__9401.shift) {
        var new_root_array__9404 = cljs.core.make_array.call(null, 32);
        var new_shift__9405 = this__9401.shift + 5;
        new_root_array__9404[0] = this__9401.root;
        new_root_array__9404[1] = cljs.core.new_path.call(null, this__9401.root.edit, this__9401.shift, tail_node__9402);
        this__9401.root = new cljs.core.VectorNode(this__9401.root.edit, new_root_array__9404);
        this__9401.shift = new_shift__9405;
        this__9401.cnt = this__9401.cnt + 1;
        return tcoll
      }else {
        var new_root__9406 = cljs.core.tv_push_tail.call(null, tcoll, this__9401.shift, this__9401.root, tail_node__9402);
        this__9401.root = new_root__9406;
        this__9401.cnt = this__9401.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9407 = this;
  if(this__9407.root.edit) {
    this__9407.root.edit = null;
    var len__9408 = this__9407.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__9409 = cljs.core.make_array.call(null, len__9408);
    cljs.core.array_copy.call(null, this__9407.tail, 0, trimmed_tail__9409, 0, len__9408);
    return new cljs.core.PersistentVector(null, this__9407.cnt, this__9407.shift, this__9407.root, trimmed_tail__9409, null)
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
  var this__9411 = this;
  var h__2190__auto____9412 = this__9411.__hash;
  if(!(h__2190__auto____9412 == null)) {
    return h__2190__auto____9412
  }else {
    var h__2190__auto____9413 = cljs.core.hash_coll.call(null, coll);
    this__9411.__hash = h__2190__auto____9413;
    return h__2190__auto____9413
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9414 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__9415 = this;
  var this__9416 = this;
  return cljs.core.pr_str.call(null, this__9416)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9417 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9418 = this;
  return cljs.core._first.call(null, this__9418.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9419 = this;
  var temp__3971__auto____9420 = cljs.core.next.call(null, this__9419.front);
  if(temp__3971__auto____9420) {
    var f1__9421 = temp__3971__auto____9420;
    return new cljs.core.PersistentQueueSeq(this__9419.meta, f1__9421, this__9419.rear, null)
  }else {
    if(this__9419.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__9419.meta, this__9419.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9422 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9423 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__9423.front, this__9423.rear, this__9423.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9424 = this;
  return this__9424.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9425 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9425.meta)
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
  var this__9426 = this;
  var h__2190__auto____9427 = this__9426.__hash;
  if(!(h__2190__auto____9427 == null)) {
    return h__2190__auto____9427
  }else {
    var h__2190__auto____9428 = cljs.core.hash_coll.call(null, coll);
    this__9426.__hash = h__2190__auto____9428;
    return h__2190__auto____9428
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9429 = this;
  if(cljs.core.truth_(this__9429.front)) {
    return new cljs.core.PersistentQueue(this__9429.meta, this__9429.count + 1, this__9429.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____9430 = this__9429.rear;
      if(cljs.core.truth_(or__3824__auto____9430)) {
        return or__3824__auto____9430
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__9429.meta, this__9429.count + 1, cljs.core.conj.call(null, this__9429.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__9431 = this;
  var this__9432 = this;
  return cljs.core.pr_str.call(null, this__9432)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9433 = this;
  var rear__9434 = cljs.core.seq.call(null, this__9433.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____9435 = this__9433.front;
    if(cljs.core.truth_(or__3824__auto____9435)) {
      return or__3824__auto____9435
    }else {
      return rear__9434
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__9433.front, cljs.core.seq.call(null, rear__9434), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9436 = this;
  return this__9436.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9437 = this;
  return cljs.core._first.call(null, this__9437.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9438 = this;
  if(cljs.core.truth_(this__9438.front)) {
    var temp__3971__auto____9439 = cljs.core.next.call(null, this__9438.front);
    if(temp__3971__auto____9439) {
      var f1__9440 = temp__3971__auto____9439;
      return new cljs.core.PersistentQueue(this__9438.meta, this__9438.count - 1, f1__9440, this__9438.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__9438.meta, this__9438.count - 1, cljs.core.seq.call(null, this__9438.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9441 = this;
  return cljs.core.first.call(null, this__9441.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9442 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9443 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9444 = this;
  return new cljs.core.PersistentQueue(meta, this__9444.count, this__9444.front, this__9444.rear, this__9444.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9445 = this;
  return this__9445.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9446 = this;
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
  var this__9447 = this;
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
  var len__9450 = array.length;
  var i__9451 = 0;
  while(true) {
    if(i__9451 < len__9450) {
      if(k === array[i__9451]) {
        return i__9451
      }else {
        var G__9452 = i__9451 + incr;
        i__9451 = G__9452;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__9455 = cljs.core.hash.call(null, a);
  var b__9456 = cljs.core.hash.call(null, b);
  if(a__9455 < b__9456) {
    return-1
  }else {
    if(a__9455 > b__9456) {
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
  var ks__9464 = m.keys;
  var len__9465 = ks__9464.length;
  var so__9466 = m.strobj;
  var out__9467 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9468 = 0;
  var out__9469 = cljs.core.transient$.call(null, out__9467);
  while(true) {
    if(i__9468 < len__9465) {
      var k__9470 = ks__9464[i__9468];
      var G__9471 = i__9468 + 1;
      var G__9472 = cljs.core.assoc_BANG_.call(null, out__9469, k__9470, so__9466[k__9470]);
      i__9468 = G__9471;
      out__9469 = G__9472;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9469, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__9478 = {};
  var l__9479 = ks.length;
  var i__9480 = 0;
  while(true) {
    if(i__9480 < l__9479) {
      var k__9481 = ks[i__9480];
      new_obj__9478[k__9481] = obj[k__9481];
      var G__9482 = i__9480 + 1;
      i__9480 = G__9482;
      continue
    }else {
    }
    break
  }
  return new_obj__9478
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
  var this__9485 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9486 = this;
  var h__2190__auto____9487 = this__9486.__hash;
  if(!(h__2190__auto____9487 == null)) {
    return h__2190__auto____9487
  }else {
    var h__2190__auto____9488 = cljs.core.hash_imap.call(null, coll);
    this__9486.__hash = h__2190__auto____9488;
    return h__2190__auto____9488
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9489 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9490 = this;
  if(function() {
    var and__3822__auto____9491 = goog.isString(k);
    if(and__3822__auto____9491) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9490.keys) == null)
    }else {
      return and__3822__auto____9491
    }
  }()) {
    return this__9490.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9492 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____9493 = this__9492.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____9493) {
        return or__3824__auto____9493
      }else {
        return this__9492.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__9492.keys) == null)) {
        var new_strobj__9494 = cljs.core.obj_clone.call(null, this__9492.strobj, this__9492.keys);
        new_strobj__9494[k] = v;
        return new cljs.core.ObjMap(this__9492.meta, this__9492.keys, new_strobj__9494, this__9492.update_count + 1, null)
      }else {
        var new_strobj__9495 = cljs.core.obj_clone.call(null, this__9492.strobj, this__9492.keys);
        var new_keys__9496 = this__9492.keys.slice();
        new_strobj__9495[k] = v;
        new_keys__9496.push(k);
        return new cljs.core.ObjMap(this__9492.meta, new_keys__9496, new_strobj__9495, this__9492.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9497 = this;
  if(function() {
    var and__3822__auto____9498 = goog.isString(k);
    if(and__3822__auto____9498) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9497.keys) == null)
    }else {
      return and__3822__auto____9498
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9520 = null;
  var G__9520__2 = function(this_sym9499, k) {
    var this__9501 = this;
    var this_sym9499__9502 = this;
    var coll__9503 = this_sym9499__9502;
    return coll__9503.cljs$core$ILookup$_lookup$arity$2(coll__9503, k)
  };
  var G__9520__3 = function(this_sym9500, k, not_found) {
    var this__9501 = this;
    var this_sym9500__9504 = this;
    var coll__9505 = this_sym9500__9504;
    return coll__9505.cljs$core$ILookup$_lookup$arity$3(coll__9505, k, not_found)
  };
  G__9520 = function(this_sym9500, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9520__2.call(this, this_sym9500, k);
      case 3:
        return G__9520__3.call(this, this_sym9500, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9520
}();
cljs.core.ObjMap.prototype.apply = function(this_sym9483, args9484) {
  var this__9506 = this;
  return this_sym9483.call.apply(this_sym9483, [this_sym9483].concat(args9484.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9507 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9508 = this;
  var this__9509 = this;
  return cljs.core.pr_str.call(null, this__9509)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9510 = this;
  if(this__9510.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9473_SHARP_) {
      return cljs.core.vector.call(null, p1__9473_SHARP_, this__9510.strobj[p1__9473_SHARP_])
    }, this__9510.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9511 = this;
  return this__9511.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9512 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9513 = this;
  return new cljs.core.ObjMap(meta, this__9513.keys, this__9513.strobj, this__9513.update_count, this__9513.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9514 = this;
  return this__9514.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9515 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9515.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9516 = this;
  if(function() {
    var and__3822__auto____9517 = goog.isString(k);
    if(and__3822__auto____9517) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9516.keys) == null)
    }else {
      return and__3822__auto____9517
    }
  }()) {
    var new_keys__9518 = this__9516.keys.slice();
    var new_strobj__9519 = cljs.core.obj_clone.call(null, this__9516.strobj, this__9516.keys);
    new_keys__9518.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9518), 1);
    cljs.core.js_delete.call(null, new_strobj__9519, k);
    return new cljs.core.ObjMap(this__9516.meta, new_keys__9518, new_strobj__9519, this__9516.update_count + 1, null)
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
  var this__9524 = this;
  var h__2190__auto____9525 = this__9524.__hash;
  if(!(h__2190__auto____9525 == null)) {
    return h__2190__auto____9525
  }else {
    var h__2190__auto____9526 = cljs.core.hash_imap.call(null, coll);
    this__9524.__hash = h__2190__auto____9526;
    return h__2190__auto____9526
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9527 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9528 = this;
  var bucket__9529 = this__9528.hashobj[cljs.core.hash.call(null, k)];
  var i__9530 = cljs.core.truth_(bucket__9529) ? cljs.core.scan_array.call(null, 2, k, bucket__9529) : null;
  if(cljs.core.truth_(i__9530)) {
    return bucket__9529[i__9530 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9531 = this;
  var h__9532 = cljs.core.hash.call(null, k);
  var bucket__9533 = this__9531.hashobj[h__9532];
  if(cljs.core.truth_(bucket__9533)) {
    var new_bucket__9534 = bucket__9533.slice();
    var new_hashobj__9535 = goog.object.clone(this__9531.hashobj);
    new_hashobj__9535[h__9532] = new_bucket__9534;
    var temp__3971__auto____9536 = cljs.core.scan_array.call(null, 2, k, new_bucket__9534);
    if(cljs.core.truth_(temp__3971__auto____9536)) {
      var i__9537 = temp__3971__auto____9536;
      new_bucket__9534[i__9537 + 1] = v;
      return new cljs.core.HashMap(this__9531.meta, this__9531.count, new_hashobj__9535, null)
    }else {
      new_bucket__9534.push(k, v);
      return new cljs.core.HashMap(this__9531.meta, this__9531.count + 1, new_hashobj__9535, null)
    }
  }else {
    var new_hashobj__9538 = goog.object.clone(this__9531.hashobj);
    new_hashobj__9538[h__9532] = [k, v];
    return new cljs.core.HashMap(this__9531.meta, this__9531.count + 1, new_hashobj__9538, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9539 = this;
  var bucket__9540 = this__9539.hashobj[cljs.core.hash.call(null, k)];
  var i__9541 = cljs.core.truth_(bucket__9540) ? cljs.core.scan_array.call(null, 2, k, bucket__9540) : null;
  if(cljs.core.truth_(i__9541)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9566 = null;
  var G__9566__2 = function(this_sym9542, k) {
    var this__9544 = this;
    var this_sym9542__9545 = this;
    var coll__9546 = this_sym9542__9545;
    return coll__9546.cljs$core$ILookup$_lookup$arity$2(coll__9546, k)
  };
  var G__9566__3 = function(this_sym9543, k, not_found) {
    var this__9544 = this;
    var this_sym9543__9547 = this;
    var coll__9548 = this_sym9543__9547;
    return coll__9548.cljs$core$ILookup$_lookup$arity$3(coll__9548, k, not_found)
  };
  G__9566 = function(this_sym9543, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9566__2.call(this, this_sym9543, k);
      case 3:
        return G__9566__3.call(this, this_sym9543, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9566
}();
cljs.core.HashMap.prototype.apply = function(this_sym9522, args9523) {
  var this__9549 = this;
  return this_sym9522.call.apply(this_sym9522, [this_sym9522].concat(args9523.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9550 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9551 = this;
  var this__9552 = this;
  return cljs.core.pr_str.call(null, this__9552)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9553 = this;
  if(this__9553.count > 0) {
    var hashes__9554 = cljs.core.js_keys.call(null, this__9553.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9521_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9553.hashobj[p1__9521_SHARP_]))
    }, hashes__9554)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9555 = this;
  return this__9555.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9556 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9557 = this;
  return new cljs.core.HashMap(meta, this__9557.count, this__9557.hashobj, this__9557.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9558 = this;
  return this__9558.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9559 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9559.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9560 = this;
  var h__9561 = cljs.core.hash.call(null, k);
  var bucket__9562 = this__9560.hashobj[h__9561];
  var i__9563 = cljs.core.truth_(bucket__9562) ? cljs.core.scan_array.call(null, 2, k, bucket__9562) : null;
  if(cljs.core.not.call(null, i__9563)) {
    return coll
  }else {
    var new_hashobj__9564 = goog.object.clone(this__9560.hashobj);
    if(3 > bucket__9562.length) {
      cljs.core.js_delete.call(null, new_hashobj__9564, h__9561)
    }else {
      var new_bucket__9565 = bucket__9562.slice();
      new_bucket__9565.splice(i__9563, 2);
      new_hashobj__9564[h__9561] = new_bucket__9565
    }
    return new cljs.core.HashMap(this__9560.meta, this__9560.count - 1, new_hashobj__9564, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9567 = ks.length;
  var i__9568 = 0;
  var out__9569 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9568 < len__9567) {
      var G__9570 = i__9568 + 1;
      var G__9571 = cljs.core.assoc.call(null, out__9569, ks[i__9568], vs[i__9568]);
      i__9568 = G__9570;
      out__9569 = G__9571;
      continue
    }else {
      return out__9569
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9575 = m.arr;
  var len__9576 = arr__9575.length;
  var i__9577 = 0;
  while(true) {
    if(len__9576 <= i__9577) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9575[i__9577], k)) {
        return i__9577
      }else {
        if("\ufdd0'else") {
          var G__9578 = i__9577 + 2;
          i__9577 = G__9578;
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
  var this__9581 = this;
  return new cljs.core.TransientArrayMap({}, this__9581.arr.length, this__9581.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9582 = this;
  var h__2190__auto____9583 = this__9582.__hash;
  if(!(h__2190__auto____9583 == null)) {
    return h__2190__auto____9583
  }else {
    var h__2190__auto____9584 = cljs.core.hash_imap.call(null, coll);
    this__9582.__hash = h__2190__auto____9584;
    return h__2190__auto____9584
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9585 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9586 = this;
  var idx__9587 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9587 === -1) {
    return not_found
  }else {
    return this__9586.arr[idx__9587 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9588 = this;
  var idx__9589 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9589 === -1) {
    if(this__9588.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9588.meta, this__9588.cnt + 1, function() {
        var G__9590__9591 = this__9588.arr.slice();
        G__9590__9591.push(k);
        G__9590__9591.push(v);
        return G__9590__9591
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9588.arr[idx__9589 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9588.meta, this__9588.cnt, function() {
          var G__9592__9593 = this__9588.arr.slice();
          G__9592__9593[idx__9589 + 1] = v;
          return G__9592__9593
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9594 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9626 = null;
  var G__9626__2 = function(this_sym9595, k) {
    var this__9597 = this;
    var this_sym9595__9598 = this;
    var coll__9599 = this_sym9595__9598;
    return coll__9599.cljs$core$ILookup$_lookup$arity$2(coll__9599, k)
  };
  var G__9626__3 = function(this_sym9596, k, not_found) {
    var this__9597 = this;
    var this_sym9596__9600 = this;
    var coll__9601 = this_sym9596__9600;
    return coll__9601.cljs$core$ILookup$_lookup$arity$3(coll__9601, k, not_found)
  };
  G__9626 = function(this_sym9596, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9626__2.call(this, this_sym9596, k);
      case 3:
        return G__9626__3.call(this, this_sym9596, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9626
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9579, args9580) {
  var this__9602 = this;
  return this_sym9579.call.apply(this_sym9579, [this_sym9579].concat(args9580.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9603 = this;
  var len__9604 = this__9603.arr.length;
  var i__9605 = 0;
  var init__9606 = init;
  while(true) {
    if(i__9605 < len__9604) {
      var init__9607 = f.call(null, init__9606, this__9603.arr[i__9605], this__9603.arr[i__9605 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9607)) {
        return cljs.core.deref.call(null, init__9607)
      }else {
        var G__9627 = i__9605 + 2;
        var G__9628 = init__9607;
        i__9605 = G__9627;
        init__9606 = G__9628;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9608 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9609 = this;
  var this__9610 = this;
  return cljs.core.pr_str.call(null, this__9610)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9611 = this;
  if(this__9611.cnt > 0) {
    var len__9612 = this__9611.arr.length;
    var array_map_seq__9613 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9612) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9611.arr[i], this__9611.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9613.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9614 = this;
  return this__9614.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9615 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9616 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9616.cnt, this__9616.arr, this__9616.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9617 = this;
  return this__9617.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9618 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9618.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9619 = this;
  var idx__9620 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9620 >= 0) {
    var len__9621 = this__9619.arr.length;
    var new_len__9622 = len__9621 - 2;
    if(new_len__9622 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9623 = cljs.core.make_array.call(null, new_len__9622);
      var s__9624 = 0;
      var d__9625 = 0;
      while(true) {
        if(s__9624 >= len__9621) {
          return new cljs.core.PersistentArrayMap(this__9619.meta, this__9619.cnt - 1, new_arr__9623, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9619.arr[s__9624])) {
            var G__9629 = s__9624 + 2;
            var G__9630 = d__9625;
            s__9624 = G__9629;
            d__9625 = G__9630;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9623[d__9625] = this__9619.arr[s__9624];
              new_arr__9623[d__9625 + 1] = this__9619.arr[s__9624 + 1];
              var G__9631 = s__9624 + 2;
              var G__9632 = d__9625 + 2;
              s__9624 = G__9631;
              d__9625 = G__9632;
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
  var len__9633 = cljs.core.count.call(null, ks);
  var i__9634 = 0;
  var out__9635 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9634 < len__9633) {
      var G__9636 = i__9634 + 1;
      var G__9637 = cljs.core.assoc_BANG_.call(null, out__9635, ks[i__9634], vs[i__9634]);
      i__9634 = G__9636;
      out__9635 = G__9637;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9635)
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
  var this__9638 = this;
  if(cljs.core.truth_(this__9638.editable_QMARK_)) {
    var idx__9639 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9639 >= 0) {
      this__9638.arr[idx__9639] = this__9638.arr[this__9638.len - 2];
      this__9638.arr[idx__9639 + 1] = this__9638.arr[this__9638.len - 1];
      var G__9640__9641 = this__9638.arr;
      G__9640__9641.pop();
      G__9640__9641.pop();
      G__9640__9641;
      this__9638.len = this__9638.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9642 = this;
  if(cljs.core.truth_(this__9642.editable_QMARK_)) {
    var idx__9643 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9643 === -1) {
      if(this__9642.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9642.len = this__9642.len + 2;
        this__9642.arr.push(key);
        this__9642.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9642.len, this__9642.arr), key, val)
      }
    }else {
      if(val === this__9642.arr[idx__9643 + 1]) {
        return tcoll
      }else {
        this__9642.arr[idx__9643 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9644 = this;
  if(cljs.core.truth_(this__9644.editable_QMARK_)) {
    if(function() {
      var G__9645__9646 = o;
      if(G__9645__9646) {
        if(function() {
          var or__3824__auto____9647 = G__9645__9646.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9647) {
            return or__3824__auto____9647
          }else {
            return G__9645__9646.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9645__9646.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9645__9646)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9645__9646)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9648 = cljs.core.seq.call(null, o);
      var tcoll__9649 = tcoll;
      while(true) {
        var temp__3971__auto____9650 = cljs.core.first.call(null, es__9648);
        if(cljs.core.truth_(temp__3971__auto____9650)) {
          var e__9651 = temp__3971__auto____9650;
          var G__9657 = cljs.core.next.call(null, es__9648);
          var G__9658 = tcoll__9649.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9649, cljs.core.key.call(null, e__9651), cljs.core.val.call(null, e__9651));
          es__9648 = G__9657;
          tcoll__9649 = G__9658;
          continue
        }else {
          return tcoll__9649
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9652 = this;
  if(cljs.core.truth_(this__9652.editable_QMARK_)) {
    this__9652.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9652.len, 2), this__9652.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9653 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9654 = this;
  if(cljs.core.truth_(this__9654.editable_QMARK_)) {
    var idx__9655 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9655 === -1) {
      return not_found
    }else {
      return this__9654.arr[idx__9655 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9656 = this;
  if(cljs.core.truth_(this__9656.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9656.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9661 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9662 = 0;
  while(true) {
    if(i__9662 < len) {
      var G__9663 = cljs.core.assoc_BANG_.call(null, out__9661, arr[i__9662], arr[i__9662 + 1]);
      var G__9664 = i__9662 + 2;
      out__9661 = G__9663;
      i__9662 = G__9664;
      continue
    }else {
      return out__9661
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
    var G__9669__9670 = arr.slice();
    G__9669__9670[i] = a;
    return G__9669__9670
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9671__9672 = arr.slice();
    G__9671__9672[i] = a;
    G__9671__9672[j] = b;
    return G__9671__9672
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
  var new_arr__9674 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9674, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9674, 2 * i, new_arr__9674.length - 2 * i);
  return new_arr__9674
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
    var editable__9677 = inode.ensure_editable(edit);
    editable__9677.arr[i] = a;
    return editable__9677
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9678 = inode.ensure_editable(edit);
    editable__9678.arr[i] = a;
    editable__9678.arr[j] = b;
    return editable__9678
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
  var len__9685 = arr.length;
  var i__9686 = 0;
  var init__9687 = init;
  while(true) {
    if(i__9686 < len__9685) {
      var init__9690 = function() {
        var k__9688 = arr[i__9686];
        if(!(k__9688 == null)) {
          return f.call(null, init__9687, k__9688, arr[i__9686 + 1])
        }else {
          var node__9689 = arr[i__9686 + 1];
          if(!(node__9689 == null)) {
            return node__9689.kv_reduce(f, init__9687)
          }else {
            return init__9687
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9690)) {
        return cljs.core.deref.call(null, init__9690)
      }else {
        var G__9691 = i__9686 + 2;
        var G__9692 = init__9690;
        i__9686 = G__9691;
        init__9687 = G__9692;
        continue
      }
    }else {
      return init__9687
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
  var this__9693 = this;
  var inode__9694 = this;
  if(this__9693.bitmap === bit) {
    return null
  }else {
    var editable__9695 = inode__9694.ensure_editable(e);
    var earr__9696 = editable__9695.arr;
    var len__9697 = earr__9696.length;
    editable__9695.bitmap = bit ^ editable__9695.bitmap;
    cljs.core.array_copy.call(null, earr__9696, 2 * (i + 1), earr__9696, 2 * i, len__9697 - 2 * (i + 1));
    earr__9696[len__9697 - 2] = null;
    earr__9696[len__9697 - 1] = null;
    return editable__9695
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9698 = this;
  var inode__9699 = this;
  var bit__9700 = 1 << (hash >>> shift & 31);
  var idx__9701 = cljs.core.bitmap_indexed_node_index.call(null, this__9698.bitmap, bit__9700);
  if((this__9698.bitmap & bit__9700) === 0) {
    var n__9702 = cljs.core.bit_count.call(null, this__9698.bitmap);
    if(2 * n__9702 < this__9698.arr.length) {
      var editable__9703 = inode__9699.ensure_editable(edit);
      var earr__9704 = editable__9703.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9704, 2 * idx__9701, earr__9704, 2 * (idx__9701 + 1), 2 * (n__9702 - idx__9701));
      earr__9704[2 * idx__9701] = key;
      earr__9704[2 * idx__9701 + 1] = val;
      editable__9703.bitmap = editable__9703.bitmap | bit__9700;
      return editable__9703
    }else {
      if(n__9702 >= 16) {
        var nodes__9705 = cljs.core.make_array.call(null, 32);
        var jdx__9706 = hash >>> shift & 31;
        nodes__9705[jdx__9706] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9707 = 0;
        var j__9708 = 0;
        while(true) {
          if(i__9707 < 32) {
            if((this__9698.bitmap >>> i__9707 & 1) === 0) {
              var G__9761 = i__9707 + 1;
              var G__9762 = j__9708;
              i__9707 = G__9761;
              j__9708 = G__9762;
              continue
            }else {
              nodes__9705[i__9707] = !(this__9698.arr[j__9708] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9698.arr[j__9708]), this__9698.arr[j__9708], this__9698.arr[j__9708 + 1], added_leaf_QMARK_) : this__9698.arr[j__9708 + 1];
              var G__9763 = i__9707 + 1;
              var G__9764 = j__9708 + 2;
              i__9707 = G__9763;
              j__9708 = G__9764;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9702 + 1, nodes__9705)
      }else {
        if("\ufdd0'else") {
          var new_arr__9709 = cljs.core.make_array.call(null, 2 * (n__9702 + 4));
          cljs.core.array_copy.call(null, this__9698.arr, 0, new_arr__9709, 0, 2 * idx__9701);
          new_arr__9709[2 * idx__9701] = key;
          new_arr__9709[2 * idx__9701 + 1] = val;
          cljs.core.array_copy.call(null, this__9698.arr, 2 * idx__9701, new_arr__9709, 2 * (idx__9701 + 1), 2 * (n__9702 - idx__9701));
          added_leaf_QMARK_.val = true;
          var editable__9710 = inode__9699.ensure_editable(edit);
          editable__9710.arr = new_arr__9709;
          editable__9710.bitmap = editable__9710.bitmap | bit__9700;
          return editable__9710
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9711 = this__9698.arr[2 * idx__9701];
    var val_or_node__9712 = this__9698.arr[2 * idx__9701 + 1];
    if(key_or_nil__9711 == null) {
      var n__9713 = val_or_node__9712.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9713 === val_or_node__9712) {
        return inode__9699
      }else {
        return cljs.core.edit_and_set.call(null, inode__9699, edit, 2 * idx__9701 + 1, n__9713)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9711)) {
        if(val === val_or_node__9712) {
          return inode__9699
        }else {
          return cljs.core.edit_and_set.call(null, inode__9699, edit, 2 * idx__9701 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9699, edit, 2 * idx__9701, null, 2 * idx__9701 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9711, val_or_node__9712, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9714 = this;
  var inode__9715 = this;
  return cljs.core.create_inode_seq.call(null, this__9714.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9716 = this;
  var inode__9717 = this;
  var bit__9718 = 1 << (hash >>> shift & 31);
  if((this__9716.bitmap & bit__9718) === 0) {
    return inode__9717
  }else {
    var idx__9719 = cljs.core.bitmap_indexed_node_index.call(null, this__9716.bitmap, bit__9718);
    var key_or_nil__9720 = this__9716.arr[2 * idx__9719];
    var val_or_node__9721 = this__9716.arr[2 * idx__9719 + 1];
    if(key_or_nil__9720 == null) {
      var n__9722 = val_or_node__9721.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9722 === val_or_node__9721) {
        return inode__9717
      }else {
        if(!(n__9722 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9717, edit, 2 * idx__9719 + 1, n__9722)
        }else {
          if(this__9716.bitmap === bit__9718) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9717.edit_and_remove_pair(edit, bit__9718, idx__9719)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9720)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9717.edit_and_remove_pair(edit, bit__9718, idx__9719)
      }else {
        if("\ufdd0'else") {
          return inode__9717
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9723 = this;
  var inode__9724 = this;
  if(e === this__9723.edit) {
    return inode__9724
  }else {
    var n__9725 = cljs.core.bit_count.call(null, this__9723.bitmap);
    var new_arr__9726 = cljs.core.make_array.call(null, n__9725 < 0 ? 4 : 2 * (n__9725 + 1));
    cljs.core.array_copy.call(null, this__9723.arr, 0, new_arr__9726, 0, 2 * n__9725);
    return new cljs.core.BitmapIndexedNode(e, this__9723.bitmap, new_arr__9726)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9727 = this;
  var inode__9728 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9727.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9729 = this;
  var inode__9730 = this;
  var bit__9731 = 1 << (hash >>> shift & 31);
  if((this__9729.bitmap & bit__9731) === 0) {
    return not_found
  }else {
    var idx__9732 = cljs.core.bitmap_indexed_node_index.call(null, this__9729.bitmap, bit__9731);
    var key_or_nil__9733 = this__9729.arr[2 * idx__9732];
    var val_or_node__9734 = this__9729.arr[2 * idx__9732 + 1];
    if(key_or_nil__9733 == null) {
      return val_or_node__9734.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9733)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9733, val_or_node__9734], true)
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
  var this__9735 = this;
  var inode__9736 = this;
  var bit__9737 = 1 << (hash >>> shift & 31);
  if((this__9735.bitmap & bit__9737) === 0) {
    return inode__9736
  }else {
    var idx__9738 = cljs.core.bitmap_indexed_node_index.call(null, this__9735.bitmap, bit__9737);
    var key_or_nil__9739 = this__9735.arr[2 * idx__9738];
    var val_or_node__9740 = this__9735.arr[2 * idx__9738 + 1];
    if(key_or_nil__9739 == null) {
      var n__9741 = val_or_node__9740.inode_without(shift + 5, hash, key);
      if(n__9741 === val_or_node__9740) {
        return inode__9736
      }else {
        if(!(n__9741 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9735.bitmap, cljs.core.clone_and_set.call(null, this__9735.arr, 2 * idx__9738 + 1, n__9741))
        }else {
          if(this__9735.bitmap === bit__9737) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9735.bitmap ^ bit__9737, cljs.core.remove_pair.call(null, this__9735.arr, idx__9738))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9739)) {
        return new cljs.core.BitmapIndexedNode(null, this__9735.bitmap ^ bit__9737, cljs.core.remove_pair.call(null, this__9735.arr, idx__9738))
      }else {
        if("\ufdd0'else") {
          return inode__9736
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9742 = this;
  var inode__9743 = this;
  var bit__9744 = 1 << (hash >>> shift & 31);
  var idx__9745 = cljs.core.bitmap_indexed_node_index.call(null, this__9742.bitmap, bit__9744);
  if((this__9742.bitmap & bit__9744) === 0) {
    var n__9746 = cljs.core.bit_count.call(null, this__9742.bitmap);
    if(n__9746 >= 16) {
      var nodes__9747 = cljs.core.make_array.call(null, 32);
      var jdx__9748 = hash >>> shift & 31;
      nodes__9747[jdx__9748] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9749 = 0;
      var j__9750 = 0;
      while(true) {
        if(i__9749 < 32) {
          if((this__9742.bitmap >>> i__9749 & 1) === 0) {
            var G__9765 = i__9749 + 1;
            var G__9766 = j__9750;
            i__9749 = G__9765;
            j__9750 = G__9766;
            continue
          }else {
            nodes__9747[i__9749] = !(this__9742.arr[j__9750] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9742.arr[j__9750]), this__9742.arr[j__9750], this__9742.arr[j__9750 + 1], added_leaf_QMARK_) : this__9742.arr[j__9750 + 1];
            var G__9767 = i__9749 + 1;
            var G__9768 = j__9750 + 2;
            i__9749 = G__9767;
            j__9750 = G__9768;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9746 + 1, nodes__9747)
    }else {
      var new_arr__9751 = cljs.core.make_array.call(null, 2 * (n__9746 + 1));
      cljs.core.array_copy.call(null, this__9742.arr, 0, new_arr__9751, 0, 2 * idx__9745);
      new_arr__9751[2 * idx__9745] = key;
      new_arr__9751[2 * idx__9745 + 1] = val;
      cljs.core.array_copy.call(null, this__9742.arr, 2 * idx__9745, new_arr__9751, 2 * (idx__9745 + 1), 2 * (n__9746 - idx__9745));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9742.bitmap | bit__9744, new_arr__9751)
    }
  }else {
    var key_or_nil__9752 = this__9742.arr[2 * idx__9745];
    var val_or_node__9753 = this__9742.arr[2 * idx__9745 + 1];
    if(key_or_nil__9752 == null) {
      var n__9754 = val_or_node__9753.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9754 === val_or_node__9753) {
        return inode__9743
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9742.bitmap, cljs.core.clone_and_set.call(null, this__9742.arr, 2 * idx__9745 + 1, n__9754))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9752)) {
        if(val === val_or_node__9753) {
          return inode__9743
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9742.bitmap, cljs.core.clone_and_set.call(null, this__9742.arr, 2 * idx__9745 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9742.bitmap, cljs.core.clone_and_set.call(null, this__9742.arr, 2 * idx__9745, null, 2 * idx__9745 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9752, val_or_node__9753, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9755 = this;
  var inode__9756 = this;
  var bit__9757 = 1 << (hash >>> shift & 31);
  if((this__9755.bitmap & bit__9757) === 0) {
    return not_found
  }else {
    var idx__9758 = cljs.core.bitmap_indexed_node_index.call(null, this__9755.bitmap, bit__9757);
    var key_or_nil__9759 = this__9755.arr[2 * idx__9758];
    var val_or_node__9760 = this__9755.arr[2 * idx__9758 + 1];
    if(key_or_nil__9759 == null) {
      return val_or_node__9760.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9759)) {
        return val_or_node__9760
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
  var arr__9776 = array_node.arr;
  var len__9777 = 2 * (array_node.cnt - 1);
  var new_arr__9778 = cljs.core.make_array.call(null, len__9777);
  var i__9779 = 0;
  var j__9780 = 1;
  var bitmap__9781 = 0;
  while(true) {
    if(i__9779 < len__9777) {
      if(function() {
        var and__3822__auto____9782 = !(i__9779 === idx);
        if(and__3822__auto____9782) {
          return!(arr__9776[i__9779] == null)
        }else {
          return and__3822__auto____9782
        }
      }()) {
        new_arr__9778[j__9780] = arr__9776[i__9779];
        var G__9783 = i__9779 + 1;
        var G__9784 = j__9780 + 2;
        var G__9785 = bitmap__9781 | 1 << i__9779;
        i__9779 = G__9783;
        j__9780 = G__9784;
        bitmap__9781 = G__9785;
        continue
      }else {
        var G__9786 = i__9779 + 1;
        var G__9787 = j__9780;
        var G__9788 = bitmap__9781;
        i__9779 = G__9786;
        j__9780 = G__9787;
        bitmap__9781 = G__9788;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9781, new_arr__9778)
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
  var this__9789 = this;
  var inode__9790 = this;
  var idx__9791 = hash >>> shift & 31;
  var node__9792 = this__9789.arr[idx__9791];
  if(node__9792 == null) {
    var editable__9793 = cljs.core.edit_and_set.call(null, inode__9790, edit, idx__9791, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9793.cnt = editable__9793.cnt + 1;
    return editable__9793
  }else {
    var n__9794 = node__9792.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9794 === node__9792) {
      return inode__9790
    }else {
      return cljs.core.edit_and_set.call(null, inode__9790, edit, idx__9791, n__9794)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9795 = this;
  var inode__9796 = this;
  return cljs.core.create_array_node_seq.call(null, this__9795.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9797 = this;
  var inode__9798 = this;
  var idx__9799 = hash >>> shift & 31;
  var node__9800 = this__9797.arr[idx__9799];
  if(node__9800 == null) {
    return inode__9798
  }else {
    var n__9801 = node__9800.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9801 === node__9800) {
      return inode__9798
    }else {
      if(n__9801 == null) {
        if(this__9797.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9798, edit, idx__9799)
        }else {
          var editable__9802 = cljs.core.edit_and_set.call(null, inode__9798, edit, idx__9799, n__9801);
          editable__9802.cnt = editable__9802.cnt - 1;
          return editable__9802
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9798, edit, idx__9799, n__9801)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9803 = this;
  var inode__9804 = this;
  if(e === this__9803.edit) {
    return inode__9804
  }else {
    return new cljs.core.ArrayNode(e, this__9803.cnt, this__9803.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9805 = this;
  var inode__9806 = this;
  var len__9807 = this__9805.arr.length;
  var i__9808 = 0;
  var init__9809 = init;
  while(true) {
    if(i__9808 < len__9807) {
      var node__9810 = this__9805.arr[i__9808];
      if(!(node__9810 == null)) {
        var init__9811 = node__9810.kv_reduce(f, init__9809);
        if(cljs.core.reduced_QMARK_.call(null, init__9811)) {
          return cljs.core.deref.call(null, init__9811)
        }else {
          var G__9830 = i__9808 + 1;
          var G__9831 = init__9811;
          i__9808 = G__9830;
          init__9809 = G__9831;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9809
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9812 = this;
  var inode__9813 = this;
  var idx__9814 = hash >>> shift & 31;
  var node__9815 = this__9812.arr[idx__9814];
  if(!(node__9815 == null)) {
    return node__9815.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9816 = this;
  var inode__9817 = this;
  var idx__9818 = hash >>> shift & 31;
  var node__9819 = this__9816.arr[idx__9818];
  if(!(node__9819 == null)) {
    var n__9820 = node__9819.inode_without(shift + 5, hash, key);
    if(n__9820 === node__9819) {
      return inode__9817
    }else {
      if(n__9820 == null) {
        if(this__9816.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9817, null, idx__9818)
        }else {
          return new cljs.core.ArrayNode(null, this__9816.cnt - 1, cljs.core.clone_and_set.call(null, this__9816.arr, idx__9818, n__9820))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9816.cnt, cljs.core.clone_and_set.call(null, this__9816.arr, idx__9818, n__9820))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9817
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9821 = this;
  var inode__9822 = this;
  var idx__9823 = hash >>> shift & 31;
  var node__9824 = this__9821.arr[idx__9823];
  if(node__9824 == null) {
    return new cljs.core.ArrayNode(null, this__9821.cnt + 1, cljs.core.clone_and_set.call(null, this__9821.arr, idx__9823, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9825 = node__9824.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9825 === node__9824) {
      return inode__9822
    }else {
      return new cljs.core.ArrayNode(null, this__9821.cnt, cljs.core.clone_and_set.call(null, this__9821.arr, idx__9823, n__9825))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9826 = this;
  var inode__9827 = this;
  var idx__9828 = hash >>> shift & 31;
  var node__9829 = this__9826.arr[idx__9828];
  if(!(node__9829 == null)) {
    return node__9829.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9834 = 2 * cnt;
  var i__9835 = 0;
  while(true) {
    if(i__9835 < lim__9834) {
      if(cljs.core.key_test.call(null, key, arr[i__9835])) {
        return i__9835
      }else {
        var G__9836 = i__9835 + 2;
        i__9835 = G__9836;
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
  var this__9837 = this;
  var inode__9838 = this;
  if(hash === this__9837.collision_hash) {
    var idx__9839 = cljs.core.hash_collision_node_find_index.call(null, this__9837.arr, this__9837.cnt, key);
    if(idx__9839 === -1) {
      if(this__9837.arr.length > 2 * this__9837.cnt) {
        var editable__9840 = cljs.core.edit_and_set.call(null, inode__9838, edit, 2 * this__9837.cnt, key, 2 * this__9837.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9840.cnt = editable__9840.cnt + 1;
        return editable__9840
      }else {
        var len__9841 = this__9837.arr.length;
        var new_arr__9842 = cljs.core.make_array.call(null, len__9841 + 2);
        cljs.core.array_copy.call(null, this__9837.arr, 0, new_arr__9842, 0, len__9841);
        new_arr__9842[len__9841] = key;
        new_arr__9842[len__9841 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9838.ensure_editable_array(edit, this__9837.cnt + 1, new_arr__9842)
      }
    }else {
      if(this__9837.arr[idx__9839 + 1] === val) {
        return inode__9838
      }else {
        return cljs.core.edit_and_set.call(null, inode__9838, edit, idx__9839 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9837.collision_hash >>> shift & 31), [null, inode__9838, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9843 = this;
  var inode__9844 = this;
  return cljs.core.create_inode_seq.call(null, this__9843.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9845 = this;
  var inode__9846 = this;
  var idx__9847 = cljs.core.hash_collision_node_find_index.call(null, this__9845.arr, this__9845.cnt, key);
  if(idx__9847 === -1) {
    return inode__9846
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9845.cnt === 1) {
      return null
    }else {
      var editable__9848 = inode__9846.ensure_editable(edit);
      var earr__9849 = editable__9848.arr;
      earr__9849[idx__9847] = earr__9849[2 * this__9845.cnt - 2];
      earr__9849[idx__9847 + 1] = earr__9849[2 * this__9845.cnt - 1];
      earr__9849[2 * this__9845.cnt - 1] = null;
      earr__9849[2 * this__9845.cnt - 2] = null;
      editable__9848.cnt = editable__9848.cnt - 1;
      return editable__9848
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9850 = this;
  var inode__9851 = this;
  if(e === this__9850.edit) {
    return inode__9851
  }else {
    var new_arr__9852 = cljs.core.make_array.call(null, 2 * (this__9850.cnt + 1));
    cljs.core.array_copy.call(null, this__9850.arr, 0, new_arr__9852, 0, 2 * this__9850.cnt);
    return new cljs.core.HashCollisionNode(e, this__9850.collision_hash, this__9850.cnt, new_arr__9852)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9853 = this;
  var inode__9854 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9853.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9855 = this;
  var inode__9856 = this;
  var idx__9857 = cljs.core.hash_collision_node_find_index.call(null, this__9855.arr, this__9855.cnt, key);
  if(idx__9857 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9855.arr[idx__9857])) {
      return cljs.core.PersistentVector.fromArray([this__9855.arr[idx__9857], this__9855.arr[idx__9857 + 1]], true)
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
  var this__9858 = this;
  var inode__9859 = this;
  var idx__9860 = cljs.core.hash_collision_node_find_index.call(null, this__9858.arr, this__9858.cnt, key);
  if(idx__9860 === -1) {
    return inode__9859
  }else {
    if(this__9858.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9858.collision_hash, this__9858.cnt - 1, cljs.core.remove_pair.call(null, this__9858.arr, cljs.core.quot.call(null, idx__9860, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9861 = this;
  var inode__9862 = this;
  if(hash === this__9861.collision_hash) {
    var idx__9863 = cljs.core.hash_collision_node_find_index.call(null, this__9861.arr, this__9861.cnt, key);
    if(idx__9863 === -1) {
      var len__9864 = this__9861.arr.length;
      var new_arr__9865 = cljs.core.make_array.call(null, len__9864 + 2);
      cljs.core.array_copy.call(null, this__9861.arr, 0, new_arr__9865, 0, len__9864);
      new_arr__9865[len__9864] = key;
      new_arr__9865[len__9864 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9861.collision_hash, this__9861.cnt + 1, new_arr__9865)
    }else {
      if(cljs.core._EQ_.call(null, this__9861.arr[idx__9863], val)) {
        return inode__9862
      }else {
        return new cljs.core.HashCollisionNode(null, this__9861.collision_hash, this__9861.cnt, cljs.core.clone_and_set.call(null, this__9861.arr, idx__9863 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9861.collision_hash >>> shift & 31), [null, inode__9862])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9866 = this;
  var inode__9867 = this;
  var idx__9868 = cljs.core.hash_collision_node_find_index.call(null, this__9866.arr, this__9866.cnt, key);
  if(idx__9868 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9866.arr[idx__9868])) {
      return this__9866.arr[idx__9868 + 1]
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
  var this__9869 = this;
  var inode__9870 = this;
  if(e === this__9869.edit) {
    this__9869.arr = array;
    this__9869.cnt = count;
    return inode__9870
  }else {
    return new cljs.core.HashCollisionNode(this__9869.edit, this__9869.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9875 = cljs.core.hash.call(null, key1);
    if(key1hash__9875 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9875, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9876 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9875, key1, val1, added_leaf_QMARK___9876).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9876)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9877 = cljs.core.hash.call(null, key1);
    if(key1hash__9877 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9877, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9878 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9877, key1, val1, added_leaf_QMARK___9878).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9878)
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
  var this__9879 = this;
  var h__2190__auto____9880 = this__9879.__hash;
  if(!(h__2190__auto____9880 == null)) {
    return h__2190__auto____9880
  }else {
    var h__2190__auto____9881 = cljs.core.hash_coll.call(null, coll);
    this__9879.__hash = h__2190__auto____9881;
    return h__2190__auto____9881
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9882 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9883 = this;
  var this__9884 = this;
  return cljs.core.pr_str.call(null, this__9884)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9885 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9886 = this;
  if(this__9886.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9886.nodes[this__9886.i], this__9886.nodes[this__9886.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9886.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9887 = this;
  if(this__9887.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9887.nodes, this__9887.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9887.nodes, this__9887.i, cljs.core.next.call(null, this__9887.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9888 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9889 = this;
  return new cljs.core.NodeSeq(meta, this__9889.nodes, this__9889.i, this__9889.s, this__9889.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9890 = this;
  return this__9890.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9891 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9891.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9898 = nodes.length;
      var j__9899 = i;
      while(true) {
        if(j__9899 < len__9898) {
          if(!(nodes[j__9899] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9899, null, null)
          }else {
            var temp__3971__auto____9900 = nodes[j__9899 + 1];
            if(cljs.core.truth_(temp__3971__auto____9900)) {
              var node__9901 = temp__3971__auto____9900;
              var temp__3971__auto____9902 = node__9901.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9902)) {
                var node_seq__9903 = temp__3971__auto____9902;
                return new cljs.core.NodeSeq(null, nodes, j__9899 + 2, node_seq__9903, null)
              }else {
                var G__9904 = j__9899 + 2;
                j__9899 = G__9904;
                continue
              }
            }else {
              var G__9905 = j__9899 + 2;
              j__9899 = G__9905;
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
  var this__9906 = this;
  var h__2190__auto____9907 = this__9906.__hash;
  if(!(h__2190__auto____9907 == null)) {
    return h__2190__auto____9907
  }else {
    var h__2190__auto____9908 = cljs.core.hash_coll.call(null, coll);
    this__9906.__hash = h__2190__auto____9908;
    return h__2190__auto____9908
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9909 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9910 = this;
  var this__9911 = this;
  return cljs.core.pr_str.call(null, this__9911)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9912 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9913 = this;
  return cljs.core.first.call(null, this__9913.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9914 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9914.nodes, this__9914.i, cljs.core.next.call(null, this__9914.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9915 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9916 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9916.nodes, this__9916.i, this__9916.s, this__9916.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9917 = this;
  return this__9917.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9918 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9918.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9925 = nodes.length;
      var j__9926 = i;
      while(true) {
        if(j__9926 < len__9925) {
          var temp__3971__auto____9927 = nodes[j__9926];
          if(cljs.core.truth_(temp__3971__auto____9927)) {
            var nj__9928 = temp__3971__auto____9927;
            var temp__3971__auto____9929 = nj__9928.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9929)) {
              var ns__9930 = temp__3971__auto____9929;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9926 + 1, ns__9930, null)
            }else {
              var G__9931 = j__9926 + 1;
              j__9926 = G__9931;
              continue
            }
          }else {
            var G__9932 = j__9926 + 1;
            j__9926 = G__9932;
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
  var this__9935 = this;
  return new cljs.core.TransientHashMap({}, this__9935.root, this__9935.cnt, this__9935.has_nil_QMARK_, this__9935.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9936 = this;
  var h__2190__auto____9937 = this__9936.__hash;
  if(!(h__2190__auto____9937 == null)) {
    return h__2190__auto____9937
  }else {
    var h__2190__auto____9938 = cljs.core.hash_imap.call(null, coll);
    this__9936.__hash = h__2190__auto____9938;
    return h__2190__auto____9938
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9939 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9940 = this;
  if(k == null) {
    if(this__9940.has_nil_QMARK_) {
      return this__9940.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9940.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9940.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9941 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9942 = this__9941.has_nil_QMARK_;
      if(and__3822__auto____9942) {
        return v === this__9941.nil_val
      }else {
        return and__3822__auto____9942
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9941.meta, this__9941.has_nil_QMARK_ ? this__9941.cnt : this__9941.cnt + 1, this__9941.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9943 = new cljs.core.Box(false);
    var new_root__9944 = (this__9941.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9941.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9943);
    if(new_root__9944 === this__9941.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9941.meta, added_leaf_QMARK___9943.val ? this__9941.cnt + 1 : this__9941.cnt, new_root__9944, this__9941.has_nil_QMARK_, this__9941.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9945 = this;
  if(k == null) {
    return this__9945.has_nil_QMARK_
  }else {
    if(this__9945.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9945.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9968 = null;
  var G__9968__2 = function(this_sym9946, k) {
    var this__9948 = this;
    var this_sym9946__9949 = this;
    var coll__9950 = this_sym9946__9949;
    return coll__9950.cljs$core$ILookup$_lookup$arity$2(coll__9950, k)
  };
  var G__9968__3 = function(this_sym9947, k, not_found) {
    var this__9948 = this;
    var this_sym9947__9951 = this;
    var coll__9952 = this_sym9947__9951;
    return coll__9952.cljs$core$ILookup$_lookup$arity$3(coll__9952, k, not_found)
  };
  G__9968 = function(this_sym9947, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9968__2.call(this, this_sym9947, k);
      case 3:
        return G__9968__3.call(this, this_sym9947, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9968
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9933, args9934) {
  var this__9953 = this;
  return this_sym9933.call.apply(this_sym9933, [this_sym9933].concat(args9934.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9954 = this;
  var init__9955 = this__9954.has_nil_QMARK_ ? f.call(null, init, null, this__9954.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9955)) {
    return cljs.core.deref.call(null, init__9955)
  }else {
    if(!(this__9954.root == null)) {
      return this__9954.root.kv_reduce(f, init__9955)
    }else {
      if("\ufdd0'else") {
        return init__9955
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9956 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9957 = this;
  var this__9958 = this;
  return cljs.core.pr_str.call(null, this__9958)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9959 = this;
  if(this__9959.cnt > 0) {
    var s__9960 = !(this__9959.root == null) ? this__9959.root.inode_seq() : null;
    if(this__9959.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9959.nil_val], true), s__9960)
    }else {
      return s__9960
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9961 = this;
  return this__9961.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9962 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9963 = this;
  return new cljs.core.PersistentHashMap(meta, this__9963.cnt, this__9963.root, this__9963.has_nil_QMARK_, this__9963.nil_val, this__9963.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9964 = this;
  return this__9964.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9965 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9965.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9966 = this;
  if(k == null) {
    if(this__9966.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9966.meta, this__9966.cnt - 1, this__9966.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9966.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9967 = this__9966.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9967 === this__9966.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9966.meta, this__9966.cnt - 1, new_root__9967, this__9966.has_nil_QMARK_, this__9966.nil_val, null)
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
  var len__9969 = ks.length;
  var i__9970 = 0;
  var out__9971 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9970 < len__9969) {
      var G__9972 = i__9970 + 1;
      var G__9973 = cljs.core.assoc_BANG_.call(null, out__9971, ks[i__9970], vs[i__9970]);
      i__9970 = G__9972;
      out__9971 = G__9973;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9971)
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
  var this__9974 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9975 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9976 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9977 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9978 = this;
  if(k == null) {
    if(this__9978.has_nil_QMARK_) {
      return this__9978.nil_val
    }else {
      return null
    }
  }else {
    if(this__9978.root == null) {
      return null
    }else {
      return this__9978.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9979 = this;
  if(k == null) {
    if(this__9979.has_nil_QMARK_) {
      return this__9979.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9979.root == null) {
      return not_found
    }else {
      return this__9979.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9980 = this;
  if(this__9980.edit) {
    return this__9980.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9981 = this;
  var tcoll__9982 = this;
  if(this__9981.edit) {
    if(function() {
      var G__9983__9984 = o;
      if(G__9983__9984) {
        if(function() {
          var or__3824__auto____9985 = G__9983__9984.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9985) {
            return or__3824__auto____9985
          }else {
            return G__9983__9984.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9983__9984.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9983__9984)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9983__9984)
      }
    }()) {
      return tcoll__9982.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9986 = cljs.core.seq.call(null, o);
      var tcoll__9987 = tcoll__9982;
      while(true) {
        var temp__3971__auto____9988 = cljs.core.first.call(null, es__9986);
        if(cljs.core.truth_(temp__3971__auto____9988)) {
          var e__9989 = temp__3971__auto____9988;
          var G__10000 = cljs.core.next.call(null, es__9986);
          var G__10001 = tcoll__9987.assoc_BANG_(cljs.core.key.call(null, e__9989), cljs.core.val.call(null, e__9989));
          es__9986 = G__10000;
          tcoll__9987 = G__10001;
          continue
        }else {
          return tcoll__9987
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9990 = this;
  var tcoll__9991 = this;
  if(this__9990.edit) {
    if(k == null) {
      if(this__9990.nil_val === v) {
      }else {
        this__9990.nil_val = v
      }
      if(this__9990.has_nil_QMARK_) {
      }else {
        this__9990.count = this__9990.count + 1;
        this__9990.has_nil_QMARK_ = true
      }
      return tcoll__9991
    }else {
      var added_leaf_QMARK___9992 = new cljs.core.Box(false);
      var node__9993 = (this__9990.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9990.root).inode_assoc_BANG_(this__9990.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9992);
      if(node__9993 === this__9990.root) {
      }else {
        this__9990.root = node__9993
      }
      if(added_leaf_QMARK___9992.val) {
        this__9990.count = this__9990.count + 1
      }else {
      }
      return tcoll__9991
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9994 = this;
  var tcoll__9995 = this;
  if(this__9994.edit) {
    if(k == null) {
      if(this__9994.has_nil_QMARK_) {
        this__9994.has_nil_QMARK_ = false;
        this__9994.nil_val = null;
        this__9994.count = this__9994.count - 1;
        return tcoll__9995
      }else {
        return tcoll__9995
      }
    }else {
      if(this__9994.root == null) {
        return tcoll__9995
      }else {
        var removed_leaf_QMARK___9996 = new cljs.core.Box(false);
        var node__9997 = this__9994.root.inode_without_BANG_(this__9994.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9996);
        if(node__9997 === this__9994.root) {
        }else {
          this__9994.root = node__9997
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9996[0])) {
          this__9994.count = this__9994.count - 1
        }else {
        }
        return tcoll__9995
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9998 = this;
  var tcoll__9999 = this;
  if(this__9998.edit) {
    this__9998.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9998.count, this__9998.root, this__9998.has_nil_QMARK_, this__9998.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__10004 = node;
  var stack__10005 = stack;
  while(true) {
    if(!(t__10004 == null)) {
      var G__10006 = ascending_QMARK_ ? t__10004.left : t__10004.right;
      var G__10007 = cljs.core.conj.call(null, stack__10005, t__10004);
      t__10004 = G__10006;
      stack__10005 = G__10007;
      continue
    }else {
      return stack__10005
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
  var this__10008 = this;
  var h__2190__auto____10009 = this__10008.__hash;
  if(!(h__2190__auto____10009 == null)) {
    return h__2190__auto____10009
  }else {
    var h__2190__auto____10010 = cljs.core.hash_coll.call(null, coll);
    this__10008.__hash = h__2190__auto____10010;
    return h__2190__auto____10010
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10011 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__10012 = this;
  var this__10013 = this;
  return cljs.core.pr_str.call(null, this__10013)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10014 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10015 = this;
  if(this__10015.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__10015.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__10016 = this;
  return cljs.core.peek.call(null, this__10016.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__10017 = this;
  var t__10018 = cljs.core.first.call(null, this__10017.stack);
  var next_stack__10019 = cljs.core.tree_map_seq_push.call(null, this__10017.ascending_QMARK_ ? t__10018.right : t__10018.left, cljs.core.next.call(null, this__10017.stack), this__10017.ascending_QMARK_);
  if(!(next_stack__10019 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__10019, this__10017.ascending_QMARK_, this__10017.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10020 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10021 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__10021.stack, this__10021.ascending_QMARK_, this__10021.cnt, this__10021.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10022 = this;
  return this__10022.meta
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
        var and__3822__auto____10024 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____10024) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____10024
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
        var and__3822__auto____10026 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____10026) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____10026
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
  var init__10030 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__10030)) {
    return cljs.core.deref.call(null, init__10030)
  }else {
    var init__10031 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__10030) : init__10030;
    if(cljs.core.reduced_QMARK_.call(null, init__10031)) {
      return cljs.core.deref.call(null, init__10031)
    }else {
      var init__10032 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__10031) : init__10031;
      if(cljs.core.reduced_QMARK_.call(null, init__10032)) {
        return cljs.core.deref.call(null, init__10032)
      }else {
        return init__10032
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
  var this__10035 = this;
  var h__2190__auto____10036 = this__10035.__hash;
  if(!(h__2190__auto____10036 == null)) {
    return h__2190__auto____10036
  }else {
    var h__2190__auto____10037 = cljs.core.hash_coll.call(null, coll);
    this__10035.__hash = h__2190__auto____10037;
    return h__2190__auto____10037
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10038 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10039 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10040 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10040.key, this__10040.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__10088 = null;
  var G__10088__2 = function(this_sym10041, k) {
    var this__10043 = this;
    var this_sym10041__10044 = this;
    var node__10045 = this_sym10041__10044;
    return node__10045.cljs$core$ILookup$_lookup$arity$2(node__10045, k)
  };
  var G__10088__3 = function(this_sym10042, k, not_found) {
    var this__10043 = this;
    var this_sym10042__10046 = this;
    var node__10047 = this_sym10042__10046;
    return node__10047.cljs$core$ILookup$_lookup$arity$3(node__10047, k, not_found)
  };
  G__10088 = function(this_sym10042, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10088__2.call(this, this_sym10042, k);
      case 3:
        return G__10088__3.call(this, this_sym10042, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10088
}();
cljs.core.BlackNode.prototype.apply = function(this_sym10033, args10034) {
  var this__10048 = this;
  return this_sym10033.call.apply(this_sym10033, [this_sym10033].concat(args10034.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10049 = this;
  return cljs.core.PersistentVector.fromArray([this__10049.key, this__10049.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10050 = this;
  return this__10050.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10051 = this;
  return this__10051.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__10052 = this;
  var node__10053 = this;
  return ins.balance_right(node__10053)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__10054 = this;
  var node__10055 = this;
  return new cljs.core.RedNode(this__10054.key, this__10054.val, this__10054.left, this__10054.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__10056 = this;
  var node__10057 = this;
  return cljs.core.balance_right_del.call(null, this__10056.key, this__10056.val, this__10056.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__10058 = this;
  var node__10059 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__10060 = this;
  var node__10061 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10061, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__10062 = this;
  var node__10063 = this;
  return cljs.core.balance_left_del.call(null, this__10062.key, this__10062.val, del, this__10062.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__10064 = this;
  var node__10065 = this;
  return ins.balance_left(node__10065)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__10066 = this;
  var node__10067 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__10067, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__10089 = null;
  var G__10089__0 = function() {
    var this__10068 = this;
    var this__10070 = this;
    return cljs.core.pr_str.call(null, this__10070)
  };
  G__10089 = function() {
    switch(arguments.length) {
      case 0:
        return G__10089__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10089
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__10071 = this;
  var node__10072 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10072, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__10073 = this;
  var node__10074 = this;
  return node__10074
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10075 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10076 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10077 = this;
  return cljs.core.list.call(null, this__10077.key, this__10077.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10078 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10079 = this;
  return this__10079.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10080 = this;
  return cljs.core.PersistentVector.fromArray([this__10080.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10081 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10081.key, this__10081.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10082 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10083 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10083.key, this__10083.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10084 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10085 = this;
  if(n === 0) {
    return this__10085.key
  }else {
    if(n === 1) {
      return this__10085.val
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
  var this__10086 = this;
  if(n === 0) {
    return this__10086.key
  }else {
    if(n === 1) {
      return this__10086.val
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
  var this__10087 = this;
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
  var this__10092 = this;
  var h__2190__auto____10093 = this__10092.__hash;
  if(!(h__2190__auto____10093 == null)) {
    return h__2190__auto____10093
  }else {
    var h__2190__auto____10094 = cljs.core.hash_coll.call(null, coll);
    this__10092.__hash = h__2190__auto____10094;
    return h__2190__auto____10094
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10095 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10096 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10097 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10097.key, this__10097.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__10145 = null;
  var G__10145__2 = function(this_sym10098, k) {
    var this__10100 = this;
    var this_sym10098__10101 = this;
    var node__10102 = this_sym10098__10101;
    return node__10102.cljs$core$ILookup$_lookup$arity$2(node__10102, k)
  };
  var G__10145__3 = function(this_sym10099, k, not_found) {
    var this__10100 = this;
    var this_sym10099__10103 = this;
    var node__10104 = this_sym10099__10103;
    return node__10104.cljs$core$ILookup$_lookup$arity$3(node__10104, k, not_found)
  };
  G__10145 = function(this_sym10099, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10145__2.call(this, this_sym10099, k);
      case 3:
        return G__10145__3.call(this, this_sym10099, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10145
}();
cljs.core.RedNode.prototype.apply = function(this_sym10090, args10091) {
  var this__10105 = this;
  return this_sym10090.call.apply(this_sym10090, [this_sym10090].concat(args10091.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10106 = this;
  return cljs.core.PersistentVector.fromArray([this__10106.key, this__10106.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10107 = this;
  return this__10107.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10108 = this;
  return this__10108.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10109 = this;
  var node__10110 = this;
  return new cljs.core.RedNode(this__10109.key, this__10109.val, this__10109.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10111 = this;
  var node__10112 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10113 = this;
  var node__10114 = this;
  return new cljs.core.RedNode(this__10113.key, this__10113.val, this__10113.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10115 = this;
  var node__10116 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10117 = this;
  var node__10118 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10118, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10119 = this;
  var node__10120 = this;
  return new cljs.core.RedNode(this__10119.key, this__10119.val, del, this__10119.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10121 = this;
  var node__10122 = this;
  return new cljs.core.RedNode(this__10121.key, this__10121.val, ins, this__10121.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10123 = this;
  var node__10124 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10123.left)) {
    return new cljs.core.RedNode(this__10123.key, this__10123.val, this__10123.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10123.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10123.right)) {
      return new cljs.core.RedNode(this__10123.right.key, this__10123.right.val, new cljs.core.BlackNode(this__10123.key, this__10123.val, this__10123.left, this__10123.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10123.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10124, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10146 = null;
  var G__10146__0 = function() {
    var this__10125 = this;
    var this__10127 = this;
    return cljs.core.pr_str.call(null, this__10127)
  };
  G__10146 = function() {
    switch(arguments.length) {
      case 0:
        return G__10146__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10146
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10128 = this;
  var node__10129 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10128.right)) {
    return new cljs.core.RedNode(this__10128.key, this__10128.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10128.left, null), this__10128.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10128.left)) {
      return new cljs.core.RedNode(this__10128.left.key, this__10128.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10128.left.left, null), new cljs.core.BlackNode(this__10128.key, this__10128.val, this__10128.left.right, this__10128.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10129, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10130 = this;
  var node__10131 = this;
  return new cljs.core.BlackNode(this__10130.key, this__10130.val, this__10130.left, this__10130.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10132 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10133 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10134 = this;
  return cljs.core.list.call(null, this__10134.key, this__10134.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10135 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10136 = this;
  return this__10136.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10137 = this;
  return cljs.core.PersistentVector.fromArray([this__10137.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10138 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10138.key, this__10138.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10139 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10140 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10140.key, this__10140.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10141 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10142 = this;
  if(n === 0) {
    return this__10142.key
  }else {
    if(n === 1) {
      return this__10142.val
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
  var this__10143 = this;
  if(n === 0) {
    return this__10143.key
  }else {
    if(n === 1) {
      return this__10143.val
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
  var this__10144 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10150 = comp.call(null, k, tree.key);
    if(c__10150 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10150 < 0) {
        var ins__10151 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__10151 == null)) {
          return tree.add_left(ins__10151)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10152 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__10152 == null)) {
            return tree.add_right(ins__10152)
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
          var app__10155 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10155)) {
            return new cljs.core.RedNode(app__10155.key, app__10155.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10155.left, null), new cljs.core.RedNode(right.key, right.val, app__10155.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10155, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10156 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10156)) {
              return new cljs.core.RedNode(app__10156.key, app__10156.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10156.left, null), new cljs.core.BlackNode(right.key, right.val, app__10156.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10156, right.right, null))
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
    var c__10162 = comp.call(null, k, tree.key);
    if(c__10162 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10162 < 0) {
        var del__10163 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____10164 = !(del__10163 == null);
          if(or__3824__auto____10164) {
            return or__3824__auto____10164
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10163, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10163, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__10165 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____10166 = !(del__10165 == null);
            if(or__3824__auto____10166) {
              return or__3824__auto____10166
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__10165)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__10165, null)
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
  var tk__10169 = tree.key;
  var c__10170 = comp.call(null, k, tk__10169);
  if(c__10170 === 0) {
    return tree.replace(tk__10169, v, tree.left, tree.right)
  }else {
    if(c__10170 < 0) {
      return tree.replace(tk__10169, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__10169, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__10173 = this;
  var h__2190__auto____10174 = this__10173.__hash;
  if(!(h__2190__auto____10174 == null)) {
    return h__2190__auto____10174
  }else {
    var h__2190__auto____10175 = cljs.core.hash_imap.call(null, coll);
    this__10173.__hash = h__2190__auto____10175;
    return h__2190__auto____10175
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10176 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10177 = this;
  var n__10178 = coll.entry_at(k);
  if(!(n__10178 == null)) {
    return n__10178.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10179 = this;
  var found__10180 = [null];
  var t__10181 = cljs.core.tree_map_add.call(null, this__10179.comp, this__10179.tree, k, v, found__10180);
  if(t__10181 == null) {
    var found_node__10182 = cljs.core.nth.call(null, found__10180, 0);
    if(cljs.core._EQ_.call(null, v, found_node__10182.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10179.comp, cljs.core.tree_map_replace.call(null, this__10179.comp, this__10179.tree, k, v), this__10179.cnt, this__10179.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10179.comp, t__10181.blacken(), this__10179.cnt + 1, this__10179.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10183 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__10217 = null;
  var G__10217__2 = function(this_sym10184, k) {
    var this__10186 = this;
    var this_sym10184__10187 = this;
    var coll__10188 = this_sym10184__10187;
    return coll__10188.cljs$core$ILookup$_lookup$arity$2(coll__10188, k)
  };
  var G__10217__3 = function(this_sym10185, k, not_found) {
    var this__10186 = this;
    var this_sym10185__10189 = this;
    var coll__10190 = this_sym10185__10189;
    return coll__10190.cljs$core$ILookup$_lookup$arity$3(coll__10190, k, not_found)
  };
  G__10217 = function(this_sym10185, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10217__2.call(this, this_sym10185, k);
      case 3:
        return G__10217__3.call(this, this_sym10185, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10217
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym10171, args10172) {
  var this__10191 = this;
  return this_sym10171.call.apply(this_sym10171, [this_sym10171].concat(args10172.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10192 = this;
  if(!(this__10192.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__10192.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10193 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10194 = this;
  if(this__10194.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10194.tree, false, this__10194.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__10195 = this;
  var this__10196 = this;
  return cljs.core.pr_str.call(null, this__10196)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__10197 = this;
  var coll__10198 = this;
  var t__10199 = this__10197.tree;
  while(true) {
    if(!(t__10199 == null)) {
      var c__10200 = this__10197.comp.call(null, k, t__10199.key);
      if(c__10200 === 0) {
        return t__10199
      }else {
        if(c__10200 < 0) {
          var G__10218 = t__10199.left;
          t__10199 = G__10218;
          continue
        }else {
          if("\ufdd0'else") {
            var G__10219 = t__10199.right;
            t__10199 = G__10219;
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
  var this__10201 = this;
  if(this__10201.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10201.tree, ascending_QMARK_, this__10201.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10202 = this;
  if(this__10202.cnt > 0) {
    var stack__10203 = null;
    var t__10204 = this__10202.tree;
    while(true) {
      if(!(t__10204 == null)) {
        var c__10205 = this__10202.comp.call(null, k, t__10204.key);
        if(c__10205 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__10203, t__10204), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__10205 < 0) {
              var G__10220 = cljs.core.conj.call(null, stack__10203, t__10204);
              var G__10221 = t__10204.left;
              stack__10203 = G__10220;
              t__10204 = G__10221;
              continue
            }else {
              var G__10222 = stack__10203;
              var G__10223 = t__10204.right;
              stack__10203 = G__10222;
              t__10204 = G__10223;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__10205 > 0) {
                var G__10224 = cljs.core.conj.call(null, stack__10203, t__10204);
                var G__10225 = t__10204.right;
                stack__10203 = G__10224;
                t__10204 = G__10225;
                continue
              }else {
                var G__10226 = stack__10203;
                var G__10227 = t__10204.left;
                stack__10203 = G__10226;
                t__10204 = G__10227;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__10203 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__10203, ascending_QMARK_, -1, null)
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
  var this__10206 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10207 = this;
  return this__10207.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10208 = this;
  if(this__10208.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10208.tree, true, this__10208.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10209 = this;
  return this__10209.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10210 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10211 = this;
  return new cljs.core.PersistentTreeMap(this__10211.comp, this__10211.tree, this__10211.cnt, meta, this__10211.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10212 = this;
  return this__10212.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10213 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__10213.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10214 = this;
  var found__10215 = [null];
  var t__10216 = cljs.core.tree_map_remove.call(null, this__10214.comp, this__10214.tree, k, found__10215);
  if(t__10216 == null) {
    if(cljs.core.nth.call(null, found__10215, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10214.comp, null, 0, this__10214.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10214.comp, t__10216.blacken(), this__10214.cnt - 1, this__10214.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__10230 = cljs.core.seq.call(null, keyvals);
    var out__10231 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__10230) {
        var G__10232 = cljs.core.nnext.call(null, in__10230);
        var G__10233 = cljs.core.assoc_BANG_.call(null, out__10231, cljs.core.first.call(null, in__10230), cljs.core.second.call(null, in__10230));
        in__10230 = G__10232;
        out__10231 = G__10233;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10231)
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
  hash_map.cljs$lang$applyTo = function(arglist__10234) {
    var keyvals = cljs.core.seq(arglist__10234);
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
  array_map.cljs$lang$applyTo = function(arglist__10235) {
    var keyvals = cljs.core.seq(arglist__10235);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__10239 = [];
    var obj__10240 = {};
    var kvs__10241 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__10241) {
        ks__10239.push(cljs.core.first.call(null, kvs__10241));
        obj__10240[cljs.core.first.call(null, kvs__10241)] = cljs.core.second.call(null, kvs__10241);
        var G__10242 = cljs.core.nnext.call(null, kvs__10241);
        kvs__10241 = G__10242;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__10239, obj__10240)
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
  obj_map.cljs$lang$applyTo = function(arglist__10243) {
    var keyvals = cljs.core.seq(arglist__10243);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__10246 = cljs.core.seq.call(null, keyvals);
    var out__10247 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__10246) {
        var G__10248 = cljs.core.nnext.call(null, in__10246);
        var G__10249 = cljs.core.assoc.call(null, out__10247, cljs.core.first.call(null, in__10246), cljs.core.second.call(null, in__10246));
        in__10246 = G__10248;
        out__10247 = G__10249;
        continue
      }else {
        return out__10247
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
  sorted_map.cljs$lang$applyTo = function(arglist__10250) {
    var keyvals = cljs.core.seq(arglist__10250);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__10253 = cljs.core.seq.call(null, keyvals);
    var out__10254 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__10253) {
        var G__10255 = cljs.core.nnext.call(null, in__10253);
        var G__10256 = cljs.core.assoc.call(null, out__10254, cljs.core.first.call(null, in__10253), cljs.core.second.call(null, in__10253));
        in__10253 = G__10255;
        out__10254 = G__10256;
        continue
      }else {
        return out__10254
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__10257) {
    var comparator = cljs.core.first(arglist__10257);
    var keyvals = cljs.core.rest(arglist__10257);
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
      return cljs.core.reduce.call(null, function(p1__10258_SHARP_, p2__10259_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____10261 = p1__10258_SHARP_;
          if(cljs.core.truth_(or__3824__auto____10261)) {
            return or__3824__auto____10261
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__10259_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__10262) {
    var maps = cljs.core.seq(arglist__10262);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__10270 = function(m, e) {
        var k__10268 = cljs.core.first.call(null, e);
        var v__10269 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__10268)) {
          return cljs.core.assoc.call(null, m, k__10268, f.call(null, cljs.core._lookup.call(null, m, k__10268, null), v__10269))
        }else {
          return cljs.core.assoc.call(null, m, k__10268, v__10269)
        }
      };
      var merge2__10272 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__10270, function() {
          var or__3824__auto____10271 = m1;
          if(cljs.core.truth_(or__3824__auto____10271)) {
            return or__3824__auto____10271
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__10272, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__10273) {
    var f = cljs.core.first(arglist__10273);
    var maps = cljs.core.rest(arglist__10273);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__10278 = cljs.core.ObjMap.EMPTY;
  var keys__10279 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__10279) {
      var key__10280 = cljs.core.first.call(null, keys__10279);
      var entry__10281 = cljs.core._lookup.call(null, map, key__10280, "\ufdd0'user/not-found");
      var G__10282 = cljs.core.not_EQ_.call(null, entry__10281, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__10278, key__10280, entry__10281) : ret__10278;
      var G__10283 = cljs.core.next.call(null, keys__10279);
      ret__10278 = G__10282;
      keys__10279 = G__10283;
      continue
    }else {
      return ret__10278
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
  var this__10287 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__10287.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10288 = this;
  var h__2190__auto____10289 = this__10288.__hash;
  if(!(h__2190__auto____10289 == null)) {
    return h__2190__auto____10289
  }else {
    var h__2190__auto____10290 = cljs.core.hash_iset.call(null, coll);
    this__10288.__hash = h__2190__auto____10290;
    return h__2190__auto____10290
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10291 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10292 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10292.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__10313 = null;
  var G__10313__2 = function(this_sym10293, k) {
    var this__10295 = this;
    var this_sym10293__10296 = this;
    var coll__10297 = this_sym10293__10296;
    return coll__10297.cljs$core$ILookup$_lookup$arity$2(coll__10297, k)
  };
  var G__10313__3 = function(this_sym10294, k, not_found) {
    var this__10295 = this;
    var this_sym10294__10298 = this;
    var coll__10299 = this_sym10294__10298;
    return coll__10299.cljs$core$ILookup$_lookup$arity$3(coll__10299, k, not_found)
  };
  G__10313 = function(this_sym10294, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10313__2.call(this, this_sym10294, k);
      case 3:
        return G__10313__3.call(this, this_sym10294, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10313
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym10285, args10286) {
  var this__10300 = this;
  return this_sym10285.call.apply(this_sym10285, [this_sym10285].concat(args10286.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10301 = this;
  return new cljs.core.PersistentHashSet(this__10301.meta, cljs.core.assoc.call(null, this__10301.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__10302 = this;
  var this__10303 = this;
  return cljs.core.pr_str.call(null, this__10303)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10304 = this;
  return cljs.core.keys.call(null, this__10304.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10305 = this;
  return new cljs.core.PersistentHashSet(this__10305.meta, cljs.core.dissoc.call(null, this__10305.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10306 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10307 = this;
  var and__3822__auto____10308 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10308) {
    var and__3822__auto____10309 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10309) {
      return cljs.core.every_QMARK_.call(null, function(p1__10284_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10284_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10309
    }
  }else {
    return and__3822__auto____10308
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10310 = this;
  return new cljs.core.PersistentHashSet(meta, this__10310.hash_map, this__10310.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10311 = this;
  return this__10311.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10312 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__10312.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__10314 = cljs.core.count.call(null, items);
  var i__10315 = 0;
  var out__10316 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__10315 < len__10314) {
      var G__10317 = i__10315 + 1;
      var G__10318 = cljs.core.conj_BANG_.call(null, out__10316, items[i__10315]);
      i__10315 = G__10317;
      out__10316 = G__10318;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10316)
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
  var G__10336 = null;
  var G__10336__2 = function(this_sym10322, k) {
    var this__10324 = this;
    var this_sym10322__10325 = this;
    var tcoll__10326 = this_sym10322__10325;
    if(cljs.core._lookup.call(null, this__10324.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__10336__3 = function(this_sym10323, k, not_found) {
    var this__10324 = this;
    var this_sym10323__10327 = this;
    var tcoll__10328 = this_sym10323__10327;
    if(cljs.core._lookup.call(null, this__10324.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__10336 = function(this_sym10323, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10336__2.call(this, this_sym10323, k);
      case 3:
        return G__10336__3.call(this, this_sym10323, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10336
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym10320, args10321) {
  var this__10329 = this;
  return this_sym10320.call.apply(this_sym10320, [this_sym10320].concat(args10321.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__10330 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__10331 = this;
  if(cljs.core._lookup.call(null, this__10331.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10332 = this;
  return cljs.core.count.call(null, this__10332.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__10333 = this;
  this__10333.transient_map = cljs.core.dissoc_BANG_.call(null, this__10333.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10334 = this;
  this__10334.transient_map = cljs.core.assoc_BANG_.call(null, this__10334.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10335 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__10335.transient_map), null)
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
  var this__10339 = this;
  var h__2190__auto____10340 = this__10339.__hash;
  if(!(h__2190__auto____10340 == null)) {
    return h__2190__auto____10340
  }else {
    var h__2190__auto____10341 = cljs.core.hash_iset.call(null, coll);
    this__10339.__hash = h__2190__auto____10341;
    return h__2190__auto____10341
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10342 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10343 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10343.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__10369 = null;
  var G__10369__2 = function(this_sym10344, k) {
    var this__10346 = this;
    var this_sym10344__10347 = this;
    var coll__10348 = this_sym10344__10347;
    return coll__10348.cljs$core$ILookup$_lookup$arity$2(coll__10348, k)
  };
  var G__10369__3 = function(this_sym10345, k, not_found) {
    var this__10346 = this;
    var this_sym10345__10349 = this;
    var coll__10350 = this_sym10345__10349;
    return coll__10350.cljs$core$ILookup$_lookup$arity$3(coll__10350, k, not_found)
  };
  G__10369 = function(this_sym10345, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10369__2.call(this, this_sym10345, k);
      case 3:
        return G__10369__3.call(this, this_sym10345, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10369
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym10337, args10338) {
  var this__10351 = this;
  return this_sym10337.call.apply(this_sym10337, [this_sym10337].concat(args10338.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10352 = this;
  return new cljs.core.PersistentTreeSet(this__10352.meta, cljs.core.assoc.call(null, this__10352.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10353 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__10353.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__10354 = this;
  var this__10355 = this;
  return cljs.core.pr_str.call(null, this__10355)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10356 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__10356.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10357 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__10357.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10358 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10359 = this;
  return cljs.core._comparator.call(null, this__10359.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10360 = this;
  return cljs.core.keys.call(null, this__10360.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10361 = this;
  return new cljs.core.PersistentTreeSet(this__10361.meta, cljs.core.dissoc.call(null, this__10361.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10362 = this;
  return cljs.core.count.call(null, this__10362.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10363 = this;
  var and__3822__auto____10364 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10364) {
    var and__3822__auto____10365 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10365) {
      return cljs.core.every_QMARK_.call(null, function(p1__10319_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10319_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10365
    }
  }else {
    return and__3822__auto____10364
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10366 = this;
  return new cljs.core.PersistentTreeSet(meta, this__10366.tree_map, this__10366.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10367 = this;
  return this__10367.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10368 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__10368.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__10374__delegate = function(keys) {
      var in__10372 = cljs.core.seq.call(null, keys);
      var out__10373 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__10372)) {
          var G__10375 = cljs.core.next.call(null, in__10372);
          var G__10376 = cljs.core.conj_BANG_.call(null, out__10373, cljs.core.first.call(null, in__10372));
          in__10372 = G__10375;
          out__10373 = G__10376;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__10373)
        }
        break
      }
    };
    var G__10374 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10374__delegate.call(this, keys)
    };
    G__10374.cljs$lang$maxFixedArity = 0;
    G__10374.cljs$lang$applyTo = function(arglist__10377) {
      var keys = cljs.core.seq(arglist__10377);
      return G__10374__delegate(keys)
    };
    G__10374.cljs$lang$arity$variadic = G__10374__delegate;
    return G__10374
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
  sorted_set.cljs$lang$applyTo = function(arglist__10378) {
    var keys = cljs.core.seq(arglist__10378);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__10380) {
    var comparator = cljs.core.first(arglist__10380);
    var keys = cljs.core.rest(arglist__10380);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__10386 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____10387 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____10387)) {
        var e__10388 = temp__3971__auto____10387;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__10388))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__10386, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__10379_SHARP_) {
      var temp__3971__auto____10389 = cljs.core.find.call(null, smap, p1__10379_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____10389)) {
        var e__10390 = temp__3971__auto____10389;
        return cljs.core.second.call(null, e__10390)
      }else {
        return p1__10379_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__10420 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__10413, seen) {
        while(true) {
          var vec__10414__10415 = p__10413;
          var f__10416 = cljs.core.nth.call(null, vec__10414__10415, 0, null);
          var xs__10417 = vec__10414__10415;
          var temp__3974__auto____10418 = cljs.core.seq.call(null, xs__10417);
          if(temp__3974__auto____10418) {
            var s__10419 = temp__3974__auto____10418;
            if(cljs.core.contains_QMARK_.call(null, seen, f__10416)) {
              var G__10421 = cljs.core.rest.call(null, s__10419);
              var G__10422 = seen;
              p__10413 = G__10421;
              seen = G__10422;
              continue
            }else {
              return cljs.core.cons.call(null, f__10416, step.call(null, cljs.core.rest.call(null, s__10419), cljs.core.conj.call(null, seen, f__10416)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__10420.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__10425 = cljs.core.PersistentVector.EMPTY;
  var s__10426 = s;
  while(true) {
    if(cljs.core.next.call(null, s__10426)) {
      var G__10427 = cljs.core.conj.call(null, ret__10425, cljs.core.first.call(null, s__10426));
      var G__10428 = cljs.core.next.call(null, s__10426);
      ret__10425 = G__10427;
      s__10426 = G__10428;
      continue
    }else {
      return cljs.core.seq.call(null, ret__10425)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____10431 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____10431) {
        return or__3824__auto____10431
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__10432 = x.lastIndexOf("/");
      if(i__10432 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__10432 + 1)
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
    var or__3824__auto____10435 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____10435) {
      return or__3824__auto____10435
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__10436 = x.lastIndexOf("/");
    if(i__10436 > -1) {
      return cljs.core.subs.call(null, x, 2, i__10436)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__10443 = cljs.core.ObjMap.EMPTY;
  var ks__10444 = cljs.core.seq.call(null, keys);
  var vs__10445 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____10446 = ks__10444;
      if(and__3822__auto____10446) {
        return vs__10445
      }else {
        return and__3822__auto____10446
      }
    }()) {
      var G__10447 = cljs.core.assoc.call(null, map__10443, cljs.core.first.call(null, ks__10444), cljs.core.first.call(null, vs__10445));
      var G__10448 = cljs.core.next.call(null, ks__10444);
      var G__10449 = cljs.core.next.call(null, vs__10445);
      map__10443 = G__10447;
      ks__10444 = G__10448;
      vs__10445 = G__10449;
      continue
    }else {
      return map__10443
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
    var G__10452__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10437_SHARP_, p2__10438_SHARP_) {
        return max_key.call(null, k, p1__10437_SHARP_, p2__10438_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__10452 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10452__delegate.call(this, k, x, y, more)
    };
    G__10452.cljs$lang$maxFixedArity = 3;
    G__10452.cljs$lang$applyTo = function(arglist__10453) {
      var k = cljs.core.first(arglist__10453);
      var x = cljs.core.first(cljs.core.next(arglist__10453));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10453)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10453)));
      return G__10452__delegate(k, x, y, more)
    };
    G__10452.cljs$lang$arity$variadic = G__10452__delegate;
    return G__10452
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
    var G__10454__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10450_SHARP_, p2__10451_SHARP_) {
        return min_key.call(null, k, p1__10450_SHARP_, p2__10451_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__10454 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10454__delegate.call(this, k, x, y, more)
    };
    G__10454.cljs$lang$maxFixedArity = 3;
    G__10454.cljs$lang$applyTo = function(arglist__10455) {
      var k = cljs.core.first(arglist__10455);
      var x = cljs.core.first(cljs.core.next(arglist__10455));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10455)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10455)));
      return G__10454__delegate(k, x, y, more)
    };
    G__10454.cljs$lang$arity$variadic = G__10454__delegate;
    return G__10454
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
      var temp__3974__auto____10458 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10458) {
        var s__10459 = temp__3974__auto____10458;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__10459), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__10459)))
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
    var temp__3974__auto____10462 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10462) {
      var s__10463 = temp__3974__auto____10462;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10463)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10463), take_while.call(null, pred, cljs.core.rest.call(null, s__10463)))
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
    var comp__10465 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10465.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10477 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____10478 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____10478)) {
        var vec__10479__10480 = temp__3974__auto____10478;
        var e__10481 = cljs.core.nth.call(null, vec__10479__10480, 0, null);
        var s__10482 = vec__10479__10480;
        if(cljs.core.truth_(include__10477.call(null, e__10481))) {
          return s__10482
        }else {
          return cljs.core.next.call(null, s__10482)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10477, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10483 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____10483)) {
      var vec__10484__10485 = temp__3974__auto____10483;
      var e__10486 = cljs.core.nth.call(null, vec__10484__10485, 0, null);
      var s__10487 = vec__10484__10485;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10486)) ? s__10487 : cljs.core.next.call(null, s__10487))
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
    var include__10499 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____10500 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____10500)) {
        var vec__10501__10502 = temp__3974__auto____10500;
        var e__10503 = cljs.core.nth.call(null, vec__10501__10502, 0, null);
        var s__10504 = vec__10501__10502;
        if(cljs.core.truth_(include__10499.call(null, e__10503))) {
          return s__10504
        }else {
          return cljs.core.next.call(null, s__10504)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10499, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10505 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10505)) {
      var vec__10506__10507 = temp__3974__auto____10505;
      var e__10508 = cljs.core.nth.call(null, vec__10506__10507, 0, null);
      var s__10509 = vec__10506__10507;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10508)) ? s__10509 : cljs.core.next.call(null, s__10509))
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
  var this__10510 = this;
  var h__2190__auto____10511 = this__10510.__hash;
  if(!(h__2190__auto____10511 == null)) {
    return h__2190__auto____10511
  }else {
    var h__2190__auto____10512 = cljs.core.hash_coll.call(null, rng);
    this__10510.__hash = h__2190__auto____10512;
    return h__2190__auto____10512
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10513 = this;
  if(this__10513.step > 0) {
    if(this__10513.start + this__10513.step < this__10513.end) {
      return new cljs.core.Range(this__10513.meta, this__10513.start + this__10513.step, this__10513.end, this__10513.step, null)
    }else {
      return null
    }
  }else {
    if(this__10513.start + this__10513.step > this__10513.end) {
      return new cljs.core.Range(this__10513.meta, this__10513.start + this__10513.step, this__10513.end, this__10513.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10514 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10515 = this;
  var this__10516 = this;
  return cljs.core.pr_str.call(null, this__10516)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10517 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10518 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10519 = this;
  if(this__10519.step > 0) {
    if(this__10519.start < this__10519.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10519.start > this__10519.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10520 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10520.end - this__10520.start) / this__10520.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10521 = this;
  return this__10521.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10522 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10522.meta, this__10522.start + this__10522.step, this__10522.end, this__10522.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10523 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10524 = this;
  return new cljs.core.Range(meta, this__10524.start, this__10524.end, this__10524.step, this__10524.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10525 = this;
  return this__10525.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10526 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10526.start + n * this__10526.step
  }else {
    if(function() {
      var and__3822__auto____10527 = this__10526.start > this__10526.end;
      if(and__3822__auto____10527) {
        return this__10526.step === 0
      }else {
        return and__3822__auto____10527
      }
    }()) {
      return this__10526.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10528 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10528.start + n * this__10528.step
  }else {
    if(function() {
      var and__3822__auto____10529 = this__10528.start > this__10528.end;
      if(and__3822__auto____10529) {
        return this__10528.step === 0
      }else {
        return and__3822__auto____10529
      }
    }()) {
      return this__10528.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10530 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10530.meta)
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
    var temp__3974__auto____10533 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10533) {
      var s__10534 = temp__3974__auto____10533;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10534), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10534)))
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
    var temp__3974__auto____10541 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10541) {
      var s__10542 = temp__3974__auto____10541;
      var fst__10543 = cljs.core.first.call(null, s__10542);
      var fv__10544 = f.call(null, fst__10543);
      var run__10545 = cljs.core.cons.call(null, fst__10543, cljs.core.take_while.call(null, function(p1__10535_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10544, f.call(null, p1__10535_SHARP_))
      }, cljs.core.next.call(null, s__10542)));
      return cljs.core.cons.call(null, run__10545, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10545), s__10542))))
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
      var temp__3971__auto____10560 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10560) {
        var s__10561 = temp__3971__auto____10560;
        return reductions.call(null, f, cljs.core.first.call(null, s__10561), cljs.core.rest.call(null, s__10561))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10562 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10562) {
        var s__10563 = temp__3974__auto____10562;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10563)), cljs.core.rest.call(null, s__10563))
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
      var G__10566 = null;
      var G__10566__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10566__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10566__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10566__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10566__4 = function() {
        var G__10567__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10567 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10567__delegate.call(this, x, y, z, args)
        };
        G__10567.cljs$lang$maxFixedArity = 3;
        G__10567.cljs$lang$applyTo = function(arglist__10568) {
          var x = cljs.core.first(arglist__10568);
          var y = cljs.core.first(cljs.core.next(arglist__10568));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10568)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10568)));
          return G__10567__delegate(x, y, z, args)
        };
        G__10567.cljs$lang$arity$variadic = G__10567__delegate;
        return G__10567
      }();
      G__10566 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10566__0.call(this);
          case 1:
            return G__10566__1.call(this, x);
          case 2:
            return G__10566__2.call(this, x, y);
          case 3:
            return G__10566__3.call(this, x, y, z);
          default:
            return G__10566__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10566.cljs$lang$maxFixedArity = 3;
      G__10566.cljs$lang$applyTo = G__10566__4.cljs$lang$applyTo;
      return G__10566
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10569 = null;
      var G__10569__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10569__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10569__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10569__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10569__4 = function() {
        var G__10570__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10570 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10570__delegate.call(this, x, y, z, args)
        };
        G__10570.cljs$lang$maxFixedArity = 3;
        G__10570.cljs$lang$applyTo = function(arglist__10571) {
          var x = cljs.core.first(arglist__10571);
          var y = cljs.core.first(cljs.core.next(arglist__10571));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10571)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10571)));
          return G__10570__delegate(x, y, z, args)
        };
        G__10570.cljs$lang$arity$variadic = G__10570__delegate;
        return G__10570
      }();
      G__10569 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10569__0.call(this);
          case 1:
            return G__10569__1.call(this, x);
          case 2:
            return G__10569__2.call(this, x, y);
          case 3:
            return G__10569__3.call(this, x, y, z);
          default:
            return G__10569__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10569.cljs$lang$maxFixedArity = 3;
      G__10569.cljs$lang$applyTo = G__10569__4.cljs$lang$applyTo;
      return G__10569
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10572 = null;
      var G__10572__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10572__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10572__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10572__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10572__4 = function() {
        var G__10573__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10573 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10573__delegate.call(this, x, y, z, args)
        };
        G__10573.cljs$lang$maxFixedArity = 3;
        G__10573.cljs$lang$applyTo = function(arglist__10574) {
          var x = cljs.core.first(arglist__10574);
          var y = cljs.core.first(cljs.core.next(arglist__10574));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10574)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10574)));
          return G__10573__delegate(x, y, z, args)
        };
        G__10573.cljs$lang$arity$variadic = G__10573__delegate;
        return G__10573
      }();
      G__10572 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10572__0.call(this);
          case 1:
            return G__10572__1.call(this, x);
          case 2:
            return G__10572__2.call(this, x, y);
          case 3:
            return G__10572__3.call(this, x, y, z);
          default:
            return G__10572__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10572.cljs$lang$maxFixedArity = 3;
      G__10572.cljs$lang$applyTo = G__10572__4.cljs$lang$applyTo;
      return G__10572
    }()
  };
  var juxt__4 = function() {
    var G__10575__delegate = function(f, g, h, fs) {
      var fs__10565 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10576 = null;
        var G__10576__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10546_SHARP_, p2__10547_SHARP_) {
            return cljs.core.conj.call(null, p1__10546_SHARP_, p2__10547_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10565)
        };
        var G__10576__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10548_SHARP_, p2__10549_SHARP_) {
            return cljs.core.conj.call(null, p1__10548_SHARP_, p2__10549_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10565)
        };
        var G__10576__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10550_SHARP_, p2__10551_SHARP_) {
            return cljs.core.conj.call(null, p1__10550_SHARP_, p2__10551_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10565)
        };
        var G__10576__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10552_SHARP_, p2__10553_SHARP_) {
            return cljs.core.conj.call(null, p1__10552_SHARP_, p2__10553_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10565)
        };
        var G__10576__4 = function() {
          var G__10577__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10554_SHARP_, p2__10555_SHARP_) {
              return cljs.core.conj.call(null, p1__10554_SHARP_, cljs.core.apply.call(null, p2__10555_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10565)
          };
          var G__10577 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10577__delegate.call(this, x, y, z, args)
          };
          G__10577.cljs$lang$maxFixedArity = 3;
          G__10577.cljs$lang$applyTo = function(arglist__10578) {
            var x = cljs.core.first(arglist__10578);
            var y = cljs.core.first(cljs.core.next(arglist__10578));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10578)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10578)));
            return G__10577__delegate(x, y, z, args)
          };
          G__10577.cljs$lang$arity$variadic = G__10577__delegate;
          return G__10577
        }();
        G__10576 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10576__0.call(this);
            case 1:
              return G__10576__1.call(this, x);
            case 2:
              return G__10576__2.call(this, x, y);
            case 3:
              return G__10576__3.call(this, x, y, z);
            default:
              return G__10576__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10576.cljs$lang$maxFixedArity = 3;
        G__10576.cljs$lang$applyTo = G__10576__4.cljs$lang$applyTo;
        return G__10576
      }()
    };
    var G__10575 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10575__delegate.call(this, f, g, h, fs)
    };
    G__10575.cljs$lang$maxFixedArity = 3;
    G__10575.cljs$lang$applyTo = function(arglist__10579) {
      var f = cljs.core.first(arglist__10579);
      var g = cljs.core.first(cljs.core.next(arglist__10579));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10579)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10579)));
      return G__10575__delegate(f, g, h, fs)
    };
    G__10575.cljs$lang$arity$variadic = G__10575__delegate;
    return G__10575
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
        var G__10582 = cljs.core.next.call(null, coll);
        coll = G__10582;
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
        var and__3822__auto____10581 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10581) {
          return n > 0
        }else {
          return and__3822__auto____10581
        }
      }())) {
        var G__10583 = n - 1;
        var G__10584 = cljs.core.next.call(null, coll);
        n = G__10583;
        coll = G__10584;
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
  var matches__10586 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10586), s)) {
    if(cljs.core.count.call(null, matches__10586) === 1) {
      return cljs.core.first.call(null, matches__10586)
    }else {
      return cljs.core.vec.call(null, matches__10586)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10588 = re.exec(s);
  if(matches__10588 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10588) === 1) {
      return cljs.core.first.call(null, matches__10588)
    }else {
      return cljs.core.vec.call(null, matches__10588)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10593 = cljs.core.re_find.call(null, re, s);
  var match_idx__10594 = s.search(re);
  var match_str__10595 = cljs.core.coll_QMARK_.call(null, match_data__10593) ? cljs.core.first.call(null, match_data__10593) : match_data__10593;
  var post_match__10596 = cljs.core.subs.call(null, s, match_idx__10594 + cljs.core.count.call(null, match_str__10595));
  if(cljs.core.truth_(match_data__10593)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10593, re_seq.call(null, re, post_match__10596))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10603__10604 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10605 = cljs.core.nth.call(null, vec__10603__10604, 0, null);
  var flags__10606 = cljs.core.nth.call(null, vec__10603__10604, 1, null);
  var pattern__10607 = cljs.core.nth.call(null, vec__10603__10604, 2, null);
  return new RegExp(pattern__10607, flags__10606)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10597_SHARP_) {
    return print_one.call(null, p1__10597_SHARP_, opts)
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
          var and__3822__auto____10617 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10617)) {
            var and__3822__auto____10621 = function() {
              var G__10618__10619 = obj;
              if(G__10618__10619) {
                if(function() {
                  var or__3824__auto____10620 = G__10618__10619.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10620) {
                    return or__3824__auto____10620
                  }else {
                    return G__10618__10619.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10618__10619.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10618__10619)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10618__10619)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10621)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10621
            }
          }else {
            return and__3822__auto____10617
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10622 = !(obj == null);
          if(and__3822__auto____10622) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10622
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10623__10624 = obj;
          if(G__10623__10624) {
            if(function() {
              var or__3824__auto____10625 = G__10623__10624.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10625) {
                return or__3824__auto____10625
              }else {
                return G__10623__10624.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10623__10624.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10623__10624)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10623__10624)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10645 = new goog.string.StringBuffer;
  var G__10646__10647 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10646__10647) {
    var string__10648 = cljs.core.first.call(null, G__10646__10647);
    var G__10646__10649 = G__10646__10647;
    while(true) {
      sb__10645.append(string__10648);
      var temp__3974__auto____10650 = cljs.core.next.call(null, G__10646__10649);
      if(temp__3974__auto____10650) {
        var G__10646__10651 = temp__3974__auto____10650;
        var G__10664 = cljs.core.first.call(null, G__10646__10651);
        var G__10665 = G__10646__10651;
        string__10648 = G__10664;
        G__10646__10649 = G__10665;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10652__10653 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10652__10653) {
    var obj__10654 = cljs.core.first.call(null, G__10652__10653);
    var G__10652__10655 = G__10652__10653;
    while(true) {
      sb__10645.append(" ");
      var G__10656__10657 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10654, opts));
      if(G__10656__10657) {
        var string__10658 = cljs.core.first.call(null, G__10656__10657);
        var G__10656__10659 = G__10656__10657;
        while(true) {
          sb__10645.append(string__10658);
          var temp__3974__auto____10660 = cljs.core.next.call(null, G__10656__10659);
          if(temp__3974__auto____10660) {
            var G__10656__10661 = temp__3974__auto____10660;
            var G__10666 = cljs.core.first.call(null, G__10656__10661);
            var G__10667 = G__10656__10661;
            string__10658 = G__10666;
            G__10656__10659 = G__10667;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10662 = cljs.core.next.call(null, G__10652__10655);
      if(temp__3974__auto____10662) {
        var G__10652__10663 = temp__3974__auto____10662;
        var G__10668 = cljs.core.first.call(null, G__10652__10663);
        var G__10669 = G__10652__10663;
        obj__10654 = G__10668;
        G__10652__10655 = G__10669;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10645
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10671 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10671.append("\n");
  return[cljs.core.str(sb__10671)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10690__10691 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10690__10691) {
    var string__10692 = cljs.core.first.call(null, G__10690__10691);
    var G__10690__10693 = G__10690__10691;
    while(true) {
      cljs.core.string_print.call(null, string__10692);
      var temp__3974__auto____10694 = cljs.core.next.call(null, G__10690__10693);
      if(temp__3974__auto____10694) {
        var G__10690__10695 = temp__3974__auto____10694;
        var G__10708 = cljs.core.first.call(null, G__10690__10695);
        var G__10709 = G__10690__10695;
        string__10692 = G__10708;
        G__10690__10693 = G__10709;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10696__10697 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10696__10697) {
    var obj__10698 = cljs.core.first.call(null, G__10696__10697);
    var G__10696__10699 = G__10696__10697;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10700__10701 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10698, opts));
      if(G__10700__10701) {
        var string__10702 = cljs.core.first.call(null, G__10700__10701);
        var G__10700__10703 = G__10700__10701;
        while(true) {
          cljs.core.string_print.call(null, string__10702);
          var temp__3974__auto____10704 = cljs.core.next.call(null, G__10700__10703);
          if(temp__3974__auto____10704) {
            var G__10700__10705 = temp__3974__auto____10704;
            var G__10710 = cljs.core.first.call(null, G__10700__10705);
            var G__10711 = G__10700__10705;
            string__10702 = G__10710;
            G__10700__10703 = G__10711;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10706 = cljs.core.next.call(null, G__10696__10699);
      if(temp__3974__auto____10706) {
        var G__10696__10707 = temp__3974__auto____10706;
        var G__10712 = cljs.core.first.call(null, G__10696__10707);
        var G__10713 = G__10696__10707;
        obj__10698 = G__10712;
        G__10696__10699 = G__10713;
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
  pr_str.cljs$lang$applyTo = function(arglist__10714) {
    var objs = cljs.core.seq(arglist__10714);
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
  prn_str.cljs$lang$applyTo = function(arglist__10715) {
    var objs = cljs.core.seq(arglist__10715);
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
  pr.cljs$lang$applyTo = function(arglist__10716) {
    var objs = cljs.core.seq(arglist__10716);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__10717) {
    var objs = cljs.core.seq(arglist__10717);
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
  print_str.cljs$lang$applyTo = function(arglist__10718) {
    var objs = cljs.core.seq(arglist__10718);
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
  println.cljs$lang$applyTo = function(arglist__10719) {
    var objs = cljs.core.seq(arglist__10719);
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
  println_str.cljs$lang$applyTo = function(arglist__10720) {
    var objs = cljs.core.seq(arglist__10720);
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
  prn.cljs$lang$applyTo = function(arglist__10721) {
    var objs = cljs.core.seq(arglist__10721);
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
  printf.cljs$lang$applyTo = function(arglist__10722) {
    var fmt = cljs.core.first(arglist__10722);
    var args = cljs.core.rest(arglist__10722);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10723 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10723, "{", ", ", "}", opts, coll)
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
  var pr_pair__10724 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10724, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10725 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10725, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____10726 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10726)) {
        var nspc__10727 = temp__3974__auto____10726;
        return[cljs.core.str(nspc__10727), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10728 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10728)) {
          var nspc__10729 = temp__3974__auto____10728;
          return[cljs.core.str(nspc__10729), cljs.core.str("/")].join("")
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
  var pr_pair__10730 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10730, "{", ", ", "}", opts, coll)
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
  var normalize__10732 = function(n, len) {
    var ns__10731 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10731) < len) {
        var G__10734 = [cljs.core.str("0"), cljs.core.str(ns__10731)].join("");
        ns__10731 = G__10734;
        continue
      }else {
        return ns__10731
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10732.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10732.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10732.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10732.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10732.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10732.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__10733 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10733, "{", ", ", "}", opts, coll)
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
  var this__10735 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10736 = this;
  var G__10737__10738 = cljs.core.seq.call(null, this__10736.watches);
  if(G__10737__10738) {
    var G__10740__10742 = cljs.core.first.call(null, G__10737__10738);
    var vec__10741__10743 = G__10740__10742;
    var key__10744 = cljs.core.nth.call(null, vec__10741__10743, 0, null);
    var f__10745 = cljs.core.nth.call(null, vec__10741__10743, 1, null);
    var G__10737__10746 = G__10737__10738;
    var G__10740__10747 = G__10740__10742;
    var G__10737__10748 = G__10737__10746;
    while(true) {
      var vec__10749__10750 = G__10740__10747;
      var key__10751 = cljs.core.nth.call(null, vec__10749__10750, 0, null);
      var f__10752 = cljs.core.nth.call(null, vec__10749__10750, 1, null);
      var G__10737__10753 = G__10737__10748;
      f__10752.call(null, key__10751, this$, oldval, newval);
      var temp__3974__auto____10754 = cljs.core.next.call(null, G__10737__10753);
      if(temp__3974__auto____10754) {
        var G__10737__10755 = temp__3974__auto____10754;
        var G__10762 = cljs.core.first.call(null, G__10737__10755);
        var G__10763 = G__10737__10755;
        G__10740__10747 = G__10762;
        G__10737__10748 = G__10763;
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
  var this__10756 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10756.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10757 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10757.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10758 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10758.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10759 = this;
  return this__10759.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10760 = this;
  return this__10760.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10761 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10775__delegate = function(x, p__10764) {
      var map__10770__10771 = p__10764;
      var map__10770__10772 = cljs.core.seq_QMARK_.call(null, map__10770__10771) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10770__10771) : map__10770__10771;
      var validator__10773 = cljs.core._lookup.call(null, map__10770__10772, "\ufdd0'validator", null);
      var meta__10774 = cljs.core._lookup.call(null, map__10770__10772, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10774, validator__10773, null)
    };
    var G__10775 = function(x, var_args) {
      var p__10764 = null;
      if(goog.isDef(var_args)) {
        p__10764 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10775__delegate.call(this, x, p__10764)
    };
    G__10775.cljs$lang$maxFixedArity = 1;
    G__10775.cljs$lang$applyTo = function(arglist__10776) {
      var x = cljs.core.first(arglist__10776);
      var p__10764 = cljs.core.rest(arglist__10776);
      return G__10775__delegate(x, p__10764)
    };
    G__10775.cljs$lang$arity$variadic = G__10775__delegate;
    return G__10775
  }();
  atom = function(x, var_args) {
    var p__10764 = var_args;
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
  var temp__3974__auto____10780 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10780)) {
    var validate__10781 = temp__3974__auto____10780;
    if(cljs.core.truth_(validate__10781.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10782 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10782, new_value);
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
    var G__10783__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10783 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10783__delegate.call(this, a, f, x, y, z, more)
    };
    G__10783.cljs$lang$maxFixedArity = 5;
    G__10783.cljs$lang$applyTo = function(arglist__10784) {
      var a = cljs.core.first(arglist__10784);
      var f = cljs.core.first(cljs.core.next(arglist__10784));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10784)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10784))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10784)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10784)))));
      return G__10783__delegate(a, f, x, y, z, more)
    };
    G__10783.cljs$lang$arity$variadic = G__10783__delegate;
    return G__10783
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10785) {
    var iref = cljs.core.first(arglist__10785);
    var f = cljs.core.first(cljs.core.next(arglist__10785));
    var args = cljs.core.rest(cljs.core.next(arglist__10785));
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
  var this__10786 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10786.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10787 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10787.state, function(p__10788) {
    var map__10789__10790 = p__10788;
    var map__10789__10791 = cljs.core.seq_QMARK_.call(null, map__10789__10790) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10789__10790) : map__10789__10790;
    var curr_state__10792 = map__10789__10791;
    var done__10793 = cljs.core._lookup.call(null, map__10789__10791, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10793)) {
      return curr_state__10792
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10787.f.call(null)})
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
    var map__10814__10815 = options;
    var map__10814__10816 = cljs.core.seq_QMARK_.call(null, map__10814__10815) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10814__10815) : map__10814__10815;
    var keywordize_keys__10817 = cljs.core._lookup.call(null, map__10814__10816, "\ufdd0'keywordize-keys", null);
    var keyfn__10818 = cljs.core.truth_(keywordize_keys__10817) ? cljs.core.keyword : cljs.core.str;
    var f__10833 = function thisfn(x) {
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
                var iter__2460__auto____10832 = function iter__10826(s__10827) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10827__10830 = s__10827;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10827__10830)) {
                        var k__10831 = cljs.core.first.call(null, s__10827__10830);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10818.call(null, k__10831), thisfn.call(null, x[k__10831])], true), iter__10826.call(null, cljs.core.rest.call(null, s__10827__10830)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2460__auto____10832.call(null, cljs.core.js_keys.call(null, x))
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
    return f__10833.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10834) {
    var x = cljs.core.first(arglist__10834);
    var options = cljs.core.rest(arglist__10834);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10839 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10843__delegate = function(args) {
      var temp__3971__auto____10840 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10839), args, null);
      if(cljs.core.truth_(temp__3971__auto____10840)) {
        var v__10841 = temp__3971__auto____10840;
        return v__10841
      }else {
        var ret__10842 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10839, cljs.core.assoc, args, ret__10842);
        return ret__10842
      }
    };
    var G__10843 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10843__delegate.call(this, args)
    };
    G__10843.cljs$lang$maxFixedArity = 0;
    G__10843.cljs$lang$applyTo = function(arglist__10844) {
      var args = cljs.core.seq(arglist__10844);
      return G__10843__delegate(args)
    };
    G__10843.cljs$lang$arity$variadic = G__10843__delegate;
    return G__10843
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10846 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10846)) {
        var G__10847 = ret__10846;
        f = G__10847;
        continue
      }else {
        return ret__10846
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10848__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10848 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10848__delegate.call(this, f, args)
    };
    G__10848.cljs$lang$maxFixedArity = 1;
    G__10848.cljs$lang$applyTo = function(arglist__10849) {
      var f = cljs.core.first(arglist__10849);
      var args = cljs.core.rest(arglist__10849);
      return G__10848__delegate(f, args)
    };
    G__10848.cljs$lang$arity$variadic = G__10848__delegate;
    return G__10848
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
    var k__10851 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10851, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10851, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____10860 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10860) {
      return or__3824__auto____10860
    }else {
      var or__3824__auto____10861 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10861) {
        return or__3824__auto____10861
      }else {
        var and__3822__auto____10862 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10862) {
          var and__3822__auto____10863 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10863) {
            var and__3822__auto____10864 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10864) {
              var ret__10865 = true;
              var i__10866 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10867 = cljs.core.not.call(null, ret__10865);
                  if(or__3824__auto____10867) {
                    return or__3824__auto____10867
                  }else {
                    return i__10866 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10865
                }else {
                  var G__10868 = isa_QMARK_.call(null, h, child.call(null, i__10866), parent.call(null, i__10866));
                  var G__10869 = i__10866 + 1;
                  ret__10865 = G__10868;
                  i__10866 = G__10869;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10864
            }
          }else {
            return and__3822__auto____10863
          }
        }else {
          return and__3822__auto____10862
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
    var tp__10878 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10879 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10880 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10881 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10882 = cljs.core.contains_QMARK_.call(null, tp__10878.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10880.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10880.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10878, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10881.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10879, parent, ta__10880), "\ufdd0'descendants":tf__10881.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10880, tag, td__10879)})
    }();
    if(cljs.core.truth_(or__3824__auto____10882)) {
      return or__3824__auto____10882
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
    var parentMap__10887 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10888 = cljs.core.truth_(parentMap__10887.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10887.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10889 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10888)) ? cljs.core.assoc.call(null, parentMap__10887, tag, childsParents__10888) : cljs.core.dissoc.call(null, parentMap__10887, tag);
    var deriv_seq__10890 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10870_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10870_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10870_SHARP_), cljs.core.second.call(null, p1__10870_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10889)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10887.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10871_SHARP_, p2__10872_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10871_SHARP_, p2__10872_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10890))
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
  var xprefs__10898 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10900 = cljs.core.truth_(function() {
    var and__3822__auto____10899 = xprefs__10898;
    if(cljs.core.truth_(and__3822__auto____10899)) {
      return xprefs__10898.call(null, y)
    }else {
      return and__3822__auto____10899
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10900)) {
    return or__3824__auto____10900
  }else {
    var or__3824__auto____10902 = function() {
      var ps__10901 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10901) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10901), prefer_table))) {
          }else {
          }
          var G__10905 = cljs.core.rest.call(null, ps__10901);
          ps__10901 = G__10905;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10902)) {
      return or__3824__auto____10902
    }else {
      var or__3824__auto____10904 = function() {
        var ps__10903 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10903) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10903), y, prefer_table))) {
            }else {
            }
            var G__10906 = cljs.core.rest.call(null, ps__10903);
            ps__10903 = G__10906;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10904)) {
        return or__3824__auto____10904
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10908 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10908)) {
    return or__3824__auto____10908
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10926 = cljs.core.reduce.call(null, function(be, p__10918) {
    var vec__10919__10920 = p__10918;
    var k__10921 = cljs.core.nth.call(null, vec__10919__10920, 0, null);
    var ___10922 = cljs.core.nth.call(null, vec__10919__10920, 1, null);
    var e__10923 = vec__10919__10920;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10921)) {
      var be2__10925 = cljs.core.truth_(function() {
        var or__3824__auto____10924 = be == null;
        if(or__3824__auto____10924) {
          return or__3824__auto____10924
        }else {
          return cljs.core.dominates.call(null, k__10921, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10923 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10925), k__10921, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10921), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10925)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10925
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10926)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10926));
      return cljs.core.second.call(null, best_entry__10926)
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
    var and__3822__auto____10931 = mf;
    if(and__3822__auto____10931) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10931
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2361__auto____10932 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10933 = cljs.core._reset[goog.typeOf(x__2361__auto____10932)];
      if(or__3824__auto____10933) {
        return or__3824__auto____10933
      }else {
        var or__3824__auto____10934 = cljs.core._reset["_"];
        if(or__3824__auto____10934) {
          return or__3824__auto____10934
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10939 = mf;
    if(and__3822__auto____10939) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10939
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2361__auto____10940 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10941 = cljs.core._add_method[goog.typeOf(x__2361__auto____10940)];
      if(or__3824__auto____10941) {
        return or__3824__auto____10941
      }else {
        var or__3824__auto____10942 = cljs.core._add_method["_"];
        if(or__3824__auto____10942) {
          return or__3824__auto____10942
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10947 = mf;
    if(and__3822__auto____10947) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10947
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2361__auto____10948 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10949 = cljs.core._remove_method[goog.typeOf(x__2361__auto____10948)];
      if(or__3824__auto____10949) {
        return or__3824__auto____10949
      }else {
        var or__3824__auto____10950 = cljs.core._remove_method["_"];
        if(or__3824__auto____10950) {
          return or__3824__auto____10950
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10955 = mf;
    if(and__3822__auto____10955) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10955
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2361__auto____10956 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10957 = cljs.core._prefer_method[goog.typeOf(x__2361__auto____10956)];
      if(or__3824__auto____10957) {
        return or__3824__auto____10957
      }else {
        var or__3824__auto____10958 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10958) {
          return or__3824__auto____10958
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10963 = mf;
    if(and__3822__auto____10963) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10963
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2361__auto____10964 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10965 = cljs.core._get_method[goog.typeOf(x__2361__auto____10964)];
      if(or__3824__auto____10965) {
        return or__3824__auto____10965
      }else {
        var or__3824__auto____10966 = cljs.core._get_method["_"];
        if(or__3824__auto____10966) {
          return or__3824__auto____10966
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10971 = mf;
    if(and__3822__auto____10971) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10971
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2361__auto____10972 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10973 = cljs.core._methods[goog.typeOf(x__2361__auto____10972)];
      if(or__3824__auto____10973) {
        return or__3824__auto____10973
      }else {
        var or__3824__auto____10974 = cljs.core._methods["_"];
        if(or__3824__auto____10974) {
          return or__3824__auto____10974
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10979 = mf;
    if(and__3822__auto____10979) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10979
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2361__auto____10980 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10981 = cljs.core._prefers[goog.typeOf(x__2361__auto____10980)];
      if(or__3824__auto____10981) {
        return or__3824__auto____10981
      }else {
        var or__3824__auto____10982 = cljs.core._prefers["_"];
        if(or__3824__auto____10982) {
          return or__3824__auto____10982
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10987 = mf;
    if(and__3822__auto____10987) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10987
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2361__auto____10988 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10989 = cljs.core._dispatch[goog.typeOf(x__2361__auto____10988)];
      if(or__3824__auto____10989) {
        return or__3824__auto____10989
      }else {
        var or__3824__auto____10990 = cljs.core._dispatch["_"];
        if(or__3824__auto____10990) {
          return or__3824__auto____10990
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10993 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10994 = cljs.core._get_method.call(null, mf, dispatch_val__10993);
  if(cljs.core.truth_(target_fn__10994)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10993)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10994, args)
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
  var this__10995 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10996 = this;
  cljs.core.swap_BANG_.call(null, this__10996.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10996.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10996.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10996.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10997 = this;
  cljs.core.swap_BANG_.call(null, this__10997.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10997.method_cache, this__10997.method_table, this__10997.cached_hierarchy, this__10997.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10998 = this;
  cljs.core.swap_BANG_.call(null, this__10998.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10998.method_cache, this__10998.method_table, this__10998.cached_hierarchy, this__10998.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10999 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10999.cached_hierarchy), cljs.core.deref.call(null, this__10999.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10999.method_cache, this__10999.method_table, this__10999.cached_hierarchy, this__10999.hierarchy)
  }
  var temp__3971__auto____11000 = cljs.core.deref.call(null, this__10999.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____11000)) {
    var target_fn__11001 = temp__3971__auto____11000;
    return target_fn__11001
  }else {
    var temp__3971__auto____11002 = cljs.core.find_and_cache_best_method.call(null, this__10999.name, dispatch_val, this__10999.hierarchy, this__10999.method_table, this__10999.prefer_table, this__10999.method_cache, this__10999.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____11002)) {
      var target_fn__11003 = temp__3971__auto____11002;
      return target_fn__11003
    }else {
      return cljs.core.deref.call(null, this__10999.method_table).call(null, this__10999.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__11004 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__11004.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__11004.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__11004.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__11004.method_cache, this__11004.method_table, this__11004.cached_hierarchy, this__11004.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__11005 = this;
  return cljs.core.deref.call(null, this__11005.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__11006 = this;
  return cljs.core.deref.call(null, this__11006.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__11007 = this;
  return cljs.core.do_dispatch.call(null, mf, this__11007.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__11009__delegate = function(_, args) {
    var self__11008 = this;
    return cljs.core._dispatch.call(null, self__11008, args)
  };
  var G__11009 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__11009__delegate.call(this, _, args)
  };
  G__11009.cljs$lang$maxFixedArity = 1;
  G__11009.cljs$lang$applyTo = function(arglist__11010) {
    var _ = cljs.core.first(arglist__11010);
    var args = cljs.core.rest(arglist__11010);
    return G__11009__delegate(_, args)
  };
  G__11009.cljs$lang$arity$variadic = G__11009__delegate;
  return G__11009
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__11011 = this;
  return cljs.core._dispatch.call(null, self__11011, args)
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
  var this__11012 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_11014, _) {
  var this__11013 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__11013.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__11015 = this;
  var and__3822__auto____11016 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____11016) {
    return this__11015.uuid === other.uuid
  }else {
    return and__3822__auto____11016
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__11017 = this;
  var this__11018 = this;
  return cljs.core.pr_str.call(null, this__11018)
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
      var s__11175 = s;
      var limit__11176 = limit;
      var parts__11177 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__11176, 1)) {
          return cljs.core.conj.call(null, parts__11177, s__11175)
        }else {
          var temp__3971__auto____11178 = cljs.core.re_find.call(null, re, s__11175);
          if(cljs.core.truth_(temp__3971__auto____11178)) {
            var m__11179 = temp__3971__auto____11178;
            var index__11180 = s__11175.indexOf(m__11179);
            var G__11181 = s__11175.substring(index__11180 + cljs.core.count.call(null, m__11179));
            var G__11182 = limit__11176 - 1;
            var G__11183 = cljs.core.conj.call(null, parts__11177, s__11175.substring(0, index__11180));
            s__11175 = G__11181;
            limit__11176 = G__11182;
            parts__11177 = G__11183;
            continue
          }else {
            return cljs.core.conj.call(null, parts__11177, s__11175)
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
  var index__11187 = s.length;
  while(true) {
    if(index__11187 === 0) {
      return""
    }else {
      var ch__11188 = cljs.core._lookup.call(null, s, index__11187 - 1, null);
      if(function() {
        var or__3824__auto____11189 = cljs.core._EQ_.call(null, ch__11188, "\n");
        if(or__3824__auto____11189) {
          return or__3824__auto____11189
        }else {
          return cljs.core._EQ_.call(null, ch__11188, "\r")
        }
      }()) {
        var G__11190 = index__11187 - 1;
        index__11187 = G__11190;
        continue
      }else {
        return s.substring(0, index__11187)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__11194 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____11195 = cljs.core.not.call(null, s__11194);
    if(or__3824__auto____11195) {
      return or__3824__auto____11195
    }else {
      var or__3824__auto____11196 = cljs.core._EQ_.call(null, "", s__11194);
      if(or__3824__auto____11196) {
        return or__3824__auto____11196
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__11194)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__11203 = new goog.string.StringBuffer;
  var length__11204 = s.length;
  var index__11205 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__11204, index__11205)) {
      return buffer__11203.toString()
    }else {
      var ch__11206 = s.charAt(index__11205);
      var temp__3971__auto____11207 = cljs.core._lookup.call(null, cmap, ch__11206, null);
      if(cljs.core.truth_(temp__3971__auto____11207)) {
        var replacement__11208 = temp__3971__auto____11207;
        buffer__11203.append([cljs.core.str(replacement__11208)].join(""))
      }else {
        buffer__11203.append(ch__11206)
      }
      var G__11209 = index__11205 + 1;
      index__11205 = G__11209;
      continue
    }
    break
  }
};
goog.provide("dommy.attrs");
goog.require("cljs.core");
goog.require("clojure.string");
dommy.attrs.class_match_QMARK_ = function class_match_QMARK_(class_name, class$, idx) {
  var and__3822__auto____11216 = function() {
    var or__3824__auto____11215 = idx === 0;
    if(or__3824__auto____11215) {
      return or__3824__auto____11215
    }else {
      return" " === class_name.charAt(idx - 1)
    }
  }();
  if(cljs.core.truth_(and__3822__auto____11216)) {
    var total_len__11217 = class_name.length;
    var stop__11218 = idx + class$.length;
    if(stop__11218 <= total_len__11217) {
      var or__3824__auto____11219 = stop__11218 === total_len__11217;
      if(or__3824__auto____11219) {
        return or__3824__auto____11219
      }else {
        return" " === class_name.charAt(stop__11218)
      }
    }else {
      return null
    }
  }else {
    return and__3822__auto____11216
  }
};
dommy.attrs.class_index = function class_index(class_name, class$) {
  var start_from__11222 = 0;
  while(true) {
    var i__11223 = class_name.indexOf(class$, start_from__11222);
    if(i__11223 >= 0) {
      if(cljs.core.truth_(dommy.attrs.class_match_QMARK_.call(null, class_name, class$, i__11223))) {
        return i__11223
      }else {
        var G__11224 = i__11223 + class$.length;
        start_from__11222 = G__11224;
        continue
      }
    }else {
      return null
    }
    break
  }
};
dommy.attrs.has_class_QMARK_ = function has_class_QMARK_(elem, class$) {
  var elem__11232 = dommy.template.__GT_node_like.call(null, elem);
  var temp__3971__auto____11233 = elem__11232.classList;
  if(cljs.core.truth_(temp__3971__auto____11233)) {
    var class_list__11234 = temp__3971__auto____11233;
    return class_list__11234.contains(class$)
  }else {
    var temp__3974__auto____11235 = elem__11232.className;
    if(cljs.core.truth_(temp__3974__auto____11235)) {
      var class_name__11236 = temp__3974__auto____11235;
      var temp__3974__auto____11237 = dommy.attrs.class_index.call(null, class_name__11236, class$);
      if(cljs.core.truth_(temp__3974__auto____11237)) {
        var i__11238 = temp__3974__auto____11237;
        return i__11238 >= 0
      }else {
        return null
      }
    }else {
      return null
    }
  }
};
dommy.attrs.add_class_BANG_ = function add_class_BANG_(elem, classes) {
  var elem__11256 = dommy.template.__GT_node_like.call(null, elem);
  var classes__11257 = clojure.string.trim.call(null, classes);
  if(cljs.core.seq.call(null, classes__11257)) {
    var temp__3971__auto____11258 = elem__11256.classList;
    if(cljs.core.truth_(temp__3971__auto____11258)) {
      var class_list__11259 = temp__3971__auto____11258;
      var G__11260__11261 = cljs.core.seq.call(null, classes__11257.split(/\s+/));
      if(G__11260__11261) {
        var class__11262 = cljs.core.first.call(null, G__11260__11261);
        var G__11260__11263 = G__11260__11261;
        while(true) {
          class_list__11259.add(class__11262);
          var temp__3974__auto____11264 = cljs.core.next.call(null, G__11260__11263);
          if(temp__3974__auto____11264) {
            var G__11260__11265 = temp__3974__auto____11264;
            var G__11273 = cljs.core.first.call(null, G__11260__11265);
            var G__11274 = G__11260__11265;
            class__11262 = G__11273;
            G__11260__11263 = G__11274;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }else {
      var class_name__11266 = elem__11256.className;
      var G__11267__11268 = cljs.core.seq.call(null, classes__11257.split(/\s+/));
      if(G__11267__11268) {
        var class__11269 = cljs.core.first.call(null, G__11267__11268);
        var G__11267__11270 = G__11267__11268;
        while(true) {
          if(cljs.core.truth_(dommy.attrs.class_index.call(null, class_name__11266, class__11269))) {
          }else {
            elem__11256.className = class_name__11266 === "" ? class__11269 : [cljs.core.str(class_name__11266), cljs.core.str(" "), cljs.core.str(class__11269)].join("")
          }
          var temp__3974__auto____11271 = cljs.core.next.call(null, G__11267__11270);
          if(temp__3974__auto____11271) {
            var G__11267__11272 = temp__3974__auto____11271;
            var G__11275 = cljs.core.first.call(null, G__11267__11272);
            var G__11276 = G__11267__11272;
            class__11269 = G__11275;
            G__11267__11270 = G__11276;
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
  return elem__11256
};
dommy.attrs.remove_class_str = function remove_class_str(init_class_name, class$) {
  var class_name__11282 = init_class_name;
  while(true) {
    var class_len__11283 = class_name__11282.length;
    var temp__3971__auto____11284 = dommy.attrs.class_index.call(null, class_name__11282, class$);
    if(cljs.core.truth_(temp__3971__auto____11284)) {
      var i__11285 = temp__3971__auto____11284;
      var G__11287 = function() {
        var end__11286 = i__11285 + class$.length;
        return[cljs.core.str(end__11286 < class_len__11283 ? [cljs.core.str(class_name__11282.substring(0, i__11285)), cljs.core.str(class_name__11282.substr(end__11286 + 1))].join("") : class_name__11282.substring(0, i__11285 - 1))].join("")
      }();
      class_name__11282 = G__11287;
      continue
    }else {
      return class_name__11282
    }
    break
  }
};
dommy.attrs.remove_class_BANG_ = function remove_class_BANG_(elem, class$) {
  var elem__11293 = dommy.template.__GT_node_like.call(null, elem);
  var temp__3971__auto____11294 = elem__11293.classList;
  if(cljs.core.truth_(temp__3971__auto____11294)) {
    var class_list__11295 = temp__3971__auto____11294;
    class_list__11295.remove(class$)
  }else {
    var class_name__11296 = elem__11293.className;
    var new_class_name__11297 = dommy.attrs.remove_class_str.call(null, class_name__11296, cljs.core.name.call(null, class$));
    if(class_name__11296 === new_class_name__11297) {
    }else {
      elem__11293.className = new_class_name__11297
    }
  }
  return elem__11293
};
dommy.attrs.toggle_class_BANG_ = function() {
  var toggle_class_BANG_ = null;
  var toggle_class_BANG___2 = function(elem, class$) {
    var elem__11302 = dommy.template.__GT_node_like.call(null, elem);
    var temp__3971__auto____11303 = elem__11302.classList;
    if(cljs.core.truth_(temp__3971__auto____11303)) {
      var class_list__11304 = temp__3971__auto____11303;
      class_list__11304.toggle(class$)
    }else {
      toggle_class_BANG_.call(null, elem__11302, class$, cljs.core.not.call(null, dommy.attrs.has_class_QMARK_.call(null, elem__11302, class$)))
    }
    return elem__11302
  };
  var toggle_class_BANG___3 = function(elem, class$, add_QMARK_) {
    var elem__11305 = dommy.template.__GT_node_like.call(null, elem);
    if(cljs.core.truth_(add_QMARK_)) {
      dommy.attrs.add_class_BANG_.call(null, elem__11305, class$)
    }else {
      dommy.attrs.remove_class_BANG_.call(null, elem__11305, class$)
    }
    return elem__11305
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
  return clojure.string.join.call(null, " ", cljs.core.map.call(null, function(p__11311) {
    var vec__11312__11313 = p__11311;
    var k__11314 = cljs.core.nth.call(null, vec__11312__11313, 0, null);
    var v__11315 = cljs.core.nth.call(null, vec__11312__11313, 1, null);
    return[cljs.core.str(cljs.core.name.call(null, k__11314)), cljs.core.str(":"), cljs.core.str(cljs.core.name.call(null, v__11315)), cljs.core.str(";")].join("")
  }, m))
};
dommy.attrs.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(elem, kvs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'even?", cljs.core.with_meta(cljs.core.list("\ufdd1'count", "\ufdd1'kvs"), cljs.core.hash_map("\ufdd0'line", 107))), cljs.core.hash_map("\ufdd0'line", 107))))].join(""));
    }
    var elem__11337 = dommy.template.__GT_node_like.call(null, elem);
    var style__11338 = elem__11337.style;
    var G__11339__11340 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, kvs));
    if(G__11339__11340) {
      var G__11342__11344 = cljs.core.first.call(null, G__11339__11340);
      var vec__11343__11345 = G__11342__11344;
      var k__11346 = cljs.core.nth.call(null, vec__11343__11345, 0, null);
      var v__11347 = cljs.core.nth.call(null, vec__11343__11345, 1, null);
      var G__11339__11348 = G__11339__11340;
      var G__11342__11349 = G__11342__11344;
      var G__11339__11350 = G__11339__11348;
      while(true) {
        var vec__11351__11352 = G__11342__11349;
        var k__11353 = cljs.core.nth.call(null, vec__11351__11352, 0, null);
        var v__11354 = cljs.core.nth.call(null, vec__11351__11352, 1, null);
        var G__11339__11355 = G__11339__11350;
        style__11338[cljs.core.name.call(null, k__11353)] = v__11354;
        var temp__3974__auto____11356 = cljs.core.next.call(null, G__11339__11355);
        if(temp__3974__auto____11356) {
          var G__11339__11357 = temp__3974__auto____11356;
          var G__11358 = cljs.core.first.call(null, G__11339__11357);
          var G__11359 = G__11339__11357;
          G__11342__11349 = G__11358;
          G__11339__11350 = G__11359;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return elem__11337
  };
  var set_style_BANG_ = function(elem, var_args) {
    var kvs = null;
    if(goog.isDef(var_args)) {
      kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return set_style_BANG___delegate.call(this, elem, kvs)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 1;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__11360) {
    var elem = cljs.core.first(arglist__11360);
    var kvs = cljs.core.rest(arglist__11360);
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
    var elem__11381 = dommy.template.__GT_node_like.call(null, elem);
    var G__11382__11383 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, kvs));
    if(G__11382__11383) {
      var G__11385__11387 = cljs.core.first.call(null, G__11382__11383);
      var vec__11386__11388 = G__11385__11387;
      var k__11389 = cljs.core.nth.call(null, vec__11386__11388, 0, null);
      var v__11390 = cljs.core.nth.call(null, vec__11386__11388, 1, null);
      var G__11382__11391 = G__11382__11383;
      var G__11385__11392 = G__11385__11387;
      var G__11382__11393 = G__11382__11391;
      while(true) {
        var vec__11394__11395 = G__11385__11392;
        var k__11396 = cljs.core.nth.call(null, vec__11394__11395, 0, null);
        var v__11397 = cljs.core.nth.call(null, vec__11394__11395, 1, null);
        var G__11382__11398 = G__11382__11393;
        dommy.attrs.set_style_BANG_.call(null, elem__11381, k__11396, [cljs.core.str(v__11397), cljs.core.str("px")].join(""));
        var temp__3974__auto____11399 = cljs.core.next.call(null, G__11382__11398);
        if(temp__3974__auto____11399) {
          var G__11382__11400 = temp__3974__auto____11399;
          var G__11401 = cljs.core.first.call(null, G__11382__11400);
          var G__11402 = G__11382__11400;
          G__11385__11392 = G__11401;
          G__11382__11393 = G__11402;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return elem__11381
  };
  var set_px_BANG_ = function(elem, var_args) {
    var kvs = null;
    if(goog.isDef(var_args)) {
      kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return set_px_BANG___delegate.call(this, elem, kvs)
  };
  set_px_BANG_.cljs$lang$maxFixedArity = 1;
  set_px_BANG_.cljs$lang$applyTo = function(arglist__11403) {
    var elem = cljs.core.first(arglist__11403);
    var kvs = cljs.core.rest(arglist__11403);
    return set_px_BANG___delegate(elem, kvs)
  };
  set_px_BANG_.cljs$lang$arity$variadic = set_px_BANG___delegate;
  return set_px_BANG_
}();
dommy.attrs.px = function px(elem, k) {
  var pixels__11405 = dommy.attrs.style.call(null, dommy.template.__GT_node_like.call(null, elem), k);
  if(cljs.core.seq.call(null, pixels__11405)) {
    return parseInt(pixels__11405)
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
      var G__11428__11429 = dommy.template.__GT_node_like.call(null, elem);
      G__11428__11429.setAttribute(cljs.core.name.call(null, k), k === "\ufdd0'style" ? dommy.attrs.style_str.call(null, v) : v);
      return G__11428__11429
    }else {
      return null
    }
  };
  var set_attr_BANG___4 = function() {
    var G__11450__delegate = function(elem, k, v, kvs) {
      if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
      }else {
        throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'even?", cljs.core.with_meta(cljs.core.list("\ufdd1'count", "\ufdd1'kvs"), cljs.core.hash_map("\ufdd0'line", 150))), cljs.core.hash_map("\ufdd0'line", 150))))].join(""));
      }
      var elem__11430 = dommy.template.__GT_node_like.call(null, elem);
      var G__11431__11432 = cljs.core.seq.call(null, cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([k, v], true), cljs.core.partition.call(null, 2, kvs)));
      if(G__11431__11432) {
        var G__11434__11436 = cljs.core.first.call(null, G__11431__11432);
        var vec__11435__11437 = G__11434__11436;
        var k__11438 = cljs.core.nth.call(null, vec__11435__11437, 0, null);
        var v__11439 = cljs.core.nth.call(null, vec__11435__11437, 1, null);
        var G__11431__11440 = G__11431__11432;
        var G__11434__11441 = G__11434__11436;
        var G__11431__11442 = G__11431__11440;
        while(true) {
          var vec__11443__11444 = G__11434__11441;
          var k__11445 = cljs.core.nth.call(null, vec__11443__11444, 0, null);
          var v__11446 = cljs.core.nth.call(null, vec__11443__11444, 1, null);
          var G__11431__11447 = G__11431__11442;
          set_attr_BANG_.call(null, elem__11430, k__11445, v__11446);
          var temp__3974__auto____11448 = cljs.core.next.call(null, G__11431__11447);
          if(temp__3974__auto____11448) {
            var G__11431__11449 = temp__3974__auto____11448;
            var G__11451 = cljs.core.first.call(null, G__11431__11449);
            var G__11452 = G__11431__11449;
            G__11434__11441 = G__11451;
            G__11431__11442 = G__11452;
            continue
          }else {
          }
          break
        }
      }else {
      }
      return elem__11430
    };
    var G__11450 = function(elem, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11450__delegate.call(this, elem, k, v, kvs)
    };
    G__11450.cljs$lang$maxFixedArity = 3;
    G__11450.cljs$lang$applyTo = function(arglist__11453) {
      var elem = cljs.core.first(arglist__11453);
      var k = cljs.core.first(cljs.core.next(arglist__11453));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11453)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11453)));
      return G__11450__delegate(elem, k, v, kvs)
    };
    G__11450.cljs$lang$arity$variadic = G__11450__delegate;
    return G__11450
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
    var elem__11462 = dommy.template.__GT_node_like.call(null, elem);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray(["\ufdd0'class", "\ufdd0'classes"]).call(null, k))) {
      elem__11462.className = ""
    }else {
      elem__11462.removeAttribute(cljs.core.name.call(null, k))
    }
    return elem__11462
  };
  var remove_attr_BANG___3 = function() {
    var G__11470__delegate = function(elem, k, ks) {
      var elem__11463 = dommy.template.__GT_node_like.call(null, elem);
      var G__11464__11465 = cljs.core.seq.call(null, cljs.core.cons.call(null, k, ks));
      if(G__11464__11465) {
        var k__11466 = cljs.core.first.call(null, G__11464__11465);
        var G__11464__11467 = G__11464__11465;
        while(true) {
          remove_attr_BANG_.call(null, elem__11463, k__11466);
          var temp__3974__auto____11468 = cljs.core.next.call(null, G__11464__11467);
          if(temp__3974__auto____11468) {
            var G__11464__11469 = temp__3974__auto____11468;
            var G__11471 = cljs.core.first.call(null, G__11464__11469);
            var G__11472 = G__11464__11469;
            k__11466 = G__11471;
            G__11464__11467 = G__11472;
            continue
          }else {
          }
          break
        }
      }else {
      }
      return elem__11463
    };
    var G__11470 = function(elem, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11470__delegate.call(this, elem, k, ks)
    };
    G__11470.cljs$lang$maxFixedArity = 2;
    G__11470.cljs$lang$applyTo = function(arglist__11473) {
      var elem = cljs.core.first(arglist__11473);
      var k = cljs.core.first(cljs.core.next(arglist__11473));
      var ks = cljs.core.rest(cljs.core.next(arglist__11473));
      return G__11470__delegate(elem, k, ks)
    };
    G__11470.cljs$lang$arity$variadic = G__11470__delegate;
    return G__11470
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
    var elem__11479 = dommy.template.__GT_node_like.call(null, elem);
    toggle_BANG_.call(null, elem__11479, dommy.attrs.hidden_QMARK_.call(null, elem__11479));
    return elem__11479
  };
  var toggle_BANG___2 = function(elem, show_QMARK_) {
    var G__11477__11478 = dommy.template.__GT_node_like.call(null, elem);
    G__11477__11478.style.display = cljs.core.truth_(show_QMARK_) ? "" : "none";
    return G__11477__11478
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
    var and__3822__auto____7065 = this$;
    if(and__3822__auto____7065) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____7065
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2361__auto____7066 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7067 = clojure.browser.event.event_types[goog.typeOf(x__2361__auto____7066)];
      if(or__3824__auto____7067) {
        return or__3824__auto____7067
      }else {
        var or__3824__auto____7068 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____7068) {
          return or__3824__auto____7068
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__7069) {
    var vec__7070__7071 = p__7069;
    var k__7072 = cljs.core.nth.call(null, vec__7070__7071, 0, null);
    var v__7073 = cljs.core.nth.call(null, vec__7070__7071, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__7072.toLowerCase()), v__7073], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__7074) {
    var vec__7075__7076 = p__7074;
    var k__7077 = cljs.core.nth.call(null, vec__7075__7076, 0, null);
    var v__7078 = cljs.core.nth.call(null, vec__7075__7076, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__7077.toLowerCase()), v__7078], true)
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
    var and__3822__auto____11023 = this$;
    if(and__3822__auto____11023) {
      return this$.dommy$template$PElement$_elem$arity$1
    }else {
      return and__3822__auto____11023
    }
  }()) {
    return this$.dommy$template$PElement$_elem$arity$1(this$)
  }else {
    var x__2361__auto____11024 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11025 = dommy.template._elem[goog.typeOf(x__2361__auto____11024)];
      if(or__3824__auto____11025) {
        return or__3824__auto____11025
      }else {
        var or__3824__auto____11026 = dommy.template._elem["_"];
        if(or__3824__auto____11026) {
          return or__3824__auto____11026
        }else {
          throw cljs.core.missing_protocol.call(null, "PElement.-elem", this$);
        }
      }
    }().call(null, this$)
  }
};
dommy.template.next_css_index = function next_css_index(s, start_idx) {
  var id_idx__11030 = s.indexOf("#", start_idx);
  var class_idx__11031 = s.indexOf(".", start_idx);
  var idx__11032 = Math.min(id_idx__11030, class_idx__11031);
  if(idx__11032 < 0) {
    return Math.max(id_idx__11030, class_idx__11031)
  }else {
    return idx__11032
  }
};
dommy.template.base_element = function base_element(node_key) {
  var node_str__11042 = cljs.core.name.call(null, node_key);
  var base_idx__11043 = dommy.template.next_css_index.call(null, node_str__11042, 0);
  var tag__11044 = base_idx__11043 > 0 ? node_str__11042.substring(0, base_idx__11043) : base_idx__11043 === 0 ? "div" : "\ufdd0'else" ? node_str__11042 : null;
  var node__11045 = document.createElement(tag__11044);
  if(base_idx__11043 >= 0) {
    var str__11046 = node_str__11042.substring(base_idx__11043);
    while(true) {
      var next_idx__11047 = dommy.template.next_css_index.call(null, str__11046, 1);
      var frag__11048 = next_idx__11047 >= 0 ? str__11046.substring(0, next_idx__11047) : str__11046;
      var G__11049__11050 = frag__11048.charAt(0);
      if(cljs.core._EQ_.call(null, "#", G__11049__11050)) {
        node__11045.setAttribute("id", frag__11048.substring(1))
      }else {
        if(cljs.core._EQ_.call(null, ".", G__11049__11050)) {
          dommy.attrs.add_class_BANG_.call(null, node__11045, frag__11048.substring(1))
        }else {
          if("\ufdd0'else") {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(frag__11048.charAt(0))].join(""));
          }else {
          }
        }
      }
      if(next_idx__11047 >= 0) {
        var G__11051 = str__11046.substring(next_idx__11047);
        str__11046 = G__11051;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return node__11045
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
      var G__11061__11062 = data;
      if(G__11061__11062) {
        if(cljs.core.truth_(function() {
          var or__3824__auto____11063 = null;
          if(cljs.core.truth_(or__3824__auto____11063)) {
            return or__3824__auto____11063
          }else {
            return G__11061__11062.dommy$template$PElement$
          }
        }())) {
          return true
        }else {
          if(!G__11061__11062.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11061__11062)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11061__11062)
      }
    }()) {
      result_frag.appendChild(dommy.template._elem.call(null, data));
      return result_frag
    }else {
      if(cljs.core.seq_QMARK_.call(null, data)) {
        var G__11064__11065 = cljs.core.seq.call(null, data);
        if(G__11064__11065) {
          var child__11066 = cljs.core.first.call(null, G__11064__11065);
          var G__11064__11067 = G__11064__11065;
          while(true) {
            __GT_document_fragment.call(null, result_frag, child__11066);
            var temp__3974__auto____11068 = cljs.core.next.call(null, G__11064__11067);
            if(temp__3974__auto____11068) {
              var G__11064__11069 = temp__3974__auto____11068;
              var G__11070 = cljs.core.first.call(null, G__11064__11069);
              var G__11071 = G__11064__11069;
              child__11066 = G__11070;
              G__11064__11067 = G__11071;
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
    var G__11075__11076 = data;
    if(G__11075__11076) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____11077 = null;
        if(cljs.core.truth_(or__3824__auto____11077)) {
          return or__3824__auto____11077
        }else {
          return G__11075__11076.dommy$template$PElement$
        }
      }())) {
        return true
      }else {
        if(!G__11075__11076.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11075__11076)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11075__11076)
    }
  }()) {
    return dommy.template._elem.call(null, data)
  }else {
    return dommy.template.__GT_document_fragment.call(null, data)
  }
};
dommy.template.compound_element = function compound_element(p__11078) {
  var vec__11118__11119 = p__11078;
  var tag_name__11120 = cljs.core.nth.call(null, vec__11118__11119, 0, null);
  var maybe_attrs__11121 = cljs.core.nth.call(null, vec__11118__11119, 1, null);
  var children__11122 = cljs.core.nthnext.call(null, vec__11118__11119, 2);
  var n__11123 = dommy.template.base_element.call(null, tag_name__11120);
  var attrs__11128 = function() {
    var and__3822__auto____11124 = cljs.core.map_QMARK_.call(null, maybe_attrs__11121);
    if(and__3822__auto____11124) {
      return!function() {
        var G__11125__11126 = maybe_attrs__11121;
        if(G__11125__11126) {
          if(cljs.core.truth_(function() {
            var or__3824__auto____11127 = null;
            if(cljs.core.truth_(or__3824__auto____11127)) {
              return or__3824__auto____11127
            }else {
              return G__11125__11126.dommy$template$PElement$
            }
          }())) {
            return true
          }else {
            if(!G__11125__11126.cljs$lang$protocol_mask$partition$) {
              return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11125__11126)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11125__11126)
        }
      }()
    }else {
      return and__3822__auto____11124
    }
  }() ? maybe_attrs__11121 : null;
  var children__11129 = cljs.core.truth_(attrs__11128) ? children__11122 : cljs.core.cons.call(null, maybe_attrs__11121, children__11122);
  var G__11130__11131 = cljs.core.seq.call(null, attrs__11128);
  if(G__11130__11131) {
    var G__11133__11135 = cljs.core.first.call(null, G__11130__11131);
    var vec__11134__11136 = G__11133__11135;
    var k__11137 = cljs.core.nth.call(null, vec__11134__11136, 0, null);
    var v__11138 = cljs.core.nth.call(null, vec__11134__11136, 1, null);
    var G__11130__11139 = G__11130__11131;
    var G__11133__11140 = G__11133__11135;
    var G__11130__11141 = G__11130__11139;
    while(true) {
      var vec__11142__11143 = G__11133__11140;
      var k__11144 = cljs.core.nth.call(null, vec__11142__11143, 0, null);
      var v__11145 = cljs.core.nth.call(null, vec__11142__11143, 1, null);
      var G__11130__11146 = G__11130__11141;
      var G__11147__11148 = k__11144;
      if(cljs.core._EQ_.call(null, "\ufdd0'classes", G__11147__11148)) {
        var G__11149__11150 = cljs.core.seq.call(null, v__11145);
        if(G__11149__11150) {
          var c__11151 = cljs.core.first.call(null, G__11149__11150);
          var G__11149__11152 = G__11149__11150;
          while(true) {
            dommy.attrs.add_class_BANG_.call(null, n__11123, c__11151);
            var temp__3974__auto____11153 = cljs.core.next.call(null, G__11149__11152);
            if(temp__3974__auto____11153) {
              var G__11149__11154 = temp__3974__auto____11153;
              var G__11157 = cljs.core.first.call(null, G__11149__11154);
              var G__11158 = G__11149__11154;
              c__11151 = G__11157;
              G__11149__11152 = G__11158;
              continue
            }else {
            }
            break
          }
        }else {
        }
      }else {
        if(cljs.core._EQ_.call(null, "\ufdd0'class", G__11147__11148)) {
          dommy.attrs.add_class_BANG_.call(null, n__11123, v__11145)
        }else {
          if("\ufdd0'else") {
            dommy.attrs.set_attr_BANG_.call(null, n__11123, k__11144, v__11145)
          }else {
          }
        }
      }
      var temp__3974__auto____11155 = cljs.core.next.call(null, G__11130__11146);
      if(temp__3974__auto____11155) {
        var G__11130__11156 = temp__3974__auto____11155;
        var G__11159 = cljs.core.first.call(null, G__11130__11156);
        var G__11160 = G__11130__11156;
        G__11133__11140 = G__11159;
        G__11130__11141 = G__11160;
        continue
      }else {
      }
      break
    }
  }else {
  }
  n__11123.appendChild(dommy.template.__GT_node_like.call(null, children__11129));
  return n__11123
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
    var G__11164__11165 = data;
    if(G__11164__11165) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____11166 = null;
        if(cljs.core.truth_(or__3824__auto____11166)) {
          return or__3824__auto____11166
        }else {
          return G__11164__11165.dommy$template$PElement$
        }
      }())) {
        return true
      }else {
        if(!G__11164__11165.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11164__11165)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__11164__11165)
    }
  }()) {
    return dommy.template._elem.call(null, data)
  }else {
    return dommy.template.throw_unable_to_make_node.call(null, data)
  }
};
dommy.template.html__GT_nodes = function html__GT_nodes(html) {
  var parent__11168 = document.createElement("div");
  parent__11168.insertAdjacentHTML("beforeend", html);
  return Array.prototype.slice.call(parent__11168.childNodes)
};
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
goog.provide("domina.support");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.dom");
var div__11887 = document.createElement("div");
var test_html__11888 = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
div__11887.innerHTML = test_html__11888;
domina.support.leading_whitespace_QMARK_ = cljs.core._EQ_.call(null, div__11887.firstChild.nodeType, 3);
domina.support.extraneous_tbody_QMARK_ = cljs.core._EQ_.call(null, div__11887.getElementsByTagName("tbody").length, 0);
domina.support.unscoped_html_elements_QMARK_ = cljs.core._EQ_.call(null, div__11887.getElementsByTagName("link").length, 0);
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
var opt_wrapper__11480 = cljs.core.PersistentVector.fromArray([1, "<select multiple='multiple'>", "</select>"], true);
var table_section_wrapper__11481 = cljs.core.PersistentVector.fromArray([1, "<table>", "</table>"], true);
var cell_wrapper__11482 = cljs.core.PersistentVector.fromArray([3, "<table><tbody><tr>", "</tr></tbody></table>"], true);
domina.wrap_map = cljs.core.ObjMap.fromObject(["col", "\ufdd0'default", "tfoot", "caption", "optgroup", "legend", "area", "td", "thead", "th", "option", "tbody", "tr", "colgroup"], {"col":cljs.core.PersistentVector.fromArray([2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], true), "\ufdd0'default":cljs.core.PersistentVector.fromArray([0, "", ""], true), "tfoot":table_section_wrapper__11481, "caption":table_section_wrapper__11481, "optgroup":opt_wrapper__11480, "legend":cljs.core.PersistentVector.fromArray([1, 
"<fieldset>", "</fieldset>"], true), "area":cljs.core.PersistentVector.fromArray([1, "<map>", "</map>"], true), "td":cell_wrapper__11482, "thead":table_section_wrapper__11481, "th":cell_wrapper__11482, "option":opt_wrapper__11480, "tbody":table_section_wrapper__11481, "tr":cljs.core.PersistentVector.fromArray([2, "<table><tbody>", "</tbody></table>"], true), "colgroup":table_section_wrapper__11481});
domina.remove_extraneous_tbody_BANG_ = function remove_extraneous_tbody_BANG_(div, html) {
  var no_tbody_QMARK___11495 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_tbody, html));
  var tbody__11499 = function() {
    var and__3822__auto____11496 = cljs.core._EQ_.call(null, domina.tag_name, "table");
    if(and__3822__auto____11496) {
      return no_tbody_QMARK___11495
    }else {
      return and__3822__auto____11496
    }
  }() ? function() {
    var and__3822__auto____11497 = div.firstChild;
    if(cljs.core.truth_(and__3822__auto____11497)) {
      return div.firstChild.childNodes
    }else {
      return and__3822__auto____11497
    }
  }() : function() {
    var and__3822__auto____11498 = cljs.core._EQ_.call(null, domina.start_wrap, "<table>");
    if(and__3822__auto____11498) {
      return no_tbody_QMARK___11495
    }else {
      return and__3822__auto____11498
    }
  }() ? divchildNodes : cljs.core.PersistentVector.EMPTY;
  var G__11500__11501 = cljs.core.seq.call(null, tbody__11499);
  if(G__11500__11501) {
    var child__11502 = cljs.core.first.call(null, G__11500__11501);
    var G__11500__11503 = G__11500__11501;
    while(true) {
      if(function() {
        var and__3822__auto____11504 = cljs.core._EQ_.call(null, child__11502.nodeName, "tbody");
        if(and__3822__auto____11504) {
          return cljs.core._EQ_.call(null, child__11502.childNodes.length, 0)
        }else {
          return and__3822__auto____11504
        }
      }()) {
        child__11502.parentNode.removeChild(child__11502)
      }else {
      }
      var temp__3974__auto____11505 = cljs.core.next.call(null, G__11500__11503);
      if(temp__3974__auto____11505) {
        var G__11500__11506 = temp__3974__auto____11505;
        var G__11507 = cljs.core.first.call(null, G__11500__11506);
        var G__11508 = G__11500__11506;
        child__11502 = G__11507;
        G__11500__11503 = G__11508;
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
  var html__11522 = clojure.string.replace.call(null, html, domina.re_xhtml_tag, "<$1></$2>");
  var tag_name__11523 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html__11522)))].join("").toLowerCase();
  var vec__11521__11524 = cljs.core._lookup.call(null, domina.wrap_map, tag_name__11523, (new cljs.core.Keyword("\ufdd0'default")).call(null, domina.wrap_map));
  var depth__11525 = cljs.core.nth.call(null, vec__11521__11524, 0, null);
  var start_wrap__11526 = cljs.core.nth.call(null, vec__11521__11524, 1, null);
  var end_wrap__11527 = cljs.core.nth.call(null, vec__11521__11524, 2, null);
  var div__11531 = function() {
    var wrapper__11529 = function() {
      var div__11528 = document.createElement("div");
      div__11528.innerHTML = [cljs.core.str(start_wrap__11526), cljs.core.str(html__11522), cljs.core.str(end_wrap__11527)].join("");
      return div__11528
    }();
    var level__11530 = depth__11525;
    while(true) {
      if(level__11530 > 0) {
        var G__11533 = wrapper__11529.lastChild;
        var G__11534 = level__11530 - 1;
        wrapper__11529 = G__11533;
        level__11530 = G__11534;
        continue
      }else {
        return wrapper__11529
      }
      break
    }
  }();
  if(cljs.core.truth_(domina.support.extraneous_tbody_QMARK_)) {
    domina.remove_extraneous_tbody_BANG_.call(null, div__11531, html__11522)
  }else {
  }
  if(cljs.core.truth_(function() {
    var and__3822__auto____11532 = cljs.core.not.call(null, domina.support.leading_whitespace_QMARK_);
    if(and__3822__auto____11532) {
      return cljs.core.re_find.call(null, domina.re_leading_whitespace, html__11522)
    }else {
      return and__3822__auto____11532
    }
  }())) {
    domina.restore_leading_whitespace_BANG_.call(null, div__11531, html__11522)
  }else {
  }
  return div__11531.childNodes
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
    var and__3822__auto____11539 = content;
    if(and__3822__auto____11539) {
      return content.domina$DomContent$nodes$arity$1
    }else {
      return and__3822__auto____11539
    }
  }()) {
    return content.domina$DomContent$nodes$arity$1(content)
  }else {
    var x__2361__auto____11540 = content == null ? null : content;
    return function() {
      var or__3824__auto____11541 = domina.nodes[goog.typeOf(x__2361__auto____11540)];
      if(or__3824__auto____11541) {
        return or__3824__auto____11541
      }else {
        var or__3824__auto____11542 = domina.nodes["_"];
        if(or__3824__auto____11542) {
          return or__3824__auto____11542
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.nodes", content);
        }
      }
    }().call(null, content)
  }
};
domina.single_node = function single_node(nodeseq) {
  if(function() {
    var and__3822__auto____11547 = nodeseq;
    if(and__3822__auto____11547) {
      return nodeseq.domina$DomContent$single_node$arity$1
    }else {
      return and__3822__auto____11547
    }
  }()) {
    return nodeseq.domina$DomContent$single_node$arity$1(nodeseq)
  }else {
    var x__2361__auto____11548 = nodeseq == null ? null : nodeseq;
    return function() {
      var or__3824__auto____11549 = domina.single_node[goog.typeOf(x__2361__auto____11548)];
      if(or__3824__auto____11549) {
        return or__3824__auto____11549
      }else {
        var or__3824__auto____11550 = domina.single_node["_"];
        if(or__3824__auto____11550) {
          return or__3824__auto____11550
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
      var and__3822__auto____11552 = domina._STAR_debug_STAR_;
      if(cljs.core.truth_(and__3822__auto____11552)) {
        return!cljs.core._EQ_.call(null, window.console, undefined)
      }else {
        return and__3822__auto____11552
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
  log_debug.cljs$lang$applyTo = function(arglist__11553) {
    var mesg = cljs.core.seq(arglist__11553);
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
  log.cljs$lang$applyTo = function(arglist__11554) {
    var mesg = cljs.core.seq(arglist__11554);
    return log__delegate(mesg)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
domina.by_id = function by_id(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
domina.by_class = function by_class(class_name) {
  if(void 0 === domina.t11562) {
    domina.t11562 = function(class_name, by_class, meta11563) {
      this.class_name = class_name;
      this.by_class = by_class;
      this.meta11563 = meta11563;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    domina.t11562.cljs$lang$type = true;
    domina.t11562.cljs$lang$ctorPrSeq = function(this__2307__auto__) {
      return cljs.core.list.call(null, "domina/t11562")
    };
    domina.t11562.prototype.domina$DomContent$ = true;
    domina.t11562.prototype.domina$DomContent$nodes$arity$1 = function(_) {
      var this__11565 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementsByClass(cljs.core.name.call(null, this__11565.class_name)))
    };
    domina.t11562.prototype.domina$DomContent$single_node$arity$1 = function(_) {
      var this__11566 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementByClass(cljs.core.name.call(null, this__11566.class_name)))
    };
    domina.t11562.prototype.cljs$core$IMeta$_meta$arity$1 = function(_11564) {
      var this__11567 = this;
      return this__11567.meta11563
    };
    domina.t11562.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_11564, meta11563) {
      var this__11568 = this;
      return new domina.t11562(this__11568.class_name, this__11568.by_class, meta11563)
    };
    domina.t11562
  }else {
  }
  return new domina.t11562(class_name, by_class, null)
};
domina.children = function children(content) {
  return cljs.core.doall.call(null, cljs.core.mapcat.call(null, goog.dom.getChildren, domina.nodes.call(null, content)))
};
domina.clone = function clone(content) {
  return cljs.core.map.call(null, function(p1__11569_SHARP_) {
    return p1__11569_SHARP_.cloneNode(true)
  }, domina.nodes.call(null, content))
};
domina.append_BANG_ = function append_BANG_(parent_content, child_content) {
  domina.apply_with_cloning.call(null, goog.dom.appendChild, parent_content, child_content);
  return parent_content
};
domina.insert_BANG_ = function insert_BANG_(parent_content, child_content, idx) {
  domina.apply_with_cloning.call(null, function(p1__11570_SHARP_, p2__11571_SHARP_) {
    return goog.dom.insertChildAt(p1__11570_SHARP_, p2__11571_SHARP_, idx)
  }, parent_content, child_content);
  return parent_content
};
domina.prepend_BANG_ = function prepend_BANG_(parent_content, child_content) {
  domina.insert_BANG_.call(null, parent_content, child_content, 0);
  return parent_content
};
domina.insert_before_BANG_ = function insert_before_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__11573_SHARP_, p2__11572_SHARP_) {
    return goog.dom.insertSiblingBefore(p2__11572_SHARP_, p1__11573_SHARP_)
  }, content, new_content);
  return content
};
domina.insert_after_BANG_ = function insert_after_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__11575_SHARP_, p2__11574_SHARP_) {
    return goog.dom.insertSiblingAfter(p2__11574_SHARP_, p1__11575_SHARP_)
  }, content, new_content);
  return content
};
domina.swap_content_BANG_ = function swap_content_BANG_(old_content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__11577_SHARP_, p2__11576_SHARP_) {
    return goog.dom.replaceNode(p2__11576_SHARP_, p1__11577_SHARP_)
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
  var s__11579 = goog.style.getStyle(domina.single_node.call(null, content), cljs.core.name.call(null, name));
  if(cljs.core.truth_(clojure.string.blank_QMARK_.call(null, s__11579))) {
    return null
  }else {
    return s__11579
  }
};
domina.attr = function attr(content, name) {
  return domina.single_node.call(null, content).getAttribute(cljs.core.name.call(null, name))
};
domina.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(content, name, value) {
    var G__11586__11587 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__11586__11587) {
      var n__11588 = cljs.core.first.call(null, G__11586__11587);
      var G__11586__11589 = G__11586__11587;
      while(true) {
        goog.style.setStyle(n__11588, cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____11590 = cljs.core.next.call(null, G__11586__11589);
        if(temp__3974__auto____11590) {
          var G__11586__11591 = temp__3974__auto____11590;
          var G__11592 = cljs.core.first.call(null, G__11586__11591);
          var G__11593 = G__11586__11591;
          n__11588 = G__11592;
          G__11586__11589 = G__11593;
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
  set_style_BANG_.cljs$lang$applyTo = function(arglist__11594) {
    var content = cljs.core.first(arglist__11594);
    var name = cljs.core.first(cljs.core.next(arglist__11594));
    var value = cljs.core.rest(cljs.core.next(arglist__11594));
    return set_style_BANG___delegate(content, name, value)
  };
  set_style_BANG_.cljs$lang$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
domina.set_attr_BANG_ = function() {
  var set_attr_BANG___delegate = function(content, name, value) {
    var G__11601__11602 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__11601__11602) {
      var n__11603 = cljs.core.first.call(null, G__11601__11602);
      var G__11601__11604 = G__11601__11602;
      while(true) {
        n__11603.setAttribute(cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__3974__auto____11605 = cljs.core.next.call(null, G__11601__11604);
        if(temp__3974__auto____11605) {
          var G__11601__11606 = temp__3974__auto____11605;
          var G__11607 = cljs.core.first.call(null, G__11601__11606);
          var G__11608 = G__11601__11606;
          n__11603 = G__11607;
          G__11601__11604 = G__11608;
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
  set_attr_BANG_.cljs$lang$applyTo = function(arglist__11609) {
    var content = cljs.core.first(arglist__11609);
    var name = cljs.core.first(cljs.core.next(arglist__11609));
    var value = cljs.core.rest(cljs.core.next(arglist__11609));
    return set_attr_BANG___delegate(content, name, value)
  };
  set_attr_BANG_.cljs$lang$arity$variadic = set_attr_BANG___delegate;
  return set_attr_BANG_
}();
domina.remove_attr_BANG_ = function remove_attr_BANG_(content, name) {
  var G__11616__11617 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__11616__11617) {
    var n__11618 = cljs.core.first.call(null, G__11616__11617);
    var G__11616__11619 = G__11616__11617;
    while(true) {
      n__11618.removeAttribute(cljs.core.name.call(null, name));
      var temp__3974__auto____11620 = cljs.core.next.call(null, G__11616__11619);
      if(temp__3974__auto____11620) {
        var G__11616__11621 = temp__3974__auto____11620;
        var G__11622 = cljs.core.first.call(null, G__11616__11621);
        var G__11623 = G__11616__11621;
        n__11618 = G__11622;
        G__11616__11619 = G__11623;
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
    var vec__11629__11630 = pair.split(/\s*:\s*/);
    var k__11631 = cljs.core.nth.call(null, vec__11629__11630, 0, null);
    var v__11632 = cljs.core.nth.call(null, vec__11629__11630, 1, null);
    if(cljs.core.truth_(function() {
      var and__3822__auto____11633 = k__11631;
      if(cljs.core.truth_(and__3822__auto____11633)) {
        return v__11632
      }else {
        return and__3822__auto____11633
      }
    }())) {
      return cljs.core.assoc.call(null, acc, cljs.core.keyword.call(null, k__11631.toLowerCase()), v__11632)
    }else {
      return acc
    }
  }, cljs.core.ObjMap.EMPTY, style.split(/\s*;\s*/))
};
domina.styles = function styles(content) {
  var style__11636 = domina.attr.call(null, content, "style");
  if(cljs.core.string_QMARK_.call(null, style__11636)) {
    return domina.parse_style_attributes.call(null, style__11636)
  }else {
    if(cljs.core.truth_(style__11636.cssText)) {
      return domina.parse_style_attributes.call(null, style__11636.cssText)
    }else {
      return null
    }
  }
};
domina.attrs = function attrs(content) {
  var node__11642 = domina.single_node.call(null, content);
  var attrs__11643 = node__11642.attributes;
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.map.call(null, function(p1__11634_SHARP_) {
    var attr__11644 = attrs__11643.item(p1__11634_SHARP_);
    var value__11645 = attr__11644.nodeValue;
    if(function() {
      var and__3822__auto____11646 = cljs.core.not_EQ_.call(null, null, value__11645);
      if(and__3822__auto____11646) {
        return cljs.core.not_EQ_.call(null, "", value__11645)
      }else {
        return and__3822__auto____11646
      }
    }()) {
      return cljs.core.PersistentArrayMap.fromArrays([cljs.core.keyword.call(null, attr__11644.nodeName.toLowerCase())], [attr__11644.nodeValue])
    }else {
      return null
    }
  }, cljs.core.range.call(null, attrs__11643.length))))
};
domina.set_styles_BANG_ = function set_styles_BANG_(content, styles) {
  var G__11666__11667 = cljs.core.seq.call(null, styles);
  if(G__11666__11667) {
    var G__11669__11671 = cljs.core.first.call(null, G__11666__11667);
    var vec__11670__11672 = G__11669__11671;
    var name__11673 = cljs.core.nth.call(null, vec__11670__11672, 0, null);
    var value__11674 = cljs.core.nth.call(null, vec__11670__11672, 1, null);
    var G__11666__11675 = G__11666__11667;
    var G__11669__11676 = G__11669__11671;
    var G__11666__11677 = G__11666__11675;
    while(true) {
      var vec__11678__11679 = G__11669__11676;
      var name__11680 = cljs.core.nth.call(null, vec__11678__11679, 0, null);
      var value__11681 = cljs.core.nth.call(null, vec__11678__11679, 1, null);
      var G__11666__11682 = G__11666__11677;
      domina.set_style_BANG_.call(null, content, name__11680, value__11681);
      var temp__3974__auto____11683 = cljs.core.next.call(null, G__11666__11682);
      if(temp__3974__auto____11683) {
        var G__11666__11684 = temp__3974__auto____11683;
        var G__11685 = cljs.core.first.call(null, G__11666__11684);
        var G__11686 = G__11666__11684;
        G__11669__11676 = G__11685;
        G__11666__11677 = G__11686;
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
  var G__11706__11707 = cljs.core.seq.call(null, attrs);
  if(G__11706__11707) {
    var G__11709__11711 = cljs.core.first.call(null, G__11706__11707);
    var vec__11710__11712 = G__11709__11711;
    var name__11713 = cljs.core.nth.call(null, vec__11710__11712, 0, null);
    var value__11714 = cljs.core.nth.call(null, vec__11710__11712, 1, null);
    var G__11706__11715 = G__11706__11707;
    var G__11709__11716 = G__11709__11711;
    var G__11706__11717 = G__11706__11715;
    while(true) {
      var vec__11718__11719 = G__11709__11716;
      var name__11720 = cljs.core.nth.call(null, vec__11718__11719, 0, null);
      var value__11721 = cljs.core.nth.call(null, vec__11718__11719, 1, null);
      var G__11706__11722 = G__11706__11717;
      domina.set_attr_BANG_.call(null, content, name__11720, value__11721);
      var temp__3974__auto____11723 = cljs.core.next.call(null, G__11706__11722);
      if(temp__3974__auto____11723) {
        var G__11706__11724 = temp__3974__auto____11723;
        var G__11725 = cljs.core.first.call(null, G__11706__11724);
        var G__11726 = G__11706__11724;
        G__11709__11716 = G__11725;
        G__11706__11717 = G__11726;
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
  var G__11733__11734 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__11733__11734) {
    var node__11735 = cljs.core.first.call(null, G__11733__11734);
    var G__11733__11736 = G__11733__11734;
    while(true) {
      goog.dom.classes.add(node__11735, class$);
      var temp__3974__auto____11737 = cljs.core.next.call(null, G__11733__11736);
      if(temp__3974__auto____11737) {
        var G__11733__11738 = temp__3974__auto____11737;
        var G__11739 = cljs.core.first.call(null, G__11733__11738);
        var G__11740 = G__11733__11738;
        node__11735 = G__11739;
        G__11733__11736 = G__11740;
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
  var G__11747__11748 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__11747__11748) {
    var node__11749 = cljs.core.first.call(null, G__11747__11748);
    var G__11747__11750 = G__11747__11748;
    while(true) {
      goog.dom.classes.remove(node__11749, class$);
      var temp__3974__auto____11751 = cljs.core.next.call(null, G__11747__11750);
      if(temp__3974__auto____11751) {
        var G__11747__11752 = temp__3974__auto____11751;
        var G__11753 = cljs.core.first.call(null, G__11747__11752);
        var G__11754 = G__11747__11752;
        node__11749 = G__11753;
        G__11747__11750 = G__11754;
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
  var classes__11762 = cljs.core.coll_QMARK_.call(null, classes) ? clojure.string.join.call(null, " ", classes) : classes;
  var G__11763__11764 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__11763__11764) {
    var node__11765 = cljs.core.first.call(null, G__11763__11764);
    var G__11763__11766 = G__11763__11764;
    while(true) {
      goog.dom.classes.set(node__11765, classes__11762);
      var temp__3974__auto____11767 = cljs.core.next.call(null, G__11763__11766);
      if(temp__3974__auto____11767) {
        var G__11763__11768 = temp__3974__auto____11767;
        var G__11769 = cljs.core.first.call(null, G__11763__11768);
        var G__11770 = G__11763__11768;
        node__11765 = G__11769;
        G__11763__11766 = G__11770;
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
  var G__11777__11778 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__11777__11778) {
    var node__11779 = cljs.core.first.call(null, G__11777__11778);
    var G__11777__11780 = G__11777__11778;
    while(true) {
      goog.dom.setTextContent(node__11779, value);
      var temp__3974__auto____11781 = cljs.core.next.call(null, G__11777__11780);
      if(temp__3974__auto____11781) {
        var G__11777__11782 = temp__3974__auto____11781;
        var G__11783 = cljs.core.first.call(null, G__11777__11782);
        var G__11784 = G__11777__11782;
        node__11779 = G__11783;
        G__11777__11780 = G__11784;
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
  var G__11791__11792 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__11791__11792) {
    var node__11793 = cljs.core.first.call(null, G__11791__11792);
    var G__11791__11794 = G__11791__11792;
    while(true) {
      goog.dom.forms.setValue(node__11793, value);
      var temp__3974__auto____11795 = cljs.core.next.call(null, G__11791__11794);
      if(temp__3974__auto____11795) {
        var G__11791__11796 = temp__3974__auto____11795;
        var G__11797 = cljs.core.first.call(null, G__11791__11796);
        var G__11798 = G__11791__11796;
        node__11793 = G__11797;
        G__11791__11794 = G__11798;
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
  var allows_inner_html_QMARK___11815 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_no_inner_html, html_string));
  var leading_whitespace_QMARK___11816 = cljs.core.re_find.call(null, domina.re_leading_whitespace, html_string);
  var tag_name__11817 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html_string)))].join("").toLowerCase();
  var special_tag_QMARK___11818 = cljs.core.contains_QMARK_.call(null, domina.wrap_map, tag_name__11817);
  if(cljs.core.truth_(function() {
    var and__3822__auto____11819 = allows_inner_html_QMARK___11815;
    if(and__3822__auto____11819) {
      var and__3822__auto____11821 = function() {
        var or__3824__auto____11820 = domina.support.leading_whitespace_QMARK_;
        if(cljs.core.truth_(or__3824__auto____11820)) {
          return or__3824__auto____11820
        }else {
          return cljs.core.not.call(null, leading_whitespace_QMARK___11816)
        }
      }();
      if(cljs.core.truth_(and__3822__auto____11821)) {
        return!special_tag_QMARK___11818
      }else {
        return and__3822__auto____11821
      }
    }else {
      return and__3822__auto____11819
    }
  }())) {
    var value__11822 = clojure.string.replace.call(null, html_string, domina.re_xhtml_tag, "<$1></$2>");
    try {
      var G__11825__11826 = cljs.core.seq.call(null, domina.nodes.call(null, content));
      if(G__11825__11826) {
        var node__11827 = cljs.core.first.call(null, G__11825__11826);
        var G__11825__11828 = G__11825__11826;
        while(true) {
          goog.events.removeAll(node__11827);
          node__11827.innerHTML = value__11822;
          var temp__3974__auto____11829 = cljs.core.next.call(null, G__11825__11828);
          if(temp__3974__auto____11829) {
            var G__11825__11830 = temp__3974__auto____11829;
            var G__11831 = cljs.core.first.call(null, G__11825__11830);
            var G__11832 = G__11825__11830;
            node__11827 = G__11831;
            G__11825__11828 = G__11832;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }catch(e11823) {
      if(cljs.core.instance_QMARK_.call(null, domina.Exception, e11823)) {
        var e__11824 = e11823;
        domina.replace_children_BANG_.call(null, content, value__11822)
      }else {
        if("\ufdd0'else") {
          throw e11823;
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
    var m__11838 = domina.single_node.call(null, node).__domina_data;
    var value__11839 = cljs.core.truth_(m__11838) ? cljs.core._lookup.call(null, m__11838, key, null) : null;
    if(cljs.core.truth_(function() {
      var and__3822__auto____11840 = bubble;
      if(cljs.core.truth_(and__3822__auto____11840)) {
        return value__11839 == null
      }else {
        return and__3822__auto____11840
      }
    }())) {
      var temp__3974__auto____11841 = domina.single_node.call(null, node).parentNode;
      if(cljs.core.truth_(temp__3974__auto____11841)) {
        var parent__11842 = temp__3974__auto____11841;
        return get_data.call(null, parent__11842, key, true)
      }else {
        return null
      }
    }else {
      return value__11839
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
  var m__11848 = function() {
    var or__3824__auto____11847 = domina.single_node.call(null, node).__domina_data;
    if(cljs.core.truth_(or__3824__auto____11847)) {
      return or__3824__auto____11847
    }else {
      return cljs.core.ObjMap.EMPTY
    }
  }();
  return domina.single_node.call(null, node).__domina_data = cljs.core.assoc.call(null, m__11848, key, value)
};
domina.apply_with_cloning = function apply_with_cloning(f, parent_content, child_content) {
  var parents__11860 = domina.nodes.call(null, parent_content);
  var children__11861 = domina.nodes.call(null, child_content);
  var first_child__11869 = function() {
    var frag__11862 = document.createDocumentFragment();
    var G__11863__11864 = cljs.core.seq.call(null, children__11861);
    if(G__11863__11864) {
      var child__11865 = cljs.core.first.call(null, G__11863__11864);
      var G__11863__11866 = G__11863__11864;
      while(true) {
        frag__11862.appendChild(child__11865);
        var temp__3974__auto____11867 = cljs.core.next.call(null, G__11863__11866);
        if(temp__3974__auto____11867) {
          var G__11863__11868 = temp__3974__auto____11867;
          var G__11871 = cljs.core.first.call(null, G__11863__11868);
          var G__11872 = G__11863__11868;
          child__11865 = G__11871;
          G__11863__11866 = G__11872;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return frag__11862
  }();
  var other_children__11870 = cljs.core.doall.call(null, cljs.core.repeatedly.call(null, cljs.core.count.call(null, parents__11860) - 1, function() {
    return first_child__11869.cloneNode(true)
  }));
  if(cljs.core.seq.call(null, parents__11860)) {
    f.call(null, cljs.core.first.call(null, parents__11860), first_child__11869);
    return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__11843_SHARP_, p2__11844_SHARP_) {
      return f.call(null, p1__11843_SHARP_, p2__11844_SHARP_)
    }, cljs.core.rest.call(null, parents__11860), other_children__11870))
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
  var and__3822__auto____11874 = obj;
  if(cljs.core.truth_(and__3822__auto____11874)) {
    return obj.length
  }else {
    return and__3822__auto____11874
  }
};
domina.normalize_seq = function normalize_seq(list_thing) {
  if(list_thing == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__11878__11879 = list_thing;
      if(G__11878__11879) {
        if(function() {
          var or__3824__auto____11880 = G__11878__11879.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____11880) {
            return or__3824__auto____11880
          }else {
            return G__11878__11879.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__11878__11879.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11878__11879)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11878__11879)
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
      var G__11881__11882 = content;
      if(G__11881__11882) {
        if(function() {
          var or__3824__auto____11883 = G__11881__11882.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____11883) {
            return or__3824__auto____11883
          }else {
            return G__11881__11882.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__11881__11882.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11881__11882)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11881__11882)
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
      var G__11884__11885 = content;
      if(G__11884__11885) {
        if(function() {
          var or__3824__auto____11886 = G__11884__11885.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3824__auto____11886) {
            return or__3824__auto____11886
          }else {
            return G__11884__11885.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__11884__11885.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11884__11885)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11884__11885)
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
    var and__3822__auto____7039 = cljs.core._EQ_.call(null, amount, 0);
    if(and__3822__auto____7039) {
      return cljs.core._EQ_.call(null, stories, 0)
    }else {
      return and__3822__auto____7039
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([choices], true)
  }else {
    if(function() {
      var or__3824__auto____7040 = amount < 0;
      if(or__3824__auto____7040) {
        return or__3824__auto____7040
      }else {
        var or__3824__auto____7041 = cljs.core._EQ_.call(null, point_cap, 0);
        if(or__3824__auto____7041) {
          return or__3824__auto____7041
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
  var coll__7043 = cljs_intro.estimate.all_estimate.call(null, amount, 3, stories, cljs.core.PersistentVector.EMPTY);
  if(cljs.core.empty_QMARK_.call(null, coll__7043)) {
    return cljs.core.PersistentVector.EMPTY
  }else {
    return cljs.core.shuffle.call(null, cljs.core.rand_nth.call(null, coll__7043))
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
        return cljs.core.reduce.call(null, function(m, p__7049) {
          var vec__7050__7051 = p__7049;
          var k__7052 = cljs.core.nth.call(null, vec__7050__7051, 0, null);
          var v__7053 = cljs.core.nth.call(null, vec__7050__7051, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__7052), clj__GT_js.call(null, v__7053))
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
  return domina.set_html_BANG_.call(null, domina.by_id.call(null, "res"), dommy.template.node.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div", function() {
    var iter__2460__auto____7060 = function iter__7054(s__7055) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__7055__7058 = s__7055;
        while(true) {
          if(cljs.core.seq.call(null, s__7055__7058)) {
            var est__7059 = cljs.core.first.call(null, s__7055__7058);
            return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'div.story", cljs.core.PersistentVector.fromArray(["\ufdd0'img.star", cljs.core.ObjMap.fromObject(["\ufdd0'src"], {"\ufdd0'src":"/images/star.png"})], true), cljs.core.PersistentVector.fromArray(["\ufdd0'div.text", cljs_intro.stories.rand_sentence.call(null)], true), cljs.core.PersistentVector.fromArray(["\ufdd0'div.estimate", est__7059], true)], true), iter__7054.call(null, cljs.core.rest.call(null, s__7055__7058)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2460__auto____7060.call(null, cljs_intro.estimate.estimates)
  }()], true)))
});
