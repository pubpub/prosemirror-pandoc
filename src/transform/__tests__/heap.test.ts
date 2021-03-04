/* global describe, it, expect */
import Heap from "../heap";

const consumeHeap = (heap) => {
    const res = [];
    while (heap.length()) {
        res.push(heap.pop())
    }
    return res;
}

describe("Heap", () => {
    it("works as a min-heap", () => {
        const heap = new Heap(x => x, [8, 6, 7, 5, 3, 0, 9]);
        expect(consumeHeap(heap)).toEqual([0, 3, 5, 6, 7, 8, 9])
    });

    it("works as a max-heap", () => {
        const heap = new Heap(x => -x, [8, 6, 7, 5, 3, 0, 9]);
        expect(consumeHeap(heap)).toEqual([9, 8, 7, 6, 5, 3, 0])
    });
});