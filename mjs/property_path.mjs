const cache = new Map();

function reuse(key) {
    key = `${this.constructor.name}+${key}`;

    const instance = cache.get(key);
    if (!!instance)
        return {has: true, instance};

    cache.set(key, this);
    return {has: false, instance: this};
}

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

/**
 * Is provided item null or primitive
 *
 * @param item {any} item
 * @returns {boolean} false for objects may be nested and property-iterated
 */
function is_primitive_or_null(item) {
    if (item == null) return true;

    return !Array.isArray(item) && !['object', 'function'].includes(typeof item);
}

/**
 * Represents a full property path, allowing deep access and modification of nested objects.
 */
export class PropertyPath {
    /** @type {PathSegment[]} */
    #segments = [];

    /**
     * Constructs a `PropertyPath` from a string or another `PropertyPath` instance.
     *
     * @param {string | PropertyPath | (string | PropertyPath)[]} path - The string path (e.g., "user.address.city") or an existing `PropertyPath`.
     */
    constructor(path) {

        /**
         * Recursive segments parser
         * @template T {string | PropertyPath | PathSegment}
         * @param segments {T | T[]}
         * @returns {PathSegment[]}
         * @private
         */
        function _parse(segments) {
            if (typeof segments == 'string') {
                return segments.trim()
                    .replaceAll(']', '') // Remove closing brackets
                    .replaceAll('[', '.') // Convert array brackets to dot notation
                    .split('.')
                    .filter(x => !!x)
                    .map(x => new PathSegment(x)); // Split into segments
            }
            if (segments instanceof PropertyPath) return [...segments.#segments];
            if (segments instanceof PathSegment) return [segments];
            if (Array.isArray(segments)) return segments.flatMap(x => _parse(x)).filter(x => !!x?.path);
            return [];
        }

        this.#segments = _parse(path);

        const reused = reuse.call(this, this.toString());
        if (reused.has) return reused.instance;
    }

    /**
     * Converts the `PropertyPath` back to a dot-separated string.
     *
     * @returns {string} - The string representation of the path.
     */
    toString(separator = '.') {
        return this.#segments.map(x => x.path).join(separator);
    }

    /**
     * Resolves the property path within the given root object.
     *
     * @param {object} root - The object to resolve the path from.
     * @returns {any} - The resolved value at the given path.
     */
    resolve(root) {
        for (const item of this.#segments) {
            root = is_primitive_or_null(root)
                ? null
                : item.get(root);
        }
        return root;
    }

    /**
     * Sets the value at the specified path in the given root object.
     * Automatically initializes missing properties along the path.
     *
     * @param {object} root - The object where the value should be set.
     * @param {any} value - The value to set at the given path.
     * @returns {boolean} - `true` if the value was set successfully, otherwise `false`.
     */
    set(root, value) {
        if (is_primitive_or_null(root)) return false;

        for (let i = 0; i < this.#segments.length; i++) {
            const segment = this.#segments[i];

            // If this is the last segment, set the value
            if (i === this.#segments.length - 1) {
                return segment.init(root, {value});
            }

            // Ensure the intermediate path exists before continuing
            if (!segment.init(root)) return false;
            root = segment.get(root);
        }

        return false;
    }

    /**
     * Checks if this `PropertyPath` is a prefix (affects) of another `PropertyPath`.
     *
     * @param {PropertyPath} other - The other property path to compare against.
     * @returns {boolean} - `true` if this path affects `other`, otherwise `false`.
     */
    affects(other) {
        if (!(other instanceof PropertyPath)) return false;

        // Ensure this path is a prefix of the other path
        if (this.#segments.length > other.#segments.length) return false;

        return this.#segments.every((value, index) => value.path === other.#segments[index].path);
    }

    /**
     * Returns a new PropertyPath representing the relative path from the given base.
     *
     * For example, if the current path is "user.name.profile.meta" and the base is "user.name",
     * then the relative path will be "profile.meta". This allows resolving the child property
     * starting from a context resolved by the base.
     *
     * @param {string | PropertyPath} base - The base property path to compute the relative path from.
     * @returns {PropertyPath} - A new PropertyPath representing the relative path.
     * @throws {Error} - If the base path is not a prefix of the current path.
     */
    relative(base) {
        // Ensure the base is a PropertyPath instance.
        if (!(base instanceof PropertyPath)) {
            base = new PropertyPath(base);
        }

        // Check that base is a prefix of the current path.
        if (base.#segments.length > this.#segments.length) {
            console.error('Base path is longer than the current path; cannot compute relative path.');
            return false;
        }
        for (let i = 0; i < base.#segments.length; i++) {
            if (this.#segments[i].path !== base.#segments[i].path) {
                console.error('The provided base path is not a prefix of the current path.');
                return false;
            }
        }

        // Compute the new segments that form the relative path.
        const newSegments = this.#segments.slice(base.#segments.length);

        // Create a new instance of PropertyPath. We call the constructor with an empty string
        // so that it starts with an empty segments array, then override the private #segments.
        const relativePath = new PropertyPath('');
        relativePath.#segments = newSegments;
        return relativePath;
    }

}
