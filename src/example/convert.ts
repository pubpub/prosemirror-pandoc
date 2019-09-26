/* global process */
import { argv } from "yargs";
import { loadAndTransformFromPandoc } from "../util";
import rules from "./rules";

const getPipedData = (): Promise<string> =>
    new Promise(resolve => {
        const lines = [];
        process.stdin.resume();
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", data => {
            lines.push(data.toString());
        });
        process.stdin.on("end", () => resolve(lines.join("")));
    });

const main = async () => {
    const contents = await getPipedData();
    const { type } = argv;
    console.log(
        JSON.stringify(
            loadAndTransformFromPandoc(contents, type as string, rules)
        )
    );
};

main().catch(e => console.error(e));
