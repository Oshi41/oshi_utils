import {PathSegment} from './segment.mjs';
import {reuse} from './reuse.mjs';

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
     * @param {PathParsable | PathParsable[]} path - The string path (e.g., "user.address.city") or an existing `PropertyPath`.
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
        for (const item of (this.#segments)) {
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
     * @returns {PropertyPath | undefined} - A new PropertyPath representing the relative path.
     */
    relative(base) {
        // Ensure the base is a PropertyPath instance.
        if (!(base instanceof PropertyPath)) {
            base = new PropertyPath(base);
        }

        // Check that base is a prefix of the current path.
        if (base.#segments.length > this.#segments.length) {
            console.error('Base path is longer than the current path; cannot compute relative path.');
            return;
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

    /**
     * Returns parent of property
     *
     * @returns {PropertyPath}
     */
    parent(){
        if (this.#segments.length < 1) return this;

        return new PropertyPath(this.#segments.slice(0, -1));
    }

    /**
     * Joins current path with provided
     * @param path {PathParsable | PathParsable[]}
     * @returns {PropertyPath}
     */
    join(path){
        if (!(path instanceof PropertyPath)) {
            path = new PropertyPath(path);
        }

        if (!path?.#segments?.length) return this;

        return new PropertyPath([...this.#segments, ...path.#segments]);
    }

    last(){
        return this.#segments[this.#segments.length - 1];
    }
}