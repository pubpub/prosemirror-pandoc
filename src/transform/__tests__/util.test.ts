/* global describe, it, expect */
import { flatten } from "../util";

describe("flatten", () => {
    it("turns a non-array input into an array with a single element", () => {
        expect(flatten(1)).toEqual([1]);
    });

    it("handles a flat array by returning an element-wise identical array", () => {
        expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("flattens an array two layers deep", () => {
        expect(flatten([1, [2, 3], 4, [5], 6])).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("flattens an array many layers deep", () => {
        expect(flatten([1, [2, [3]], 4, [[5], 6], [7, [8, 9]]])).toEqual([
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ]);
    });
});
