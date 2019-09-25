/**
 * Implements a regular expression-like language parser, and a finite state machine generator
 * for evaluating lists of nodes against such an expression. For example:
 *
 * const expr = parseExpr("(A | B)+ C")
 * const acceptedNodesCount = <string>acceptNodes(
 *    expr,
 *    ['A', 'B', 'A', 'C', 'A'],
 *    id => str => id === str
 * ) // === 4 because only the first four elements of the input array match the expression.
 */
interface Identifier {
    type: "identifier";
    identifier: string;
}
interface OneOrMore {
    type: "oneOrMore";
    child: Expr;
}
interface ZeroOrMore {
    type: "zeroOrMore";
    child: Expr;
}
interface Range {
    type: "range";
    lowerBound: number;
    upperBound: number | null;
    child: Expr;
}

interface Sequence {
    type: "sequence";
    children: Expr[];
}
interface Choice {
    type: "choice";
    children: Expr[];
}

export type IdentifierMatch<Node> = (id: string) => (node: Node) => boolean;

export type Expr =
    | Identifier
    | OneOrMore
    | ZeroOrMore
    | Sequence
    | Choice
    | Range;

interface State<Node> {
    addSuccessor: (s: State<Node>) => void;
    getSuccessors: (n: Node) => State<Node>[];
    consumesNode: () => boolean;
}

interface Machine<Node> {
    startState: State<Node>;
    acceptState: State<Node>;
}

interface SearchPosition<Node> {
    state: State<Node>;
    nodeCount: number;
}

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
    let separators = [];
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
        let separated: string[] = [];
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
        const range = rangeStrs.map(str => parseInt(str.trim()));
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

const state = <Node>(guard?: (n: Node) => boolean): State<Node> => {
    const successors: Set<State<Node>> = new Set();

    const addSuccessor = (s: State<Node>) => {
        successors.add(s);
    };

    const getSuccessors = (currentNode: Node) => {
        const passesGuard = !guard || (currentNode && guard(currentNode));
        return passesGuard ? Array.from(successors) : [];
    };

    const consumesNode = () => {
        return !!guard;
    };

    return {
        addSuccessor,
        getSuccessors,
        consumesNode,
    };
};

const createAcceptanceMachine = <Node>(
    expr: Expr,
    matcher: IdentifierMatch<Node>
): Machine<Node> => {
    const startState = state();
    const acceptState = state();

    if (expr.type === "identifier") {
        const identifierState = state(matcher(expr.identifier));
        startState.addSuccessor(identifierState);
        identifierState.addSuccessor(acceptState);
    } else if (expr.type === "choice") {
        const choiceMachines = expr.children.map(x =>
            createAcceptanceMachine(x, matcher)
        );
        choiceMachines.forEach(machine => {
            startState.addSuccessor(machine.startState);
            machine.acceptState.addSuccessor(acceptState);
        });
    } else if (expr.type === "sequence") {
        const sequenceMachines = expr.children.map(x =>
            createAcceptanceMachine(x, matcher)
        );
        const finalAcceptState = sequenceMachines.reduce(
            (intermediateAcceptState, nextMachine) => {
                intermediateAcceptState.addSuccessor(nextMachine.startState);
                return nextMachine.acceptState;
            },
            startState
        );
        finalAcceptState.addSuccessor(acceptState);
    } else if (expr.type === "range") {
        const { lowerBound, upperBound, child } = expr;
        if (
            (upperBound !== null && upperBound < lowerBound) ||
            (lowerBound === 0 && upperBound === 0) ||
            lowerBound < 0
        ) {
            throw new Error(`Invalid range: [${lowerBound},${upperBound}]`);
        }
        const make = () => createAcceptanceMachine(child, matcher);
        const machines: Machine<Node>[] = [];
        const machineCount = Math.max(
            1,
            upperBound !== null ? upperBound : lowerBound
        );
        for (let i = 0; i < machineCount; i++) {
            const machine = make();
            machines.push(machine);
            if (i > 0) {
                const prev = machines[i - 1];
                prev.acceptState.addSuccessor(machine.startState);
            }
            if (i + 1 >= lowerBound) {
                machine.acceptState.addSuccessor(acceptState);
            }
        }
        if (upperBound === null) {
            const last = machines[machines.length - 1];
            last.acceptState.addSuccessor(last.startState);
        }
        const first = machines[0];
        startState.addSuccessor(first.startState);
        if (lowerBound === 0) {
            startState.addSuccessor(acceptState);
        }
    } else if (expr.type === "zeroOrMore") {
        const innerMachine = createAcceptanceMachine(expr.child, matcher);
        startState.addSuccessor(innerMachine.startState);
        innerMachine.acceptState.addSuccessor(acceptState);
        startState.addSuccessor(acceptState);
        acceptState.addSuccessor(startState);
    } else if (expr.type === "oneOrMore") {
        const innerMachine = createAcceptanceMachine(expr.child, matcher);
        startState.addSuccessor(innerMachine.startState);
        innerMachine.acceptState.addSuccessor(acceptState);
        acceptState.addSuccessor(startState);
    } else {
        startState.addSuccessor(acceptState);
    }

    return { startState, acceptState };
};

