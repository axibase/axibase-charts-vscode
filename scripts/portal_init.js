(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.version = "0.1.0";
exports.revision = '20016';
exports.logging = false;
exports.testing = false;
exports.defaultContextPath = "/api/v1/";
exports.defaultSeriesPath = "/series/query";
exports.DEFAULT_MESSAGE_STAT_PATH = "/messages/stats/query";
exports.defaultPropertiesPath = "/properties/query";
exports.defaultAlertsPath = "/alerts/query";
exports.defaultMessagesPath = "/messages/query";
},{}],2:[function(require,module,exports){
require("./methods/loadjson")(window);
require("./methods/urlformat")(window);
require("./methods/log")(window);

require("./init")(window);
window.axibase = require("./axibase");
},{"./axibase":1,"./init":3,"./methods/loadjson":4,"./methods/log":5,"./methods/urlformat":6}],3:[function(require,module,exports){
var axibase = require("./axibase");

module.exports = function (global, undefined) {

var bodyLoaded = !!document.body;
global.onBodyLoad = extendFunction(global.onBodyLoad, function () { bodyLoaded = true; });

function initializePortal(getConfigArgs, callback) {
    if (typeof getConfigArgs !== "function") {
        getConfigArgs = getConfigArgsDefault;
    }

    var nonSvg = !document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");
    var configArgs = null;

    // the main rendering method which is executed when body is loaded
    function renderPortal() {
        if (!bodyLoaded) {
        // if body has not been loaded yet then set event
            global.onBodyLoad = extendFunction(global.onBodyLoad, renderPortal);
            return;
        }
        if (axibase.testing) log("config and body loaded");

        // create portal config
        var portalConfig = global.portalConfig = configArgs && parseConfiguration.apply(this, configArgs);
        if (axibase.testing) log("config parsed");
        if (callback) callback(portalConfig, configArgs);

        var portalViewEl = document.getElementsByClassName("portalView")[0];
        if (!portalViewEl) {
            return;
        }

        if (nonSvg || !global.d3) {
            portalViewEl.innerHTML = "<br><pre>   Sorry, this application doesn't support non-svg browsers.</pre>";
            return;
        }

        d3.select("html").classed("portalPage", true);
        if (!configArgs) {
            portalViewEl.innerHTML = "<br><pre>   Widgets config can not be found.</pre>";
            return;
        }

        // render portal
        $(portalViewEl).portalView();
        if (axibase.testing) log("portal rendered");
    }

    if (nonSvg) {
        renderPortal();
    } else if ((configArgs = getConfigArgs()) === undefined) {
        // if getConfigArgs returns undefined then it must be needing callback function
        // (e.g. if it sends ajax request it can't return result instantly)

        getConfigArgs(function (res) {
            configArgs = res;
            renderPortal();
        });
    } else {
        renderPortal();
    }
}

function getConfigArgsDefault(callback) {
    if (typeof callback === "function") {
        var placeholders = global.portalPlaceholders = global.getPortalPlaceholders();
        var query = encodeParams(placeholders);
        var configURL;

        if (typeof global.getDefaultConfigURL === "function") {
            configURL = global.getDefaultConfigURL(query);
        } else {
            configURL = global.getDefaultConfigURL;
        }

        loadText(configURL, function (res) {
            callback(this.status < 400 && [res, placeholders]);
        });

        if (axibase.testing) log("request for config sent");
    }
}

function getPortalPlaceholders(url) {
    var exp = /^(p_)?([\w-]+)$/;
    var params = getParametersMap(url);
    var res = {};

    for (var n in params) {
        var m = params.hasOwnProperty(n) && n.match(exp);
        if (m){
            res[m[2].toLowerCase()] = params[n];
        }
    }
    return res;
}

function getDefaultConfigURL(query) {
    // check if url is specified after the location URL hash
    var str = location.href.split("#");
    var url = (str[1] || null) && getParametersByName("url", "?" + str[1])[0];

    // if it's not in hash parameters then check query parameter "c"
    if (url == null) {
        var configSuffix = getParametersByName("c")[0] || "";
        url = ["conf/widgets", configSuffix, ".config"].join("");

        // add query parameters (placeholders values by default) to the config url
        if (Array.isArray(query)) query = query.join("&");
        if (query) url += "?" + query;
    }

    // in order to prevent loading config from the browser cache the line below might be needed
    url += (url.indexOf("?") < 0 ? "?" : "&") + "cache=" + Date.now();
    return url;
}

global.doLog = function () { return axibase.logging; };

global.getPortalPlaceholders = getPortalPlaceholders;
global.getDefaultConfigURL = getDefaultConfigURL;
global.initializePortal = initializePortal;

};

},{"./axibase":1}],4:[function(require,module,exports){
module.exports = function (global, undefined) {

    function loadJson(url, callback) {
        if (callback) {
            var Callback = callback;
            arguments[1] = function (res) {
                if (typeof res !== "object") {
                    try{
                        res = JSON.parse(res);
                    } catch(e) {
                        res = null;
                    }
                }
                Callback.call(this, res);
            };
        }
        return global.loadText.apply(this, arguments);
    }

    function loadText(url, callback, data, contentType, method) {
        var xdr = !!window.XDomainRequest && isIE9() && getLocation(url).origin !== getLocation("").origin;
        var req = xdr ? new XDomainRequest() : new XMLHttpRequest();
        var post = !!data;
        var sendJson = post && typeof data === "object";
        var params = post ? (sendJson ? JSON.stringify(data) : data) : null;

        var first = true;
        var instantly = true;
        var instantArgs;
        req.onprogress = function () {};
        req.onload = req.onerror = req.onabort = req.ontimeout = function () {
            if (first && (!instantly || (instantArgs = arguments, false))) {
                first = false;
                req.responseTime = Date.now();
                return typeof callback === "function" && callback.call(this, req.errorJSON || req.responseText);
            }
        };

        var abort = req.abort;
        req.abort = function () {
            if (first) {
                req.aborted = true;
                var res = typeof abort === "function" && abort.apply(this, arguments);
                if (first) {
                    req.onabort.apply(this, arguments);
                }
                return res;
            }
        };

        req.open(method == null ? post ? "POST" : "GET" : method, url, true);
        if (!xdr) {
            if (contentType == null) contentType = getContentType(params, sendJson);
            if (contentType) req.setRequestHeader("Content-Type", contentType);
        }

        try{ req.send(params); }
        catch(e) { req.errorJSON = { error: e.message }; }

        instantly = false;
        if (instantArgs) {
            instantArgs.callee.apply(req, instantArgs);
        }
        return req;
    }

    function isIE9() {
        return navigator.hasOwnProperty("isIE9") ? navigator.isIE9 : /\bMSIE 9\./.test(navigator.userAgent);
    }

    function getLocation(url) {
        var a = document.createElement("a");
        a.href = url;
        if (!a.host) a.href = a.href;
        if (!("origin" in a)) {
            a.origin = a.protocol + "//" + a.host;
        }
        return a;
    }

    function getContentType(params, json) {
        if (json || /^(\[.*\]|\{.*\})$/.test(params)) {
            return "application/json;charset=UTF-8";
        }
        return "application/x-www-form-urlencoded";
    }

    global.loadJson = loadJson;
    global.loadText = loadText;
    global.getLocation = getLocation;

};

},{}],5:[function(require,module,exports){
module.exports = function (global, undefined) {

function log() {
    if (doLog() && console && typeof console.log === "function") {
        console.log.apply(console, arguments);
    }
}

function extendFunction(fn, ext, before) {
    if (typeof ext !== "function") return fn;
    if (typeof fn !== "function") return ext;

    function mix() {
        var args = before && ext.apply(this, arguments);
        var res = fn.apply(this, Array.isArray(args) ? args : arguments);
        if (!before) {
            ext.apply(this, arguments);
        }
        return res;
    }

    var string = []
        .concat((before ? ext : fn).toString())
        .concat((before ? fn : ext).toString());

    mix.toString = function () { return string; };
    return mix;
}

global.extendFunction = extendFunction;
global.doLog = function () { return false; };
global.log = log;

};

},{}],6:[function(require,module,exports){
module.exports = function (global, undefined) {

function getParametersByName(name, url) {
    if (url == null) url = location.search;
    var res = url.match(new RegExp("[?&]" + name + "=[^&#]*", "g"));
    return res ? res.map(function (s) { return decodeURIComponent(s.replace(/.*?=/, "").replace(/\+/g, " ")); }) : [];
}

function getParametersMap(url) {
    if (url == null) url = location.search;
    var res = {};
    url.replace(/[?&]([^&#=]*)=([^&#]*)/g, function (s, g1, g2) {
        g1 = decodeURIComponent(g1.replace(/\+/g, " "));
        g2 = decodeURIComponent(g2.replace(/\+/g, " "));
        (res[g1] || (res[g1] = [])).push(g2);
        return s;
    });
    return res;
}

function encodeParams(obj) {
    var query = [];
    for (var n in obj) {
        if (obj.hasOwnProperty(n)) {
            var v = obj[n];
            if (Array.isArray(v) ? v.length : v != null && (v = [v], true)) {
                function encodeComponent(p) { return (p + "").replace(/[^{}]/g, encodeURIComponent); }

                for (var i = 0, en = encodeComponent(n); i < v.length; i++) {
                    query.push(en + "=" + encodeComponent(v[i]));
                }
            }
        }
    }
    return query;
}

global.encodeParams = encodeParams;
global.getParametersByName = getParametersByName;
global.getParametersMap = getParametersMap;

};

},{}]},{},[2]);
