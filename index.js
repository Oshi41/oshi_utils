import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import {format} from 'node:util'
import {validate} from "email-validator";
import date_and_time from 'date-and-time';
import settings from "./settings.js";
import {Writable, Readable} from 'stream';
import file_dialog from 'node-file-dialog';
import crypto from "crypto-js";
import child_process, {exec as _exec} from 'child_process';

/**
 * @typedef {'int' | 'float' | 'positive_int' | 'positive_float' | 'string' | 'date' | 'mail' | 'password' | 'plain_list'
 * | 'existing_filepath'} QType
 */

/**
 * Ask question and waits for answer
 * @param q {string} question
 * @param type {QType} Type of return value
 * @param force - ask user to rewrite answer to fit type needs
 * @param cb {(s: string)=>{err: Error, val: any}} - custom validation callback
 * @param def {any} Default or previous value
 * @returns {Promise<number | string | Date | string[]>}
 * @throws {Error} wrong value provided with no force opt / custom callback validation is not provided
 */
export const question = async (q, type, {force = true, cb, def = undefined} = {}) => {
    let {stdin: input, stdout: output} = process;
    let was_typed = false;
    input.on('data', args => {
        was_typed = true;
    });
    let mutableStdout = new Writable({
        write: function (...args) {
            if (type != 'password' || !was_typed)
                return output.write(...args);

            was_typed = false;
            let [chunk, encoding, callback] = args;
            let str = chunk.toString('utf-8');
            str = '*'.repeat(str.length);
            let buff = Buffer.from(str);
            output.write(buff, encoding, callback);
        }
    });
    const rl = readline.createInterface({
        input,
        output: mutableStdout,
        terminal: true,
    });
    if (def) {
        let def_value = type == 'password' ?
            '*'.repeat(def.length) : def;
        q += `\n[Default: ${def_value}]\n`;
    }
    if (!q.endsWith('\n'))
        q += '\n';
    let msg = q, extra = type.includes('list') ? def : undefined;

    try {
        do {
            let answer;
            if (type == 'existing_filepath') {
                console.log(msg);
                answer = (await file_dialog({type: 'open-file'}))?.[0];
            } else {
                answer = await new Promise(resolve => rl.question(msg, a => resolve(a)));
            }
            if (!type.includes('list'))
                answer = answer || def;
            switch (type) {
                case "float":
                    if (Number.isFinite(+answer)) {
                        return +answer;
                    } else {
                        msg = 'Answer should be a float value';
                    }
                    break;

                case "int":
                    if (Number.isInteger(+answer)) {
                        return +answer;
                    } else {
                        msg = 'Answer should be a int value';
                    }
                    break;

                case "positive_float":
                    answer = +answer;
                    if (Number.isFinite(answer) && answer > 0) {
                        return answer;
                    } else {
                        msg = 'Answer should be a positive float value';
                    }
                    break;

                case "positive_int":
                    answer = +answer;
                    if (Number.isInteger(answer) && answer > 0) {
                        return answer;
                    } else {
                        msg = 'Answer should be a positive int value';
                    }
                    break;

                case "string":
                    answer = answer?.trim();
                    if (!!answer && typeof answer == 'string') {
                        return answer;
                    } else {
                        msg = 'Answer should be any string';
                    }
                    break;

                case 'password':
                    if (!answer) {
                        msg = 'Password should not be empty';
                        break;
                    }
                    return answer;

                case "date":
                    let number = Date.parse(answer);
                    if (Number.isFinite(number)) {
                        return new Date(number);
                    } else {
                        msg = 'Answer should be valid date';
                    }
                    break;

                case "mail":
                    try {
                        if (validate(answer)) {
                            return answer;
                        } else {
                            msg = 'Answer should be valid email';
                        }
                    } catch (e) {
                        console.error('Error during email validation', e);
                        msg = 'Answer should be valid email';
                    }
                    break;

                case 'plain_list':
                    if (!Array.isArray(extra))
                        extra = [];
                    if (!answer) {
                        if (extra.length)
                            return extra;
                        msg = 'You need to write at least one string';
                        break;
                    } else {
                        extra.push(answer);
                        break;
                    }

                case "existing_filepath":
                    if (fs.existsSync(answer))
                        return answer;
                    msg = 'You should enter valid and existing file path';
                    break;

                default:
                    if (!cb) {
                        throw new Error('No validation callback provided');
                    }
                    let {err, val} = cb(answer);
                    if (err) {
                        msg = err.message;
                    } else {
                        return val;
                    }
                    break;
            }
        } while (force);
    } finally {
        rl.close();
    }

    throw new Error('Wrong value provided');
};

