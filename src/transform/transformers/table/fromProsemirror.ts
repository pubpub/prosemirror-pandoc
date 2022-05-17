import {
    Block,
    Caption,
    Cell,
    ColSpec,
    ProsemirrorNode,
    Row,
    Table,
} from "types";
import { FromProsemirrorTransformContext } from "transform/types";
import { createAttr } from "transform/util";

const getDefaultColSpec = (): ColSpec => ({
    type: "ColSpec",
    alignment: "AlignDefault",
    defaultWidth: true,
});

const getDefaultCaption = (): Caption => ({
    type: "Caption",
    content: [],
});

const getColumnCountFromRow = (row: ProsemirrorNode<"table_row">) => {
    return row.content
        .map((cell) => cell.attrs?.colspan ?? 1)
        .map((attr) => Number(attr))
        .reduce((a, b) => a + b);
};

const getColSpecsForTable = (
    header: ProsemirrorNode<"table_row">,
    context: FromProsemirrorTransformContext
) => {
    const { prosemirrorDocWidth } = context;
    const columnCount = getColumnCountFromRow(header);
    const colSpecs: ColSpec[] = new Array(columnCount)
        .fill(0)
        .map(() => getDefaultColSpec());
    header.content.forEach((cell, index) => {
        if ("colwidth" in cell.attrs && cell.attrs.colwidth) {
            const colWidth = cell.attrs.colwidth as (number | null)[];
            colWidth.forEach((width, cellIndex) => {
                const realColumnIndex = index + cellIndex;
                if (typeof width === "number") {
                    colSpecs[realColumnIndex] = {
                        type: "ColSpec",
                        alignment: "AlignDefault",
                        width: width / prosemirrorDocWidth,
                    };
                }
            });
        }
    });
    return colSpecs;
};

const transformCell = (
    cell: ProsemirrorNode<"table_cell" | "table_header">,
    context: FromProsemirrorTransformContext
): Cell => {
    const { transform } = context;
    const { colspan = 1, rowspan = 1 } = cell.attrs;
    return {
        type: "Cell",
        attr: createAttr(),
        alignment: "AlignDefault",
        rowSpan: Number(rowspan),
        colSpan: Number(colspan),
        content: transform(cell.content).asArray() as Block[],
    };
};

const transformRow = (
    row: ProsemirrorNode<"table_row">,
    context: FromProsemirrorTransformContext
): Row => {
    const cells = row.content as ProsemirrorNode<
        "table_cell" | "table_header"
    >[];
    return {
        type: "Row",
        attr: createAttr(),
        // Table rows may be devoid of content, for example phantom rows that
        // are automatically added to satisfy a row where each element has
        // rowspan >1
        cells: cells?.map((cell) => transformCell(cell, context)) ?? [] ,
    };
};

export const prosemirrorTableTransformer = (
    table: ProsemirrorNode<"table">,
    context: FromProsemirrorTransformContext
): Table => {
    const [header, ...body] = table.content as ProsemirrorNode<"table_row">[];
    return {
        type: "Table",
        attr: createAttr("id" in table.attrs ? String(table.attrs.id) : ""),
        caption: getDefaultCaption(),
        colSpecs: getColSpecsForTable(header, context),
        head: {
            type: "TableHead",
            attr: createAttr(),
            rows: [transformRow(header, context)],
        },
        bodies: [
            {
                type: "TableBody",
                attr: createAttr(),
                rowHeadColumns: 1,
                headRows: [],
                bodyRows: body.map((row) => transformRow(row, context)),
            },
        ],
        foot: {
            type: "TableFoot",
            attr: createAttr(),
            rows: [],
        },
    };
};

prosemirrorTableTransformer.assertCapturedProsemirrorNodes = [
    "table_row",
    "table_cell",
    "table_header",
];
