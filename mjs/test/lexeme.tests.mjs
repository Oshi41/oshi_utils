import {describe, it, beforeEach, before, afterEach, after} from 'node:test';
import assert from 'assert';
import {Lexeme, getLexemeType} from '../lexeme.mjs';

const testCases = [
    {
        input: {source: '"hello"', position: 0},
        expected: {type: 'quoted', boundary: 1},
        description: 'Detects quoted lexeme at start'
    },
    {
        input: {source: 'hello,world', position: 5},
        expected: {type: 'separator', boundary: {start: 1, end: 1}},
        description: 'Detects separator lexeme (comma)'
    },
    {
        input: {source: '[value]', position: 0},
        expected: {type: 'array', boundary: {start: 1}},
        description: 'Detects array start'
    },
    {
        input: {source: '[value]', position: 6},
        expected: {type: 'array', boundary: {end: 1}},
        description: 'Detects array end'
    },
    {
        input: {source: 'key:value', position: 3},
        expected: {type: 'key_separator', boundary: {start: 1, end: 1}},
        description: 'Detects key separator'
    },
    {
        input: {source: '\"escaped"', position: 1},
        expected: {type: 'string'},
        description: 'Handles escaped quote as part of string'
    },
    {
        input: {source: '', position: 0},
        expected: {type: 'string'},
        description: 'Handles empty input gracefully'
    }
];

describe('getLexemeType', () => {
    for (const {input, expected, description} of testCases) {
        it(description, () => {
            assert.deepStrictEqual(getLexemeType(input.source, input.position), expected);
        });
    }
});

describe('Lexeme', () => {
    it('Creates Lexeme instance correctly', () => {
        const lex = new Lexeme({source: 'hello', start: 0});
        assert.strictEqual(lex.isOpen(), true);
    });

    it('Handles valid lexeme finishing', () => {
        const lex = new Lexeme({source: 'hello', start: 0});
        lex.finish_lexeme(4);
        assert.strictEqual(lex.isOpen(), false);
    });

    it('Throws error for out-of-bounds end index', () => {
        const lex = new Lexeme({source: 'hello', start: 0});
        assert.throws(() => lex.finish_lexeme(10), /end\[10\] is out of source length: 5/);
    });

    it('Throws error for invalid lexeme end', () => {
        const lex = new Lexeme({source: 'key[', start: 0});
        lex.finish_lexeme(2);
        assert.throws(() => lex.finish_lexeme(3), /Lexeme\[array\] can only be a start lexeme/);
    });

    it('Throws error for invalid lexeme start', () => {
        assert.throws(() => new Lexeme({source: ']key', start: 0}), /Lexeme\[array\] can only be an end lexeme/);
    });
});