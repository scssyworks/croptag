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

function _wrapAndMask(imageList) {
    imageList.forEach(img => {
        const wrapper = _createElement('div', {
            style: 'position: relative; width: 100%; height: 100%;',
            class: 'crop-tag-wrap'
        });
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        wrapper.appendChild(_createElement('div', {
            style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;',
            class: 'crop-tag-mask'
        }));
    });
}

function _resolveImageData(imageList) {
    const imgData = [];
    return Promise.all(imageList.map(img => new Promise((resolve) => {
        if (img.complete) {
            const hasErrors = img.naturalWidth === 0 || img.naturalHeight === 0;
            if (hasErrors) {
                img.classList.add('crop-tag-error');
            }
            resolve();
            imgData.push({
                src: img.src,
                width: img.naturalWidth,
                height: img.naturalHeight,
                hasErrors
            });
        } else {
            img.onload = () => {
                resolve();
                imgData.push({
                    src: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    hasErrors: false
                });
            };
            img.onerror = () => {
                img.classList.add('crop-tag-error');
                resolve();
                imgData.push({
                    src: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    hasErrors: true
                });
            }
        }
    }))).then(() => imgData);
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
    _resolveImageData(imageList).then((imageData) => console.log(imageData));
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
            target: null, // Image target to be used if image URL is passed
            onDragStart: null, // Callback fires when dragging starts
            onDrag: null, // Callback fires during drag
            onDrapStop: null, // Callback fires when dragging stops
            onResize: null // Callback fires when tag is resized
        }, config);
        // Mask image
        const { image, imageAlt, target } = this.config;
        _createMask(image, imageAlt, target);
    }
    getAll() {
        // TODO: Returns all tags
    }
    get(index) {
        //TODO: Returns focussed tag if focussedTags is enabled, else returns tag info based on created index
    }
    on(event, handler) {
        //TODO: Event handler to be used for onDragStart, onDrag, onDrapStop and onResize
    }
    off(event, handler) {
        //TODO: Removes event handlers
    }
}