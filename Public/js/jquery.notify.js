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
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

__webpack_require__(1);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * Notify - A light-weight yet customizable toast plugin for jQuery
 *
 * Copyright 2018, Mehdi Dehghani
 *
 * @author   Mehdi Dehghani (http://www.github.com/dehghani-mehdi)
 * @license  Licensed under MIT (https://github.com/digitalify/notify/blob/master/LICENSE)
 *
 */
;

(function ($, window, document, undefined) {
    var PLUGIN_NAME = 'notify',
        transitionEndEvent = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
        animationEndEvent = 'animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd',
        p = {};

    p[PLUGIN_NAME] = function () {
        function _class(config) {
            _classCallCheck(this, _class);

            this.config = $.extend(true, {}, $.fn.defaults, config);
            this.init();
        }

        _createClass(_class, [{
            key: 'init',
            value: function init() {
                var $box = this.createHTML();

                this.show($box);
            }
        }, {
            key: 'createHTML',
            value: function createHTML() {
                var _this = this;

                var $appended = $(this.config.wrapper).find('.notify');

                var $div = $appended.is('div') ? $appended : $('<div />', { class: 'notify ' + this.getPositionCssClass() + ' notify__' + this.config.dir }),
                    html = $('<textarea />').html(this.config.message).text(),
                    width = this.getWidth(html),
                    $innerDiv = $('<div />', { html: '<div style="width:' + (width > 230 ? 230 : width) + 'px">' + html + '</div>' }),
                    $inner = $('<div />', { class: 'notify__box notify__' + this.config.type }),
                    $close = $('<i />', { class: 'notify__close', html: '&#10005;' });

                // append close button
                $innerDiv.prepend($close);

                if (this.config.autoClose) {
                    $('<span />', {
                        class: 'notify__progress-bar',
                        css: {
                            '-webkit-animation-duration': Math.round(this.config.duration / 1000) + 's',
                            'animation-duration': Math.round(this.config.duration / 1000) + 's'
                        }
                    }).appendTo($innerDiv);
                }

                $inner.append($innerDiv);

                // append box
                $div.append($inner);

                // bind click event on close button
                $close.on('click', function (e) {
                    return _this.dismiss($(e.currentTarget).parent().parent());
                });

                // append notify to the page (first time only)
                if (!$appended.is('div')) $div.appendTo($(this.config.wrapper));

                return $inner;
            }
        }, {
            key: 'getWidth',
            value: function getWidth(s) {
                var $el = $('<span />', { css: { visibility: 'hidden' } }).html(s).appendTo($('body')),
                    w = $el.width();
                $el.remove();

                return w + 5;
            }
        }, {
            key: 'dismiss',
            value: function dismiss($box) {
                var _this2 = this;

                $box.removeClass('notify__show');
                $box.addClass('notify__hide');

                // after animation ends remove $notify from the DOM
                $box.on(animationEndEvent, function (e) {
                    if (e.target !== $box[0]) return false;
                    $box.off(e);
                    $box.remove();

                    if (typeof _this2.config.onClose === 'function') _this2.config.onClose.call($box);
                });
            }
        }, {
            key: 'show',
            value: function show($box) {
                var _this3 = this;

                $box.addClass('notify__show');

                if (this.config.autoClose) {
                    setTimeout(function () {
                        return _this3.dismiss($box);
                    }, this.config.duration);
                }

                if (typeof this.config.onOpen === 'function') this.config.onOpen.call($box);
            }
        }, {
            key: 'getPositionCssClass',
            value: function getPositionCssClass() {
                switch (this.config.position) {
                    case 1:
                        return 'notify__top-left';
                    case 2:
                        return 'notify__top-center';
                    case 3:
                        return 'notify__top-right';
                    case 4:
                        return 'notify__mid-left';
                    case 5:
                        return 'notify__mid-right';
                    case 6:
                        return 'notify__bottom-left';
                    case 7:
                        return 'notify__bottom-center';
                    case 8:
                        return 'notify__bottom-right';
                    default:
                        return '';
                }
            }
        }]);

        return _class;
    }();

    $[PLUGIN_NAME] = function (options) {
        new p[PLUGIN_NAME](options);
    };

    $.fn.defaults = {
        wrapper: 'body',
        message: 'Your request submitted successfuly!',
        // success, info, error, warn
        type: 'success',
        // 1: top-left, 2: top-center, 3: top-right
        // 4: mid-left, 5: mid-right
        // 6: bottom-left, 7: bottom-center, 8: bottom-right
        position: 1,
        dir: 'ltr',
        autoClose: true,
        duration: 4000,
        onOpen: null,
        onClose: null
    };
})(jQuery, window, document);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ })
/******/ ]);