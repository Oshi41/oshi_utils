import assert from 'node:assert/strict';
import test from 'node:test';
import {Lexeme_type, parse_lexemes} from '../bind/lexeme_type.mjs';

/**
 * Helper function to get lexeme type at a specific position
 * @param {string} source
 * @param {number} position
 * @returns {Lexeme_type}
 */
function getLexeme(source, position) {
    return new Lexeme_type(source, position);
}

test('Lexeme_type constructor and caching mechanism', () => {
    const lex1 = getLexeme('hello,world', 5); // ',' -> list_separator
    const lex2 = getLexeme('hello,world', 5);

    assert.strictEqual(lex1, lex2, 'Lexeme should be reused from cache');
});


test('Lexeme_type type determination', () => {
    assert.strictEqual(getLexeme('hello', 0).type, 'string');
    assert.strictEqual(getLexeme('"hello"', 0).type, 'quoted');
    assert.strictEqual(getLexeme(',', 0).type, 'list_separator');
    assert.strictEqual(getLexeme('[', 0).type, 'array');
    assert.strictEqual(getLexeme(']', 0).type, 'array');
    assert.strictEqual(getLexeme(':', 0).type, 'property_divider');
    assert.strictEqual(getLexeme(' ', 0).type, 'space');
});


test('Lexeme_type.isSingleChar()', () => {
    assert.strictEqual(getLexeme(':', 0).isSingleChar(), true);
    assert.strictEqual(getLexeme(',', 0).isSingleChar(), true);
    assert.strictEqual(getLexeme('[', 0).isSingleChar(), false);
    assert.strictEqual(getLexeme('"', 0).isSingleChar(), false);
});


test('Lexeme_type.mustOpen()', () => {
    assert.strictEqual(getLexeme('[', 0).mustOpen(), true);
    assert.strictEqual(getLexeme(']', 0).mustOpen(), false);
});


test('Lexeme_type.mustClose()', () => {
    assert.strictEqual(getLexeme(']', 0).mustClose(), true);
    assert.strictEqual(getLexeme('[', 0).mustClose(), false);
});


test('Lexeme_type.mustOpenOrClose()', () => {
    assert.strictEqual(getLexeme('"', 0).mustOpenOrClose(), true);
    assert.strictEqual(getLexeme('[', 0).mustOpenOrClose(), false);
});


test('Lexeme_type.canOpenHere()', () => {
    assert.strictEqual(getLexeme('hello', 0).canOpenHere('hello world', 0), true);
    assert.strictEqual(getLexeme(',', 0).canOpenHere('hello,world', 5), true);
    assert.strictEqual(getLexeme(']', 0).canOpenHere('[hello]', 6), false);
});


test('Lexeme_type.canCloseHere()', () => {
    assert.strictEqual(getLexeme(']', 0).canCloseHere('[hello]', 6), true);
    assert.strictEqual(getLexeme('[', 0).canCloseHere('[hello]', 0), false);
    assert.strictEqual(getLexeme('"', 0).canCloseHere('"hello"', 6), true);
});


test('parse_lexemes()', () => {
    // const text = 'path: "hello, world", delay:    300 | listeners: [onclick, `mousemove`]';
    const text = 'p:sel';
    let lexemes = [];
    assert.doesNotThrow(() => lexemes.push(...parse_lexemes(text)));

    assert.deepStrictEqual(lexemes.length, 3);
});
