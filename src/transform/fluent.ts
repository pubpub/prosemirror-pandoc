import { asNode, asArray } from "./util";
import { ProsemirrorNode, PandocNode } from "../types";

const FLUENT_SYMBOL = Symbol();

export type Fluent<T> = {
    asArray: () => T[];
    asNode: () => T;
    fluent: typeof FLUENT_SYMBOL;
};

const isFluent = <T>(item: any): item is Fluent<T> =>
    "fluent" in item && item.fluent === FLUENT_SYMBOL;

export const fluent = <T extends ProsemirrorNode | PandocNode>(
    item: T | T[] | Fluent<T>
): Fluent<T> => {
    if (isFluent<T>(item)) {
        return item;
    } else {
        return {
            asArray: () => asArray(item),
            asNode: () => asNode(item),
            fluent: FLUENT_SYMBOL,
        };
    }
};
