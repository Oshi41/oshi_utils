import {r, prop} from './reactive.js';
import assert from 'assert';
import {describe, it, beforeEach, before, afterEach, after} from 'node:test';

describe('property_path', () => {
    it('should parse a string path into dotted notation', () => {
        const path = prop('a.b.c');
        assert.strictEqual(path.toString(), 'a=>b=>c');
    });
    it('should handle an array of strings as input', () => {
        const path = prop(['x', 'y', 'z']);
        assert.strictEqual(path.toString(), 'x=>y=>z');
    });
    it('should handle an empty array', () => {
        const path = prop([]);
        assert.strictEqual(path.toString(), '');
    });
    it('should handle nested PropertyPath instances', () => {
        const subPath = prop('nested.path');
        const path = prop(['root', subPath]);
        assert.strictEqual(path.toString(), 'root=>nested=>path');
    });
    it('should resolve a valid path from an object', () => {
        const obj = {a: {b: {c: 42}}};
        const path = prop('a.b.c');
        assert.strictEqual(path.resolve(obj), 42);
    });
    it('should return undefined for non-existent paths', () => {
        const obj = {a: {b: {c: 42}}};
        const path = prop('a.x.c');
        assert.strictEqual(path.resolve(obj), undefined);
    });
    it('should handle null or undefined root values gracefully', () => {
        const path = prop('a.b.c');
        assert.strictEqual(path.resolve(null), null);
        assert.strictEqual(path.resolve(undefined), undefined);
    });
    it('should return all affected paths including the full path', () => {
        const path = prop('a.b.c');
        const affected = path.affected_paths();
        assert.deepStrictEqual(affected.map((p) => `${p}`), ["", "a", "a=>b", "a=>b=>c"]);
    });
    it('should return only the root for an empty path', () => {
        const path = prop([]);
        const affected = path.affected_paths();
        assert.deepStrictEqual(affected.map((p) => `${p}`), ['']);
    });
    it('should convert to string with => notation', () => {
        const path = prop('a.b.c');
        assert.strictEqual(path.toString(), 'a=>b=>c');
    });
    it('should work as a key in a Map', () => {
        const path1 = prop('a.b');
        const path2 = prop('a.c');
        const map = new Map();

        map.set(path1, 1);
        map.set(path2, 2);

        assert.strictEqual(map.get(path1), 1);
        assert.strictEqual(map.get(path2), 2);
    });
    it('should distinguish between different paths', () => {
        const path1 = prop('a.b');
        const path2 = prop('a.b.c');
        const map = new Map();

        map.set(path1, 10);
        assert.strictEqual(map.get(path2), undefined);
    });
});

