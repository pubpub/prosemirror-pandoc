import { PandocNode, ProsemirrorNode, ProsemirrorMark } from "types";
import { FromProsemirrorTransformContext, OneOrMany } from "transform/types";
import { asArray } from "transform/util";

type NodesAndMarksBucket = {
    nodes: ProsemirrorNode[];
    marks: ProsemirrorMark[];
};

export const createWrapperNodeFromMarks = (
    innerNode: OneOrMany<PandocNode>,
    marks: ProsemirrorMark[],
    context: FromProsemirrorTransformContext
): OneOrMany<PandocNode> => {
    const { ruleset } = context;
    return marks.reduce((node, mark) => {
        const { rule } = ruleset.matchProsemirrorMarks([mark]);
        return rule.transformer(mark, asArray(node), context);
    }, innerNode);
};

const createNodesAndMarksBucket = (
    marks: ProsemirrorMark[]
): NodesAndMarksBucket => {
    return {
        nodes: [],
        marks,
    };
};

const alphabetizeObjectProps = <T extends Record<string, any>>(
    object: T
): T => {
    const next: Partial<T> = {};
    Object.keys(object)
        .sort()
        .forEach((key: keyof T) => {
            next[key] = object[key];
        });
    return next as T;
};

const canonicalizeMarks = (marks: ProsemirrorMark[]) => {
    const canonicalized = marks
        .concat()
        .sort((a, b) => (a.type > b.type ? 1 : -1))
        .map((mark) => {
            if (mark.attrs) {
                return {
                    ...mark,
                    attrs: alphabetizeObjectProps(mark.attrs),
                };
            }
            return mark;
        });
    return JSON.stringify(canonicalized);
};

export const splitNodesByMarks = (
    nodes: ProsemirrorNode[]
): NodesAndMarksBucket[] => {
    let currentCanonicalizedMarks: null | string = null;
    let currentBucket: null | NodesAndMarksBucket = null;
    const buckets: NodesAndMarksBucket[] = [];
    for (const node of nodes) {
        const currentMarks = node.marks || [];
        const canonicalizedMarks = canonicalizeMarks(currentMarks);
        const useNewBucket = canonicalizedMarks !== currentCanonicalizedMarks;
        if (useNewBucket) {
            if (currentBucket) {
                buckets.push(currentBucket);
            }
            currentBucket = createNodesAndMarksBucket(currentMarks);
            currentCanonicalizedMarks = canonicalizedMarks;
        }
        currentBucket.nodes.push(node);
    }
    if (currentBucket) {
        buckets.push(currentBucket);
    }
    return buckets;
};
