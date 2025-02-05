import {PropertyPath} from './property_path.mjs';

// region Private methods

/**
 * Map with intercepting functions. All of them mutates object.
 * value is a value in case of cancelled event
 *
 * @type {Map<Function, function>}
 */
const intercepting = new Map([
    [Array.prototype.push, () => 0],
    [Array.prototype.pop, () => undefined],
    [Array.prototype.shift, () => undefined],
    [Array.prototype.unshift, x => x?.length || 0],
    [Array.prototype.splice, () => []],
    [Array.prototype.sort, arr => arr],
    [Array.prototype.reverse, arr => arr],
    [Array.prototype.copyWithin, arr => arr],
    [Array.prototype.fill, arr => arr],
]);

/**
 * Checks whether a given value is a reference type (object or array).
 * @param {any} obj - The value to check.
 * @returns {boolean} - True if the value is an object or array, false otherwise.
 */
function is_ref_type(obj) {
    if (obj == null) return false;
    return Array.isArray(obj) || ['function', 'object'].includes(typeof obj);
}

/**
 *
 * @param obj {any}
 * @param prop_path {PropertyPath}
 * @param visited {WeakSet<any>}
 * @returns {Generator<[any, PropertyPath], *, *>}
 */
function* obj_iterate(obj, prop_path = new PropertyPath(''), visited = new WeakSet()) {
    if (visited.has(obj)) return;

    yield [obj, prop_path];
    if (!is_ref_type(obj)) return;

    visited.add(obj);

    for (let key of new Set([
        ...Object.keys(obj),
        ...Object.getOwnPropertyNames(obj),
        ...Object.getOwnPropertySymbols(obj),
    ])) {
        for (let ret of obj_iterate(obj[key], prop_path.join(key), visited)) {
            yield ret;
        }
    }
}

/**
 * Recursively checks for frozen objects in the given object structure.
 * Throws an error if a frozen object is found, since reactivity requires mutability.
 *
 * @param {object} obj - The object to check.
 */
function check_for_frozen_objects(obj) {
    for (let [elem] of obj_iterate(obj)) {
        if (is_ref_type(elem) && Object.isFrozen(elem))
            throw new Error('ReactiveState does not support frozen objects or objects with frozen children.');
    }
}

// endregion

