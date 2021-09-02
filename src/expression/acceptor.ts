import { Expr, IdentifierMatch } from "./types";

import Heap from "../heap";

interface State<Item> {
    addSuccessor: (s: State<Item>) => void;
    getSuccessors: (n: Item) => State<Item>[];
    consumesItem: () => boolean;
}

interface Machine<Item> {
    startState: State<Item>;
    acceptState: State<Item>;
}

interface SearchPosition<Item> {
    state: State<Item>;
    consumedItems: number;
}

interface SearchPosition<Item> {
    state: State<Item>;
    consumedItems: number;
}

interface DiscoveryState<Item> {
    discoveredPositions: SearchPosition<Item>[];
    positionsHeap: Heap<SearchPosition<Item>>;
}

const state = <Item>(guard?: (n: Item) => boolean): State<Item> => {
    const successors: Set<State<Item>> = new Set();

    const addSuccessor = (s: State<Item>) => {
        successors.add(s);
    };

    const getSuccessors = (currentItem: Item) => {
        const passesGuard = !guard || (currentItem && guard(currentItem));
        return passesGuard ? Array.from(successors) : [];
    };

    const consumesItem = () => {
        return !!guard;
    };

    return {
        addSuccessor,
        getSuccessors,
        consumesItem,
    };
};