export const acceptNodes = <Node>(
    expr: Expr,
    nodes: Node[],
    matchTest: IdentifierMatch<Node>
): number => {
    const { startState, acceptState } = createAcceptanceMachine(
        expr,
        matchTest
    );
    const positions: SearchPosition<Node>[] = [
        { state: startState, nodeCount: 0 },
    ];
    const discoveredPositions: SearchPosition<Node>[] = [];
    const acceptedNodeCounts = [];

    const maybePushPosition = (p: SearchPosition<Node>) => {
        const hasAlreadyDiscoveredPosition = discoveredPositions.some(
            discoveredPosition =>
                discoveredPosition.state === p.state &&
                discoveredPosition.nodeCount === p.nodeCount
        );
        if (!hasAlreadyDiscoveredPosition) {
            positions.push(p);
        }
    };

    while (positions.length > 0) {
        const position = positions.shift();
        const { state, nodeCount } = position;
        const currentNode = nodes[nodeCount];
        const successors = state.getSuccessors(currentNode);
        discoveredPositions.push(position);
        if (state === acceptState) {
            acceptedNodeCounts.push(nodeCount);
        }
        for (const successor of successors) {
            const nextNodeCount = state.consumesNode()
                ? nodeCount + 1
                : nodeCount;
            maybePushPosition({ state: successor, nodeCount: nextNodeCount });
        }
    }

    return acceptedNodeCounts.reduce((a, b) => Math.max(a, b), 0);
};

export const expressionAcceptsMultiple = (expr: Expr): boolean => {
    if (expr.type === "identifier") {
        return false;
    } else if (expr.type === "sequence") {
        return true;
    } else if (expr.type === "oneOrMore") {
        return true;
    } else if (expr.type === "zeroOrMore") {
        return true;
    } else if (expr.type === "range") {
        return expr.upperBound === null || expr.upperBound > 1;
    } else if (expr.type === "choice") {
        return expr.children.some(child => expressionAcceptsMultiple(child));
    }
};

export const willAlwaysMatchSingleIdentifier = (expr: Expr, id: string) => {
    if (expr.type === "identifier") {
        return expr.identifier === id;
    } else if (expr.type === "sequence") {
        return false;
    } else if (expr.type === "choice") {
        return expr.children.some(child =>
            willAlwaysMatchSingleIdentifier(child, id)
        );
    } else if (expr.type === "range") {
        return (
            expr.lowerBound === 1 &&
            willAlwaysMatchSingleIdentifier(expr.child, id)
        );
    } else {
        return willAlwaysMatchSingleIdentifier(expr.child, id);
    }
};
