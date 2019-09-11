"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
exports.__esModule = true;
// A simple recursive-descent parser to turn expressions like `(Space | Str)+` into syntax trees
exports.parseRegexp = function (str) {
    str = str.trim();
    // Remove spaces around choice separators
    str = str.replace(/\s+\|\s+/g, "|");
    // Remove extraneous spaces
    str = str.replace(/\s+/g, " ");
    // Keep track of the separator type we have at this level. It should either be choice separators
    // ("|") or sequential separators (" ").
    var separator;
    // Find separators
    var separators = [];
    // Keep track of open and close parens
    var parenCount = 0;
    for (var ptr = 0; ptr < str.length; ++ptr) {
        var char = str.charAt(ptr);
        if (char === "(") {
            ++parenCount;
        }
        else if (char === ")") {
            --parenCount;
        }
        else if (parenCount === 0 && (char === "|" || char === " ")) {
            if (separator && separator !== char) {
                throw new Error("Please surround mixed separators with parentheses!" +
                    (" e.g. prefer '(Foo | Bar) Baz' over 'Foo | Bar Baz'. (at " + ptr + ", parsing '" + str + "')"));
            }
            else {
                separator = char;
                separators.push(ptr);
            }
        }
    }
    if (separators.length > 0) {
        var separated = [];
        var substring = "";
        for (var ptr = 0; ptr < str.length; ++ptr) {
            if (separators.includes(ptr)) {
                separated.push(substring);
                substring = "";
            }
            else {
                substring += str.charAt(ptr);
            }
        }
        if (substring.length > 0) {
            separated.push(substring);
        }
        return {
            type: separator === " " ? "sequence" : "choice",
            children: separated.map(exports.parseRegexp)
        };
    }
    else if (str.endsWith("+")) {
        return {
            type: "oneOrMore",
            child: exports.parseRegexp(str.slice(0, str.length - 1))
        };
    }
    else if (str.endsWith("*")) {
        return {
            type: "zeroOrMore",
            child: exports.parseRegexp(str.slice(0, str.length - 1))
        };
    }
    else if (str.startsWith("(") && str.endsWith(")")) {
        return exports.parseRegexp(str.slice(1, str.length - 1));
    }
    return { type: "identifier", identifier: str };
};
var state = function (guard) {
    var successors = new Set();
    var addSuccessor = function (s) {
        successors.add(s);
    };
    var getSuccessors = function (currentNodes) {
        var consumesNode = !!guard;
        var _a = __read(currentNodes), firstNode = _a[0], restNodes = _a.slice(1);
        if (consumesNode) {
            if (firstNode && guard(firstNode)) {
                return {
                    nextNodes: restNodes,
                    successors: Array.from(successors)
                };
            }
            else {
                return {
                    nextNodes: currentNodes,
                    successors: []
                };
            }
        }
        else {
            return {
                nextNodes: currentNodes,
                successors: Array.from(successors)
            };
        }
    };
    return { addSuccessor: addSuccessor, getSuccessors: getSuccessors };
};
var createAcceptanceMachine = function (expr) {
    var startState = state();
    var acceptState = state();
    if (expr.type === "identifier") {
        var identifierState = state(function (n) { return n.type === expr.identifier; });
        startState.addSuccessor(identifierState);
        identifierState.addSuccessor(acceptState);
    }
    else if (expr.type === "choice") {
        var choiceMachines = expr.children.map(createAcceptanceMachine);
        choiceMachines.forEach(function (machine) {
            startState.addSuccessor(machine.startState);
            machine.acceptState.addSuccessor(acceptState);
        });
    }
    else if (expr.type === "sequence") {
        var sequenceMachines = expr.children.map(createAcceptanceMachine);
        var finalAcceptState = sequenceMachines.reduce(function (intermediateAcceptState, nextMachine) {
            intermediateAcceptState.addSuccessor(nextMachine.startState);
            return nextMachine.acceptState;
        }, startState);
        finalAcceptState.addSuccessor(acceptState);
    }
    else if (expr.type === "zeroOrMore") {
        var innerMachine = createAcceptanceMachine(expr.child);
        startState.addSuccessor(innerMachine.startState);
        innerMachine.acceptState.addSuccessor(acceptState);
        startState.addSuccessor(acceptState);
        acceptState.addSuccessor(startState);
    }
    else if (expr.type === "oneOrMore") {
        var innerMachine = createAcceptanceMachine(expr.child);
        startState.addSuccessor(innerMachine.startState);
        innerMachine.acceptState.addSuccessor(acceptState);
        acceptState.addSuccessor(startState);
    }
    else {
        startState.addSuccessor(acceptState);
    }
    return { startState: startState, acceptState: acceptState };
};
exports.accepts = function (regexpString, nodes) {
    var regexp = exports.parseRegexp(regexpString);
    var _a = createAcceptanceMachine(regexp), startState = _a.startState, acceptState = _a.acceptState;
    var positions = [{ state: startState, nodes: nodes }];
    var _loop_1 = function () {
        var _a = positions.shift(), nodes_1 = _a.nodes, state_2 = _a.state;
        var _b = state_2.getSuccessors(nodes_1), nextNodes = _b.nextNodes, successors = _b.successors;
        if (successors.length > 0) {
            if (successors.some(function (successor) { return successor === acceptState; })) {
                return { value: true };
            }
            successors.forEach(function (successor) {
                positions.push({ state: successor, nodes: nextNodes });
            });
        }
    };
    while (positions.length > 0) {
        var state_1 = _loop_1();
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return false;
};
