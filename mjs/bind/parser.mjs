export default function parse(expressionString) {
    const parsedProperties = {};

    // Find positions of top-level delimiters (',' or '|')
    const delimiterPositions = findTopLevelDelimiters(expressionString);

    // Split the string into individual property strings
    let propertyStart = 0;
    const propertyStrings = [];
    for (const delimiterPosition of delimiterPositions) {
        propertyStrings.push(expressionString.slice(propertyStart, delimiterPosition).trim());
        propertyStart = delimiterPosition + 1;
    }
    propertyStrings.push(expressionString.slice(propertyStart).trim());

    // Parse each property string
    for (const propertyString of propertyStrings) {
        if (propertyString) {
            const colonPosition = findTopLevelColon(propertyString);
            let propertyKey, valueString;

            // If there's a colon, it's a key-value pair; otherwise, it's just a value (key = "path")
            if (colonPosition !== -1) {
                propertyKey = propertyString.slice(0, colonPosition).trim();
                valueString = propertyString.slice(colonPosition + 1).trim();
            } else {
                propertyKey = "path";
                valueString = propertyString.trim();
            }

            const parsedValue = parseValue(valueString);
            parsedProperties[propertyKey] = parsedValue;
        }
    }

    return parsedProperties;
}

function findTopLevelDelimiters(inputString) {
    const delimiterPositions = [];
    let parsingState = "default"; // "default", "quoted"
    let quoteType = null; // '"' or "'"
    let arrayDepth = 0;

    for (let index = 0; index < inputString.length; index++) {
        const currentChar = inputString[index];

        if (parsingState === "default") {
            if (currentChar === '"' || currentChar === "'") {
                parsingState = "quoted";
                quoteType = currentChar;
            } else if (currentChar === "[") {
                arrayDepth++;
            } else if (currentChar === "]") {
                if (arrayDepth > 0) arrayDepth--;
            } else if ((currentChar === "," || currentChar === "|") && arrayDepth === 0) {
                delimiterPositions.push(index);
            }
        } else if (parsingState === "quoted") {
            // Exit quoted state if we find the matching quote that's not escaped
            if (currentChar === quoteType && (index === 0 || inputString[index - 1] !== "\\")) {
                parsingState = "default";
            }
        }
    }

    return delimiterPositions;
}

function findTopLevelColon(inputString) {
    let parsingState = "default";
    let quoteType = null;
    let arrayDepth = 0;

    for (let index = 0; index < inputString.length; index++) {
        const currentChar = inputString[index];

        if (parsingState === "default") {
            if (currentChar === '"' || currentChar === "'") {
                parsingState = "quoted";
                quoteType = currentChar;
            } else if (currentChar === "[") {
                arrayDepth++;
            } else if (currentChar === "]") {
                if (arrayDepth > 0) arrayDepth--;
            } else if (currentChar === ":" && arrayDepth === 0) {
                return index;
            }
        } else if (parsingState === "quoted") {
            if (currentChar === quoteType && (index === 0 || inputString[index - 1] !== "\\")) {
                parsingState = "default";
            }
        }
    }

    return -1; // No top-level colon found
}

function parseValue(valueString) {
    valueString = valueString.trim();

    // Handle quoted string
    if (valueString.startsWith('"') || valueString.startsWith("'")) {
        const quoteType = valueString[0];
        if (valueString.endsWith(quoteType)) {
            const quotedContent = valueString.slice(1, -1);
            return unescapeQuoted(quotedContent, quoteType);
        } else {
            throw new Error("Unmatched quote in value: " + valueString);
        }
    }

    // Handle array
    else if (valueString.startsWith("[") && valueString.endsWith("]")) {
        const arrayContent = valueString.slice(1, -1).trim();
        if (!arrayContent) return [];
        const arrayDelimiterPositions = findTopLevelDelimiters(arrayContent);

        // Split array content into items
        const arrayItems = [];
        let itemStart = 0;
        for (const delimiterPosition of arrayDelimiterPositions) {
            arrayItems.push(arrayContent.slice(itemStart, delimiterPosition).trim());
            itemStart = delimiterPosition + 1;
        }
        arrayItems.push(arrayContent.slice(itemStart).trim());

        // Recursively parse each item
        return arrayItems.map(parseValue);
    }

    // Handle invalid array brackets
    else if (valueString.startsWith("[") || valueString.endsWith("]")) {
        throw new SyntaxError("Unclosed array");
    }

    // Plain string
    else {
        return valueString;
    }
}

function unescapeQuoted(quotedContent, quoteType) {
    return quotedContent.replaceAll(`\\` + quoteType, quoteType);
}