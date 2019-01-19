"use strict";

// document.ready
function DocReady(f) { //calling document.ready()
  if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    f();
  } else {
    document.addEventListener("DOMContentLoaded", f);
  }
};

// edge svg transform fix: ????
void(new MutationObserver(function(muts) {
  for(let i = muts.length; i--;) {
    let mut = muts[i], objs = mut.target.querySelectorAll('foreignObject');
    for(let j = objs.length; j--;) {
        let obj = objs[j];
        let val = obj.style.display;
        obj.style.display = 'none';
        obj.getBBox();
        obj.style.display = val;
    }
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ['transform'], subtree: true }));

// browser detection (consistent / non usual)
var DomainName = function() {
  return window.location.hostname;
}
function RawCookies() {
  let cookies_list = document.cookie.split(';');
  let concat = '';
  for (let i = 1; i <= cookies_list.length; i++) {
    concat += i + ' ' + cookies_list[i-1] + "\n";
  }
  return concat;
}

var BrowserName = function() {
  if (!!window.chrome && !!window.chrome.webstore) {
    return "chrome";
  } // Chrome 1+
  if (/constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification))) {
    return "safari";
  } // Safari 3.0+ "[object HTMLElementConstructor]"
  if (typeof InstallTrigger !== 'undefined') {
    return "firefox";
  } // Firefox 1.0+ 
  if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
    return "opera";
  } // Opera 8.0+
  if (!isIE && !!window.StyleMedia) {
    return "edge";
  } // Edge 20+
  if (/*@cc_on!@*/false || !!document.documentMode) {
    return "ie";
  } // Internet Explorer 6-11
  return undefined;
  ///if ((isChrome || isOpera) && !!window.CSS; // Blink engine detection
}

// CSS insertion
var RuntimeStyle = document.createElement('style');

document.head.appendChild(RuntimeStyle);
var CSS_AddKeyFrames = null;
if (CSS && CSS.supports && CSS.supports('animation: name')){
    // we can safely assume that the browser supports unprefixed version.
    CSS_AddKeyFrames = function(name, s){
        CSS_Insert("@keyframes " + name, s);
    }
} else {
    CSS_AddKeyFrames = function(name, s){
      // Ugly and terrible, but users with this terrible of a browser
      // *cough* IE *cough* don't deserve a fast site
      let str = name + s;
		  let pos = RuntimeStyle.length;
      RuntimeStyle.sheet.insertRule("@-webkit-keyframes " + str, pos);
      RuntimeStyle.sheet.insertRule("@keyframes " + str, pos + 1); //not sure about that, need to test
    }
}

var CSS_Insert = function(name, s){ //use to insert class/id/keyframes to RuntimeStyle
    let pos = RuntimeStyle.length;
    RuntimeStyle.sheet.insertRule(name + s, pos);
}

// HTML insertion
// .appendBefore(element) Prototype
Element.prototype.appendBefore = function (element) {
  element.parentNode.insertBefore(this, element);
},false;

// .appendAfter(element) Prototype
Element.prototype.appendAfter = function (element) {
  element.parentNode.insertBefore(this, element.nextSibling);
},false;

String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

// JS utilities
//var browser = (navigator.userAgent.toLowerCase().match(/(chrome|safari|firefox)/) || [null])[0];
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function FormReset(form_id) {
  document.getElementById(form_id).reset();
}

function FormParams(form_id) {
  return Array.from(new FormData(document.getElementById(form_id)),
    e => e.map(encodeURIComponent).join('=')).join('&')
}

function LoadComponentAPI(component_id, el_id) {
  let req = _API("xhr", "GET", "/api/v1/private/component?id=" + component_id,
    function(str) {
      // console.log(str);
      // let node = document.getElementById(el_id);
      document.getElementById(el_id).innerHTML = str;
    },
    function(str) {
      console.log("LoadComponentAPI error: " + str);
    }
  );
  // return component;
}

function LoadSVG(svg_id, holder) {
  let req = _API("xhr", "GET", "/static/assets/svg/" + svg_id + ".svg",
    function(str) {
      // console.log(str);
      // let node = document.getElementById(el_id);
      holder = str;
    },
    function(str) {
      console.log("LoadSVG error: " + str);
    }
  );
  // return component;
}

function LoadComponentiFrame(component_id, iframe_id, parent_id) {
  let source = "/api/v1/private/component?id=" + component_id;
  let el = document.createElement("iframe");
  let parent_el = document.getElementByID("parent_id");
  el.setAttribute("id", iframe_id);
  el.setAttribute("title", iframe_id);
  el.setAttribute("src", source);
  el.setAttribute("width", "100%");
  el.setAttribute("height", "100%");
  parent_el.appendChild(el);
}

