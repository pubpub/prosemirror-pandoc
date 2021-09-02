import { Expr } from "./types";

// A simple recursive-descent parser to turn expressions like `(Space | Str)+` into syntax trees
export const parseExpr = (str: string): Expr => {
    str = str.trim();
    // Remove spaces around choice separators
    str = str.replace(/\s*\|\s*/g, "|");
    // Remove extraneous spaces
    str = str.replace(/\s+/g, " ");

    // Keep track of the separator type we have at this level. It should either be choice separators
    // ("|") or sequential separators (" ").
    let separator;
    // Find separators
    const separators = [];
    // Keep track of open and close parens
    let parenCount = 0;
    // Keep track of open and close curlies
    let curlyCount = 0;
    for (let ptr = 0; ptr < str.length; ++ptr) {
        const char = str.charAt(ptr);
        if (char === "(") {
            ++parenCount;
        } else if (char === ")") {
            --parenCount;
        } else if (char === "{") {
            ++curlyCount;
        } else if (char === "}") {
            --curlyCount;
        } else if (
            parenCount === 0 &&
            curlyCount === 0 &&
            (char === "|" || char === " ")
        ) {
            if (separator && separator !== char) {
                throw new Error(
                    "Please surround mixed separators with parentheses!" +
                        ` e.g. prefer '(Foo | Bar) Baz' over 'Foo | Bar Baz'. (at ${ptr}, parsing '${str}')`
                );
            } else {
                separator = char;
                separators.push(ptr);
            }
        }
    }
    if (separators.length > 0) {
        const separated: string[] = [];
        let substring = "";
        for (let ptr = 0; ptr < str.length; ++ptr) {
            if (separators.includes(ptr)) {
                separated.push(substring);
                substring = "";
            } else {
                substring += str.charAt(ptr);
            }
        }
        if (substring.length > 0) {
            separated.push(substring);
        }
        return {
            type: separator === " " ? "sequence" : "choice",
            children: separated.map(parseExpr),
        };
    } else if (str.endsWith("}")) {
        let ptr = str.length - 1;
        while (str.charAt(ptr) !== "{") {
            ptr--;
        }
        const rangeStrs = str.slice(ptr + 1, str.length - 1).split(",");
        const hasTwo = rangeStrs.length === 2;
        const range = rangeStrs.map((str) => parseInt(str.trim()));
        const [lowerBound, upperBound] = range;
        return {
            type: "range",
            lowerBound,
            upperBound: hasTwo
                ? isNaN(upperBound)
                    ? null
                    : upperBound
                : lowerBound,
            child: parseExpr(str.slice(0, ptr)),
        };
    } else if (str.endsWith("+")) {
        return {
            type: "oneOrMore",
            child: parseExpr(str.slice(0, str.length - 1)),
        };
    } else if (str.endsWith("*")) {
        return {
            type: "zeroOrMore",
            child: parseExpr(str.slice(0, str.length - 1)),
        };
    } else if (str.startsWith("(") && str.endsWith(")")) {
        return parseExpr(str.slice(1, str.length - 1));
    }
    return { type: "identifier", identifier: str };
};
