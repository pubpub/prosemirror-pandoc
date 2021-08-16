import {
    Cell,
    ColSpec,
    PandocNode,
    ProsemirrorNode,
    Row,
    Table,
} from "../types";
import { TransformContext, BidiTransformer } from "./types";

const cellFromPandoc = (
    cell: Cell,
    colSpec: ColSpec,
    isHead: boolean,
    context: TransformContext<PandocNode, ProsemirrorNode>
): ProsemirrorNode<"table_cell" | "table_header"> => {
    const { rowSpan, colSpan } = cell;
    return {
        type: isHead ? "table_header" : "table_cell",
        attrs: { rowspan: rowSpan, colspan: colSpan },
        content: context.transform(cell.content).asArray(),
    };
};

const rowFromPandoc = (
    row: Row,
    colSpecs: ColSpec[],
    headColumns: number | "all",
    context: TransformContext<PandocNode, ProsemirrorNode>
): ProsemirrorNode<"table_row"> => {
    const headCutoff = headColumns === "all" ? Infinity : headColumns;
    return {
        type: "table_row",
        content: row.cells.map((cell, idx) =>
            cellFromPandoc(cell, colSpecs[idx], idx < headCutoff, context)
        ),
    };
};

const fromPandoc = (node: Table): ProsemirrorNode => {
    const { head, foot, bodies, caption, colSpecs } = node;
};

const fromProsemirror = (node: ProsemirrorNode<"table">): Table => {};

export const tableTransformer: BidiTransformer<Table> = {
    fromPandoc,
    fromProsemirror,
};
