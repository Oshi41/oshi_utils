import assert from 'assert';
import {describe, it, beforeEach, before, afterEach, after} from 'node:test';
import {r} from '../bind/reactive.mjs';
import {PropertyPath} from '../bind/property.mjs';

const prop = (...args) => new PropertyPath(...args);

function create_cases(original, item) {
    return [
        [Array.prototype.copyWithin, [2, 0, 1], [original[0], original[1], original[0]]],
        // immitating reverse()
        [Array.prototype.sort,
            [(a, b) => original.indexOf(b) - original.indexOf(a)],
            [original[2], original[1], original[0]]],
        [Array.prototype.push, [item], [...original, item]],
        [Array.prototype.pop, [], [original[0], original[1]]],
        [Array.prototype.shift, [], [original[1], original[2]]],
        [Array.prototype.unshift, [item], [item, ...original]],
        [Array.prototype.splice, [1, 1, item], [original[0], item, original[2]]],
        [Array.prototype.reverse, [], [original[2], original[1], original[0]]],
        [Array.prototype.fill, [item], [item, item, item]],
    ]
}

/**
 *
 * @param original {any}
 * @param r {ReactiveState}
 * @param paths {string[]}
 */
function create_listeners(original, r, paths) {
    const map = new Map();
    map._called = new Set();

    for (let path of paths) {
        const id = new PropertyPath(path);
        map.set(id, id.resolve(original));
        r.observe('notify', id, p => {
           map.set(p, p.resolve(r.state));
           map._called.add(p);
        });
    }

    return map;
}

describe('reactive', () => {
    it('works', () => {
        const reactive = r({user: {name: 'John'}});
        let observedValue;

        reactive.observe('notify', 'user.name', (path) => {
            observedValue = path.resolve(reactive.state);
        });

        reactive.state.user.name = 'Jane';

        assert.strictEqual(observedValue, 'Jane',
            'Should observe changes to user.name');
    });
    it('edge cases', () => {
        const state = r({user: {name: 'John', details: {age: 30}}});
        let _details;
        let _age;
        let _user;

        state.observe('notify', 'user.details',
            (prop) => _details = prop.resolve(state.state));
        state.observe('notify', 'user.details.age',
            (prop) => _age = prop.resolve(state.state));
        state.observe('notify', 'user',
            (prop) => _user = prop.resolve(state.state));

        state.state.user.details.age = 31;
        assert.strictEqual(
            _age,
            31,
            'Should observe changes to user.details.age'
        );

        // Check bubbling
        state.state.user.details = {age: 32, gender: 'male'};

        assert.deepStrictEqual(
            _details,
            {age: 32, gender: 'male'},
            'Should update parent observer when details is replaced'
        );

        assert.strictEqual(
            _age,
            32,
            'Should observe changes to user.details.age'
        );
    });
    describe('simple array', () => {
        const arr = [1, 2, 3];
        for (let [fn, args, expected] of create_cases([...arr], 99)) {
            it(fn.name, () => {
                const state = r({items: [...arr]});
                let observedArray;
                state.observe('notify', prop('items'), p => observedArray = p.resolve(state.state));
                let first_element = arr[1];
                state.observe('notify', prop('items[1]'),
                    p => first_element = p.resolve(state.state));

                let was_called = false;
                state.observe('notify', prop('items[13408573]'),
                    p => was_called = true);

                state.state.items[fn.name](...args);
                assert.deepStrictEqual(observedArray, expected, `Should observe array ${fn.name}, array is not the same`);
                assert.deepStrictEqual(first_element, state.state.items[1], `Should observe array ${fn.name}, array[1] is not the same`);
                assert.deepStrictEqual(was_called, false, `array[13408573] not exist should not change`);
            });
        }
    });
    describe('object array', () => {
        const arr = [
            {a: {g: {c: {d: '123'}}},},
            {a: {b: {f: {m: '678'}}},},
            {e: {b: {5: {m: '678'}}},},
        ];
        const item = {chg: {value: '123'}};
        const cases = create_cases([...arr], item);
        const first_not_changed = [Array.prototype.copyWithin, Array.prototype.pop, Array.prototype.splice, Array.prototype.push];

        describe(`[first element changed]`, ()=>{
            for (const [fn, args, expected] of cases.filter(x => !first_not_changed.includes(x[0]))) {
                it(fn.name, ()=>{
                    const state = r({items: [...arr]});
                    const listener_state = create_listeners({items: [...arr]}, state, [
                        'items[0].a.g.c.d',
                        '[items][0][a][g][c][d]',
                        'items.0.a.g.c',
                        'items.0.a.g',
                        'items.0.a',
                        'items.0',
                        'items',
                    ]);

                    state.state.items[fn.name](...args);

                    for (let [id, actual_value] of listener_state.entries()) {
                        assert.deepStrictEqual(listener_state._called.has(id), true, `${id} was not observed`);

                        const current_value = id.resolve({items: expected});
                        assert.deepStrictEqual(current_value, actual_value,
                            `${id} was not observed properly`)
                    }
                });
            }
        });

        //
        // for (let [fn, args, expected] of create_cases([...arr], item)) {
        //     it(fn.name, () => {
        //         const state = r({items: [...arr]});
        //         const map = new Map(
        //             [
        //                 'items[0].a.g.c.d',
        //                 'items[1].a.b.f.m',
        //                 'items[2].e.b[5].m',
        //                 'items[0].chg.value',
        //                 'items[1].chg.value',
        //                 'items[2].chg.value',
        //                 'items[3].chg.value',
        //             ]
        //             .map(x => new PropertyPath(x))
        //             .map(x => [x, x.resolve({items: arr})]))
        //
        //         for (let key of map.keys()) {
        //             state.observe('notify', key, p=>{
        //                map.set(key, p.resolve(state.state));
        //             });
        //         }
        //         state.state.items[fn.name](...args);
        //         console.log(state);
        //     });
        // }
    });
});