import {
    Caption,
    Cell,
    ColSpec,
    PandocNode,
    ProsemirrorNode,
    Row,
    Table,
} from "../types";
import { TransformContext, TransformParentContext } from "./types";

const resolveCaption = (
    caption: Caption,
    context: TransformContext<PandocNode, ProsemirrorNode>
): ProsemirrorNode[] => {
    const { shortCaption, content } = caption;
    return [
        ...context.transform(content).asArray(),
        ...(shortCaption ? context.transform(shortCaption).asArray() : []),
    ];
};

const resolveParentContextFromTextAlignment = (
    colSpec: ColSpec
): Partial<TransformParentContext> => {
    if (colSpec.alignment === "AlignCenter") {
        return { textAlign: "center" };
    }
    if (colSpec.alignment === "AlignRight") {
        return { textAlign: "right" };
    }
    return {};
};

const resolveCellAttrs = (cell: Cell, colSpec: ColSpec, docWidth: number) => {
    const width = "width" in colSpec ? { width: colSpec.width * docWidth } : {};
    return {
        ...width,
        rowspan: cell.rowSpan,
        colspan: cell.colSpan,
    };
};

const cellFromPandoc = (
    cell: Cell,
    colSpec: ColSpec,
    isHead: boolean,
    context: TransformContext<PandocNode, ProsemirrorNode>
): ProsemirrorNode<"table_cell" | "table_header"> => {
    const parentContext = resolveParentContextFromTextAlignment(colSpec);
    return {
        type: isHead ? "table_header" : "table_cell",
        attrs: resolveCellAttrs(cell, colSpec, context.docWidth),
        content: context
            .transform(cell.content, { context: parentContext })
            .asArray(),
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

export const tableFromPandoc = (
    node: Table,
    context: TransformContext<PandocNode, ProsemirrorNode>
):
    | ProsemirrorNode<"table">
    | [ProsemirrorNode<"table">, ...ProsemirrorNode[]] => {
    const { head, foot, bodies, caption, colSpecs } = node;

    const renderMyRow = (row: Row, headColumns: number | "all") =>
        rowFromPandoc(row, colSpecs, headColumns, context);

    const headRows = head.rows.map((row) => renderMyRow(row, "all"));
    const bodyRows = bodies
        .map((body) => [
            ...body.headRows.map((row) => renderMyRow(row, "all")),
            ...body.bodyRows.map((row) =>
                renderMyRow(row, body.rowHeadColumns)
            ),
        ])
        .reduce((a, b) => [...a, ...b]);
    const footRows = foot.rows.map((row) => renderMyRow(row, 0));
    const prosemirrorCaption = resolveCaption(caption, context);

    const table: ProsemirrorNode<"table"> = {
        type: "table",
        content: [...headRows, ...bodyRows, ...footRows],
    };

    if (prosemirrorCaption.length > 0) {
        return [table, ...prosemirrorCaption];
    }

    return table;
};
