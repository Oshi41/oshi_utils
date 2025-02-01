import {describe, it, beforeEach, before, afterEach, after} from 'node:test';
import assert from 'assert';
import {PathSegment as seg, PropertyPath as prop} from '../property_path.mjs';

it('PathSegment basic functionality', () => {
    const obj = {key: 'value', func: () => 'hello'};

    const segment = new seg('key');
    assert.strictEqual(segment.get(obj), 'value');

    const funcSegment = new seg('func', 'function');
    assert.strictEqual(funcSegment.get(obj), 'hello');
});

it('PathSegment initialization', () => {
    const obj = {};
    const segment = new seg('newKey');

    segment.init(obj, {value: 'initialized'});
    assert.strictEqual(obj.newKey, 'initialized');

    segment.init(obj, {unset: true});
    assert.strictEqual(obj.hasOwnProperty('newKey'), false);
});

it('PropertyPath resolving paths', () => {
    const obj = {a: {b: {c: 'found'}}};
    const path = new prop('a.b.c');

    assert.strictEqual(path.resolve(obj), 'found');
});

it('PropertyPath setting values', () => {
    const obj = {};
    const path = new prop('x.y.z');

    path.set(obj, 'newValue');
    assert.strictEqual(obj.x.y.z, 'newValue');
});

it('PropertyPath affects', () => {
    const basePath = new prop('a.b');
    const subPath = new prop('a.b.c');
    const unrelatedPath = new prop('x.y');

    assert.strictEqual(basePath.affects(subPath), true);
    assert.strictEqual(subPath.affects(basePath), false);
    assert.strictEqual(basePath.affects(unrelatedPath), false);
});

it('Edge cases: Undefined and null roots', () => {
    const path = new prop('a.b');
    assert.equal(path.resolve(null), null);
    assert.equal(path.resolve(undefined), null);
});
it('Edge cases: Non-object roots', () => {
    const path = new prop('a.b');
    assert.strictEqual(path.resolve(42), null);
    assert.strictEqual(path.resolve('string'), null);
});

it('Edge cases: Overwriting existing values', () => {
    const obj = {a: {b: 'old'}};
    const path = new prop('a.b');

    path.set(obj, 'new');
    assert.strictEqual(obj.a.b, 'new');
});

it('equality', () => {
    let l = new seg('123' + '456');
    let r = new seg([1, 2, 3, 4, 5, 6].join(''));
    assert.strictEqual(l, r, 'should be the same instances');

    for (let s of ['134234', 'swsfovusflvkdfjdofiejr', 'sdpisjdogvidf0978d8f7gsiodjfoswuhf', '', 'GGgG']) {
        l = new seg(s);
        r = new seg(s);
        assert.strictEqual(l, r, 'should be the same instances');
    }

    l = new prop('a.b[c].d.e[1][12].f');
    r = new prop([
        new seg('a'),
        [
            'b',
            new seg('c'),
        ],
        new prop([
            [
                new prop('d'),
                new seg('e'),
                '1',
            ]
        ],),
        '1' + 2,
        new seg('f'),
    ]);

    assert.strictEqual(l, r, 'should be the same instances');
});