class ReactiveState {
    #proxy_cache = new WeakMap();
    #subscription = {
        change: new EventTarget(),
        call: new EventTarget(),
        notify: new Map(),
    };
    #notify_queue = new Set();
    #timer = 0;
    #debounce = 100;

    constructor(src, {debounce = 100} = {}) {
        this.#debounce = debounce;
        this.state = this.#create_proxy(src, new PropertyPath(''));
        this.#send_notify_batch();
    }

    // region event helping

    /**
     * Equals function. By default using '==='
     * @param path {PropertyPath} path from root to current property
     * @param left {any}
     * @param right {any}
     * @returns {boolean}
     */
    #is_equal(path, left, right) {
        return left === right;
    }

    /**
     * @param type {'change' | 'notify' | 'call'}
     * @param id {PropertyPath}
     * @return {boolean}
     */
    #has_listener(type, id) {
        const source = this.#subscription[type];
        if (source instanceof Map) return source.has(id);
        if (source?._keys instanceof Set) return source._keys.has(id);
        return false;
    }

    // endregion

    // region notify event

    /**
     * Signal that property was changed. Will schedule batch update later.
     * @param props {PropertyPath} - path from root to property
     * @returns {number}
     */
    notify_property_changed(...props) {
        try {
            return props.filter(x => this.#subscription.notify.has(x))
                .map(x => this.#notify_queue.add(x))
                .length;
        } finally {
            if (this.#debounce <= 0) this.#send_notify_batch();
        }
    }

    /**
     * Delivers batch of pending notify events
     */
    #send_notify_batch() {
        clearTimeout(this.#timer);

        const copy = Array.from(this.#notify_queue);
        this.#notify_queue.clear()

        for (let prop_path of copy) {
            const set = this.#subscription.notify.get(prop_path);
            if (set?.size) {
                for (let fn of set) {
                    try {
                        fn(prop_path);
                    } catch (e) {
                        console.error(`[ReactiveState] Observer error for ${prop_path}:`, e);
                    }
                }
            }
        }

        if (this.#debounce > 0)
            this.#timer = setTimeout(this.#send_notify_batch.bind(this), this.#debounce);
    }

    /**
     * Returns all possible changes within object
     *
     * @param path {PropertyPath} path to current proeprties
     * @param old {any} - old value
     * @param current {any} - current value
     * @param visited - list of visited proeprties
     * @returns {Generator<[PropertyPath, any, any], void, *>}
     */
    * children_diff(path, old, current, visited = new WeakSet()) {
        if (visited.has(path)) return;

        for (let [left, right] of [[old, current], [old, current].reverse()]) {
            if (left == null) continue;

            for (let [elem, relative_prop] of obj_iterate(left)) {
                const absolute = new PropertyPath([path, relative_prop]);
                if (visited.has(absolute)) continue;

                visited.add(absolute);
                const r_elem = relative_prop.resolve(right);
                if (!this.#is_equal(absolute, elem, r_elem))
                    yield [absolute, elem, r_elem];
            }
        }
    }

    // endregion

    // region change event

    /**
     *
     * @param root_path {PropertyPath} path pointing on target (not on the prop!)
     * @param target {any} - direct property owner
     * @param prop {string} - property name
     * @param current {any}  - value we want to set
     * @param unset {boolean} - should unset property?
     * @returns {*|boolean}
     */
    #raise_change_event(root_path, target, prop, current, unset) {
        // reference to compare function
        const self = this;
        const old = target?.[prop];

        const full_path = root_path.join(prop);

        // value was not actually change
        if (self.#is_equal(full_path, old, current)) return false;

        const event = Object.assign(
            new Event(full_path.toString(), {bubbles: true, cancelable: true}),
            {
                get old() {
                    return old;
                },
                get path() {
                    return full_path;
                },
                current,
                unset,
            });

        function apply_changes() {
            // handle delete for arrays as JS do
            if (event.unset && prop in target && Array.isArray(target)) {
                target[prop] = undefined;
                return full_path;
            }

            // handle delete for any other objects
            if (event.unset && prop in target && !Array.isArray(target)) {
                delete target[prop];
                return full_path;
            }

            // set updated value
            if (!event.unset && !self.#is_equal(full_path, event.old, event.current)) {
                target[prop] = event.current;
                return full_path;
            }
        }

        // cancel event
        if (!this.#subscription.change.dispatchEvent(event)) return false;

        // was it the meaningful changes?
        if (!apply_changes()) return false;

        // raise the change for parent and possible children changes
        this.notify_property_changed(full_path, ...this.children_diff(full_path, old, event.current)
            .map(x => x[0])
            .filter(x => this.#has_listener('notify', x))
            .toArray());

        return true;
    }

    // endregion

    // region call event

    /**
     * Intercept function
     *
     * @param path {PropertyPath} - property path from root to target (not function!)
     * @param fn {function} - original function
     * @param return_on_cancel {function(target: any, args: any[]): any} - return callback if cancelled call via event handling
     * @param target {any} - thisArg
     * @param args {any[]} - fn args
     * @param is_mutating {boolean} - the function mutates target?
     */
    #intercept(path, fn, return_on_cancel, target, args, is_mutating = false) {
        const event = Object.assign(
            new Event(path.toString(), {bubbles: true, cancelable: true}),
            {
                get path() {
                    return path;
                },
                get fn() {
                    return fn;
                },
                this_arg: target,
                args: args
            },
        );

        // return default value
        if (!this.#subscription.call.dispatchEvent(event)) return return_on_cancel(target, args);

        // shallow copy of object
        const old = is_mutating
            ? Array.isArray(target) && Array.from(target)
            || typeof target == 'object' && Object.assign({}, target)
            : null;

        try {
            Reflect.apply(fn, target, args);
        } finally {
            if (is_mutating) {
                const calculated_changes = this.children_diff(path, old, target)
                    .map(x => x[0])
                    .toArray();

                // any change mutate target, assume changes were made
                if (calculated_changes.length)
                    calculated_changes.push(path);

                this.notify_property_changed(...calculated_changes);
            }
        }
    }

    // endregion

    // region Events

    /**
     * Observe for the property path changed
     *
     * @param type {'change' | 'notify' | 'call'} which event will listen
     * @param id {PathParsable | PathParsable[]} path to property
     * @param callback {Function} - callback
     * @returns {boolean} true if was subscribed
     */
    observe(type, id, callback) {
        if (!(id instanceof PropertyPath))
            id = new PropertyPath(id);

        const source = this.#subscription[type];

        if (source instanceof Map) {
            if (!source.has(id)) source.set(id, new Set());
            const set = source.get(id);
            set.add(callback);
            return true;
        }

        if (source instanceof EventTarget) {
            const id_str = id.toString();
            source.removeEventListener(id_str, callback);
            source.addEventListener(id_str, callback);

            source._keys ??= new Set();
            source._keys.add(id);
            return true;
        }

        return false;
    }

    // endregion

    // region Proxy

    /**
     *
     * @param obj {any}
     * @param path_from_root {PropertyPath}
     * @returns {*|object}
     */
    #create_proxy(obj, path_from_root) {
        if (!is_ref_type(obj))
            return obj;
        if (this.#proxy_cache.has(obj))
            return this.#proxy_cache.get(obj);
        check_for_frozen_objects(obj);

        const self = this;

        const proxy = new Proxy(obj, {
            get: function _getter(target, p) {
                let value = target?.[p];
                switch (p) {
                    // special properties
                    case '__isProxy':
                        return true;
                    case '__target':
                        return target;

                    // simple values returns 'as-is'
                    case !is_ref_type(value):
                        return value;

                    // do not proxy functions, use apply trap instead
                    case typeof value == 'function':
                        return value;

                    default:
                        return self.#create_proxy(value, path_from_root.join(p));
                }
            },
            set: function _set(target, p, value) {
                self.#raise_change_event(path_from_root, target, p, value, false);
                return true;
            },
            deleteProperty: function _deleteProperty(target, p) {
                self.#raise_change_event(path_from_root, target, p, null, true);
                return true;
            },
            apply: function (fn, thisArg, argArray) {
                // can intercept this function
                if (intercepting.has(fn)) {
                    const actual_target = thisArg?.__isProxy && thisArg.__target || thisArg;
                    // observe value from this state
                    if (self.#proxy_cache.has(actual_target)) {
                        return self.#intercept(path_from_root.parent(), fn, intercepting.get(fn), actual_target, argArray, true);
                    }
                }

                return Reflect.apply(fn, thisArg, argArray);
            }
        });
        this.#proxy_cache.set(obj, proxy);
        return proxy;
    }

    // endregion
}

/**
 * Creates reactive state
 *
 * @param src {Object} state initial source
 * @param debounce {number} batch delivery of notify to prevent over flooding
 * @returns {ReactiveState}
 */
export function r(src, {debounce = 0} = {}) {
    return new ReactiveState(src, {debounce});
}
