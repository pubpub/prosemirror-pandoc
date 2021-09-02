import { ProsemirrorNode, ProsemirrorSchema } from "types";
import { parseExpr, Expr, createItemAcceptor } from "expression";

interface OpenToken {
    type: "open";
    node: ProsemirrorNode;
    createdFromSplit?: boolean;
}

interface CloseToken {
    type: "close";
    node: ProsemirrorNode;
}

interface AcceptedState {
    consumeNode: (node: ProsemirrorNode) => boolean;
    acceptedNodes: ProsemirrorNode[];
}

export type Token = OpenToken | CloseToken;

export const getNaiveTokenList = (node: ProsemirrorNode) => {
    const tokens: Token[] = [];

    const visit = (node: ProsemirrorNode) => {
        tokens.push({ type: "open", node });
        if (node.content) {
            for (const child of node.content) {
                visit(child);
            }
        }
        tokens.push({ type: "close", node });
    };

    visit(node);
    return tokens;
};

export const healNaiveTokenList = (
    tokens: Token[],
    schema: ProsemirrorSchema
): Token[] => {
    const openTokens: OpenToken[] = [];
    const nextTokens: Token[] = [];

    const tokenToAcceptorMap: Map<OpenToken, AcceptedState> = new Map();
    const newOpenTokensMap: Map<ProsemirrorNode, OpenToken[]> = new Map();
    const acceptorExpressions: Map<string, Expr> = new Map();
    const nodeToTokenMap: Map<ProsemirrorNode, OpenToken[]> = new Map();

    Object.entries(schema.nodes).forEach(([key, entry]) => {
        if (entry.spec.content) {
            acceptorExpressions.set(key, parseExpr(entry.spec.content));
        }
    });

    const matchProsemirrorNode = (group: string) => (node: ProsemirrorNode) => {
        const schemaEntry = schema.nodes[node.type];
        const matchRes =
            node.type === group || schemaEntry.spec.group === group;
        return matchRes;
    };

    const openToken = (token: OpenToken) => {
        nextTokens.push(token);
        openTokens.push(token);
        nodeToTokenMap.set(token.node, [
            ...(nodeToTokenMap.get(token.node) || []),
            token,
        ]);
    };

    const getOrAddAcceptedStateToTokenMap = (token): AcceptedState => {
        const existing = tokenToAcceptorMap.get(token);
        if (existing) {
            return existing;
        }
        const next = {
            consumeNode: createItemAcceptor(
                acceptorExpressions.get(token.node.type),
                matchProsemirrorNode
            ),
            acceptedNodes: [] as ProsemirrorNode[],
        };
        tokenToAcceptorMap.set(token, next);
        return next;
    };

    for (const token of tokens) {
        if (token.type === "open") {
            const toReopen: OpenToken[] = [];
            let acceptingParentDepth = openTokens.length - 1;
            let accepted = token === tokens[0];
            while (!accepted) {
                if (acceptingParentDepth < 0) {
                    throw new Error(
                        `Prosemirror healer cannot find a suitable parent node for ${token.node.type}` +
                            ` (closed ${toReopen
                                .concat()
                                .reverse()
                                .map((t) => t.node.type)
                                .join(", ")})`
                    );
                }
                const testingToken = openTokens[acceptingParentDepth];
                const { acceptedNodes, consumeNode } =
                    getOrAddAcceptedStateToTokenMap(testingToken);
                accepted = consumeNode(token.node);
                if (accepted) {
                    acceptedNodes.push(token.node);
                } else {
                    nextTokens.push({
                        type: "close",
                        node: testingToken.node,
                    });
                    openTokens.pop();
                    toReopen.unshift({
                        type: "open",
                        node: testingToken.node,
                    });
                    --acceptingParentDepth;
                }
            }
            openToken(token);
            if (toReopen.length > 0) {
                newOpenTokensMap.set(token.node, toReopen);
            }
        } else if (token.type === "close") {
            nextTokens.push(token);
            openTokens.pop();
            const mustOpenNow = newOpenTokensMap.get(token.node);
            if (mustOpenNow) {
                for (const tokenToOpen of mustOpenNow) {
                    openToken(tokenToOpen);
                }
            }
        }
    }
    return nextTokens.map((token) => {
        const tokensForNode = nodeToTokenMap.get(token.node);
        if (tokensForNode && tokensForNode.length > 1) {
            return { ...token, createdFromSplit: true };
        }
        return token;
    });
};

export const heal = (
    node: ProsemirrorNode,
    schema: ProsemirrorSchema
): ProsemirrorNode => {
    const naiveTokens = getNaiveTokenList(node);
    const tokens = healNaiveTokenList(naiveTokens, schema);
    const parentStack = [];
    let rootNode: ProsemirrorNode;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const nextToken = tokens[i + 1];
        if (token.type === "open") {
            if (
                nextToken &&
                nextToken.type === "close" &&
                nextToken.node === token.node &&
                token.createdFromSplit
            ) {
                // We found an open(X), close(X) pair that is empty because it was created while
                // spliting an element during healing. Just ignore these nodes.
                ++i;
                continue;
            }
            const contentProp = token.node.content ? { content: [] } : {};
            const nextNode = { ...token.node, ...contentProp };
            if (parentStack.length === 0) {
                rootNode = nextNode;
            } else {
                parentStack[parentStack.length - 1].content.push(nextNode);
            }
            parentStack.push(nextNode);
        } else if (token.type === "close") {
            parentStack.pop();
        }
    }
    if (parentStack.length !== 0) {
        throw new Error(
            "Mismatched tokens encountered while healing document."
        );
    }
    return rootNode;
};
