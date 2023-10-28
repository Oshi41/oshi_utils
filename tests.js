process.env.EXTEND_ARRAY_PROTO = 'true';

import {describe, it, test, mock, beforeEach, afterEach} from 'node:test';
import {fail, deepStrictEqual, ok} from 'assert';
import {_, qw, question, sleep, date, console_format, setup_log, join_mkfile} from './index.js';
import os from "os";
import fs from "fs";
import path from "path";
import readline from "readline";
import Settings from './settings.js';
import {Writable} from "stream";

describe('_.min', ()=>{
    const _t = (name, arr, expected, fn)=>it(name, ()=>{
        deepStrictEqual(_.min(arr, fn), expected);
        deepStrictEqual(arr.min(fn), expected);
    });
    _t('numbers', [1, 2, 3, 4], 1);
    _t('mixed', [1, 2, 3, '4'], 1);
    _t('string vals', qw`1 2 3 4`, '1');
    _t('date', [1, 2].map(x=>new Date(x)), new Date(1));
    _t('date', [new Date(), new Date(2)], new Date(2));
    _t('min_by', [{a: 1}, {a: 2}], {a: 1}, x=>x.a);
});
describe('_.max', ()=>{
    const _t = (name, arr, expected, fn)=>it(name, ()=>{
        deepStrictEqual(_.max(arr, fn), expected);
        deepStrictEqual(arr.max(fn), expected);
    });

    _t('numbers', [1, 2, 3, 4], 4);
    _t('mixed', [1, 2, 3, '4'], '4');
    _t('string vals', qw`1 2 3 4`, '4');
    _t('date', [1, 2].map(x=>new Date(x)), new Date(2));
    _t('date', [new Date('01.01.1980'), new Date(2)], new Date('01.01.1980'));
    _t('min_by', [{a: 1}, {a: 2}], {a: 2}, x=>x.a);
});
describe('_.sum', ()=>{
    const _t = (name, arr, expected, fn)=>it(name, ()=>{
        deepStrictEqual(_.sum(arr, fn), expected);
        deepStrictEqual(arr.sum(fn), expected);
    });
    _t('empty', [], 0);
    _t('0', [0], 0);
    _t('1', [1], 1);
    _t('many', [1, 2, 3], 6);
    _t('by func', [{a: 1}, {a: 2}], 3, x=>x.a);
});
describe('_.select_recursive', ()=>{
    const _t = (name, arr, child_fn, length)=>it(name, ()=>{
        deepStrictEqual(_.select_recursive(arr, child_fn).length, length);
        deepStrictEqual(arr.select_recursive(child_fn).length, length);
    });
    _t('works', [
        {
            v: 1,
            children: [
                {
                    v: 2,
                    children: [
                        {
                            v: 3
                        }
                    ]
                }
            ],
        },
        {v: 2}
    ], x=>x?.children, 4);
});
describe('arr_diff', ()=>{
    const _t = (name, left, right, {l, r, c})=>it(name, ()=>{
        let diff = _.arr_diff(left, right);
        deepStrictEqual(diff.left, l);
        deepStrictEqual(diff.right, r);
        deepStrictEqual(diff.common, c);
    });
    _t('works', [1, 2, 3], [2, 3, 4], {
        l: [1],
        r: [4],
        c: [2, 3],
    })
});
it('Map.prototype', ()=>{
    qw`values_arr keys_arr entries_arr`.forEach(x=>deepStrictEqual(!!Map.prototype[x], true));
    let map = new Map([
        [1, 'some value'],
        [2, 'some value 2'],
        [3, 'some value 3'],
    ]);
    deepStrictEqual(map.keys_arr(), [1, 2, 3]);
    deepStrictEqual(map.values_arr(), ['some value', 'some value 2', 'some value 3']);
    deepStrictEqual(map.entries_arr(), [[1, 'some value'], [2, 'some value 2'], [3, 'some value 3']]);
});
it('Array.prototype', ()=>{
    qw`to_map min max sum select_recursive`.forEach(x=>deepStrictEqual(!!Array.prototype[x], true));
    let left = [{a: 1}, {a: 2}].to_map(x=>x.a);
    let right = new Map([
        [1, {a: 1}],
        [2, {a: 2}],
    ]);
    deepStrictEqual(left, right);
    deepStrictEqual([1, 2, 3, 4, 5].max(), 5);
    deepStrictEqual([1, 2, 3, 4, 5].sum(), 15);
    deepStrictEqual([1, 2, 3, 4, 5].min(), 1);
});
describe('readline', (s_ctx)=>{
    let write_fn, _mock;
    beforeEach(()=>{
        _mock = mock.method(readline, 'createInterface').mock;
        write_fn = (txt)=>{
            _mock.calls[0].result.write(txt+os.EOL, 'utf-8');
        };
    });
    afterEach(()=>{
        _mock.restore();
        write_fn = null;
    });
    /*** @param type {QType}*/
    const _t = (name, type, prompt, answer, is_err = false)=>it(name, async()=>{
        let promise = question('Question', type, {force: !is_err});
        await sleep(1);
        write_fn(prompt);
        try
        {
            let res = await promise;
            if (is_err)
            {
                fail('Should fail here');
            }
            deepStrictEqual(res, answer);
        } catch(e)
        {
            if (!is_err)
            {
                fail(e.message);
            } else
            {
                deepStrictEqual(!!e, true);
            }
        }
    });
    _t('readline date', 'date', '01.01.1970', new Date('01.01.1970'));
    _t('readline date_iso', 'date', '1969-12-31T17:00:00.000Z', new Date('1969-12-31T17:00:00.000Z'));
    _t('readline date fail', 'date', 'dfgdfg', null, true);
    _t('readline string', 'string', 'hello', 'hello');
    _t('readline int', 'int', '-1', -1);
    _t('readline int fail', 'int', 'abs', null, true);
    _t('readline int fail 2', 'int', '12.5', null, true);
    _t('readline float', 'float', '-1.2', -1.2);
    _t('readline float fail', 'float', 'abs', null, true);
    _t('readline float fail 2', 'float', '01.13.1980', null, true);
    _t('readline positive_int', 'positive_int', '15', 15);
    _t('readline positive_int fail', 'positive_int', '-15', null, true);
    _t('readline positive_float', 'positive_float', '15.4578', 15.4578);
    _t('readline positive_float fail', 'positive_float', '-15.4578', null, true);
    _t('readline password', 'password', '123456', '123456');
    _t('readline existing_filepath', 'existing_filepath', os.homedir(), os.homedir());
});
describe('date.add', ()=>{
    const _t = (name, from, add, to)=>it(name, ()=>{
        from = new Date(from);
        to = new Date(to);
        let other = date.add(from, add);
        deepStrictEqual(other, to);
    });
    _t('works', '01.01.2000',
        {
            y: 1,
            m: 1,
            d: 1,
            h: 1,
            min: 1,
            sec: 1,
            mls: 1
        }, '02.02.2001 1:1:1.001');
});
describe('date.str<->dur', ()=>{
    const _t = (str, num)=>it(str, ()=>{
        deepStrictEqual(date.str2dur(num), str);
        deepStrictEqual(date.dur2str(str), num);
    });
    let s = 1000, m = 60 * s, h = 60 * m, d = 24 * h, w = 7 * d;
    _t('1w 1d 1h 1m 1s 112mls', 112+s+m+h+d+w);
    _t('1d 1h 1m 1s 112mls', 112+s+m+h+d);
    _t('1w 1h 1m 1s 112mls', 112+s+m+h+w);
    _t('1w 1d 1m 1s 112mls', 112+s+m+d+w);
    _t('1w 1d 1h 1s 112mls', 112+s+h+d+w);
    _t('1w 1d 1h 1m 112mls', 112+m+h+d+w);
    _t('1w 1d 1h 1m 1s', s+m+h+d+w);
});
describe('date.format', ()=>{
    const _t = (date_obj, str, expected)=>it(expected, ()=>{
        date_obj = new Date(date_obj);
        let result = date.format(date_obj, str);
        deepStrictEqual(result, expected);
    });
    _t('01.01.2000', 'dd ddd dddd D DD', 'Sa Sat Saturday 1 01');
    _t('01.01.2000', 'M MM MMM MMMM', '1 01 Jan January');
    _t('01.01.0138', 'Y YY YYYY', '138 38 0138');
    _t('01.01.2000 13:58', 'h hh H HH', '1 01 13 13');
    _t('01.01.0138 10:00', 'A', 'AM');
    _t('01.01.0138 20:00', 'A', 'PM');
    _t('01.01.0138 20:09:04.123', 'm mm s ss SSS SS S', '9 09 4 04 123 12 1');
});
it('console color', ()=>{
    let text = `< b>Hi, there!</b> <i  >This is example test</i>
    with custom text style. <red>You</red> <green>can</green>
    <yellow>use</yellow> <gray>different</gray> <white>color</white>
    <red_b>and</red_b> <green_b>even</green_b>
    <yellow_b>different</yellow_b> <gray_b>background</gray_b>
    <black_b>color</black_b>. <  b  ><red><green_b>Also you can 
    combine tags</green_b></red></b>`;
    const formatted = console_format(text);
    console.log(formatted)
    deepStrictEqual(formatted.includes('<'), false);
    deepStrictEqual(formatted.includes('>'), false);
});
describe('setup_log', ()=>{
    let log_dir;
    beforeEach(()=>{
        log_dir = fs.mkdtempSync('log_test');
    });
    afterEach(()=>{
        if (fs.existsSync(log_dir))
            fs.rmSync(log_dir, {force: true, recursive: true});
    });
    it('works', async ()=>{
        let logfile_format = 'DD.MM.YYYY';
        setup_log({
            log_dir,
            logfile_format,
            mask: 'debug+',
        });
        qw`debug trace info log warn error`.forEach(fn=>{
            console[fn]('Hi');
        });
        await sleep(10);
        let filepath = path.join(log_dir, date.format(new Date(), logfile_format)+'.log');
        deepStrictEqual(fs.existsSync(filepath), true);
    });
});

describe('Settings', ()=>{
    let filepath;
    beforeEach(()=>{
        filepath = join_mkfile(os.tmpdir(), 'settings.crypt');
    });
    afterEach(()=>{
       if (fs.existsSync(filepath))
           fs.rmSync(filepath);
    });
    let _it = (name, cfg, pass)=>it(name, async ()=>{
        let settings = new Settings(filepath, pass);
        settings.save(cfg);
        if (pass)
        {
            ok(!!settings.iv);
            let txt = fs.readFileSync(filepath, 'utf-8');
            try {
                JSON.parse(txt);
                fail('text should be encrypted');
            } catch (e) {
                ok(e);
            }
        }
        let copy = await settings.read();
        deepStrictEqual(cfg, copy);
    });
    _it('works', {f: '111', f2: '222'});
    _it('works with pass', {f1: '111', f2: '222'}, 'password');
    _it('complex cfg', {
        str: 'str',
        int: 1,
        float: 1.2,
        bool: true,
        array: ['str', 1, 1.2, {str: 'str'}, true],
    }, 'other password 1234567890!@#$%^&*()');
});