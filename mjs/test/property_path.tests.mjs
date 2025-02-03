import {describe, it, beforeEach, before, afterEach, after} from 'node:test';
import assert from 'assert';
import {PathSegment as seg, PropertyPath as prop} from '../property_path.mjs';

describe('property_path', () => {
    it('should parse a string path into dotted notation', () => {
        const path = new prop('a.b.c');
        assert.strictEqual(path.toString('.'), 'a.b.c');
    });
    it('should handle an array of strings as input', () => {
        const path = new prop(['x', 'y', 'z']);
        assert.strictEqual(path.toString(), 'x.y.z');
    });
    it('should handle an empty array', () => {
        const path = new prop([]);
        assert.strictEqual(path.toString(), '');
    });
    it('should handle nested PropertyPath instances', () => {
        const subPath = new prop('nested.path');
        const path = new prop(['root', subPath]);
        assert.strictEqual(path.toString(), 'root.nested.path');
    });
    it('should resolve a valid path from an object', () => {
        const obj = {a: {b: {c: 42}}};
        const path = new prop('a.b.c');
        assert.strictEqual(path.resolve(obj), 42);
    });
    it('should return undefined for non-existent paths', () => {
        const obj = {a: {b: {c: 42}}};
        const path = new prop('a.x.c');
        assert.equal(path.resolve(obj), null);
    });
    it('should handle null or undefined root values gracefully', () => {
        const path = new prop('a.b.c');
        assert.equal(path.resolve(null), null);
        assert.equal(path.resolve(undefined), null);
    });
    it('should convert to string with . notation', () => {
        const path = new prop('a.b.c');
        assert.strictEqual(path.toString(), 'a.b.c');
    });
    it('should work as a key in a Map', () => {
        const path1 = new prop('a.b');
        const path2 = new prop('a.c');
        const map = new Map();

        map.set(path1, 1);
        map.set(path2, 2);

        assert.strictEqual(map.get(path1), 1);
        assert.strictEqual(map.get(path2), 2);
    });
    it('should distinguish between different paths', () => {
        const path1 = new prop('a.b');
        const path2 = new prop('a.b.c');
        const map = new Map();

        map.set(path1, 10);
        assert.strictEqual(map.get(path2), undefined);
    });

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
});


