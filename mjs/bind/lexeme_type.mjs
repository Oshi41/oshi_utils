/**
 * @typedef {'list_separator' | 'property_divider' | 'quoted' | 'array'  | 'string' | 'space' | '_empty_'} LexemeTypes
 */
const cache = new Map();

function reuse(key) {
    key = `${this.constructor.name}+${key}`;

    const instance = cache.get(key);
    if (!!instance)
        return {has: true, instance};

    cache.set(key, this);
    return {has: false, instance: this};
}

function __pp(...args) {
    return args.map(x => {
        if (typeof x === 'object') {
            try {
                return JSON.stringify(x, null, 2);
            } catch (e) {
                console.error('error during JSON stringify:', e);
            }
        }

        return x?.toString();
    }).join(' ');
}

/**
 * parse approximate lexeme type
 *
 * @param source {string}
 * @param position {number}
 * @returns {LexemeTypes}
 */
function parseFuzzyLexemeType(source, position) {
    const char = source.charAt(position);
    const escaped = source.charAt(position - 1) === '\\';

    if (!char) {
        console.warn(__pp('Invalid string data:', {source, position}));
        return '_empty_';
    }

    switch (char) {
        case '"':
        case "'":
        case '`':
            // if escaped, means it's plain string now
            return escaped ? 'string' : 'quoted';

        case '|':
        case ',':
            return 'list_separator';

        case ':':
            return 'property_divider';

        case '[':
        case ']':
            return 'array';

        case ' ':
            return 'space';
    }

    return 'string';
}

export class Lexeme_type {
    /** @type {string | false}*/
    #first;
    /*** @type {LexemeTypes}*/
    #type;

    /**
     * Parse current char as lexeme type
     * @param source {string}
     * @param position {number}
     */
    constructor(source, position = 0) {
        const t = this.#type = parseFuzzyLexemeType(source, position);
        const c = source.charAt(position);

        // for complex lexeme, need to save first char
        switch (this.type) {
            case 'list_separator':
            case 'quoted':
                this.#first = c;
                break;
        }

        const key = [this.#first, this.#type].filter(Boolean).join('.');
        const existing = reuse.call(this, key);
        if (existing.has)
            return existing.instance;

        const singleChar = t === 'list_separator' || t === 'property_divider';
        const mustOpenOrClose = t === 'quoted' || t === 'array';
        const actual = t !== 'space' && t !== '_empty_';
        const canHaveChildren = t === 'array';

        /**
         * IS current lexeme exact 1 char length
         * @returns {boolean}
         */
        this.isSingleChar = () => singleChar;

        /**
         * Indicated that lexeme must create or close opened instance
         * @returns {boolean}
         */
        this.mustOpenOrClose = () => mustOpenOrClose;

        /**
         * Is lexem no white space or empty
         * @returns {boolean}
         */
        this.isActualData = () => actual;

        /**
         * Is current lexem can contain children
         * @returns {boolean}
         */
        this.canHaveChildren = () => canHaveChildren;
    }

    /**
     * @returns {LexemeTypes}
     */
    get type() {
        return this.#type;
    }

    /**
     * Check if can close lexem here.
     * Assumin we are already opened lexem
     *
     * @param source {string}
     * @param position {number}
     * @returns {boolean}
     */
    canCloseHere(source, position) {
        switch (this.type) {
            case "quoted":
                return this.type === parseFuzzyLexemeType(source, position);

            case "array":
                return source.charAt(position) === ']';
        }

        // close lexemes at the end of string
        if (position + 1 === source.length) return true;
        return this.type !== parseFuzzyLexemeType(source, position);
    }

    /**
     * Checking if can consume char.
     * Assuming lexem is already opened
     *
     * @param source {string}
     * @param position {number}
     * @returns {boolean}
     */
    canConsume(source, position) {
        // need to remove or create something but not consume
        if (this.mustOpenOrClose()) return false;

        // cannot consume elements but only create
        if (this.isSingleChar()) return false;

        // quote swallows everything
        if (this.type === 'quoted')
            return !this.canCloseHere(source, position);

        // if char belongs to other lexeme, cannot consume it
        const current_type = parseFuzzyLexemeType(source, position);
        if (current_type !== this.type)
            return false;

        return true;
    }

    toString() {
        return `[${this.type}]${!!this.#first ? `, ${this.#first}` : ''}`;
    }
}

/**
 *
 * @param value
 * @returns {{l: Lexeme_type, start: number, end: number}[]|*[]}
 */
export function parse_lexemes(value) {
    if (!value?.trim()) return [];

    /*** @type {{l: Lexeme_type, start: number, end: number}[]}*/
    const lexemes = [];
    /*** @type {Lexeme_type}*/
    let current;

    for (let i = 0; i < value.length; i++) {
        /**
         * @param upd {Lexeme_type}
         */
        function update_current(upd) {
            current = upd;

            if (current.isActualData()) {
                if (current.canCloseHere(value, i + 1)) {
                    lexemes.push({l: current, start: i, end: i + 1});
                    current = null;
                } else {
                    lexemes.push({l: current, start: i, end: -1});
                }
            }
        }

        // init new lexeme iterator
        if (!current) {
            let find = lexemes.findLast(x => x.end < 0)?.l;
            if (!find) {
                console.log('no pending items founded')
                find = new Lexeme_type(value, i);
            }

            update_current(find);
            continue;
        }

        const opened = lexemes.findLast(x => x.l === current && x.end < 0);
        const step = current.consume(value, i, !!opened ? opened.start : -1);

        // attempt to create lexem
        if (!!step?.create) {
            update_current(step.create);
            continue;
        }

        // close existing lexeme
        if (!!step?.close) {
            if (!opened)
                throw new Error(__pp('cannot close lexeme:', {lexeme: current, value}));

            opened.end = i + 1;
            // find last opened lexeme
            current = null;
            continue;
        }

        // just can consume next char
        if (!!step.consume) continue;

        if (!!step?.end)
            break;
    }

    for (let {l, start, end} of lexemes) {
        if (end > start) {
            console.log(`${l.type} "${value.slice(start, end)}"`);
        }
    }

    const missed = lexemes.filter(x => x.end < 0).map(x => __pp('Lexeme was not closed', x));
    if (!!missed.length) throw new Error(__pp('Parse error: ' + missed.join('\n')));


    return lexemes;
}