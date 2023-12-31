process.env.EXTEND_ARRAY_PROTO = 'true';

import {describe, it, test, mock, beforeEach, afterEach} from 'node:test';
import {fail, deepStrictEqual, ok, notEqual} from 'assert';
import {
    _,
    qw,
    question,
    sleep,
    date,
    console_format,
    setup_log,
    join_mkfile,
    hash,
    safe_rm,
    filehash, exec, Awaiter, debounce, Queue, clamp, promisify
} from './index.js';
import os from "os";
import fs from "fs";
import path from "path";
import readline from "readline";
import Settings from './settings.js';
import child_process from 'child_process';

describe('_.min', () => {
    const _t = (name, arr, expected, fn) => it(name, () => {
        deepStrictEqual(_.min(arr, fn), expected);
    });
    _t('numbers', [1, 2, 3, 4], 1);
    _t('mixed', [1, 2, 3, '4'], 1);
    _t('string vals', qw`1 2 3 4`, '1');
    _t('date', [1, 2].map(x => new Date(x)), new Date(1));
    _t('date', [new Date(), new Date(2)], new Date(2));
    _t('min_by', [{a: 1}, {a: 2}], {a: 1}, x => x.a);
});
describe('_.max', () => {
    const _t = (name, arr, expected, fn) => it(name, () => {
        deepStrictEqual(_.max(arr, fn), expected);
    });

    _t('numbers', [1, 2, 3, 4], 4);
    _t('mixed', [1, 2, 3, '4'], '4');
    _t('string vals', qw`1 2 3 4`, '4');
    _t('date', [1, 2].map(x => new Date(x)), new Date(2));
    _t('date', [new Date('01.01.1980'), new Date(2)], new Date('01.01.1980'));
    _t('min_by', [{a: 1}, {a: 2}], {a: 2}, x => x.a);
});
describe('_.sum', () => {
    const _t = (name, arr, expected, fn) => it(name, () => {
        deepStrictEqual(_.sum(arr, fn), expected);
    });
    _t('empty', [], 0);
    _t('0', [0], 0);
    _t('1', [1], 1);
    _t('many', [1, 2, 3], 6);
    _t('by func', [{a: 1}, {a: 2}], 3, x => x.a);
});
describe('_.select_recursive', () => {
    const _t = (name, arr, child_fn, length) => it(name, () => {
        deepStrictEqual(_.select_recursive(arr, child_fn).length, length);
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
    ], x => x?.children, 4);
});

describe('_.assign', () => {
    it('works', () => {
        let source = {nested: {}};
        _.assign(source, {nested: {link1: {url: '1234'}}});
        deepStrictEqual(source.nested.link1.url, '1234');

        _.assign(source, {nested: {link2: {url: '1234'}}});
        deepStrictEqual(source.nested.link2.url, '1234');

        _.assign(source, {nested: {link2: {url: '789'}}});
        deepStrictEqual(source.nested.link2.url, '789');
    });
});

