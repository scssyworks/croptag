(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.CropTag = factory());
}(this, function () { 'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  // Events
  var CROPTAG_READY = 'croptag.ready'; // Mouse events

  var MOUSE_DOWN = 'mousedown';
  var MOUSE_MOVE = 'mousemove';
  var MOUSE_UP = 'mouseup'; // Classes

  var CROPTAG_ERROR = 'crop-tag-error';
  var CROPTAG_MASK = 'crop-tag-mask';
  var CROPTAG_WRAP = 'crop-tag-wrap';
  var CROPTAG_TAG = 'crop-tag-element';
  var CROPTAG_DOT = 'crop-tag-dot';
  var CROPTAG_EDGE = 'crop-tag-edge';

  /**
   * Creates and return a DOM element
   * @private
   * @param {string} el Element type
   * @param {object} attributes Element attributes
   * @param {string} html HTML string
   * @returns {Node}
   */

  function _createElement(el) {
    var attributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var html = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var tag = document.createElement(el);
    Object.keys(attributes).forEach(function (attr) {
      tag.setAttribute(attr, attributes[attr]);
    });

    if (html) {
      tag.innerHTML = html;
    }

    return tag;
  }
  /**
   * Wraps images for drawing tags
   * @private
   * @param {Node[]} imageList Element list
   */


  function _wrapAndMask(imageList) {
    imageList.forEach(function (img) {
      var wrapper = _createElement('div', {
        style: 'position: relative; width: 100%; height: 100%;',
        "class": CROPTAG_WRAP
      });

      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      wrapper.appendChild(_createElement('div', {
        style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;',
        "class": CROPTAG_MASK
      }));
    });
  }
  /**
   * Returns a promise to ensure the tags are created only when image is available
   * @param {Node[]} imageList Image list
   */


  function _resolveImageData(imageList) {
    var _this = this;

    return Promise.all(imageList.map(function (img) {
      return new Promise(function (resolve) {
        if (img.complete) {
          var hasErrors = img.naturalWidth === 0 || img.naturalHeight === 0;

          if (hasErrors) {
            img.classList.add(CROPTAG_ERROR);
          }

          resolve();

          _this.originalImages.push({
            img: img,
            src: img.src,
            width: img.naturalWidth,
            height: img.naturalHeight,
            hasErrors: hasErrors
          });
        } else {
          img.onload = function () {
            resolve();

            _this.originalImages.push({
              img: img,
              src: img.src,
              width: img.naturalWidth,
              height: img.naturalHeight,
              hasErrors: false
            });
          };

          img.onerror = function () {
            img.classList.add(CROPTAG_ERROR);
            resolve();

            _this.originalImages.push({
              img: img,
              src: img.src,
              width: img.naturalWidth,
              height: img.naturalHeight,
              hasErrors: true
            });
          };
        }
      });
    })).then(function () {
      return _this.originalImages;
    });
  }

  function _createMask(image, imageAlt, target) {
    var imageList = image instanceof NodeList || image instanceof HTMLCollection ? _toConsumableArray(image) : image instanceof Node ? [image] : [];

    if (imageList.length === 0) {
      if (typeof image === 'string') {
        // Possibly URL
        if (target instanceof Node) {
          var img = _createElement('img', {
            src: image,
            alt: imageAlt || 'CropTag image'
          });

          target.appendChild(img);
          imageList.push(target);
        } else {
          throw new TypeError('Target node is unavailable');
        }
      } else {
        throw new TypeError('Image should be a valid DOM element or URL');
      }
    }

    _wrapAndMask(imageList);

    return imageList;
  }

  function _validateSchema(dots, defaultDots) {
    var isValid = true;
    Object.keys(dots).forEach(function (dot) {
      if (!(dot in defaultDots)) {
        isValid = false;
      }
    });

    if (!isValid) {
      throw new Error("Input dots does not match current schema. Accepted values are ".concat(Object.keys(defaultDots).join(', ')));
    }

    return isValid;
  }

  function _insertSquare(_ref) {
    var e = _ref.e,
        dots = _ref.dots,
        edges = _ref.edges,
        drag = _ref.drag,
        defaultDots = _ref.defaultDots;
    var rect = this.getBoundingClientRect();
    var left = e.clientX - rect.left;
    var top = e.clientY - rect.top;

    var square = _createElement('div', {
      "class": "".concat(CROPTAG_TAG).concat(drag ? " ".concat(CROPTAG_TAG, "--drag") : ''),
      style: "position: absolute; top: ".concat(top, "px; left: ").concat(left, "px;")
    });

    if (dots) {
      var availableDots = defaultDots;

      if (_typeof(dots) === 'object' && _validateSchema(dots, defaultDots)) {
        availableDots = dots;
      }

      Object.keys(availableDots).forEach(function (dot) {
        square.appendChild(_createElement('div', {
          "class": "".concat(CROPTAG_DOT, " ").concat(CROPTAG_DOT, "--").concat(availableDots[dot])
        }));
      });
    }

    if (edges && drag) {
      ['top', 'left', 'bottom', 'right'].forEach(function (edge) {
        square.appendChild(_createElement('div', {
          "class": "".concat(CROPTAG_EDGE, " ").concat(CROPTAG_EDGE, "--drag ").concat(CROPTAG_EDGE, "--").concat(edge)
        }));
      });
    }

    this.appendChild(square);
    return square;
  }

  function _bindEvents() {
    var _this2 = this;

    var _this$config = this.config,
        dots = _this$config.dots,
        edges = _this$config.edges,
        drag = _this$config.drag;
    var defaultDots = this.defaultDots;
    document.addEventListener(MOUSE_DOWN, function (e) {
      var currentTarget = e.target;

      if (edges && currentTarget.classList.contains(CROPTAG_TAG)) {
        currentTarget = currentTarget.parentNode;
      }

      if (currentTarget.classList.contains(CROPTAG_MASK)) {
        var square = _insertSquare.apply(currentTarget, [{
          e: e,
          dots: dots,
          edges: edges,
          drag: drag,
          defaultDots: defaultDots
        }]);

        var x1 = e.clientX;
        var y1 = e.clientY;
        var initialLeft = square.style.left;
        var initialTop = square.style.top;
        var ctRect = currentTarget.getBoundingClientRect();

        _this2.drawHandler = function (e) {
          var x2 = e.clientX;
          var y2 = e.clientY;
          var width = x2 - x1;
          var height = y2 - y1;
          var maxAttainableWidth = ctRect.width - parseFloat(square.style.left);
          var maxAttainableHeight = ctRect.height - parseFloat(square.style.top);
          square.style.width = "".concat(Math.abs(width < maxAttainableWidth ? width : maxAttainableWidth) / ctRect.width * 100, "%");
          square.style.height = "".concat(Math.abs(height < maxAttainableHeight ? height : maxAttainableHeight) / ctRect.height * 100, "%");
          var computedLeft = (parseFloat(initialLeft) + width) / ctRect.width * 100;
          var computedTop = (parseFloat(initialTop) + height) / ctRect.height * 100;
          var effectiveLeft = computedLeft > 0 ? computedLeft : 0;
          var effectiveTop = computedTop > 0 ? computedTop : 0;

          if (width < 0) {
            square.style.left = "".concat(effectiveLeft, "%");
          }

          if (height < 0) {
            square.style.top = "".concat(effectiveTop, "%");
          }
        };

        document.addEventListener(MOUSE_MOVE, _this2.drawHandler);
      }
    });
    document.addEventListener(MOUSE_UP, function () {
      document.removeEventListener(MOUSE_MOVE, _this2.drawHandler);
      _this2.drawHandler = null;
    });
  }

  var CropTag =
  /*#__PURE__*/
  function () {
    function CropTag(config) {
      var _this3 = this;

      _classCallCheck(this, CropTag);

      _defineProperty(this, "originalImages", []);

      _defineProperty(this, "defaultDots", {
        TL: 'top-left',
        T: 'top',
        TR: 'top-right',
        R: 'right',
        BR: 'bottom-right',
        B: 'bottom',
        BL: 'bottom-left',
        L: 'left'
      });

      config = config || {};
      this.config = Object.assign({
        dots: true,
        // Enables resize dots
        edges: true,
        // Enables edges for drag
        drag: true,
        // Enables drag via edges
        focussedTags: false,
        // Enables focus and blur effect to get details of only focussed tag
        image: null,
        // Image URL or reference
        imageAlt: null,
        target: null // Image target to be used if image URL is passed

      }, config); // Mask image

      var _this$config2 = this.config,
          image = _this$config2.image,
          imageAlt = _this$config2.imageAlt,
          target = _this$config2.target;

      _resolveImageData.apply(this, [_createMask(image, imageAlt, target)]).then(function (imageData) {
        var onReady = new CustomEvent(CROPTAG_READY, {
          bubbles: true,
          cancelable: true,
          detail: {
            payload: imageData
          }
        });
        imageData.forEach(function (_ref2) {
          var img = _ref2.img;
          img.dispatchEvent(onReady);
        });

        _bindEvents.apply(_this3);
      });
    }

    _createClass(CropTag, [{
      key: "getAll",
      value: function getAll() {// TODO: Returns all tags
      }
    }, {
      key: "get",
      value: function get(index) {//TODO: Returns focussed tag if focussedTags is enabled, else returns tag info based on created index
      }
    }]);

    return CropTag;
  }();

  return CropTag;

}));
