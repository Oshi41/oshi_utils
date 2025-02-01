/*** @typedef {(PropertyPath | string) | (string | PropertyPath)[]} PathType*/

/*** @typedef {'mutate' | 'delete' | 'update'} UpdateType*/
/**
 * @typedef {Function} ObserverCallback
 * @template T
 * @param {T} new_state
 * @param {PropertyPath} path
 * @param {UpdateType} type
 */

class PropertyPath {
    /**
     * Static cache to enforce uniqueness
     * @type {Map<string, WeakRef<PropertyPath>>}
     */
    static #instances = new Map();

    /*** @type {string[]}*/
    #paths = [];
    #hash;

    /**
     * @param path {PathType}
     */
    constructor(path) {

        // for single string - parse as dotted notation
        if (typeof path === 'string')
            path = path.split('.').filter(x => x?.length > 0);

        // convert to arr
        if (!Array.isArray(path)) path = [path];

        for (let part of path) {

            if (part instanceof PropertyPath)
                this.#paths.push(...part.#paths);

            else if (typeof part == 'string')
                this.#paths.push(part);
        }

        this.#hash = JSON.stringify(this.#paths);

        // Enforce uniqueness: Return existing instance if already created
        const existing = PropertyPath.#instances.get(this.#hash);
        if (!!existing?.deref()) return existing.deref();

        // Otherwise, cache this instance
        PropertyPath.#instances.set(this.#hash, new WeakRef(this));
    }

