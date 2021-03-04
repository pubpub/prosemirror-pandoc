// "Inspired" by https://eloquentjavascript.net/1st_edition/appendix2.html

type ScoreFn<T> = (t: T) => number;

export default class Heap<T> {
    private scoreFn: ScoreFn<T>;
    private content: T[];

    constructor(scoreFn: ScoreFn<T>, initialItems: T[] = []) {
        this.scoreFn = scoreFn;
        this.content = [];
        for (const item of initialItems) {
            this.push(item);
        }
    }

    push(element: T) {
        this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    }

    pop() {
        const [result] = this.content;
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this.sinkDown(0);
        }
        return result;
    }

    length() {
        return this.content.length;
    }

    toArray() {
        return [...this.content];
    }

    private bubbleUp(index: number) {
        const element = this.content[index];
        const score = this.scoreFn(element);
        while (index > 0) {
            const parentIndex = Math.floor((index + 1) / 2) - 1;
            const parent = this.content[parentIndex];
            if (score >= this.scoreFn(parent)) {
                break;
            }
            this.content[parentIndex] = element;
            this.content[index] = parent;
            index = parentIndex;
        }
    }

    private sinkDown(index: number) {
        const { length } = this.content;
        const element = this.content[index];
        const elemScore = this.scoreFn(element);
        while (true) {
            const child2N = (index + 1) * 2;
            const child1N = child2N - 1;
            let swap: null | number = null;
            let child1Score;
            if (child1N < length) {
                const child1 = this.content[child1N];
                child1Score = this.scoreFn(child1);
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }
            if (child2N < length) {
                const child2 = this.content[child2N];
                const child2Score = this.scoreFn(child2);
                const thresholdScore = swap === null ? elemScore : child1Score;
                if (child2Score < thresholdScore) {
                    swap = child2N;
                }
            }
            if (swap === null) {
                break;
            }
            this.content[index] = this.content[swap];
            this.content[swap] = element;
            index = swap;
        }
    }
}
