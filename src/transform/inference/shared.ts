export type OneOrMore<T> = [T, ...T[]];

export type Trim<T> = T extends ` ${infer U}`
    ? Trim<U>
    : T extends `${infer U} `
    ? Trim<U>
    : T;