export const Settings = settings;

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
            return {val: s.toLowerCase().trim() == 'y'};
        }
    });
};

/**
 * Resolves path from parts and creates dir if needed
 * @param paths {string}
 * @returns {string}
 */
export const join_mkdir = (...paths) => {
    let dir = path.resolve(...paths);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    return dir;
};

/**
 * Resolve filepath from parts and created one if needed with default text
 * @param paths {string}
 * @returns {string}
 */
export const join_mkfile = (...paths) => {
    let filepath = path.resolve(...paths);
    let dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, '', 'utf-8');
    }
    return filepath;
};

/**
 * Saving json to file. Checks dir existance
 * @param fpath {string} filepath. Create dir if needed
 * @param obj {any} JSON serializable
 */
export const save_json = (fpath, obj) => {
    let dir = path.dirname(fpath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    fs.writeFileSync(fpath, JSON.stringify(obj, null, 2), 'utf-8');
};

/**
 * Reads json
 * @param fpath {string} filepath. Creates dir if needed
 * @param create_default {boolean} Should we create default file?
 * @param def_val {any} Default JSON value
 * @param no_error {boolean} In case of error rewriting file with def value
 * @return {{}|[]|any}
 */
export const read_json = (fpath, {
    create_default = false, def_val = {},
    no_error = false
} = {}) => {
    if (!fs.existsSync(fpath) && create_default) {
        save_json(fpath, def_val);
        return def_val;
    }
    try {
        let raw = fs.readFileSync(fpath, 'utf-8');
        return JSON.parse(raw)
    } catch (e) {
        if (!no_error) {
            throw e;
        }

        if (create_default) {
            save_json(fpath, def_val);
        }
    }
    return def_val;
}

export function safe_rm(filepath) {
    if (fs.existsSync(filepath))
        fs.rmSync(filepath, {force: true, recursive: true});
}

Map.prototype.keys_arr = function () {
    return Array.from(this.keys())
};
Map.prototype.values_arr = function () {
    return Array.from(this.values());
};
Map.prototype.entries_arr = function () {
    return Array.from(this.entries());
};

if (process.env.EXTEND_ARRAY_PROTO) {
    Array.prototype.to_map = function (key_fn) {
        return new Map(this.map(x => [key_fn(x), x]));
    };
    Array.prototype.sum = function (val_func) {
        return _.sum(this, val_func);
    };
    Array.prototype.max = function (val_func) {
        return _.max(this, val_func);
    };
    Array.prototype.min = function (val_func) {
        return _.min(this, val_func);
    };
    Array.prototype.select_recursive = function (val_func) {
        return _.select_recursive(this, val_func);
    };
    Array.prototype.sort_by = function (val_func) {
        val_func = val_func || (x => x);
        let res = this.sort((a, b) => val_func(a) - val_func(b));
        return res;
    };
}

Function.prototype.es6_args = function () {
    let _this = this;
    return function (s) {
        if (Array.isArray(s)) {
            s = s[0];
        }
        return _this(s);
    }
}

/*** @type {function(string): string[]}*/
export const qw = (str => str?.trim()?.split(' ')?.filter(Boolean)).es6_args();

const date_cfg = new Map([
    [date_and_time.addYears, qw`years y`],
    [date_and_time.addMonths, qw`month m`],
    [date_and_time.addDays, qw`day d`],
    [date_and_time.addHours, qw`hour h`],
    [date_and_time.addMinutes, qw`minute min`],
    [date_and_time.addSeconds, qw`second sec`],
    [date_and_time.addMilliseconds, qw`millisecond mls`],
]);
const dur_cfg = new Map([
    ['s', 1000],
    ['m', 1000 * 60],
    ['h', 1000 * 60 * 60],
    ['d', 1000 * 60 * 60 * 24],
    ['w', 1000 * 60 * 60 * 24 * 7],
]);

export const date = {
    /**
     * Formatting date
     * @param d_obj {Date | string | number}
     * @param format {string} Examples:
     * YYYY/MM/DD HH:mm:ss -> 2015/01/02 23:14:05
     * ddd, MMM DD YYYY -> Fri, Jan 02 2015
     * hh:mm A [GMT]Z -> 11:14 PM GMT-0800
     * @param utc {boolean}
     * @return {string}
     */
    format: function (d_obj, format, utc = false) {
        d_obj = new Date(d_obj);
        return date_and_time.format(d_obj, format, utc);
    },
    /**
     * @param _date {Date}
     * @param opt
     */
    add: function add(_date, opt) {
        date_cfg.forEach((times, func) => {
            let values = +_.sum(times.map(x => opt[x]).filter(Number.isInteger))
            _date = func(_date, values);
        });
        return _date;
    },
    /**
     * Prints duration in human readable form
     * @param mls {number}
     * @return {string}
     */
    str2dur: function (mls) {
        let parts = [];
        for (let [key, zone] of _.sort_by(dur_cfg.entries_arr(), x => -x[1])) {
            if (mls >= zone) {
                parts.push(Math.floor(mls / zone) + key);
                mls = mls % zone;
            }
        }
        if (mls) {
            parts.push(mls + 'mls');
        }
        return parts.join(' ');
    },
    /**
     * Calculates duration from human readable form
     * @param str {string}
     * @return {number}
     */
    dur2str: function (str) {
        let res = 0, i;
        let dur_cfg_copy = new Map([...dur_cfg.entries_arr(),
            ['mls', 1]]);
        for (let part of qw(str)) {
            for (let [key, zone] of dur_cfg_copy.entries_arr()) {
                if (part.includes(key)
                    && Number.isInteger(i = +part.replace(key, ''))) {
                    res += i * zone;
                }
            }
        }
        return res;
    }
};
export const sleep = async mls => new Promise((resolve) => {
    setTimeout(() => resolve(true), mls);
})

export const to_arr = obj => Array.isArray(obj) ? obj : [obj];
export const _ = {
    /**
     * Find index by compare func
     * @param arr {Array}
     * @param iteratee {(any)=>any} iteraty func
     * @param compare_fn {(l: any, r: any)=>number} compare func
     * @returns {number}
     */
    find_index: function (arr, iteratee, compare_fn) {
        if (!arr?.length) {
            return -1;
        }
        let min = iteratee(arr[0]), index = 0;
        for (let i = 1; i < arr.length; i++) {
            let other = iteratee(arr[i]);
            if (compare_fn(min, other) > 0) {
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
        return arr[_.find_index(arr, min_by || (x => x), (l, r) => l - r)];
    },
    /**
     *
     * @param arr {Array}
     * @param max_by {(any)=>any | undefined}
     * @returns {*}
     */
    max: function (arr, max_by) {
        return arr[_.find_index(arr, max_by || (x => x), (l, r) => r - l)];
    },
    /**
     * @param arr {Array}
     * @param sum_by {(any)=>number | undefined}
     */
    sum: function (arr, sum_by) {
        sum_by = sum_by || (x => x);
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
            left: left.filter(x => !right.includes(x)),
            common: left.filter(x => right.includes(x)),
            right: right.filter(x => !left.includes(x)),
        }
    },
    /**
     *
     * @param arr {Array}
     * @param child_fn {(x: any)=>Array}
     */
    select_recursive: function (arr, child_fn) {
        let res = [];
        if (Array.isArray(arr)) {
            for (let elem of arr) {
                res.push(elem);
                res.push(..._.select_recursive(child_fn(elem), child_fn));
            }
        }
        return res;
    },
    /**
     * Sorting with function selecting key per array item. Using default comparer.
     * Sorting and returns same array!
     * @param arr {Array}
     * @param value_fn {(any)=>any}
     */
    sort_by: function (arr, value_fn) {
        value_fn = value_fn || (x => x);
        let res = arr.sort((a, b) => value_fn(a) - value_fn(b));
        return res;
    },
    /**
     * Soft assigning. Nested objects will merge with each other
     * @param to {any}
     * @param from {any}
     */
    assign: function (to, from) {
        for (let [key, value] of Object.entries(from || {})) {
            if (typeof value == 'object') {
                to[key] = to[key] || {};
                _.assign(to[key], value);
            } else
                to[key] = value;
        }
        return to;
    },
    get: function (src, paths) {
        if (typeof paths == 'string')
            paths = paths.split('.');
        let _paths = [...paths];
        let temp = src;
        while (temp && _paths.length) {
            temp = temp[_paths.shift()];
        }
        return temp;
    },
    set: function (src, value, paths) {
        if (typeof paths == 'string')
            paths = paths.split('.');

        let temp = src;
        for (let key of paths.slice(0, -1)) {
            if (!temp.hasOwnProperty(key))
                temp[key] = {};

            temp = temp[key];
        }
        temp[paths[paths.length - 1]] = value;
    },
    pick: function (src, props) {
        if (typeof props == 'string')
            props = qw(props);
        if (!Array.isArray(props) || !props.length)
            return {};
        let result = {};
        props.forEach(key => {
            let value = _.get(src, key);
            _.set(result, value, key);
        });
        return result;
    },
}

const html_tags = {
    b: '\x1b[1m',
    u: '\x1b[4m',
    i: '\x1b[2m',

    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    white: '\x1b[37m',
    gray: '\x1b[90m',

    black_b: '\x1b[40m',
    red_b: '\x1b[41m',
    green_b: '\x1b[42m',
    blue_b: '\x1b[44m',
    yellow_b: '\x1b[43m',
    white_b: '\x1b[47m',
    gray_b: '\x1b[100m',
};
export const console_format = txt => {
    let reset = '\x1b[0m';
    for (let [key, val] of Object.entries(html_tags)) {
        let open = new RegExp(`<\\s*${key}\\s*>`, 'g');
        let close = new RegExp(`<\\s*/\\s*${key}\\s*>`, 'g');
        txt = txt.replace(open, val).replace(close, reset);
    }
    return txt;
};

export function lazy(async_fn) {
    let promise;
    return async () => {
        promise = promise || new Promise(async (resolve, reject) => {
            try {
                await async_fn();
                resolve();
            } catch (e) {
                reject(e);
            }
        });
        return await promise;
    };
}

/**
 * Returns string hash
 * @param {string} str - any string
 * @returns {string}
 */
export function hash(str) {
    return crypto.MD5(str)?.toString();
}

/**
 * Returns hash of file content
 * @param {string} str - path to file
 * @returns {WordArray|string}
 */
export function filehash(str) {
    if (!fs.existsSync(str))
        return '';
    let text = fs.readFileSync(str, 'utf-8');
    return crypto.MD5(text).toString();
}

/**
 * @param cmd {string}
 * @param opts {CommonSpawnOptions}
 * @returns {Promise<{code: number, result: string, pid: number}>}
 */
export async function exec(cmd, opts = {}) {
    return new Promise(async (resolve, reject) => {
        let command = 'bash', f_arg = '-c';
        if (os.platform() == 'win32') {
            command = 'powershell';
            f_arg = 'Invoke-Expression';
        }
        let res = child_process.spawnSync(command, [f_arg, `"${cmd.replace(/\"/g, `'`)}"`], {
            cwd: process.cwd(),
            env: process.env,
            encoding: 'buffer',
            ...opts
        });
        if (res.error)
            return reject(res.error);
        let text = res.output?.map(x => x?.toString('utf-8')).filter(Boolean).join('\n');
        let result = {
            code: res.status,
            result: text,
            pid: res.pid,
        };
        return resolve(result);
    });
}

const log_levels = {
    debug: console.debug.bind(console),
    trace: console.trace.bind(console),
    info: console.info.bind(console),
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),

    get_levels: function () {
        return qw`debug trace info log warn error`;
    },
    get_fn_by_lvl: function (level) {
        level = level.trim().toLowerCase();
        if (this.get_levels().includes(level)) {
            return this[level];
        }
    },
    accept_level_mask: function (mask, level) {
        level = level.trim().toLowerCase();
        let all = this.get_levels();
        if (!all.includes(level))
            return false;

        let upper = mask.includes('+'), lower = mask.includes('+');
        mask = mask.replaceAll('+', '').replaceAll('-', '')
            .trim().toLowerCase();
        if (mask == level)
            return true;
        if (upper && all.indexOf(level) >= all.indexOf(mask))
            return true;
        if (lower && all.indexOf(level) <= all.indexOf(mask))
            return true;
        return false;
    },
};
/**
 * @typedef {object} LogCfg
 * @property {string} log_dir  path to logs directory
 * @property {string?} date_format  date format for logs, by default
 * DD.MM.YYYY HH:mm:ss.SSS
 * @property {string} mask Log level mask. Use debug+ for debug level and
 * higher. Use warn- for warn and lower, etc
 * @property {string} logfile_format  date format for log file. Must be valid
 * date format. DD.MM.YYYY by default
 */

/*** @param cfg {LogCfg}*/
export const setup_log = (cfg) => {
    if (!cfg.log_dir)
        throw new Error('You should set log directory!');
    if (cfg.date_format && typeof cfg.date_format != 'string')
        throw new Error('date_format should be a string!');

    const to_write = [];
    let scheduled = false;

    function get_log_file() {
        return join_mkfile(cfg.log_dir, date.format(new Date(),
            cfg.logfile_format || 'DD.MM.YYYY', true) + '.log');
    }

    function flush() {
        while (to_write.length) {
            let write = '\n' + to_write.splice(0, to_write.length).join('\n');
            let fpath = get_log_file();
            fs.appendFileSync(fpath, write, 'utf-8');
        }
        scheduled = false;
    }

    const write_fn = lvl => (...txt) => {
        let final_text = lvl.toString().toUpperCase().padEnd(7, ' ')
            + date.format(new Date(), cfg.date_format || 'DD.MM.YYYY HH:mm:ss.SSS')
            + ' ' + format(...txt);


        if (!cfg.mask || log_levels.accept_level_mask(cfg.mask, lvl)) {
            to_write.push(final_text);
            if (!scheduled) {
                process.nextTick(flush);
                scheduled = true;
            }
        }
        log_levels.get_fn_by_lvl(lvl)?.(final_text);
    }
    log_levels.get_levels().forEach(fn => console[fn] = write_fn(fn));
};

export function debounce(func, mls) {
    let timer, promise;
    return (...args) => {
        if (promise)
            return;
        clearTimeout(timer);
        timer = setTimeout(() => {
            promise = new Promise(async (resolve, reject) => {
                try {
                    let res = await func.apply(this, args);
                    resolve(res);
                } catch (e) {
                    reject(e);
                } finally {
                    promise = null;
                }
            });
        }, mls);
    };
}

/**
 * Return value between min and max value
 * @param min {any} min value (including)
 * @param val {any} value
 * @param max {any} - max value (including)
 * @returns {any}
 */
export function clamp(min, val, max) {
    if (min > val)
        return min;
    if (max < val)
        return max;
    return val;
}

export class Awaiter {
    #promise;
    #resolve;
    #reject;
    #dbg;

    constructor(txt) {
        this.dbg = (...args) => console.debug(`[${txt}:${this.#promise.id}]`, ...args);
        this.#install_promise();
    }

    #install_promise() {
        this.#promise = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
        this.#promise.id = Math.floor(Math.random() * 1_000_000);
        this.dbg('installed');
    }

    wait_for(mls = Number.MAX_VALUE) {
        let timeout, reject;

        async function wait_promise(promise) {
            try {
                return await promise;
            } finally {
                clearTimeout(timeout);
            }
        }

        if (Number.isInteger(mls) && mls > 0 && mls < Number.MAX_VALUE)
            timeout = setTimeout(() => reject(new Error('timeout')), [mls]);

        return wait_promise(this.#promise);
    }

    resolve(val) {
        this.dbg('resolving');
        this.#resolve(val);
        this.#install_promise();
    }
}

export class Queue {
    constructor(process_single_item) {
        this._process_single_item = process_single_item;
        this.queue = [];
        this.processing = false;
    }

    push(...items) {
        items = items.filter(x => !this.queue.includes(x));
        this.queue.push(...items);
        this.#process_queue();
    }

    async #process_queue() {
        if (this.processing)
            return;
        while (this.queue.length) {
            this.processing = true;
            const cleanup_fns = [], on_catch = [], on_then = [];
            try {
                let first = this.queue[0];
                const this_param = {
                    finally: fn => cleanup_fns.push(fn),
                    catch: fn => on_catch.push(fn),
                    then: fn => on_then.push(fn),
                };
                await this._process_single_item.bind(this_param)(first);
                await Promise.all(on_then.map(x => x()).filter(x => x.then));
                this.queue.shift();
            } catch (e) {
                console.error('Error during single item proceed:', e);
                await Promise.all(on_catch.map(x => x(e)).filter(x => x.then));
            } finally {
                await Promise.all(cleanup_fns.map(x => x()).filter(x => x.then));
            }
        }
        this.processing = false;
    }
}