import {PropertyPath} from "./property_path.mjs";

/*** @typedef {string | number | Object | (string | number | Object)[]} ParameterValue*/

/**
 * @typedef {Object} BindSettings
 * @property {PropertyPath} path - path from reactive state root to bound property
 * @property {number} delay - delay to prevent rapid changes. Ignore if < 1. Default is -1
 * @property {'2way' | '1way2state' | '1way2view'} mode - bind mode. <br/>
 * <b>2way</b>          - view <-> state binding (default) <br/>
 * <b>1way2state</b>    - view -> state binding only <br/>
 * <b>1way2view</b>     - state -> view binding only <br/>
 * @property {string[]} listen - list of HTML events to update binding state
 */


const control_symbols = new Map([
    ...'\'`"'.split('').map(x => [x, 'quote']),
    ...'|,'.split('').map(x => [x, 'separator']),
    ['[', 'array_start'],
    [']', 'array_end'],
    [':', 'key_separator'],
])

const bind_ns = '@data-prop';
const bind_property_ns = '@data-attr';

/**
 *
 * @template {function} T
 * @param func {T}
 * @param wait {number}
 * @returns {T}
 */
function debounce(func, wait) {
    let timeout, lastInvokeTime = 0;
    if (isNaN(wait) || wait <= 0) return func;

    return function (...args) {
        const context = this;
        const now = Date.now();

        clearTimeout(timeout);

        if (now - lastInvokeTime >= wait * 2) {
            lastInvokeTime = now;
            func.apply(context, args);
        } else {
            timeout = setTimeout(() => {
                lastInvokeTime = Date.now();
                func.apply(context, args);
            }, wait);
        }
    };
}

/**
 *
 * @param value {string}
 * @param open - currently opened lexemes
 * @param current {number} current parsing index
 * @returns {(string|*|number)[]|number|*|string}
 */
