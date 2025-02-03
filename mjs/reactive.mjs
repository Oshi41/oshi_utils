import {PropertyPath} from './property_path.mjs';

// region Private methods

const history = Symbol('history');

/**
 * Checks whether a given value is a reference type (object or array).
 * @param {any} obj - The value to check.
 * @returns {boolean} - True if the value is an object or array, false otherwise.
 */
function is_ref_type(obj) {
    return obj != null && (Array.isArray(obj) || typeof obj === 'object');
}

/**
 * Recursively checks for frozen objects in the given object structure.
 * Throws an error if a frozen object is found, since reactivity requires mutability.
 *
 * @param {object} obj - The object to check.
 * @param {WeakSet<object>} visited - A set of visited objects to avoid infinite recursion.
 */
function check_for_frozen_objects(obj, visited = new WeakSet()) {
    if (!is_ref_type(obj) || visited.has(obj)) return; // Skip non-objects and already visited objects

    visited.add(obj);

    if (Object.isFrozen(obj)) {
        throw new Error('ReactiveState does not support frozen objects or objects with frozen children.');
    }

    // Recursively check all own properties
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            check_for_frozen_objects(obj[key], visited);
        }
    }
}

// endregion

class ReactiveState extends EventTarget {
    #proxyCache = new WeakMap();
    #subscription = {
        change: new EventTarget(),
        /*** @type {Map<PropertyPath, Set<function>>}*/
        notify: new Map(),
    };
    /**
     * @type {Set<PropertyPath>}
     */
    #notify_queue = new Set();
    #timer = 0;
    #debounce = 100;

    constructor(src, {debounce = 100} = {}) {
        super();
        this.#debounce = debounce;
        this.state = this.#create_proxy(src, new PropertyPath(''));
        this.#on_batch_update();
    }

    // region Events


    /**
     *
     * @param type {'change' | 'notify'}
     * @return {PropertyPath[]}
     */
    #listening_props(type) {
        const set = this.#subscription[type]?.[history];
        if (!set?.size) return [];

        return [...set];
    }

    /**
     * Delivers batch of pending notify events
     */
    #on_batch_update() {
        clearTimeout(this.#timer);

        const copy = Array.from(this.#notify_queue);
        this.#notify_queue.clear()

        for (let prop_path of copy) {
            const set = this.#subscription.notify.get(prop_path.toString());
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
            this.#timer = setTimeout(this.#on_batch_update.bind(this), this.#debounce);
    }

    /**
     * Checks if subtree need to be notified
     *
     * @param path {PropertyPath} - full path to property
     * @param old
     * @param current {any} - updated value
     */
    #diff_and_notify(path, old, current) {
        for (let key of this.#listening_props('notify').filter(x => path.affects(x))) {
            const old_value = key.resolve(old);
            const current_value = key.relative(path)?.resolve?.(current);
            if (old_value !== current_value) {
                this.#notify_queue.add(key);
            }
        }

        // works instantly
        if (this.#debounce <= 0)
            this.#on_batch_update();
    }

    /**
     *
     * @param event {Event & {unset, current}}
     * @param target {any}
     * @param prop {string}
     * @param fullpath {PropertyPath}
     */
    #apply_change_event(event, target, prop, fullpath) {
        if (event.cancelable && event.defaultPrevented || !target) return false;

        if (!(prop in target)) return false;

        if (!event.unset && target[prop] !== event.current) {
            const old = target[prop];
            target[prop] = event.current;
            this.#diff_and_notify(fullpath, old, event.current);
            return true;
        }

        if (!event.unset && Array.isArray(target) && target[prop] !== undefined) {
            const old = target[prop];
            target[prop] = undefined;
            this.#diff_and_notify(fullpath, old, undefined);
            return true;
        }

        if (!event.unset && prop in target) {
            const old = target[prop];
            delete target[prop];
            this.#diff_and_notify(fullpath, old, undefined);
            return true;
        }

        return false;
    }

    /**
     * Observe for the property path changed
     *
     * @param type {'change' | 'notify'} which event will listen
     * @param property_path {PropertyPath} path to property
     * @param callback {Function} - callback
     * @returns {boolean} true if was subscribed
     */
    observe(type, property_path, callback) {
        property_path = new PropertyPath(property_path);
        const id = property_path.toString();
        const event_by_type = this.#subscription[type];

        function save_history() {
            (event_by_type[history] ??= new Set()).add(property_path);
            return true;
        }

        if (event_by_type instanceof EventTarget) {
            event_by_type.removeEventListener(id, callback);
            event_by_type.addEventListener(id, callback);

            return save_history();
        }

        if (event_by_type instanceof Map) {
            if (!event_by_type.has(id))
                event_by_type.set(id, new Set());

            const set = event_by_type.get(id);
            set.add(callback);
            return save_history();
        }

        return false;
    }

    // endregion

    // region Proxy

    #create_proxy(obj, path_from_root) {
        if (!is_ref_type(obj)) return obj;
        if (this.#proxyCache.has(obj)) return this.#proxyCache.get(obj);
        check_for_frozen_objects(obj);

        const proxy = new Proxy(obj, {
            get: this.#create_proxy_getter(path_from_root),
            set: this.#create_proxy_setter(path_from_root),
            deleteProperty: this.#create_proxy_delete(path_from_root),
        });
        this.#proxyCache.set(obj, proxy);
        return proxy;
    }

    /**
     * Intercepts property access and ensures the returned value is also reactive
     * @param root_path {PropertyPath} path from root to this object
     * @returns {ProxyHandler.get}
     */
    #create_proxy_getter(root_path) {
        const self = this;
        return function _getter(target, prop, receiver) {
            // Special marker to identify proxies
            if (prop === '__isProxy') return true;
            const value = target[prop];
            // Wrap the value in a proxy if needed
            return self.#create_proxy(value, new PropertyPath([root_path, prop]));
        }
    }

    /**
     * Intercepts property modifications, raises a change event, and updates the object
     *
     * @param root_path {PropertyPath}
     * @returns {ProxyHandler.deleteProperty}
     */
    #create_proxy_setter(root_path) {
        const self = this;
        return function _setter(target, prop, value) {
            // Construct full property path
            const prop_path = new PropertyPath([root_path, prop]);
            // Store old value for event comparison
            const old_value = target[prop];
            if (value === old_value) return true;

            const event = Object.assign(
                new Event(prop_path.toString(), {bubbles: true, cancelable: true}),
                {path: prop_path, old: old_value, current: value, unset: false},
            );

            if (self.#subscription.change.dispatchEvent(event)) {
                self.#apply_change_event(event, target, prop, prop_path);

            }

            // Proxy traps must return true for successful operation
            return true;
        }
    }

    /**
     * Intercepts property deletion, raises a delete event, and removes the property.
     *
     * @param root_path {PropertyPath}
     * @returns {ProxyHandler.deleteProperty}
     */
    #create_proxy_delete(root_path) {
        const self = this;
        return function _delete_property(target, prop) {
            const prop_path = new PropertyPath([root_path, prop]);
            if (!(prop in target)) return false; // Return false if the property doesn't exist

            const event = Object.assign(
                new Event(prop_path.toString(), {bubbles: true, cancelable: true}),
                {path: prop_path, current: target[prop], unset: true},
            );

            if (self.#subscription.change.dispatchEvent(event)) {
                self.#apply_change_event(event, target, prop, prop_path);
            }

            return true;
        }
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