it('_.get', () => {
    let src = {
        p1: {
            p2: {
                p3: {
                    arr: [1, 2, 3],
                    bool: true,
                    fn: () => {
                    },
                }
            }
        }
    };
    deepStrictEqual(_.get(src, 'p1.p2.p3.bool'), true);
    deepStrictEqual(_.get(src, 'p1.p2.p3.arr'), [1, 2, 3]);
    deepStrictEqual(_.get(src, 'p1.p2.p3.arr.0'), 1);
    deepStrictEqual(_.get(src, 'p1.p2.p3.p4'), undefined);
});
it('_.set', () => {
    let src = {
        p1: {
            p2: {
                p3: {
                    arr: [1, 2, 3],
                    bool: true,
                    fn: () => {
                    },
                }
            }
        }
    };
    let _it = (val, path) => {
        _.set(src, val, path);
        deepStrictEqual(_.get(src, path), val);
    };
    _it(5, 'p1.p2.p3.arr.0');
    _it(false, 'p1.p2.p3.bool');
    _it(false, 'p1.p2.p3.p4.bool');
});
it('_.pick', () => {
    let src = {
        a0: true,
        a1: true,
        a2: true,
        a3: true,
        a4: true,
    };
    deepStrictEqual(_.pick(src, 'a0'), {a0: true});
    deepStrictEqual(_.pick(src, 'a0 a1'), {a0: true, a1: true});
    deepStrictEqual(_.pick(src, ['a0', 'a1']), {a0: true, a1: true});
});
describe('arr_diff', () => {
    const _t = (name, left, right, {l, r, c}) => it(name, () => {
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
it('Map.prototype', () => {
    qw`values_arr keys_arr entries_arr`.forEach(x => deepStrictEqual(!!Map.prototype[x], true));
    let map = new Map([
        [1, 'some value'],
        [2, 'some value 2'],
        [3, 'some value 3'],
    ]);
    deepStrictEqual(map.keys_arr(), [1, 2, 3]);
    deepStrictEqual(map.values_arr(), ['some value', 'some value 2', 'some value 3']);
    deepStrictEqual(map.entries_arr(), [[1, 'some value'], [2, 'some value 2'], [3, 'some value 3']]);
});
if (0)
    it('Array.prototype', () => {
        qw`to_map min max sum select_recursive`.forEach(x => deepStrictEqual(!!Array.prototype[x], true));
        let left = [{a: 1}, {a: 2}].to_map(x => x.a);
        let right = new Map([
            [1, {a: 1}],
            [2, {a: 2}],
        ]);
        deepStrictEqual(left, right);
        deepStrictEqual([1, 2, 3, 4, 5].max(), 5);
        deepStrictEqual([1, 2, 3, 4, 5].sum(), 15);
        deepStrictEqual([1, 2, 3, 4, 5].min(), 1);
    });
describe('readline', (s_ctx) => {
    let write_fn, _mock;
    beforeEach(() => {
        _mock = mock.method(readline, 'createInterface').mock;
        write_fn = (txt) => {
            _mock.calls[0].result.write(txt + os.EOL, 'utf-8');
        };
    });
    afterEach(() => {
        _mock.restore();
        write_fn = null;
    });
    /*** @param type {QType}*/
    const _t = (name, type, prompt, answer, is_err = false) => it(name, async () => {
        let promise = question('Question', type, {force: !is_err});
        await sleep(1);
        write_fn(prompt);
        try {
            let res = await promise;
            if (is_err) {
                fail('Should fail here');
            }
            deepStrictEqual(res, answer);
        } catch (e) {
            if (!is_err) {
                fail(e.message);
            } else {
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
});
describe('date.add', () => {
    const _t = (name, from, add, to) => it(name, () => {
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
describe('date.str<->dur', () => {
    const _t = (str, num) => it(str, () => {
        deepStrictEqual(date.str2dur(num), str);
        deepStrictEqual(date.dur2str(str), num);
    });
    let s = 1000, m = 60 * s, h = 60 * m, d = 24 * h, w = 7 * d;
    _t('1w 1d 1h 1m 1s 112mls', 112 + s + m + h + d + w);
    _t('1d 1h 1m 1s 112mls', 112 + s + m + h + d);
    _t('1w 1h 1m 1s 112mls', 112 + s + m + h + w);
    _t('1w 1d 1m 1s 112mls', 112 + s + m + d + w);
    _t('1w 1d 1h 1s 112mls', 112 + s + h + d + w);
    _t('1w 1d 1h 1m 112mls', 112 + m + h + d + w);
    _t('1w 1d 1h 1m 1s', s + m + h + d + w);
});
describe('date.format', () => {
    const _t = (date_obj, str, expected) => it(expected, () => {
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
it('console color', () => {
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
describe('setup_log', () => {
    let log_dir;
    beforeEach(() => {
        log_dir = fs.mkdtempSync('log_test');
    });
    afterEach(() => {
        if (fs.existsSync(log_dir))
            fs.rmSync(log_dir, {force: true, recursive: true});
    });
    it('works', async () => {
        let logfile_format = 'DD.MM.YYYY';
        setup_log({
            log_dir,
            logfile_format,
            mask: 'debug+',
        });
        qw`debug trace info log warn error`.forEach(fn => {
            console[fn]('Hi');
        });
        await sleep(10);
        let filepath = path.join(log_dir, date.format(new Date(), logfile_format) + '.log');
        deepStrictEqual(fs.existsSync(filepath), true);
    });
});
describe('hash', () => {
    it('string', () => {
        let left = hash('1234');
        let right = hash('1234');
        deepStrictEqual(left, right);
    });
    it('file', () => {
        let fp, content = '12345678';
        try {
            fs.writeFileSync(fp = join_mkfile(os.tmpdir(), 'temp.txt'), content, 'utf-8');
            let left = filehash(fp);
            let right = hash(content);
            deepStrictEqual(left, right);
        } catch (e) {
            console.error(e);
        } finally {
            safe_rm(fp);
        }
    });
});

it('clamp', () => {
    let _it = (min, val, max, exp, msg = undefined) => {
        deepStrictEqual(exp, clamp(min, val, max), msg);
    };
    _it(0, 200, 100, 100);
    _it(0, 100, 100, 100);
    _it(0, 99, 100, 99);

    _it(0, -1, 100, 0);
    _it(-10, -1, 100, -1);
    _it(-100, -50, -2, -50);

    let it_date = (min, val, max, exp, msg = undefined)=>{
        deepStrictEqual(new Date(exp), clamp(new Date(min), new Date(val), new Date(max)), msg);
    };
    it_date(0, new Date(), '1980', '1980');
    it_date(0, 1, 2, 1);
    it_date(0, new Date(), Number.MAX_VALUE, new Date());
});

describe('promisify', ()=>{
   it('works', async () => {
       let data = {};
       let fn = promisify(() => {
           this.after(() => data.after = true);
           this.finally(() => data.finally = true);
           data.call = true;
       });
       await fn();
       deepStrictEqual(data.after, true);
       deepStrictEqual(data.finally, true);
       deepStrictEqual(data.call, true);
   });
   it('works for catch', async () => {
       let data = {};
       let fn = promisify(function () {
           this.after(() => data.after = true);
           this.catch(() => data.catch = true);
           this.finally(() => data.finally = true);
           data.call = true;
           throw new Error('ERROR');
       });
       await fn().catch(x=>{});
       deepStrictEqual(data.after, false);
       deepStrictEqual(data.catch, true);
       deepStrictEqual(data.finally, true);
       deepStrictEqual(data.call, true);
   });
   it('works chain', async () => {
       let catches = [], finallies = [];
       let fn = promisify(function () {
           this.catch(() => catches.push(1));
           this.catch(() => catches.push(2));
           this.catch(() => catches.push(3));

           this.finally(() => finallies.push(3));
           this.finally(() => finallies.push(2));
           this.finally(() => finallies.push(1));

           throw new Error('here');
       });
       await fn().catch(x => {});
       deepStrictEqual(catches, [3, 2, 1]);
       deepStrictEqual(finallies, [1, 2, 3]);
   });
});
describe('Settings', () => {
    let filepath;
    beforeEach(() => {
        filepath = join_mkfile(os.tmpdir(), 'settings.crypt');
    });
    afterEach(() => {
        if (fs.existsSync(filepath))
            fs.rmSync(filepath);
    });
    let _it = (name, cfg, pass) => it(name, async () => {
        let settings = new Settings(filepath, pass);
        settings.save(cfg);
        if (pass) {
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
    it('use_fresh', async () => {
        let settings = new Settings(filepath, '1234');
        let cfg = settings.use_fresh(20);
        cfg.param = 1;
        let from_file = await settings.read();
        deepStrictEqual(cfg.param, from_file.param);

        settings.save({
            param1: 1,
            param2: '1234',
            param3: {
                param4: true,
            },
        });

        await sleep(50);
        from_file = await settings.read();

        deepStrictEqual(cfg.param, undefined);
        deepStrictEqual(cfg.param1, from_file.param1);
        deepStrictEqual(cfg.param2, from_file.param2);
        deepStrictEqual(cfg.param3.param4, from_file.param3.param4);

        cfg.param3.param4 = false;
        await sleep(50);
        from_file = await settings.read();

        // Nssting fields are not supported
        notEqual(cfg.param3.param4, from_file.param3.param4);
    });
});
describe('child_process', () => {
    it('works', async () => {
        let cmd = `cd "${os.homedir()}" && ls -t`;
        let text = await new Promise((resolve, reject) => {
            let command = 'powershell', f_arg = 'Invoke-Expression';
            let res = child_process.spawnSync(command, [f_arg, cmd], {
                env: process.env,
                cwd: process.cwd(),
            });
            if (res.error)
                reject(res.error);

            let text = res?.output?.map(x => x?.toString('utf-8')).filter(Boolean).join('\n')
            resolve(text);
        });
        deepStrictEqual(!!text, true);
    });
    it('works with exec', async () => {
        let cmd = `cd "${os.homedir()}" && ls -t`;
        let {result, code} = await exec(cmd);
        deepStrictEqual(!!result, true);
    });
});

describe('Awaiter', () => {
    it('works', async () => {
        let awaiter = new Awaiter();
        let prev = new Date();
        setTimeout(() => {
            awaiter.resolve(true);
        }, 300);
        let res = await awaiter.wait_for();
        deepStrictEqual(res, true);
        let now = new Date();
        ok(now - prev >= 300);
    });
    it('check await chain', async () => {
        let awaiter = new Awaiter();
        for (let i = 0; i < 5; i++) {
            let prev = new Date();
            setTimeout(() => {
                awaiter.resolve(true);
            }, 30);
            let res = await awaiter.wait_for();
            deepStrictEqual(res, true);
            let now = new Date();
            ok(now - prev >= 30);
        }
    });
    it('works with timeout', async () => {
        let awaiter = new Awaiter();
        setTimeout(() => {
            awaiter.resolve(true);
        }, 100);
        try {
            await awaiter.wait_for(30);
            fail('Should failed');
        } catch (e) {
            ok(e.message == 'timeout');
        }
    });
});

describe('debounce', () => {
    it('works', async () => {
        let mls = 100;
        let a = 0, fn = debounce(() => {
            a++;
        }, mls);

        for (let j = 0; j < 10; j++) {
            fn();
            deepStrictEqual(a, 0);
        }
        await sleep(mls + 1);
        deepStrictEqual(a, 1);
        await sleep(mls + 1);
        deepStrictEqual(a, 1);
    });
    it('async works', async () => {
        let a = 0, fn = debounce(async () => {
            await sleep(50);
            a++;
        }, 50);

        for (let j = 0; j < 10; j++) {
            fn();
            deepStrictEqual(a, 0);
        }
        await sleep(50);
        deepStrictEqual(a, 0);
        for (let j = 0; j < 10; j++) {
            fn();
            deepStrictEqual(a, 0);
        }
        await sleep(50);
        deepStrictEqual(a, 1);
    });
});

if (0)
    describe('Queue', () => {
        it('works', async () => {
            let a = 0, queue = new Queue(async arg => {
                await sleep(30);
                console.log('Awaited', a);
                a++;
            });
            queue.push(1, 1, 1);
            await sleep(100);
            deepStrictEqual(a, 3);
        });
    });