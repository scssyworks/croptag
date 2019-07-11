import { CROPTAG_READY, CROPTAG_ERROR, CROPTAG_WRAP, CROPTAG_MASK, MOUSE_DOWN, CROPTAG_TAG, CROPTAG_DOT, CROPTAG_EDGE, MOUSE_MOVE, MOUSE_UP } from './lib/constants';

/**
 * Creates and return a DOM element
 * @private
 * @param {string} el Element type
 * @param {object} attributes Element attributes
 * @param {string} html HTML string
 * @returns {Node}
 */
function _createElement(el, attributes = {}, html = '') {
    const tag = document.createElement(el);
    Object.keys(attributes).forEach((attr) => {
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
    imageList.forEach(img => {
        const wrapper = _createElement('div', {
            style: 'position: relative; width: 100%; height: 100%;',
            class: CROPTAG_WRAP
        });
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        wrapper.appendChild(_createElement('div', {
            style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;',
            class: CROPTAG_MASK
        }));
    });
}

/**
 * Returns a promise to ensure the tags are created only when image is available
 * @param {Node[]} imageList Image list
 */
function _resolveImageData(imageList) {
    return Promise.all(imageList.map(img => new Promise((resolve) => {
        if (img.complete) {
            const hasErrors = img.naturalWidth === 0 || img.naturalHeight === 0;
            if (hasErrors) {
                img.classList.add(CROPTAG_ERROR);
            }
            resolve();
            this.originalImages.push({
                img,
                src: img.src,
                width: img.naturalWidth,
                height: img.naturalHeight,
                hasErrors
            });
        } else {
            img.onload = () => {
                resolve();
                this.originalImages.push({
                    img,
                    src: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    hasErrors: false
                });
            };
            img.onerror = () => {
                img.classList.add(CROPTAG_ERROR);
                resolve();
                this.originalImages.push({
                    img,
                    src: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    hasErrors: true
                });
            }
        }
    }))).then(() => this.originalImages);
}

function _createMask(image, imageAlt, target) {
    const imageList = (
        image instanceof NodeList
        || image instanceof HTMLCollection
    )
        ? [...image] : (
            image instanceof Node
        )
            ? [image] : [];
    if (imageList.length === 0) {
        if (typeof image === 'string') {
            // Possibly URL
            if (target instanceof Node) {
                const img = _createElement('img', {
                    src: image,
                    alt: (imageAlt || 'CropTag image')
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
    let isValid = true;
    Object.keys(dots).forEach(dot => {
        if (!(dot in defaultDots)) {
            isValid = false;
        }
    });
    if (!isValid) {
        throw new Error(`Input dots does not match current schema. Accepted values are ${Object.keys(defaultDots).join(', ')}`);
    }
    return isValid;
}

function _insertSquare({ e, dots, edges, drag, defaultDots }) {
    const rect = this.getBoundingClientRect();
    const left = e.clientX - rect.left;
    const top = e.clientY - rect.top;
    const square = _createElement('div', {
        class: `${CROPTAG_TAG}${drag ? ` ${CROPTAG_TAG}--drag` : ''}`,
        style: `position: absolute; top: ${top}px; left: ${left}px;`
    });
    if (dots) {
        let availableDots = defaultDots;
        if (typeof dots === 'object' && _validateSchema(dots, defaultDots)) {
            availableDots = dots;
        }
        Object.keys(availableDots).forEach(dot => {
            square.appendChild(_createElement('div', {
                class: `${CROPTAG_DOT} ${CROPTAG_DOT}--${availableDots[dot]}`
            }));
        });
    }
    if (edges && drag) {
        ['top', 'left', 'bottom', 'right'].forEach(edge => {
            square.appendChild(_createElement('div', {
                class: `${CROPTAG_EDGE} ${CROPTAG_EDGE}--drag ${CROPTAG_EDGE}--${edge}`
            }));
        });
    }
    this.appendChild(square);
    return square;
}

function _bindEvents() {
    const { dots, edges, drag } = this.config;
    const { defaultDots } = this;
    document.addEventListener(MOUSE_DOWN, (e) => {
        let currentTarget = e.target;
        if (edges && currentTarget.classList.contains(CROPTAG_TAG)) {
            currentTarget = currentTarget.parentNode;
        }
        if (currentTarget.classList.contains(CROPTAG_MASK)) {
            const square = _insertSquare.apply(currentTarget, [{ e, dots, edges, drag, defaultDots }]);
            const x1 = e.clientX;
            const y1 = e.clientY;
            const initialLeft = square.style.left;
            const initialTop = square.style.top;
            const ctRect = currentTarget.getBoundingClientRect();
            this.drawHandler = function (e) {
                const x2 = e.clientX;
                const y2 = e.clientY;
                const width = x2 - x1;
                const height = y2 - y1;
                const sqRect = square.getBoundingClientRect();
                const maxAttainableWidth = ctRect.width - sqRect.left;
                const maxAttainableHeight = ctRect.height - sqRect.top;
                console.log(maxAttainableWidth, maxAttainableHeight);
                square.style.width = `${(Math.abs((width < maxAttainableWidth ? width : maxAttainableWidth))) / ctRect.width * 100}%`;
                square.style.height = `${(Math.abs((height < maxAttainableHeight ? height : maxAttainableHeight))) / ctRect.height * 100}%`;
                const computedLeft = (parseFloat(initialLeft) + width) / ctRect.width * 100;
                const computedTop = (parseFloat(initialTop) + height) / ctRect.height * 100;
                const effectiveLeft = computedLeft > 0 ? computedLeft : 0;
                const effectiveTop = computedTop > 0 ? computedTop : 0;
                if (width < 0) {
                    square.style.left = `${effectiveLeft}%`;
                }
                if (height < 0) {
                    square.style.top = `${effectiveTop}%`
                }
            }
            document.addEventListener(MOUSE_MOVE, this.drawHandler);
        }
    });
    document.addEventListener(MOUSE_UP, () => {
        document.removeEventListener(MOUSE_MOVE, this.drawHandler);
        this.drawHandler = null;
    });
}

export default class CropTag {
    constructor(config) {
        config = config || {};
        this.config = Object.assign({
            dots: true, // Enables resize dots
            edges: true, // Enables edges for drag
            drag: true, // Enables drag via edges
            focussedTags: false, // Enables focus and blur effect to get details of only focussed tag
            image: null, // Image URL or reference
            imageAlt: null,
            target: null // Image target to be used if image URL is passed
        }, config);
        // Mask image
        const { image, imageAlt, target } = this.config;
        _resolveImageData.apply(this, [_createMask(image, imageAlt, target)]).then((imageData) => {
            const onReady = new CustomEvent(CROPTAG_READY, {
                bubbles: true,
                cancelable: true,
                detail: {
                    payload: imageData
                }
            });
            imageData.forEach(({ img }) => {
                img.dispatchEvent(onReady);
            });
            _bindEvents.apply(this);
        });
    }
    originalImages = [];
    defaultDots = {
        TL: 'top-left',
        T: 'top',
        TR: 'top-right',
        R: 'right',
        BR: 'bottom-right',
        B: 'bottom',
        BL: 'bottom-left',
        L: 'left'
    };
    getAll() {
        // TODO: Returns all tags
    }
    get(index) {
        //TODO: Returns focussed tag if focussedTags is enabled, else returns tag info based on created index
    }
}