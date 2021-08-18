import { PandocNode } from "../types";

type Whitespace = "\n" | " ";
type OneOrMore<T> = [T, ...T[]];

type Trim<T> = T extends `${Whitespace}${infer U}`
    ? Trim<U>
    : T extends `${infer U}${Whitespace}`
    ? Trim<U>
    : T;

type Resolve<T> =
    | ResolveZeroOrMore<T>
    | ResolveOneOrMore<T>
    | ResolveParens<T>
    | ResolveChoice<T>
    | ResolveIdentifier<T>;

type ResolveZeroOrMore<S> = S extends `${infer Some}*`
    ? Resolve<Some> extends never
        ? never
        : Resolve<Some>[]
    : never;

type ResolveOneOrMore<S> = S extends `${infer Some}+`
    ? Resolve<Some> extends never
        ? never
        : OneOrMore<Resolve<Some>>
    : never;

type ResolveParens<S> = S extends `(${infer Some})` ? Resolve<Some> : never;

type ResolveChoice<S> = S extends `${infer Some}|${infer Rest}`
    ? Resolve<Trim<Some>> | Resolve<Trim<Rest>>
    : never;

type ResolveIdentifier<S> = S extends PandocNode["type"]
    ? PandocNode & { type: S }
    : never;

export type InferPandocNodeType<T extends string> = Resolve<T> extends never
    ? PandocNode
    : Resolve<T>;
