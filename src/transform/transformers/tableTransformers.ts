import {
    Block,
    Caption,
    Cell,
    ColSpec,
    PandocNode,
    ProsemirrorNode,
    Row,
    Table,
} from "../../types";
import { TransformContext, TransformParentContext } from "../types";

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

const resolveCellAttrs = (
    cell: Cell,
    colSpecs: ColSpec[],
    prosemirrorDocWidth: number
) => {
    const colWidths = colSpecs
        .map((colSpec) => ("width" in colSpec ? colSpec.width : 0))
        // Subtract 1 from the total width here to account for 1px column dividers
        .map((percentageWidth) => -1 + percentageWidth * prosemirrorDocWidth);
    const widthAttr = colWidths.some((width) => width > 0)
        ? { colwidth: colWidths }
        : {};
    return {
        ...widthAttr,
        rowspan: cell.rowSpan,
        colspan: cell.colSpan,
    };
};

const cellFromPandoc = (
    cell: Cell,
    colSpecs: ColSpec[],
    isHead: boolean,
    context: TransformContext<PandocNode, ProsemirrorNode>
): ProsemirrorNode<"table_cell" | "table_header"> => {
    const parentContext = resolveParentContextFromTextAlignment(colSpecs[0]);
    // Don't pass empty content into table_header or table_cell, which expect block+
    const contentToTransform: Block[] =
        cell.content.length > 0
            ? cell.content
            : [{ type: "Para", content: [] }];
    return {
        type: isHead ? "table_header" : "table_cell",
        attrs: resolveCellAttrs(cell, colSpecs, context.prosemirrorDocWidth),
        content: context
            .transform(contentToTransform, { context: parentContext })
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
            cellFromPandoc(
                cell,
                colSpecs.slice(idx, idx + cell.colSpan),
                idx < headCutoff,
                context
            )
        ),
    };
};

export const pandocTableTransformer = (
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
