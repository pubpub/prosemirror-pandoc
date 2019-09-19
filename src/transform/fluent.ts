import { asNode, asArray } from "./util";
import { ProsemirrorNode, ProsemirrorDoc, PandocNode, Inline } from "../types";

const commonFluent = { asNode, asArray };

type FluentType<T> = T extends PandocNode ? PandocFluent : ProsemirrorFluent;

type CommonFluent<T> = T & {
    asArray: () => T[];
    asNode: () => T;
};

export type ProsemirrorFluent<
    T extends ProsemirrorNode = ProsemirrorNode
> = CommonFluent<T> & {
    asProsemirrorDoc: () => ProsemirrorDoc;
};

export type PandocFluent<T extends PandocNode = PandocNode> = CommonFluent<
    T
> & {
    asPandocInline: () => PandocFluent<Inline>;
};

const assignFluent = <T>(
    target: T | FluentType<T>,
    fluentizer: (target: T | FluentType<T>) => FluentType<T>,
    methods: { [key: string]: (target: any) => any }
): FluentType<T> => {
    Object.keys(methods).forEach(key => {
        const method = methods[key];
        Object.defineProperty(target, key, {
            value: () => fluentizer(method(target)),
            configurable: true,
            writable: false,
        });
    });
    return target as FluentType<T>;
};

export const pandocFluent = (node: PandocNode | PandocNode[]): PandocFluent => {
    return assignFluent<PandocFluent>(node as PandocFluent, pandocFluent, {
        ...commonFluent,
        asPandocInline: () => {
            throw new Error("Not implemented yet!");
        },
    });
};

export const prosemirrorFluent = (
    node: ProsemirrorNode | ProsemirrorNode[]
): ProsemirrorFluent => {
    return assignFluent(node, prosemirrorFluent, {
        ...commonFluent,
        asProsemirrorDoc: () => {
            throw new Error("Not implemented yet!");
        },
    });
};
