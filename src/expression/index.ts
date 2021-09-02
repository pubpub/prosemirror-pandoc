/**
 * This package implements a regular expression-like language parser, and a finite state machine
 * generator for evaluating lists of items against such an expression. For example:
 *
 * const expr = parseExpr("(A | B)+ C")
 * const acceptedItemsCount = <string>acceptItems(
 *    expr,
 *    ['A', 'B', 'A', 'C', 'A'],
 *    id => str => id === str
 * ) // === 4 because only the first four elements of the input array match the expression.
 */

export * from "./acceptor";
export * from "./parse";
export * from "./types";
export * from "./util";
