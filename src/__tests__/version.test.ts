/* global describe, it, expect */
import { callPandoc } from "../util";
import { PANDOC_API_VERSION } from "../config";

describe("PANDOC_API_VERSION", () => {
    it("Matches the version produced by the Pandoc executable (update it if not!)", () => {
        const testJson = JSON.parse(callPandoc("", "html", "json"));
        expect(testJson["pandoc-api-version"]).toEqual(PANDOC_API_VERSION);
    });
});
