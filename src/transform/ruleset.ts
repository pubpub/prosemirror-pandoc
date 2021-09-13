import {
    PANDOC_NODE_TYPES,
    PandocNode,
    ProsemirrorMark,
    ProsemirrorNode,
    ProsemirrorSchema,
} from "types";
import {
    parseExpr,
    exprAcceptsMultiple,
    exprWillAlwaysMatchSingleIdentifier,
    acceptItems,
} from "expression";

import {
    InferPandocPattern,
    InferProsemirrorMarkType,
    InferProsemirrorElementType,
    InferProsemirrorNodePattern,
    InferPandocNodeType,
} from "./inference";
import {
    BidirectionalTransformer,
    PandocNodeToProsemirrorMarkTransformer,
    PandocNodeToProsemirrorNodeTransformer,
    ParameterizedBidirectionalTransformer,
    ProsemirrorMarkToPandocNodeTransformer,
    ProsemirrorNodeToPandocNodeTransformer,
    Rule,
} from "./typesNew";

type AcceptResult<Rule> = {
    acceptedCount: number;
    rule: Rule;
};

const matchItemWithType =
    (identifier: string) =>
    (item: { type: string }): boolean =>
        identifier === item.type;

const assertExpressionsSafeForParameterizedTransformer = (
    pandocPattern: string,
    prosemirrorPattern: string
) => {
    const pdExpr = parseExpr(pandocPattern);
    const pmExpr = parseExpr(prosemirrorPattern);
    if (pdExpr.type !== "identifier" && pmExpr.type !== "identifier") {
        throw new Error(
            "Cannot use a transformer that takes node names as arguments in a rule that accepts patterns." +
                " For instance, calling rules.transform('A | B', 'a', tr) will fail if tr is a function" +
                " of two arguments (pandocNodeType, prosemirrorNodeType), because 'A | B' is not" +
                " a valid Pandoc node name. You will need to call the transformer with two statically known" +
                " argument types and pass the result into the transform rule instead," +
                " e.g. rules.transform('A | B', 'a', tr('A', 'a')).\n" +
                `(Attempting to transform between ${pandocPattern} and ${prosemirrorPattern}`
        );
    }
};

const throwFailedMatchError = <WithType extends { type: string }>(
    items: WithType[]
) => {
    throw new Error(
        `Could not find transform rule for items: ${
            items
                .map((item) => item.type)
                .slice(0, 3)
                .join(", ") + (items.length > 3 ? "..." : "")
        }`
    );
};

const throwMarkMatchingError = (pattern: string) => {
    throw new Error(
        `Pattern for mark conversion must accept exactly one Pandoc node or Prosemirror mark (${pattern} was supplied)`
    );
};

const warnAboutMissingMatchesForRules = (
    matchNoun: string,
    requiredTypes: string[],
    rules: Rule<any>[]
) => {
    const matchingExpressions = rules
        .map((rule) => [rule.expression, ...rule.capturedExpressions])
        .reduce((a, b) => [...a, ...b]);
    const missingTypes = requiredTypes.filter(
        (type) =>
            !matchingExpressions.some((expr) =>
                exprWillAlwaysMatchSingleIdentifier(expr, type)
            )
    );
    if (missingTypes.length > 0) {
        console.warn(
            `Cannot find rules that are guaranteed to match on a ${matchNoun} of these types: ` +
                `${missingTypes.join(", ")}.` +
                " You may want to add or modify rules so that the transformer does not break" +
                ` if it encounters one of these ${matchNoun}s.`
        );
    }
};

export class RuleSet<Schema extends ProsemirrorSchema> {
    readonly pandocNodeToProsemirrorRules: (
        | Rule<PandocNodeToProsemirrorMarkTransformer>
        | Rule<PandocNodeToProsemirrorNodeTransformer>
    )[] = [];
    readonly prosemirrorNodeToPandocNodeRules: Rule<ProsemirrorNodeToPandocNodeTransformer>[] =
        [];
    readonly prosemirrorMarkToPandocNodeRules: Rule<ProsemirrorMarkToPandocNodeTransformer>[] =
        [];
    readonly prosemirrorSchema: Schema;

    constructor(schema: Schema) {
        this.prosemirrorSchema = schema;
    }

    toProsemirrorNode<PandocNodePattern extends string>(
        pattern: PandocNodePattern,
        transformer: PandocNodeToProsemirrorNodeTransformer<
            InferPandocPattern<PandocNodePattern>
        >,
        assertCapturedPandocNodes: string[] = []
    ) {
        const expression = parseExpr(pattern);
        const capturedExpressions = assertCapturedPandocNodes.map((type) =>
            parseExpr(type)
        );
        this.pandocNodeToProsemirrorRules.push({
            isMarksRule: false,
            acceptsMultiple: exprAcceptsMultiple(expression),
            expression,
            transformer,
            capturedExpressions,
        });
    }

    toProsemirrorMark<PandocNodePattern extends string>(
        pattern: PandocNodePattern,
        transformer: PandocNodeToProsemirrorMarkTransformer<
            InferPandocPattern<PandocNodePattern>
        >,
        assertCapturedPandocNodes: string[] = []
    ) {
        const expression = parseExpr(pattern);
        const capturedExpressions = assertCapturedPandocNodes.map((type) =>
            parseExpr(type)
        );
        const acceptsMultiple = exprAcceptsMultiple(expression);
        if (acceptsMultiple) {
            throwMarkMatchingError(pattern);
        }
        this.pandocNodeToProsemirrorRules.push({
            isMarksRule: true,
            acceptsMultiple: false,
            expression,
            transformer,
            capturedExpressions,
        });
    }

