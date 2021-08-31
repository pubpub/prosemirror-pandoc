import { Schema as ProsemirrorSchema } from "prosemirror-model";

import { ProsemirrorMark, ProsemirrorNode } from "types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Marks<S> = S extends ProsemirrorSchema<infer Nodes, infer Marks>
    ? Marks
    : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Nodes<S> = S extends ProsemirrorSchema<infer Nodes, infer Marks>
    ? Nodes
    : never;

// TODO(ian): Maybe add some real inference here if it turns out to be possible
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type InferProsemirrorType<
    T,
    S extends ProsemirrorSchema
> = T extends Marks<S>
    ? ProsemirrorMark<T>
    : T extends Nodes<S>
    ? ProsemirrorNode<T>
    : never;
