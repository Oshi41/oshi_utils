/**
 * @typedef {Object} LexemeType
 * @property {'quoted' | 'separator' | 'array' | 'key_separator' | 'string'} type - approximate lexeme type
 * @property {number | {[end]: number, [start]: number}} [boundary]   - lexeme boundary settings. </br>
 * <b>if falsy</b>, no boundary required </br>
 * <b>if > 0</b>, any boundary required (start,end - doesn't matter) </br>
 * Otherwise, check properties: </br>
 * <b>boundary.end?</b>  should lexeme end now?</br>
 * <b>boundary.start?</b>  should lexeme start now?</br>
 */

const quotes = '\'"`'.split('');
const splitters = '|,'.split('');

/**
 * Approximate lexeme type parsing
 * @param source {string} - original parsing string
 * @param position {number} - current position
 * @returns {LexemeType}
 */
export function getLexemeType(source, position) {
    const char = source.charAt(position);
    const prev = position > 0 && source.charAt(position - 1);

    if (prev !== '\\' && quotes.includes(char))
        return {type: 'quoted', boundary: 1};

    if (splitters.includes(char))
        return {type: 'separator', boundary: {start: 1, end: 1}};

    switch (char) {
        case ':':
            return {type: 'key_separator', boundary: {start: 1, end: 1}};

        case '[':
            return {type: 'array', boundary: {start: 1}};

        case ']':
            return {type: 'array', boundary: {end: 1}};

        default:
            return {type: 'string'};
    }
}

export class Lexeme {
    #state = {source: '', start: -1, end: -1, content: '', lexeme: {type: 'string'}};

    #validate_lexeme_start() {
        const {lexeme} = this.#state;

        if (!lexeme) throw new Error('Unknown lexeme');

        // single char lexeme
        if (!!lexeme?.boundary?.start && !!lexeme?.boundary?.end) {
            this.finish_lexeme(this.#state.start + 1);
            return true;
        }

        if (!lexeme?.boundary?.start && !!lexeme?.boundary?.end) {
            throw new Error(`Lexeme[${lexeme.type}] can only be an end lexeme`);
        }

        return true;
    }

    #validate_lexeme_end() {
        if (this.isOpen()) return true;

        const {source, end} = this.#state;

        const lexeme = getLexemeType(source, end);

        if (!!lexeme?.boundary?.start && !lexeme?.boundary?.end) {
            throw new Error(`Lexeme[${lexeme.type}] can only be a start lexeme`);
        }
    }

    constructor({source, start, lexeme}={}) {
        this.#state.source = source;
        this.#state.start = +start;

        this.#state.lexeme = lexeme || getLexemeType(source, this.#state.start);
        this.#validate_lexeme_start();
    }

    finish_lexeme(index) {
        const end = this.#state.end = +index;
        const {start, source} = this.#state;

        if (isNaN(end) || end < start)
            throw new Error(`start[${start}] should be less than end[${end}]`);

        if (end >= source.length)
            throw new Error(`end[${end}] is out of source length: ${source.length}${source}`);

        this.#state.content = source.slice(start, end).trim();
        this.#validate_lexeme_end();
    }

    isOpen() {
        const {start, end, source} = this.#state;
        return start < 0 || end < start || end >= source.length;
    }
}