/**
 * @module property_path
 */

(function () {
    class PathSegment {
        /**
         * @param path {string}
         * @param type {'object' | 'array' | 'function'}
         */
        constructor(path, type = 'object') {
            path ??= '';
            path = path.trim();

            if (path.endsWith('()')) {
                type = 'function';
                path = path.slice(0, -2);
            }

            this.path = path;
            this.type = type;
        }

        #create_new_node() {
            switch (this.type) {
                case "array":
                    return [];
                case "function":
                    return function HelloWorld() {
                    };

                case 'object':
                default:
                    return {};
            }
        }

        get(root) {
            if (!root) return null;

            root = root[this.path];

            if (this.type === 'function') {
                root = root?.() ?? root;
            }

            return root;
        }

        init(root, {value = null, unset = false} = {}) {
            if (!root) return false;

            if (unset) {
                delete root[this.path];
                return true;
            }

            if (value != null) {
                root[this.path] = value;
                return true;
            }

            if (!root.hasOwnProperty(this.path))
                root[this.path] = this.#create_new_node();

            return true;
        }
    }

    class PropertyPath {
        /*** @type {PathSegment[]}*/
        #segments = []

        #can_lookup(root) {
            return root != null && (Array.isArray(root) || typeof root === 'object');
        }

        constructor(path) {
            if (path instanceof PropertyPath)
                path = path.#segments;

            if (typeof path === 'string') {
                path = path.trim()
                    .replaceAll(']', '')
                    .replaceAll('[', '.')
                    .split('.');
            }

            this.#segments = path.filter(x => !!x?.length).map(x => new PathSegment(x));
        }

        toString() {
            return this.#segments.map(x => x.path).join('.');
        }

        resolve(root) {
            for (const item of this.#segments) {
                root = this.#can_lookup(root)
                    ? item.get(root)
                    : null;
            }
            return root;
        }

        set(root, value) {
            if (!this.#can_lookup(root)) return false;

            for (let i = 0; i < this.#segments.length; i++) {
                const segment = this.#segments[i];

                // last item
                if (i === this.#segments.length - 1) {
                    return segment.init(root, {value});
                }

                if (!segment.init(root)) return false;
                root = segment.get(root);
            }

            return false;
        }

        /**
         * Checks if this PropertyPath affects the given path
         * @param {PropertyPath} other
         * @returns {boolean}
         */
        affects(other) {
            if (!(other instanceof PropertyPath)) return false;

            // Ensure this path is a prefix of the otherPath
            if (this.#segments.length > other.#segments.length) return false;
            return this.#segments.every((value, index) => value.path === other.#segments[index].path);
        }
    }

    const _this = {
        define: typeof define != 'undefined' && typeof define.amd != 'undefined' && define,
        module: typeof module != 'undefined' && typeof module.exports != 'undefined' && module,
        global: typeof globalThis != 'undefined' && globalThis
            || typeof self != 'undefined' && self
            || typeof global != 'undefined' && global
            || typeof window != 'undefined' && window
    };

    /**
     * @exports
     * @type {{PathSegment: PathSegment, PropertyPath: PropertyPath}}
     */
    const E = {PathSegment, PropertyPath};

    if (!_this.global?.uni_export?.call(_this, E)) {
        console.error('Cannot export')
    }
})();

