import {reuse} from './reuse.mjs';

/**
 * Represents a segment of a property path.
 * Used to navigate and manipulate nested object structures.
 */
export class PathSegment {
    /**
     * @param {string} path - The key or property name in the object.
     * @param {'object' | 'array' | 'function'} [type='object'] - The expected data type of this segment.
     */
    constructor(path, type = 'object') {
        path ??= ''; // Default to an empty string if `null` or `undefined`
        path = path.trim(); // Remove unnecessary whitespace

        // If the path ends with `()`, treat it as a function call
        if (path.endsWith('()')) {
            type = 'function';
            path = path.slice(0, -2); // Remove the `()` from the path
        }

        const reused = reuse.call(this, `${path}+${type}`);
        if (reused.has) return reused.instance;

        this.path = path; // Store the cleaned-up path string
        this.type = type; // Store the type of the property (object, array, or function)
    }

    /**
     * Creates a new value for the given segment based on its type.
     * This ensures that missing properties are initialized with the correct data type.
     *
     * @returns {object|array|function} - A new empty object, array, or function.
     */
    #create_new_node() {
        switch (this.type) {
            case "array":
                return []; // Create an empty array
            case "function":
                return function HelloWorld() {
                }; // Return a placeholder function
            case 'object':
            default:
                return {}; // Default to an empty object
        }
    }

    /**
     * Retrieves the value of this segment from a given root object.
     * If the type is 'function', it automatically invokes it.
     *
     * @param {object} root - The root object where this segment resides.
     * @returns {any} - The value of the property at this segment.
     */
    get(root) {
        if (!root) return null; // Return `null` if the root is invalid

        root = root[this.path]; // Navigate to the property

        // If the type is a function, invoke it and return its result
        if (this.type === 'function') {
            root = root?.() ?? root;
        }

        return root; // Return the found value
    }

    /**
     * Initializes or modifies the value of this segment in the given root object.
     * Can also delete the property if `unset` is set to `true`.
     *
     * @param {object} root - The root object where this segment should be modified.
     * @param {{value?: any, unset?: boolean}} [options] - Options to control behavior.
     * @returns {boolean} - `true` if the operation was successful.
     */
    init(root, {value = null, unset = false} = {}) {
        if (!root) return false; // Ensure root is valid

        if (unset) {
            delete root[this.path]; // Delete the property if `unset` is `true`
            return true;
        }

        if (value != null) {
            root[this.path] = value; // Set the value directly
            return true;
        }

        // Initialize the property only if it doesn't already exist
        if (!root.hasOwnProperty(this.path)) {
            root[this.path] = this.#create_new_node();
        }

        return true;
    }
}