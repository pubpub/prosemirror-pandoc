/**
 * Implements a state-machine like token acceptor.
 */
interface Node {
    type: string;
}

interface Identifier {
    type: "identifier";
    identifier: string;
}
interface OneOrMore {
    type: "oneOrMore";
    child: RegExp;
}
interface ZeroOrMore {
    type: "zeroOrMore";
    child: RegExp;
}
interface Sequence {
    type: "sequence";
    children: RegExp[];
}
interface Choice {
    type: "choice";
    children: RegExp[];
}

type RegExp = Identifier | OneOrMore | ZeroOrMore | Sequence | Choice;

interface State {
    addSuccessor: (s: State) => void;
    getSuccessors: (n: Node) => State[];
    consumesNode: () => boolean;
    debugValue: string;
}

interface Machine {
    startState: State;
    acceptState: State;
}

interface SearchPosition {
    state: State;
    nodeCount: number;
}

// A simple recursive-descent parser to turn expressions like `(Space | Str)+` into syntax trees
export const parseRegExp = (str: string): RegExp => {
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
    for (let ptr = 0; ptr < str.length; ++ptr) {
        const char = str.charAt(ptr);
        if (char === "(") {
            ++parenCount;
        } else if (char === ")") {
            --parenCount;
        } else if (parenCount === 0 && (char === "|" || char === " ")) {
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
            children: separated.map(parseRegExp),
        };
    } else if (str.endsWith("+")) {
        return {
            type: "oneOrMore",
            child: parseRegExp(str.slice(0, str.length - 1)),
        };
    } else if (str.endsWith("*")) {
        return {
            type: "zeroOrMore",
            child: parseRegExp(str.slice(0, str.length - 1)),
        };
    } else if (str.startsWith("(") && str.endsWith(")")) {
        return parseRegExp(str.slice(1, str.length - 1));
    }
    return { type: "identifier", identifier: str };
};

const state = (
    guard?: (n: Node) => boolean,
    debugValue: string = "NoDebugValue"
): State => {
    const successors: Set<State> = new Set();

    const addSuccessor = (s: State) => {
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
        debugValue: debugValue + `(${consumesNode()})`,
    };
};

const createAcceptanceMachine = (expr: RegExp): Machine => {
    const startState = state();
    const acceptState = state();

    if (expr.type === "identifier") {
        const identifierState = state(
            (n: Node) => n.type === expr.identifier,
            "IDState"
        );
        startState.addSuccessor(identifierState);
        identifierState.addSuccessor(acceptState);
    } else if (expr.type === "choice") {
        const choiceMachines = expr.children.map(createAcceptanceMachine);
        choiceMachines.forEach(machine => {
            startState.addSuccessor(machine.startState);
            machine.acceptState.addSuccessor(acceptState);
        });
    } else if (expr.type === "sequence") {
        const sequenceMachines = expr.children.map(createAcceptanceMachine);
        const finalAcceptState = sequenceMachines.reduce(
            (intermediateAcceptState, nextMachine) => {
                intermediateAcceptState.addSuccessor(nextMachine.startState);
                return nextMachine.acceptState;
            },
            startState
        );
        finalAcceptState.addSuccessor(acceptState);
    } else if (expr.type === "zeroOrMore") {
        const innerMachine = createAcceptanceMachine(expr.child);
        startState.addSuccessor(innerMachine.startState);
        innerMachine.acceptState.addSuccessor(acceptState);
        startState.addSuccessor(acceptState);
        acceptState.addSuccessor(startState);
    } else if (expr.type === "oneOrMore") {
        const innerMachine = createAcceptanceMachine(expr.child);
        startState.addSuccessor(innerMachine.startState);
        innerMachine.acceptState.addSuccessor(acceptState);
        acceptState.addSuccessor(startState);
    } else {
        startState.addSuccessor(acceptState);
    }

    return { startState, acceptState };
};

export const acceptNodes = (regexpString: string, nodes: Node[]): number => {
    const regexp = parseRegExp(regexpString);
    const { startState, acceptState } = createAcceptanceMachine(regexp);
    const positions: SearchPosition[] = [{ state: startState, nodeCount: 0 }];
    const discoveredPositions: SearchPosition[] = [];
    const acceptedNodeCounts = [];

    const maybePushPosition = (p: SearchPosition) => {
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