    fromProsemirrorNode<ProsemirrorNodePattern extends string>(
        pattern: ProsemirrorNodePattern,
        transformer: ProsemirrorNodeToPandocNodeTransformer<
            InferProsemirrorNodePattern<ProsemirrorNodePattern, Schema>
        >,
        assertCapturedProsemirrorNodes: string[] = []
    ) {
        const expression = parseExpr(pattern);
        const capturedExpressions = assertCapturedProsemirrorNodes.map((type) =>
            parseExpr(type)
        );
        const acceptsMultiple = exprAcceptsMultiple(expression);
        this.prosemirrorNodeToPandocNodeRules.push({
            isMarksRule: false,
            acceptsMultiple,
            expression,
            transformer,
            capturedExpressions,
        });
    }

    fromProsemirrorMark<ProsemirrorMarkPattern extends string>(
        pattern: ProsemirrorMarkPattern,
        transformer: ProsemirrorMarkToPandocNodeTransformer<
            InferProsemirrorMarkType<ProsemirrorMarkPattern, Schema>
        >,
        assertCapturedProsemirrorNodes: string[] = []
    ) {
        const expression = parseExpr(pattern);
        const capturedExpressions = assertCapturedProsemirrorNodes.map((type) =>
            parseExpr(type)
        );
        const acceptsMultiple = exprAcceptsMultiple(expression);
        if (acceptsMultiple) {
            throwMarkMatchingError(pattern);
        }
        this.prosemirrorMarkToPandocNodeRules.push({
            isMarksRule: true,
            acceptsMultiple: false,
            expression,
            transformer,
            capturedExpressions,
        });
    }

    transform<PandocPattern extends string, ProsemirrorPattern extends string>(
        pandocPattern: PandocPattern,
        prosemirrorPattern: ProsemirrorPattern,
        bidirectionalTransformer:
            | BidirectionalTransformer<
                  InferPandocNodeType<PandocPattern>,
                  InferProsemirrorElementType<ProsemirrorPattern, Schema>
              >
            | ParameterizedBidirectionalTransformer<
                  PandocPattern,
                  ProsemirrorPattern,
                  Schema
              >
    ) {
        if (typeof bidirectionalTransformer === "function") {
            assertExpressionsSafeForParameterizedTransformer(
                pandocPattern,
                prosemirrorPattern
            );
            bidirectionalTransformer = bidirectionalTransformer(
                pandocPattern,
                prosemirrorPattern
            );
        }
        if ("toProsemirrorNode" in bidirectionalTransformer) {
            const { toProsemirrorNode, assertCapturedPandocNodes = [] } =
                bidirectionalTransformer;
            this.toProsemirrorNode(
                pandocPattern,
                toProsemirrorNode,
                assertCapturedPandocNodes
            );
        }
        if ("toProsemirrorMark" in bidirectionalTransformer) {
            const { toProsemirrorMark, assertCapturedPandocNodes = [] } =
                bidirectionalTransformer;
            this.toProsemirrorMark(
                pandocPattern,
                toProsemirrorMark,
                assertCapturedPandocNodes
            );
        }
        if ("fromProsemirrorNode" in bidirectionalTransformer) {
            const { fromProsemirrorNode, assertCapturedProsemirrorNodes = [] } =
                bidirectionalTransformer;
            this.fromProsemirrorNode(
                prosemirrorPattern,
                fromProsemirrorNode,
                assertCapturedProsemirrorNodes
            );
        }
        if ("fromProsemirrorMark" in bidirectionalTransformer) {
            const { fromProsemirrorMark, assertCapturedProsemirrorNodes = [] } =
                bidirectionalTransformer;
            this.fromProsemirrorMark(
                prosemirrorPattern,
                fromProsemirrorMark,
                assertCapturedProsemirrorNodes
            );
        }
    }

    validate() {
        const {
            pandocNodeToProsemirrorRules,
            prosemirrorMarkToPandocNodeRules,
            prosemirrorNodeToPandocNodeRules,
            prosemirrorSchema,
        } = this;

        warnAboutMissingMatchesForRules(
            "Pandoc node",
            PANDOC_NODE_TYPES,
            pandocNodeToProsemirrorRules
        );
        warnAboutMissingMatchesForRules(
            "Prosemirror node",
            Object.keys(prosemirrorSchema.nodes),
            prosemirrorNodeToPandocNodeRules
        );
        warnAboutMissingMatchesForRules(
            "Prosemirror mark",
            Object.keys(prosemirrorSchema.marks),
            prosemirrorMarkToPandocNodeRules
        );
    }

    private matchItems<
        ItemType extends { type: string },
        RuleType extends Rule<any>
    >(items: ItemType[], rules: RuleType[]): AcceptResult<RuleType> {
        for (const rule of rules) {
            const acceptedCount = acceptItems(
                rule.expression,
                items,
                matchItemWithType
            );
            if (acceptedCount > 0) {
                return {
                    acceptedCount,
                    rule,
                };
            }
        }
        throwFailedMatchError(items);
    }

    matchPandocNodes(nodes: PandocNode[]) {
        return this.matchItems(nodes, this.pandocNodeToProsemirrorRules);
    }

    matchProsemirrorNodes(nodes: ProsemirrorNode[]) {
        return this.matchItems(nodes, this.prosemirrorNodeToPandocNodeRules);
    }

    matchProsemirrorMarks(marks: ProsemirrorMark[]) {
        return this.matchItems(marks, this.prosemirrorMarkToPandocNodeRules);
    }
}
