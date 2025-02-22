import assert  from 'assert';
import { describe, it } from 'node:test';
import parse from "../bind/parser.mjs";

describe("parse", () => {
    // Normal Working Flow
    describe("Normal Working Flow", () => {
        it("should parse simple key-value pairs", () => {
            const input = "key1: value1, key2: value2";
            const expected = { key1: "value1", key2: "value2" };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should parse key-value pairs with quoted strings", () => {
            const input = "key: \"quoted value\", another: 'single quoted'";
            const expected = { key: "quoted value", another: "single quoted" };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should parse arrays with simple values", () => {
            const input = "array: [a, b, c]";
            const expected = { array: ["a", "b", "c"] };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should parse nested arrays", () => {
            const input = "nested: [a, [b, c], d]";
            const expected = { nested: ["a", ["b", "c"], "d"] };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should default key to 'path' when omitted", () => {
            const input = "selected, delay: 500";
            const expected = { path: "selected", delay: "500" };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should handle mixed delimiters", () => {
            const input = "key1: value1 | key2: value2, key3: value3";
            const expected = { key1: "value1", key2: "value2", key3: "value3" };
            assert.deepStrictEqual(parse(input), expected);
        });
    });

    // Edge Cases
    describe("Edge Cases", () => {
        it("should handle empty string", () => {
            const input = "";
            const expected = {};
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should handle strings with only delimiters", () => {
            const input = ",,,|,,,";
            const expected = {};
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should handle properties with no values", () => {
            const input = "key1:, key2: , key3:";
            const expected = { key1: "", key2: "", key3: "" };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should handle arrays with no elements", () => {
            const input = "array: []";
            const expected = { array: [] };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should handle deeply nested arrays", () => {
            const input = "deep: [[[[a]]]]";
            const expected = { deep: [[[["a"]]]] };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should handle escaped quotes inside quoted strings", () => {
            const input = "escaped: \"hello\\\"world\", single: 'it\\'s'";
            const expected = { escaped: "hello\"world", single: "it's" };
            assert.deepStrictEqual(parse(input), expected);
        });

        it("should handle backslashes not escaping quotes", () => {
            const input = "backslash: \"hello\\world\"";
            const expected = { backslash: "hello\\world" };
            assert.deepStrictEqual(parse(input), expected);
        });
    });

    // Error Handling
    describe("Error Handling", () => {
        it("should throw error for unmatched quotes", () => {
            const input = "key: \"unmatched";
            assert.throws(() => parse(input), /Unmatched quote/);
        });

        it("should throw error for unclosed arrays", () => {
            const input = "array: [a, b, c";
            assert.throws(() => parse(input), /Unclosed array/);
        });

        it("should handle delimiters inside arrays or quoted strings", () => {
            const input = "array: [a, b| c], quoted: \"hello, | world\"";
            const expected = { array: ["a", "b", "c"], quoted: "hello, | world" };
            assert.deepStrictEqual(parse(input), expected);
        });
    });
});