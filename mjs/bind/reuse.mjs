const cache = new Map();

/**
 * Tries to reuse existing instance.
 *
 * Must be called as
 * @example
 *     const {has, instance} = reuse.call(this, key);
 *     if (has)
 *      return instance;
 *
 *
 * @param key {string}
 * @returns {{has: boolean, instance: any}}
 * @this {any}
 */
export function reuse(key) {
    key = `${this.constructor.name}+${key}`;

    const instance = cache.get(key);
    if (!!instance)
        return {has: true, instance};

    cache.set(key, this);
    return {has: false, instance: this};
}