function parseLexemes(value) {
    /*** @type {Lexeme[]}*/
    const lexemes = [];

    for (let i = 0; i < value.length; i++) {
        const last = lexemes.filter(x => x.isOpen)
        const char = value.slice(i, i + 1);
    }


    // escaped with quotes
    if (control_symbols.quotes.some(q => val.startsWith(q) && val.endsWith(q))) {
        return val.slice(1, -1).replaceAll(control_symbols.escaped_quotes_regex, '$1');
    }

    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('`') && val.endsWith('`'))) {
        return val.slice(1, -1).replace(/\\(['"`])/g, '$1');
    }

    if (!isNaN(val)) return Number(val);

    if (val.startsWith('[') && val.endsWith(']')) {
        return val.slice(1, -1).split(',')
            .map(item => item.trim())
            .filter(item => item)
            .map(parseValue);
    }

    return val;
}

/**
 * Parse binding value
 * @param value {string}
 * @returns {BindSettings}
 */
function parseBindValue(value) {
    const result = {
        path: new PropertyPath(''),
        mode: '2way',
        delay: -1,
        listen: [],
    };

    value = value?.trim();
    if (!value) return result;

    let buffer = '';
    let inQuotes = false;
    let quoteChar = '';
    let entries = [];

    for (let char of value) {
        if ((char === '"' || char === "'" || char === '`') && (!inQuotes || quoteChar === char)) {
            inQuotes = !inQuotes;
            quoteChar = inQuotes ? char : '';
        }
        if (!inQuotes && (char === ',' || char === '|')) {
            entries.push(buffer.trim());
            buffer = '';
        } else {
            buffer += char;
        }
    }
}


//
// /**
//  * Parse attribute and it's modifiers
//  *
//  * @param str {string}
//  * @return {Object}
//  * @property {string} prop - name of property from reactive state
//  * @property {number} modifiers.delay - execution delay
//  */
// function parse(str) {
//     const possibleSplitters = splitters.filter(x => str.includes(x));
//     // const res = {
//     //     prop: str,
//     //     modifiers: {
//     //         delay: -1,
//     //         mode: '2way',
//     //         listeners: [],
//     //     },
//     // };
//     //
//     // if (res.prop.includes('.')) {
//     //     const [actual_prop, ...modifiers] = res.prop.split('.').filter(x => x?.length);
//     //     res.prop = actual_prop;
//     //     for (let modifier of modifiers) {
//     //         const [k, val] = modifier.replaceAll(']', '')
//     //             .split('[');
//     //
//     //         if (k?.length)
//     //             res.modifiers[val] = k;
//     //     }
//     // }
//     //
//     // return res;
// }
//
// /**
//  *
//  * @param r {ReactiveState}
//  * @param attribute {Attr}
//  *
//  * @return {Object | false}
//  * @property {any} view
//  * @property {any} model
//  * @property {boolean} is_disposed
//  * @property {() => void} dispose
//  */
// function Bind(r, attribute) {
//     if (!r || !attribute?.ownerElement || !attribute.localName?.length) return;
//
//     const settings = parse(attribute.localName);
//     if (!settings?.prop?.length) return;
//
//     const listeners = [];
//
//     let disposed = false;
//     const element = attribute.ownerElement;
//     const state_path = new PropertyPath(attribute.value);
//     const view_path = attribute.localName;
//     const empty_fn = function () {
//     };
//
//     const get_view = attribute.prefix === bind_property_ns
//         ? function get_attribute() {
//             element.getAttribute(view_path)
//         }
//         : function get() {
//             return element[view_path]
//         };
//     const set_view = attribute.prefix === bind_property_ns
//         ? function set_attribute(v) {
//             element.setAttribute(view_path, v)
//         }
//         : function set(v) {
//             element[view_path] = v;
//         };
//
//     const state2view = settings.modifiers.bind === '1way2state'
//         ? empty_fn // disable state->view bind
//         : () => update('view');
//     const view2state = settings.modifiers.bind === '1way2state'
//         ? empty_fn // disable state<-view bind
//         : debounce(() => update('view'), +settings.modifiers.delay);
//
//     const dispose = () => {
//         r.unobserve('notify', state_path, state2view);
//         while (listeners.size)
//             element.removeEventListener(listeners.pop(), view2state);
//         disposed = true;
//     };
//     const check_access = () => {
//         if (disposed) return false;
//         if (!element.isConnected) {
//             dispose();
//             return false;
//         }
//
//         return true;
//     };
//     const update = from => {
//         if (!check_access()) return;
//
//         const m = state_path.resolve(r.state);
//         const v = get_view();
//         if (m === v) return;
//
//         switch (from) {
//             case 'state':
//                 return set_view(m);
//
//             case "view":
//                 return state_path.set(r.state, v);
//
//             default:
//                 console.warn('unknown update type', from);
//         }
//     }
//
//     return {
//         dispose,
//         get
//     };
//
//     this.dispose = dispose;
//
//     Object.defineProperty(this, 'view', {
//         get() {
//             check_access() && get_view();
//         },
//         set(v) {
//             check_access() && set_view(v);
//         },
//         writable: true,
//     });
//     Object.defineProperty(this, 'state', {
//         get() {
//             check_access() && state_path.resolve(r.state)
//         },
//         set(v) {
//             check_access() && state_path.set(r.state, v)
//         },
//         writable: true,
//     });
//     Object.defineProperty(this, 'is_disposed', {
//         get() {
//             return disposed;
//         },
//         set(v) {
//         },
//         writable: false,
//     });
// }
//
// /**
//  *
//  * @param r
//  * @param elem
//  * @returns {Generator<Bind, void, *>}
//  */
// function* bind_element(r, elem) {
//     for (let attr of Array.from(elem.attributes)) {
//         if (attr.prefix == bind_ns || attr.prefix == bind_property_ns) {
//             const bind = Bind
//             yield new Bind(r, attr);
//         }
//     }
// }