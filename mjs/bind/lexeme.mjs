import {Lexeme_type} from "./lexeme_type.mjs";

export class Lexeme {
    /**
     *
     * @param source {string}
     * @param start {number}
     */
    constructor(source, start) {
        const type = new Lexeme_type(source, start);
        let end = -1;

        for (let i = start + 1; i <= source?.length; i++) {
            // reach the end
            if (i === source?.length) {
                end = source.length;
                break;
            }

            // consume the item
            if (type.canConsume(source, i))
                continue;

            // can close at this char
            if (type.canCloseHere(source, i)) {
                end = i;
                break;
            }

            // can have children inside
            if (type.canHaveChildren()) {
                const child = new Lexeme(source, i);
                i = child.end;

                if (child.type.isActualData()) {
                    this.children ??= [];
                    this.children.push(child);
                }
            }
        }

        if (end < start) {
            throw new Error(`Cannot close lexeme: ${type}, ${source.slice(start)}`);
        }

        // need to include last bracket and quote
        if (type.type === 'array' || type.type === 'quoted')
            end += 1;

        /**** @type {string | number | []}*/
        this.value = source.slice(start, end);

        // remove quotes
        if (type.type === 'quoted')
            this.value = this.value.slice(1, -1);

        if (this.children?.length) {
            this.value = this.children.map(x => x.value);
        }

        this.start = start;
        this.type = type;
        this.end = end;
    }

    toString() {
        let str = `${this.type.type} ${this.start}:${this.end} ${JSON.stringify(this.value, null, 2)}`;
        return str;
    }
}

/**
 *
 * @param value {string}
 * @returns {Lexeme[]}
 */
export function parse_bind_expression(value) {
    const result = [];

    let index = 0;
    /**** @type {Lexeme[]}*/
    const lexemes = [];

    while (index < value.length) {
        const item = new Lexeme(value, index);
        index = item.end;

        if (item.type.isActualData())
            lexemes.push(item);
    }

    let current = [];
    const err = () => new Error('Syntax error: ' + JSON.stringify({current, result}, null, 2));

    function install_property() {
        if (current.length === 1)
            current.unshift('path');
        result.push([...current]);
        current.length = 0;
    }

    for (let i = 0; i < lexemes.length; i++) {
        const lex = lexemes[i];

        if (lex.type.type === 'list_separator' && (current.length < 1 || current.length > 2))
            throw err();

        if (lex.type.type === 'property_divider') {
            if (current.length !== 1) throw err();

            if (i + 1 === current.length) throw err();
        }

        if (['_empty_', 'space'].includes(lex.type.type))
            throw err();


        // flush property
        if (lex.type.type === 'list_separator') {
            install_property()
            continue;
        }

        // instaling value
        if (lex.type.type === 'property_divider') {
            // skipping property divider
            i++;
            current.push(lexemes[i].value);
            continue;
        }

        current.push(lex.value);
    }

    if (current?.length)
        install_property();

    console.log(result, '\n');

    return lexemes;
}