const createAcceptanceMachine = <Item>(
    expr: Expr,
    matcher: IdentifierMatch<Item>
): Machine<Item> => {
    const startState = state();
    const acceptState = state();

    if (expr.type === "identifier") {
        const identifierState = state(matcher(expr.identifier));
        startState.addSuccessor(identifierState);
        identifierState.addSuccessor(acceptState);
    } else if (expr.type === "choice") {
        const choiceMachines = expr.children.map((x) =>
            createAcceptanceMachine(x, matcher)
        );
        choiceMachines.forEach((machine) => {
            startState.addSuccessor(machine.startState);
            machine.acceptState.addSuccessor(acceptState);
        });
    } else if (expr.type === "sequence") {
        const sequenceMachines = expr.children.map((x) =>
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
        const machines: Machine<Item>[] = [];
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

// Adds a position to a DiscoveryState if it hasn't already been discovered.
const maybeEnqueuePosition = <Item>(
    position: SearchPosition<Item>,
    discoveryState: DiscoveryState<Item>
) => {
    const { discoveredPositions, positionsHeap } = discoveryState;
    const hasAlreadyDiscoveredPosition = discoveredPositions.some(
        (discoveredPosition) =>
            discoveredPosition.state === position.state &&
            discoveredPosition.consumedItems === position.consumedItems
    );
    if (!hasAlreadyDiscoveredPosition) {
        positionsHeap.push(position);
    }
};

// Mark a position discovered in a DiscoveryState.
const discoverPosition = <Item>(
    position: SearchPosition<Item>,
    discoveryState: DiscoveryState<Item>
) => {
    discoveryState.discoveredPositions.push(position);
};

// We want SearchPositions with high `consumedItems` to come out first, so they get low scores.
const heapScore = <Item>(item: SearchPosition<Item>) => 0 - item.consumedItems;

export const createItemAcceptor = <Item>(
    expr: Expr,
    matchTest: IdentifierMatch<Item>
) => {
    // An "item acceptor" takes an Expr like (A | B)* and tests it against a list of items like
    // [A, B, B, A...]. We do this by transforming the expression into a state machine and
    // performing a graph search through the states, with the understanding that some edges between
    // states "consume" items in the list. A few bits of terminology first:
    //
    // - an expression or Expr is a pattern matching tool to test a list of items. The term item
    //   is intentionally generic, and while an expression is ultimately a composition of string
    //   itentifiers, the `matchTest` argument can be used to do any kind of string =?= Item
    //   comparison that you like.
    //
    // - an expression is transformed into a graph called a state machine. The nodes or vertices of
    //   this graph are called states.
    //
    // - a position or SearchPosition is a pair of values (state, consumedItems) that uniquely
    //   defines a "moment" (I'm really trying to avoid using the word "state" here) in the search
    //   that should not be repeated. In other words, the position (X, 3) means we've arrived at
    //   state X and we've seen three items so far, and if the search takes us to this position
    //   again, we ought not to explore that branch further because it's already been done.
    //
    // The "online" version of this algorithm is a little tricky to understand, so I'm going to lay
    // out how it works in some comments here. The problem is that we have a stream of Items, and
    // we want to see how many of them `expr` will accept. Say we have S = [I1, I2, I3]...we can
    // just check accepts(expr, [I1]), then accepts(expr, [I1, I2]), and finally
    // accepts(expr, [I1, I2, I3]). This is a reasonable solution for small batches of items, but
    // when checking hundreds of children (as the heal algorithm sometimes does), this quadratic
    // behavior is unacceptably slow. So we need a way to hold on to what we've learned about the
    // batch of items 0....(n - 1) when checking if the nth item is accepted. Let's look at a simple
    // state machine for the expr "I*". It has the structure:
    //
    // (S0) --> [ (S1) --- C(I) ---> (A1) ] ---> (A0)
    //              ^                 |
    //              |                 |
    //               -----------------
    //
    // Where S0 and S1 are the start and accept states for the overall state machine, and S1 and A1
    // are the start and accept states for the actual expression N*. Note that the edge from S1 to
    // A1 is labelled "C(I)" to indicate that it consumes an item. Running this on the first item is
    // straightforward enough...we just search all the positions reachable from S0 with [I] and
    // see whether we arrive at the state A0. When checking [I, I], we might be tempted to use the
    // fact that for the first I, we found the accept state, and start the search against the second
    // A at state A0. But this won't work because A0 is a terminal state with no outbound edges.
    //
    // Instead, when we're given [I, I], we have no choice but to restart the search from _all_
    // positions we explored in the search against [I]. The only reason this is faster than running
    // the whole search from scratch multiple times is the hunch that search positions with higher
    // nodeCount values are likely to bring us to a solution more quickly. Concretely, when we
    // test [I] against I* we explore the following (state, consumedItems) positions:
    //
    // (S0, 0) (S1, 0) (A1, 1) (A0, 1)
    //
    // When we test against [I, I], success means finding the position (A0, 2) -- which is only
    // reachable by exploring (A1, 1) from the last search. We'll use a max-heap to keep track of
    // positions reached in previous iterations of the search, so that positions with higher
    // consumedItems values are explored more readily. So that, in broad strokes, is the goal of
    // this code -- to test an expression against a list of items, one item at a time, while
    // providing partial results along the way and replicating as little work as possible.

    // Build a state machine graph to traverse.
    const { startState, acceptState } = createAcceptanceMachine(
        expr,
        matchTest
    );

    // Keep a running list of items we're given.
    const items = [];

    // Our initial position is the start state, with no items consumed.
    const initialPosition = {
        state: startState,
        consumedItems: 0,
    };

    // A DiscoveryState is a heap of positions to explore next, and a list of positions that we've
    // already discovered and shouldn't explore further.
    const globalDiscoveryState: DiscoveryState<Item> = {
        positionsHeap: new Heap(heapScore, [initialPosition]),
        discoveredPositions: [],
    };

    return function acceptsNextItem(nextItem: Item): boolean {
        // Create a DiscoveryState that's a shallow copy of the global discovery state. We'll
        // use this to exhaust positions locally (in this acceptsNextItem call) while preserving a
        // monotonically-growing heap of positions and list of discovered items (for the lifetime
        // of the parent createItemAcceptor frame).
        // Keep a local discovery state object that's a shallow copy of the global one.
        const localDiscoveryState: DiscoveryState<Item> = {
            positionsHeap: new Heap(
                heapScore,
                globalDiscoveryState.positionsHeap.toArray()
            ),
            discoveredPositions: [...globalDiscoveryState.discoveredPositions],
        };
        // We'll pop items only off the local discovery heap.
        const { positionsHeap: localHeap } = localDiscoveryState;
        // Mark the next item as consumable.
        items.push(nextItem);
        while (localHeap.length() > 0) {
            // Get the next best candidate position
            const position = localHeap.pop();
            const { state, consumedItems } = position;
            // If we're in the accept state and consumed all the items we have, we're successful.
            if (state === acceptState && consumedItems === items.length) {
                return true;
            }
            // Mark this position as discovered so we don't bother to explore it again.
            discoverPosition(position, globalDiscoveryState);
            discoverPosition(position, localDiscoveryState);
            const currentItem = items[consumedItems];
            // Get all the successors of this position...
            const successors = state.getSuccessors(currentItem);
            // And for each one...
            for (const successor of successors) {
                // See whether it consumes an item or not...
                const nextPosition = {
                    state: successor,
                    consumedItems: state.consumesItem()
                        ? consumedItems + 1
                        : consumedItems,
                };
                // And mark it to be explored, either in this call to acceptsNextItem, or later.
                maybeEnqueuePosition(nextPosition, globalDiscoveryState);
                maybeEnqueuePosition(nextPosition, localDiscoveryState);
            }
        }
        // Looks like we didn't find any acceptable states.
        return false;
    };
};

export const acceptItems = <Item>(
    expr: Expr,
    items: Item[],
    matchTest: IdentifierMatch<Item>
): number => {
    const { startState, acceptState } = createAcceptanceMachine(
        expr,
        matchTest
    );
    const positions: SearchPosition<Item>[] = [
        { state: startState, consumedItems: 0 },
    ];
    const discoveredPositions: SearchPosition<Item>[] = [];
    let maxConsumedItems = 0;

    const maybePushPosition = (p: SearchPosition<Item>) => {
        const hasAlreadyDiscoveredPosition = discoveredPositions.some(
            (discoveredPosition) =>
                discoveredPosition.state === p.state &&
                discoveredPosition.consumedItems === p.consumedItems
        );
        if (!hasAlreadyDiscoveredPosition) {
            positions.push(p);
        }
    };

    while (positions.length > 0) {
        const position = positions.shift();
        const { state, consumedItems: consumedItems } = position;
        const currentItem = items[consumedItems];
        const successors = state.getSuccessors(currentItem);
        discoveredPositions.push(position);
        if (state === acceptState) {
            maxConsumedItems = Math.max(maxConsumedItems, consumedItems);
        }
        for (const successor of successors) {
            const nextconsumedItems = state.consumesItem()
                ? consumedItems + 1
                : consumedItems;
            maybePushPosition({
                state: successor,
                consumedItems: nextconsumedItems,
            });
        }
    }

    return maxConsumedItems;
};
