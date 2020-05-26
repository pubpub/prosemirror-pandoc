/* global describe, it, expect */
import { callPandoc } from "../util";
import { emitPandocJson } from "../emit";
import { PANDOC_API_VERSION, setPandocApiVersion } from "../config";

describe("PANDOC_API_VERSION", () => {
    it("Matches the version produced by the Pandoc executable (update it if not!)", () => {
        const testJson = JSON.parse(callPandoc("", "html", "json"));
        expect(testJson["pandoc-api-version"]).toEqual(PANDOC_API_VERSION);
    });
});

describe("setPandocApiVersion", () => {
    it("Sets the Pandoc API version specified in emitted JSON", () => {
        const newPandocApiVersion = [2, 30];
        setPandocApiVersion(newPandocApiVersion);
        expect(PANDOC_API_VERSION).toEqual(newPandocApiVersion);
        const testJson = emitPandocJson({ type: "Doc", blocks: [], meta: {} });
        expect(testJson["pandoc-api-version"]).toEqual(newPandocApiVersion);
    });
});
