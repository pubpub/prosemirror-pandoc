import { Expr } from "./types";

export const exprAcceptsMultiple = (expr: Expr): boolean => {
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
        return expr.children.some((child) => exprAcceptsMultiple(child));
    }
};

export const exprWillAlwaysMatchSingleIdentifier = (expr: Expr, id: string) => {
    if (expr.type === "identifier") {
        return expr.identifier === id;
    } else if (expr.type === "sequence") {
        return false;
    } else if (expr.type === "choice") {
        return expr.children.some((child) =>
            exprWillAlwaysMatchSingleIdentifier(child, id)
        );
    } else if (expr.type === "range") {
        return (
            expr.lowerBound === 1 &&
            exprWillAlwaysMatchSingleIdentifier(expr.child, id)
        );
    } else {
        return exprWillAlwaysMatchSingleIdentifier(expr.child, id);
    }
};