function _API(channel, method, path, onload, onerror/*, onabort*/) {
  //channel: websocket/xhr/fetch
  //method: GET/POST/PUT/PATCH/DELETE
  //path: /api/v1/...
  //onload: function(response){ console.log(response);... }
  if (channel.toLowerCase() == "ajax" || channel.toLowerCase() == "xhr") {
    let xhr = new XMLHttpRequest();
    xhr.open(method, path, true);
    xhr.onload = function() { onload(xhr.response); }
    // xhr.onerror = onerror("xhr request failed");
    // xhr.onerror = onerror("xhr request failed");
    xhr.send();
  } else if (channel.toLowerCase() == "websocket" || channel.toLowerCase() == "ws") {
    let wsw = new WebSocketWrapper(VisitorID, "api");
    wsw.DefaultCallbacks();
    wsw.OnMessage(onload(e.data/*responseText*/));
    wsw.OnError(onerror("websocket request failed"));
    wsw.Send("{ method: " + method + ", path: " + path + " }"); // send JSON formatted WebSocket request to server 
  } else if (channel.toLowerCase() == "fetch") {
    // fetch method to implement (similar to xhr with promise)
  }
}

function FormSubmit(form_id, method, action, destination, content_type, callback) {
  // SubmitForm("POST", "/post_log_in", "application/x-www-form-urlencoded");
  let xhr = new XMLHttpRequest();
  xhr.open(method, destination, true);
  xhr.setRequestHeader("Content-type", content_type);
  xhr.send(/*"action=" + action + "&" + */FormParams(form_id));
  xhr.onload = callback;
}

var Overlay = {}; // Overlay
var Underlay = {}; // Underlay
var Gesture = {
  // touch start / end
  start_x : 0,
  start_y : 0,
  end_x : 0,
  end_y : 0,
  Rec : ""
}; // Gesture
var VisitorID = "";
var QueryParams = null;
var MouseClick = null;
!function() {
  DocReady(function() {
    MouseClick = new MouseEvent("click", { view: window, bubbles: true, cancelable: true });
    QueryParams = new URL(decodeURIComponent(document.location)).searchParams;
    let visitor_id_div = document.getElementById("visitor_id");
    if (visitor_id_div) { VisitorID = visitor_id_div.textContent; }
    // console.log("visitor id: " + visitor_id)
    Underlay.el = document.querySelector(".underlay");
    Overlay.el = document.querySelector(".overlay");
    if (Overlay.el) {
      Overlay.On = function() { Overlay.el.style.display = "block"; }
      Overlay.Off = function() { Overlay.el.style.display = "none"; }
      Overlay.Toggle = function() {
        if (Overlay.el.style.display() == "block") { Overlay.Off() } else { Overlay.On(); }
      }
      Gesture.Listen = function(el_id) {
        Gesture.el = document.querySelector(el_id);
        Gesture.el.addEventListener('touchstart', function(e) {
            Gesture.start_x = e.changedTouches[0].screenX;
            Gesture.start_y = e.changedTouches[0].screenY;
        }, false);
        Gesture.el.addEventListener('touchend', function(e) {
            Gesture.end_x = e.changedTouches[0].screenX;
            Gesture.end_y = e.changedTouches[0].screenY;
            Gesture.Handle(Gesture.start_x, Gesture.start_y, Gesture.end_x, Gesture.end_y);
        }, false); 
      }
      Gesture.Listen("body");
      // let _dim = Gesture.el.getBoundingClientRect();
      // console.log("dim:",_dim);
      Gesture.Handle = async function(_x1, _y1, _x2, _y2) {
        let is_callback = (typeof Gesture.Swipe === 'function');
        let x_ratio = ((_x2 - _x1) / Gesture.el.offsetWidth);
        let y_ratio = -((_y2 - _y1) / Gesture.el.offsetHeight);
        // console.log(Gesture.w, Gesture.h, "xr:",x_ratio,"yr",y_ratio);
        if (Math.abs(x_ratio) > Math.abs(y_ratio) && x_ratio > 0.05) {// Gesture.Rec = "swipe-right";
            if (is_callback) { Gesture.Swipe("right"); }
        }
        if (Math.abs(x_ratio) < Math.abs(y_ratio) && y_ratio > 0.05) {// Gesture.Rec = "swipe-up";
            if (is_callback) { Gesture.Swipe("up"); }
        }
        if (Math.abs(x_ratio) > Math.abs(y_ratio) && x_ratio < -0.05) {// Gesture.Rec = "swipe-left";
            if (is_callback) { Gesture.Swipe("left"); }
        }
        if (Math.abs(x_ratio) < Math.abs(y_ratio) && y_ratio < -0.05) {// Gesture.Rec = "swipe-down";
            if (is_callback) { Gesture.Swipe("down"); }
        }
      }
    }
  });
}();
