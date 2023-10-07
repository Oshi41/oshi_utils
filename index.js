import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import {validate} from "email-validator";
import date_and_time from 'date-and-time';

/**
 * @typedef {'int' | 'float' | 'positive_int' | 'positive_float' | 'string' | 'date' | 'mail'} QType
 */

/**
 * Ask question and waits for answer
 * @param q {string} question
 * @param type {QType} Type of return value
 * @param force - ask user to rewrite answer to fit type needs
 * @param cb {(s: string)=>{err: Error, val: any}} - custom validation callback
 * @returns {Promise<number | string | Date>}
 * @throws {Error} wrong value provided with no force opt / custom callback validation is not provided
 */
export const question = async (q, type, {force = true, cb} = {}) => {
    let {stdin: input, stdout: output} = process;
    const rl = readline.createInterface({input, output});
    if (!q.endsWith(os.EOL))
        q += os.EOL;
    let msg = q;

    try {
        do {
            let answer = await new Promise(resolve => rl.question(msg+os.EOL, a => resolve(a)));
            switch (type) {
                case "float":
                    if (Number.isFinite(+answer))
                        return +answer;
                    else
                        msg = 'Answer should be a float value';
                    break;

                case "int":
                    if (Number.isInteger(+answer))
                        return +answer;
                    else
                        msg = 'Answer should be a int value';
                    break;

                case "positive_float":
                    answer = +answer;
                    if (Number.isFinite(answer) && answer > 0)
                        return answer;
                    else
                        msg = 'Answer should be a positive float value';
                    break;

                case "positive_int":
                    answer = +answer;
                    if (Number.isInteger(answer) && answer > 0)
                        return answer;
                    else
                        msg = 'Answer should be a positive int value';
                    break;

                case "string":
                    answer = answer?.trim();
                    if (!!answer && typeof answer == 'string')
                        return answer;
                    else
                        msg = 'Answer should be any string';
                    break;

                case "date":
                    let number = Date.parse(answer);
                    if (Number.isFinite(number))
                        return new Date(number);
                    else
                        msg = 'Answer should be valid date';
                    break;

                case "mail":
                    try {
                        if (validate(answer))
                            return answer;
                        else
                            msg = 'Answer should be valid email';
                    } catch (e) {
                        console.error('Error during email validation', e);
                        msg = 'Answer should be valid email';
                    }
                    break;

                default:
                    if (!cb)
                        throw new Error('No validation callback provided');
                    let {err, val} = cb(answer);
                    if (err)
                        msg = err.message;
                    else
                        return val;
                    break;
            }
        } while (force);
    } finally {
        rl.close();
    }

    throw new Error('Wrong value provided');
};

/**
 * Ask confirmation
 * @param q {string} question
 * @returns {Promise<boolean>}
 */
export const confirm = async (q) => {
    let {stdin: input, stdout: output} = process;
    const rl = readline.createInterface({input, output});
    return await question(q + ' (y/n)', 'custom', {
        force: false, cb: s => {
            return s.toLowerCase().trim() == 'y';
        }
    });
};

/**
 * Resolves path from parts and creates dir if needed
 * @param paths {string}
 * @returns {string}
 */
export const jn_and_mkdir = (...paths) => {
    let dir = path.join(...paths);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
    return dir;
};

/**
 * Resolve filepath from parts and created one if needed with default text
 * @param def {string} default file content
 * @param paths {string}
 * @returns {string}
 */
export const jn_and_mkfile = (def = '', ...paths) => {
    let filepath = path.join(...paths);
    if (!fs.existsSync(filepath))
        fs.writeFileSync(filepath, def, 'utf-8');
    return filepath;
};

/**
 * Split string by spaces
 * @param s {string}
 * @returns {string[]}
 */
export const qw = (...s) =>{
    if (!s.length)
        return [];
    return String(s[0]).trim().split(' ')?.filter(Boolean);
};

Map.prototype.keys_arr = function () {
    return Array.from(this.keys())
};
Map.prototype.values_arr = function () {
    return Array.from(this.values());
};
Array.prototype.to_map = function (key_fn) {
    return new Map(this.map(x=>[key_fn(x), x]));
};

export const write_file = fs.writeFileSync;
export const read_file = fs.readFileSync;
export const homedir = os.homedir;
export const basename = path.basename;
export const join = path.join;
export const dir = path.dirname;

export const date = {
    format: date_and_time.format,
    /**
     * @param date {Date}
     * @param opt
     */
    add: function add(date, opt) {
        let cfg = {
            [qw`year y`]: date_and_time.addYears,
            [qw`month m`]: date_and_time.addMonths,
            [qw`day d`]: date_and_time.addDays,
            [qw`hour h`]: date_and_time.addHours,
            [qw`minute min`]: date_and_time.addMinutes,
            [qw`second sec`]: date_and_time.addSeconds,
            [qw`millisecond mls`]: date_and_time.addMilliseconds,
        };
        for (let [time_key, value] of Object.entries(opt)) {
            for (let [times, func] of Object.entries(cfg)) {
                if (times.includes(time_key))
                    date = func(date, +value)
            }
        }
        return date;
    }
};

export const sleep = async mls=>new Promise((resolve) => {
    setTimeout(()=>resolve(true), mls);
})

export const _ = {
    /**
     * Find index by compare func
     * @param arr {Array}
     * @param iteratee {(any)=>any} iteraty func
     * @param compare_fn {(l: any, r: any)=>number} compare func
     * @returns {number}
     */
    find_index: function (arr, iteratee, compare_fn) {
        if (!arr?.length)
            return -1;
        let min = iteratee(arr[0]), index = 0;
        for (let i = 1; i < arr.length; i++)
        {
            let other = iteratee(arr[i]);
            if (compare_fn(min, other) > 0)
            {
                min = other;
                index = i;
            }
        }
        return index;
    },

    /**
     * @param arr {Array}
     * @param min_by {(any)=>any | undefined}
     */
    min: function (arr, min_by) {
        return  arr[ _.find_index(arr, min_by || (x=>x), (l, r)=>l-r)];
    },
    /**
     *
     * @param arr {Array}
     * @param max_by {(any)=>any | undefined}
     * @returns {*}
     */
    max: function (arr, max_by) {
        return  arr[ _.find_index(arr, max_by || (x=>x), (l, r)=>r-l)];
    },
    /**
     * @param arr {Array}
     * @param sum_by {(any)=>number | undefined}
     */
    sum: function (arr, sum_by) {
        sum_by  = sum_by || (x=>x);
        return arr.reduce((p, c) => p + sum_by(c), 0);
    },
    /**
     * Compare flat arrays
     * @param left {Array}
     * @param right {Array}
     * @returns {{common: Array, left: Array, right: Array}}
     */
    arr_diff: function (left, right) {
        return {
            left: left.filter(x=>!right.includes(x)),
            common: left.filter(x=>right.includes(x)),
            right: right.filter(x=>!left.includes(x)),
        }
    },
    /**
     *
     * @param arr {Array}
     * @param child_fn {(x: any)=>Array}
     */
    select_recursive: function (arr, child_fn) {
        let res = [];
        if (Array.isArray(arr))
        {
            for (let elem of arr)
            {
                res.push(elem);
                res.push(..._.select_recursive(child_fn(elem), child_fn));
            }
        }
        return res;
    },
}