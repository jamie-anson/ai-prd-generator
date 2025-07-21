/**
 * @author renhongl
 * @email liangrenhong2017@gmail.com
 * @desc This library renders pretty, interactive JSON data in a webview.
 * It has been slightly modified to work within the VS Code webview context by
 * listening for messages from the extension backend.
 */

(function () {
    // Polyfill for Object.assign for older environments, though modern webviews shouldn't need it.
    Object.assign = Object.assign || function (target, ...sources) {
        sources.forEach(source => {
            Object.keys(source).forEach(key => {
                target[key] = source[key];
            });
        });
        return target;
    };

    const toString = Object.prototype.toString;

    // Type-checking utility functions.
    function isString(val) { return typeof val === 'string'; }
    function isNumber(val) { return typeof val === 'number'; }
    function isBoolean(val) { return typeof val === 'boolean'; }
    function isUndefined(val) { return typeof val === 'undefined'; }
    function isArray(val) { return toString.call(val) === '[object Array]'; }
    function isObject(val) { return toString.call(val) === '[object Object]'; }
    function isNull(val) { return toString.call(val) === '[object Null]'; }

    /**
     * The main constructor for the JSON viewer.
     * @param {object} options - Configuration options.
     * @param {string} options.theme - The color theme (e.g., 'light').
     * @param {HTMLElement} options.container - The DOM element to render the viewer in.
     * @param {string} options.data - The JSON data as a string.
     * @param {boolean} options.expand - Whether to expand all nodes by default.
     */
    function JsonViewer(options) {
        const defaults = {
            theme: 'light',
            container: null,
            data: '{}',
            expand: true, // Changed to true for better default UX.
        };
        this.options = Object.assign(defaults, options);
        if (isNull(this.options.container)) {
            throw new Error('Container DOM element is required');
        }
        this.render();
    }

    /**
     * Renders the right-hand side of a key-value pair (the value).
     * @param {string} theme - The CSS class prefix for the current theme.
     * @param {HTMLElement} right - The DOM element for the value.
     * @param {*} val - The value to render.
     */
    JsonViewer.prototype.renderRight = function(theme, right, val) {
        let valueText = val;
        let valueClass = theme + 'rightString'; // Default to string

        if (isNumber(val)) {
            valueClass = theme + 'rightNumber';
        } else if (isBoolean(val)) {
            valueClass = theme + 'rightBoolean';
        } else if (isNull(val)) {
            valueText = 'null';
            valueClass = theme + 'rightNull';
        } else {
            valueText = `"${val}"`; // Add quotes for strings
        }
        right.setAttribute('class', valueClass);
        right.innerText = valueText;
    };

    /**
     * Renders the children of a collapsible node (an object or an array).
     * @param {string} theme - The CSS class prefix.
     * @param {string} key - The key of the object/array.
     * @param {object|Array} val - The value (the object or array itself).
     * @param {HTMLElement} right - The DOM element that will contain the children.
     * @param {number} indent - The current indentation level.
     * @param {HTMLElement} left - The DOM element for the key.
     */
    JsonViewer.prototype.renderChildren = function(theme, key, val, right, indent, left) {
        let self = this;
        let folder = this.createElement('span');
        let rotate90 = this.options.expand ? 'rotate90' : '';
        let addHeight = this.options.expand ? 'add-height' : '';
        folder.setAttribute('class', theme + 'folder ' + rotate90);
        folder.onclick = function (e) {
            let nextSibling = e.target.parentNode.nextSibling;
            self.toggleItem(nextSibling, e.target);
            e.stopPropagation(); // Prevent the parent click handler from firing.
        };
        let len = isObject(val) ? Object.keys(val).length : val.length;
        let isObj = isObject(val);
        
        left.innerHTML = isObj ? `${key}<span class="jv-${theme}-symbol">&nbsp;:&nbsp;</span>{${len}}` : `${key}<span class="jv-${theme}-symbol">&nbsp;:&nbsp;</span>[${len}]`;
        left.prepend(folder);
        right.setAttribute('class', theme + 'rightObj ' + addHeight);
        self.parse(val, right, indent + 1, theme);
    };
  
    /**
     * Parses and iterates over a data object or array to render its items.
     * @param {object|Array} dataObj - The data to parse.
     * @param {HTMLElement} parent - The parent DOM element to append children to.
     * @param {number} indent - The current indentation level.
     * @param {string} theme - The CSS class prefix.
     */
    JsonViewer.prototype.parse = function(dataObj, parent, indent, theme) {
        const self = this;
        this.forEach(dataObj, function (val, key) {
            const { left, right } = self.createItem(indent, theme, parent, key, typeof val !== 'object' || isNull(val));
            if (typeof val !== 'object' || isNull(val)) {
                self.renderRight(theme, right, val);
            } else {
                self.renderChildren(theme, key, val, right, indent, left);
            }
        });
    };

    /**
     * Creates a single key-value item in the DOM.
     * @param {number} indent - The indentation level for this item.
     * @param {string} theme - The CSS class prefix.
     * @param {HTMLElement} parent - The parent DOM element.
     * @param {string} key - The key of the item.
     * @param {boolean} basicType - True if the value is a primitive type (string, number, etc.).
     * @returns {object} An object containing the left (key) and right (value) DOM elements.
     */
    JsonViewer.prototype.createItem = function(indent, theme, parent, key, basicType) {
        let self = this;
        let current = this.createElement('div');
        let left = this.createElement('div');
        let right = this.createElement('div');
        let wrap = this.createElement('div');

        current.style.marginLeft = indent * 20 + 'px'; // Increased indent for readability
        if (basicType) {
            left.innerHTML = `${key}<span class="jv-${theme}-symbol">&nbsp;:&nbsp;</span>`;
            current.appendChild(wrap);
            wrap.appendChild(left);
            wrap.appendChild(right);
            parent.appendChild(current);
            wrap.setAttribute('class', 'jv-wrap');
        } else {
            current.appendChild(left);
            current.appendChild(right);
            parent.appendChild(current);
            left.classList.add('jv-folder');
            left.onclick = function (e) {
                let nextSibling = e.target.nextSibling;
                self.toggleItem(nextSibling, e.target.querySelector('span.' + theme + 'folder'));
            };
        }
        current.setAttribute('class', theme + 'current');
        left.setAttribute('class', theme + 'left');
        
        return { left, right, current };
    };

    /**
     * Initial render method to start the process.
     */
    JsonViewer.prototype.render = function () {
        let data = this.options.data;
        let theme = 'jv-' + this.options.theme + '-';
        let indent = 0;
        let parent = this.options.container;
        let key = isArray(data) ? 'array' : 'object';
        
        parent.setAttribute('class', theme + 'con');
        const { left, right } = this.createItem(indent, theme, parent, key, false);
        this.renderChildren(theme, key, data, right, indent, left);
    };

    /**
     * Toggles the visibility of a collapsible section.
     * @param {HTMLElement} ele - The element to show/hide.
     * @param {HTMLElement} target - The folder icon element to rotate.
     */
    JsonViewer.prototype.toggleItem = function (ele, target) {
        ele.classList.toggle('add-height');
        if (target) {
            target.classList.toggle('rotate90');
        }
    };

    /**
     * Utility to create a DOM element.
     * @param {string} type - The type of element to create (e.g., 'div').
     * @returns {HTMLElement}
     */
    JsonViewer.prototype.createElement = function (type) {
        return document.createElement(type);
    };

    /**
     * A custom forEach loop that works for both arrays and objects.
     * @param {Array|object} obj - The collection to iterate over.
     * @param {Function} fn - The callback function (val, key, obj).
     */
    JsonViewer.prototype.forEach = function (obj, fn) {
        if (isUndefined(obj) || isNull(obj)) { return; }
        if (isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                fn.call(null, obj[i], i, obj);
            }
        } else {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    fn.call(null, obj[key], key, obj);
                }
            }
        }
    };

    /**
     * Listen for messages from the VS Code extension backend.
     */
    window.addEventListener('message', event => {
        const message = event.data;
        const loader = document.getElementById('loader');
        const viewerContainer = document.getElementById('json-viewer');

        if (message.command === 'renderJson') {
            // Hide loader and show viewer container.
            loader.style.display = 'none';
            viewerContainer.style.display = 'block';

            // Instantiate the JsonViewer with the received data.
            new JsonViewer({
                container: viewerContainer,
                data: message.data,
                theme: 'light',
                expand: true
            });
        }
    });
})();

