describe('reactive', () => {
    it('works', () => {
        const state = r({user: {name: 'John'}});
        let observedValue;

        state.observe('user.name', (newState) => {
            observedValue = newState.user.name;
        });

        state.state.user.name = 'Jane';

        assert.strictEqual(observedValue, 'Jane',
            'Should observe changes to user.name');
    });
    it('edge cases', () => {
        const state = r({user: {name: 'John', details: {age: 30}}});
        let observedParent;
        let observedChild;
        let observedUser;

        state.observe('user.details', (newState) => {
            observedParent = newState.user.details;
        });

        state.observe('user.details.age', (newState) => {
            observedChild = newState.user.details.age;
        });

        state.observe('user', (newState) => {
            observedUser = newState.user;
        });

        state.state.user.details.age = 31;

        assert.deepStrictEqual(
            observedParent,
            {age: 31},
            'Should observe changes to user.details as a whole'
        );

        assert.strictEqual(
            observedChild,
            31,
            'Should observe changes to user.details.age'
        );

        assert.deepStrictEqual(
            observedUser,
            {name: 'John', details: {age: 31}},
            'Should observe changes to user when a nested property changes'
        );

        // Check bubbling
        state.state.user.details = {age: 32, gender: 'male'};

        assert.deepStrictEqual(
            observedParent,
            {age: 32, gender: 'male'},
            'Should update parent observer when details is replaced'
        );

        assert.deepStrictEqual(
            observedUser,
            {name: 'John', details: {age: 32, gender: 'male'}},
            'Should update user observer when details is replaced'
        );
    });
    it('simple array', () => {
        const state = r({items: [1, 2, 3]});
        let observedArray;

        state.observe('items', (newState) => {
            observedArray = newState.items;
        });

        // Test push
        state.state.items.push(4);
        assert.deepStrictEqual(observedArray, [1, 2, 3, 4], 'Should observe array push');

        // Test pop
        state.state.items.pop();
        assert.deepStrictEqual(observedArray, [1, 2, 3], 'Should observe array pop');

        // Test direct index modification
        state.state.items[1] = 42;
        assert.deepStrictEqual(observedArray, [1, 42, 3], 'Should observe direct index modification');

        // Test splice
        state.state.items.splice(1, 1, 99);
        assert.deepStrictEqual(observedArray, [1, 99, 3], 'Should observe array splice');
    });
    it('object array', () => {
        const state = r({items: [1, 2, 3]});
        let observedFull;
        let observedPartial;

        state.observe("items", (newState) => {
            observedFull = newState.items;
        });

        state.observe("items.1", (newState) => {
            observedPartial = newState.items[1];
        });

        // Test observing specific index
        state.state.items[1] = 99;
        assert.equal(observedPartial, 99, "Should observe specific index changes");
        assert.deepEqual(observedFull, [1, 99, 3], "Should observe full array changes when specific index changes");

        // Test deleting an element
        delete state.state.items[1];
        assert.deepEqual(observedFull, [1, undefined, 3], "Should observe deletion of array element");

        // Test adding properties to array
        state.state.items.extra = "test";
        assert.deepEqual(state.state.items.extra, "test", "Should allow adding properties to arrays");

    });
    it('array, edge cases', () => {
        const state = r({items: [1, 2, 3]});
        let observedArray;

        state.observe('items', (newState) => {
            observedArray = newState.items;
        });

        // Test replacing the array
        state.state.items = [7, 8, 9];
        assert.deepStrictEqual(observedArray, [7, 8, 9], 'Should observe array replacement');

        // Test clearing the array
        state.state.items.length = 0;
        assert.deepStrictEqual(observedArray, [], 'Should observe array clearing');

        // Test nested arrays
        state.state.items = [[1, 2], [3, 4]];
        let observedNested;
        state.observe('items.0', (newState) => {
            observedNested = newState.items[0];
        });
        state.state.items[0].push(5);
        assert.deepStrictEqual(observedNested, [1, 2, 5], 'Should observe nested array changes');
    });
    it('initializes with non-object types', () => {
        let state = r(42);
        assert.strictEqual(state.state, 42, 'Should initialize with a number');

        state = r(null);
        assert.strictEqual(state.state, null, 'Should initialize with null');

        state = r([]);
        assert.deepStrictEqual(state.state, [], 'Should initialize with an empty array');

        state = r();
        assert.deepStrictEqual(state.state, {}, 'Should default to an empty object');
    });
    it('handles accessing non-existing properties', () => {
        const state = r({user: {name: 'John'}});
        assert.strictEqual(state.state.user.age, undefined, 'Non-existing properties should return undefined');
    });
    it('handles accessing properties that have been deleted', () => {
        const state = r({user: {name: 'John'}});
        delete state.state.user.name;
        assert.strictEqual(state.state.user.name, undefined, 'Deleted properties should return undefined');
    });
    it('cannot set properties on non-objects', () => {
        for (let primitive of [42, true, false, '123']) {
            const state = r(primitive);
            assert.throws(() => state.state.newKey = 'value',
                /Cannot create property/,
                `Should repeat JavaScript behavior - cannot create properties on primitive value: ${primitive}`);
        }
    });
    it('handles undefined or null values as updates', () => {
        const state = r({key: 'value'});
        state.state.key = undefined;
        assert.strictEqual(state.state.key, undefined, 'Should handle setting undefined');

        state.state.key = null;
        assert.strictEqual(state.state.key, null, 'Should handle setting null');
    });
    it('notifies observers when deleting properties', () => {
        const state = r({user: {name: 'John'}});
        let observedValue;
        state.observe('user.name', () => {
            observedValue = 'deleted';
        });
        delete state.state.user.name;
        assert.strictEqual(observedValue, 'deleted', 'Should notify observers on property deletion');
    });
    it('handles invoking non-function properties', () => {
        const state = r({user: {name: 'John'}});
        assert.throws(() => {
            state.state.user.name();
        }, 'Should throw an error when invoking non-function properties');
    });
    it('ensures unobserve works', () => {
        const state = r({user: {name: 'John'}});
        let observedValue = 0;
        const callback = () => {
            observedValue += 1;
        };
        state.observe('user.name', callback);
        state.unobserve('user.name', callback);
        state.state.user.name = 'Jane';
        assert.strictEqual(observedValue, 0, 'Should not trigger unobserved callbacks');
    });
    it('handles sparse arrays', () => {
        const state = r({items: [1, , 3]});
        let observedValue;
        state.observe('items', (newState) => {
            observedValue = newState.items;
        });
        state.state.items[1] = 2;
        assert.deepStrictEqual(observedValue, [1, 2, 3], 'Should observe sparse array updates');
    });
    it('observes non-standard array methods', () => {
        const state = r({items: [3, 1, 2]});
        let observedValue;
        state.observe('items', (newState) => {
            observedValue = newState.items;
        });
        state.state.items.sort();
        assert.deepStrictEqual(observedValue, [1, 2, 3], 'Should observe array sort');
        state.state.items.reverse();
        assert.deepStrictEqual(observedValue, [3, 2, 1], 'Should observe array reverse');
    });
    it('wraps already reactive objects correctly', () => {
        const state1 = r({user: {name: 'John'}});
        const state2 = r(state1.state);
        assert.strictEqual(state2.state.user.name, 'John', 'Should correctly wrap an already reactive object');
    });
    it('observes non-enumerable properties', () => {
        const obj = {};
        Object.defineProperty(obj, 'hidden', {
            value: 'secret',
            enumerable: false,
            configurable: true,
            writable: true,
        });
        const state = r(obj);
        let observedValue;
        state.observe('hidden', (newState) => {
            observedValue = newState.hidden;
        });
        state.state.hidden = 'not secret';
        assert.strictEqual(observedValue, 'not secret', 'Should observe non-enumerable properties');
    });
    it('handles deleting a non-existing property', () => {
        const state = r({user: {name: 'John'}});
        const result = delete state.state.user.age;
        assert.strictEqual(result, true, 'Current implementation returns true always, even on non-existing values');
    });
    it('handles circular references', () => {
        const obj = {};
        obj.self = obj;
        const state = r(obj);
        assert.strictEqual(state.state.self, state.state, 'Should handle circular references without crashing');
    });
    it('handles frozen objects', () => {
        const state = {user: {info: {name: 'John'}}};
        for (let keys of [
            [],
            ['user'],
            ['user', 'info'],
            ['user', 'info', 'name'],
        ]) {
            const state_copy = {...state};
            let find = state_copy;
            for (let key of keys) {
                find = find[key];
            }
            Object.freeze(find);
            assert.throws(() => r(state_copy),
                `Cannot use frozen objects [${keys.join('.')}]`);
        }
    });
    it('handles special characters in paths', () => {
        const reactive = r({
            some: {tricky: {field: {value: 1}}},
            'some.tricky.field.value': 2,
            'some.tricky': {field: {value: 3}},
        });

        let f1 = reactive.state.some.tricky.field.value;
        let f2 = reactive.state['some.tricky.field.value'];
        let f3 = reactive.state['some.tricky'].field.value;

        reactive.observe('some.tricky.field.value', (s, p) => f1 = p.resolve(s));
        reactive.observe(['some.tricky.field.value',], (s, p) => f2 = p.resolve(s));
        reactive.observe(['some.tricky', 'field', 'value'], (s, p) => f3 = p.resolve(s));

        reactive.state.some.tricky.field.value = 31;
        assert.strictEqual(f1, 31, 'Should handle special characters in paths');
        assert.strictEqual(f2, 2, 'Should stay at same value');
        assert.strictEqual(f3, 3, 'Should stay at same value');

        reactive.state['some.tricky.field.value'] = 32;
        assert.strictEqual(f1, 31, 'Should stay at same value');
        assert.strictEqual(f2, 32, 'Should handle special characters in paths');
        assert.strictEqual(f3, 3, 'Should stay at same value');

        reactive.state['some.tricky'].field.value = 33;
        assert.strictEqual(f1, 31, 'Should stay at same value');
        assert.strictEqual(f2, 32, 'Should stay at same value');
        assert.strictEqual(f3, 33, 'Should handle special characters in paths');
    });
    it('observes changes to the root state', () => {
        const state = r({user: {name: 'John'}});
        let observedValue;
        state.observe('', (newState) => {
            observedValue = newState;
        });
        state.state.user.name = 'Jane';
        assert.deepStrictEqual(observedValue, {user: {name: 'Jane'}}, 'Should observe changes to the root state');
    });
    it('observes non-existent paths', () => {
        const state = r({});
        let observedValue;
        let count = 0;
        state.observe('nonexistent.path', (s, p) => observedValue = p.resolve(s));
        state.observe('nonexistent', (s, p) => count++);
        state.state.nonexistent = {path: 'value', f1: 1, f2: 2, f3: 3, f4: 4, f5: 5 };
        assert.deepStrictEqual(observedValue, 'value', 'Should observe changes to non-existent paths');
        assert.deepStrictEqual(count, 1, 'Should notify only once for the root path');
    });

    it('observes dynamically added methods', () => {
        const state = r({});
        let observedValue;
        state.state.customMethod = () => 'dynamic';
        state.observe('customMethod', (newState) => {
            observedValue = newState.customMethod();
        });
        assert.strictEqual(observedValue, 'dynamic', 'Should observe dynamically added methods');
    });
});