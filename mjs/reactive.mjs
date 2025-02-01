import {PropertyPath} from './property_path.mjs';

// Cache for proxies to avoid redundant wrapping of the same object.
const proxyCache = new WeakMap();

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

/**
 * Creates a reactive proxy that watches changes in an object.
 *
 * @fires create_proxy#change
 * @fires create_proxy#delete
 * @fires create_proxy#notify
 *
 * @template T
 * @param {T} obj - The object to wrap in a proxy.
 * @param {PropertyPath} path - The property path leading to this object.
 * @returns {Proxy<T>} - The reactive proxy of the object.
 */
function create_proxy(obj, path) {
    // Return an existing proxy from cache if available
    let proxy = proxyCache.get(obj);
    if (proxy) return proxy;

    // If the object is a primitive value, return it as-is
    if (!is_ref_type(obj)) return obj;

    // Ensure the object and its children are not frozen
    check_for_frozen_objects(obj);

    /**
     * Event management for the reactive proxy
     * @type {EventTarget & {status: 'active' | 'blocked' | 'queued', queue: Function[]}}
     */
    const events = Object.assign(new EventTarget(), {status: 'active', queue: []});

    /**
     * Raises an event and optionally executes a callback if the event is not blocked.
     *
     * @template T
     * @param {T} e - The event object to dispatch.
     * @param {function(e: T): void} [continue_with] - Optional callback executed if the event is not blocked.
     * @returns {boolean} - True if the event was successfully dispatched, false otherwise.
     */
    function raise(e, continue_with) {
        switch (events.status) {
            case "queued":
                // If events are queued, store the event for later execution
                events.queue.push(() => raise(e, continue_with));
                return false;

            case "blocked":
                // If blocked, directly call the callback if provided
                continue_with?.(e);
                return true;

            case "active":
                // Dispatch the event and call the callback if not canceled
                if (!events.dispatchEvent(e)) return false;
                continue_with?.(e);
                return true;

            default:
                console.warn('Unknown events status');
                return false;
        }
    }

    /**
     * Notifies about changes in the object tree.
     * Currently, this function is empty, but should ideally dispatch an event.
     *
     * @event create_proxy#notify
     * @param {PropertyPath} path - The path where the change occurred.
     */
    function notify(path) {
        // TODO: Implement notification logic
    }

    // Create the proxy
    proxy = new Proxy(obj, {
        /**
         * Intercepts property access and ensures the returned value is also reactive.
         *
         * @param {object} target - The original object.
         * @param {string | symbol} prop - The property being accessed.
         * @returns {any} - The property value, wrapped in a proxy if necessary.
         */
        get(target, prop) {
            if (prop === '__isProxy') return true; // Special marker to identify proxies
            const value = target[prop];
            return create_proxy(value, new PropertyPath([path, prop])); // Wrap the value in a proxy if needed
        },

        /**
         * Intercepts property modifications, raises a change event, and updates the object.
         *
         * @param {object} target - The original object.
         * @param {string | symbol} prop - The property being modified.
         * @param {any} value - The new value to be set.
         * @returns {boolean} - Always true to indicate success.
         */
        set(target, prop, value) {
            const prop_path = new PropertyPath([path, prop]); // Construct full property path
            const old_value = target[prop]; // Store old value for event comparison

            /**
             * Fires an event before changing the property.
             *
             * @event create_proxy#change
             * @type {Event & {path: PropertyPath, old: any, value: any}}
             */
            raise(Object.assign(
                new Event('change', {bubbles: true, cancelable: true}),
                {path: prop_path, old: old_value, value}
            ), function _after_change(e) {
                // Ensure the new value is also reactive
                target[prop] = create_proxy(e.value, prop_path);
                notify(prop_path);
            });

            return true; // Proxy traps must return true for successful operation
        },

        /**
         * Intercepts property deletion, raises a delete event, and removes the property.
         *
         * @param {object} target - The original object.
         * @param {string | symbol} prop - The property to be deleted.
         * @returns {boolean} - True if deletion was successful, false otherwise.
         */
        deleteProperty(target, prop) {
            const prop_path = new PropertyPath([path, prop]);
            if (!(prop in target)) return false; // Return false if the property doesn't exist

            /**
             * Fires an event before deleting a property.
             *
             * @event create_proxy#delete
             * @type {Event & {path: PropertyPath, value: any}}
             */
            raise(Object.assign(
                new Event('delete', {bubbles: true, cancelable: true}),
                {path: prop_path, value: target[prop]}
            ), function after_delete_confirmed() {
                // Mimic JavaScript behavior for array deletions
                if (Array.isArray(target)) {
                    target[prop] = undefined; // Leave an undefined slot in arrays
                } else {
                    delete target[prop]; // Remove property from objects
                }
                notify(prop_path);
            });

            return true;
        },
    });

    // Cache the proxy to prevent redundant wrapping
    proxyCache.set(obj, proxy);
    return proxy;
}

export {create_proxy as r};
