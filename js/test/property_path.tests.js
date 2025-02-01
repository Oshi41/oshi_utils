import '../common.js';
import {default as property_path} from '../property_path.js';
import assert from 'assert';
import {describe, it, beforeEach, before, afterEach, after} from 'node:test';
const {PathSegment, PropertyPath} = property_path;


it('PathSegment basic functionality', () => {
    const obj = {key: 'value', func: () => 'hello'};

    const segment = new PathSegment('key');
    assert.strictEqual(segment.get(obj), 'value');

    const funcSegment = new PathSegment('func', 'function');
    assert.strictEqual(funcSegment.get(obj), 'hello');
});

it('PathSegment initialization', () => {
    const obj = {};
    const segment = new PathSegment('newKey');

    segment.init(obj, {value: 'initialized'});
    assert.strictEqual(obj.newKey, 'initialized');

    segment.init(obj, {unset: true});
    assert.strictEqual(obj.hasOwnProperty('newKey'), false);
});

it('PropertyPath resolving paths', () => {
    const obj = {a: {b: {c: 'found'}}};
    const path = new PropertyPath('a.b.c');

    assert.strictEqual(path.resolve(obj), 'found');
});

it('PropertyPath setting values', () => {
    const obj = {};
    const path = new PropertyPath('x.y.z');

    path.set(obj, 'newValue');
    assert.strictEqual(obj.x.y.z, 'newValue');
});

it('PropertyPath affects', () => {
    const basePath = new PropertyPath('a.b');
    const subPath = new PropertyPath('a.b.c');
    const unrelatedPath = new PropertyPath('x.y');

    assert.strictEqual(basePath.affects(subPath), true);
    assert.strictEqual(subPath.affects(basePath), false);
    assert.strictEqual(basePath.affects(unrelatedPath), false);
});

it('Edge cases: Undefined and null roots', () => {
    const path = new PropertyPath('a.b');
    assert.strictEqual(path.resolve(null), null);
    assert.strictEqual(path.resolve(undefined), undefined);
});
it('Edge cases: Non-object roots', () => {
    const path = new PropertyPath('a.b');
    assert.strictEqual(path.resolve(42), null);
    assert.strictEqual(path.resolve('string'), null);
});

it('Edge cases: Overwriting existing values', () => {
    const obj = {a: {b: 'old'}};
    const path = new PropertyPath('a.b');

    path.set(obj, 'new');
    assert.strictEqual(obj.a.b, 'new');
});