    resolve(root) {
        let current = root;
        for (let i = 0; i < this.#paths.length && current != null; i++) {
            current = current?.[this.#paths[i]];
        }
        return current;
    }

    /**
     * @returns {PropertyPath[]}
     */
    affected_paths() {
        let paths = new Set();
        paths.add(new PropertyPath([]));
        for (let i = 0; i < this.#paths.length - 1; i++) {
            paths.add(new PropertyPath(this.#paths.slice(0, i + 1)));
        }
        paths.add(this);
        paths =  Array.from(paths);
        return paths;
    }

    toString() {
        return this.#paths.join('=>');
    }
}

class ReactiveState {
    /**@type {Map<PropertyPath, function[]>}*/
    #observers = new Map();
    #proxyCache = new WeakMap(); // Cache for already proxied objects

    constructor(initialState = {}) {
        this.#check_for_frozen_objects(initialState);
        this.state = this.#create_reactive(initialState, new PropertyPath([]));
    }

    /**
     *
     * @param obj
     * @param path {PropertyPath}
     * @returns {*|object|boolean}
     */
    #create_reactive(obj, path) {
        if (typeof obj !== 'object' || obj === null) return obj;

        if (this.#proxyCache.has(obj)) {
            return this.#proxyCache.get(obj);
        }

        const self = this;

        const proxy = new Proxy(obj, {
            get(target, prop) {
                if (prop === '__isProxy') return true;
                const value = target[prop];
                return self.#create_reactive(value, new PropertyPath([path, prop]));
            },

            set(target, prop, value) {
                const fullPath = new PropertyPath([path, prop]);
                const oldValue = target[prop]; // Preserve the old value for comparison

                // Check if the new value is an object and needs to be proxied
                const reactiveValue = self.#create_reactive(value, fullPath);
                target[prop] = reactiveValue;

                // Notify for changes, even if the path didn't previously exist
                if (!target.hasOwnProperty(prop)) {
                    self.#notify(self.#get_all_paths(fullPath, reactiveValue), 'update');
                } else if (oldValue !== reactiveValue) {
                    // If the value is the same reference, no need to notify
                    self.#notify(fullPath, 'update');

                    if (typeof oldValue === 'object' && oldValue !== null &&
                        typeof reactiveValue === 'object' && reactiveValue !== null) {
                        self.#diff_and_notify(fullPath, oldValue, reactiveValue);
                    } else {
                        self.#notify_subtree(fullPath, reactiveValue);
                    }
                }

                return true;
            },

            deleteProperty(target, prop) {
                const fullPath = new PropertyPath([path, prop]);
                if (prop in target) {
                    const old = target[prop];
                    if (Array.isArray(target)) {
                        target[prop] = undefined;
                    } else {
                        delete target[prop];
                    }
                    self.#notify(self.#get_all_paths(fullPath, old), 'delete');
                }
                return true;
            },

            apply(target, thisArg, argumentsList) {
                const result = Reflect.apply(target, thisArg, argumentsList);
                self.#notify(path.affected_paths(), 'mutate');
                return result;
            },
        });

        this.#proxyCache.set(obj, proxy);
        return proxy;
    }

    observe(path, callback) {
        const normalizedPath = new PropertyPath(path);

        if (!this.#observers.has(normalizedPath)) {
            this.#observers.set(normalizedPath, []);
        }
        this.#observers.get(normalizedPath).push(callback);
    }

    unobserve(path, callback) {
        const normalizedPath = new PropertyPath(path);

        if (this.#observers.has(normalizedPath)) {
            const callbacks = this.#observers.get(normalizedPath).filter((cb) => cb !== callback);
            if (callbacks.length > 0) {
                this.#observers.set(normalizedPath, callbacks);
            } else {
                this.#observers.delete(normalizedPath);
            }
        }
    }

    #get_all_paths(path, obj) {
        const paths = [];

        const traverse = (currentPath, currentObj) => {
            paths.push(currentPath); // Add the current path

            if (typeof currentObj === 'object' && currentObj !== null) {
                for (const key of Object.keys(currentObj)) {
                    const fullPath = new PropertyPath([currentPath, key]);
                    traverse(fullPath, currentObj[key]);
                }
            }
        };

        traverse(path, obj);
        return paths;
    }

    #check_for_frozen_objects(obj, visited = new WeakSet()) {
        if (!!obj && typeof obj === 'object') {
            if (visited.has(obj)) return;
            visited.add(obj);

            if (Object.isFrozen(obj)) {
                throw new Error('ReactiveState does not support frozen objects or objects with frozen children.');
            }

            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    this.#check_for_frozen_objects(obj[key], visited);
                }
            }
        }
    }

    #diff_and_notify(path, oldObj, newObj) {
        const oldKeys = new Set(Object.keys(oldObj));
        const newKeys = new Set(Object.keys(newObj));

        // Notify for updated or added keys
        for (const key of newKeys) {
            const fullPath = new PropertyPath([path, key]);
            if (!oldKeys.has(key)) {
                // New property
                this.#notify(fullPath, 'update');
                this.#notify_subtree(fullPath, newObj[key]);
            } else if (oldObj[key] !== newObj[key]) {
                // Changed property
                if (typeof oldObj[key] === 'object' && oldObj[key] !== null &&
                    typeof newObj[key] === 'object' && newObj[key] !== null) {
                    // Recurse into nested objects
                    this.#diff_and_notify(fullPath, oldObj[key], newObj[key]);
                } else {
                    this.#notify(fullPath, 'update');
                }
            }
        }

        // Notify for deleted keys
        for (const key of oldKeys) {
            if (!newKeys.has(key)) {
                const fullPath = new PropertyPath([path, key]);
                this.#notify(fullPath, 'delete');
            }
        }
    }

    #notify_subtree(path, obj) {
        if (typeof obj !== 'object' || obj === null) {
            this.#notify(path, 'update'); // Notify for non-object values directly
            return;
        }

        this.#notify(path, 'update'); // Notify for the root of the subtree
        for (const key of Object.keys(obj)) {
            const fullPath = new PropertyPath([path, key]);
            this.#notify_subtree(fullPath, obj[key]); // Recurse for each child key
        }
    }

    /**
     * @param paths {PropertyPath | PropertyPath[]}
     * @param type {UpdateType}
     */
    #notify(paths, type) {
        if (!Array.isArray(paths)) paths = [paths];
        for (let path of paths) {
            for (let callback of (this.#observers.get(path) ?? [])) {
                callback(this.state, path, type);
            }
        }
    }
}

/**
 *
 * @param state {T}
 * @template T
 * @returns {{
 *     state: T,
 *     observe: function(path: PathType, ObserverCallback)
 * }}
 */
export function r(state = {}) {
    return new ReactiveState(state);
};

/**
 * @param paths {PathType}
 */
export function prop(paths) {
    return new PropertyPath(paths);
}