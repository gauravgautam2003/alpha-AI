import { DynamicStructuredTool } from "@langchain/core/tools";
import { getMCPTools, callMCPTool } from "./mcpClient.js";
import { z } from "zod";



// Convert MCP JSON Schema → Zod
function jsonSchemaToZod(schema = {}) {

    if (!schema || schema.type !== "object") {
        return z.object({});
    }

    const properties = schema.properties || {};
    const required = schema.required || [];

    const shape = {};

    for (const [key, value] of Object.entries(properties)) {

        let field;

        switch (value.type) {

            case "string":
                field = z.string();
                break;

            case "number":
                field = z.number();
                break;

            case "integer":
                field = z.number().int();
                break;

            case "boolean":
                field = z.boolean();
                break;

            case "array":
                field = z.array(
                    z.any()
                );
                break;

            default:
                field = z.any();
        }

        if (value.description) {
            field = field.describe(value.description);
        }

        if (!required.includes(key)) {
            field = field.optional();
        }

        shape[key] = field;
    }

    return z.object(shape);
}


// Create LangChain tools from MCP tools
export async function createMCPTools(workspacePath) {

    const mcpTools = await getMCPTools(workspacePath);

    return mcpTools.map((tool) => {

        const schema = jsonSchemaToZod(tool.inputSchema);
        return new DynamicStructuredTool({

            name: tool.name,
            description: tool.description || `MCP tool: ${tool.name}`,
            schema,

            func: async (input) => {
                try {

                    const result = await callMCPTool(
                        workspacePath,
                        tool.name,
                        input
                    );

                    return JSON.stringify(result);

                } catch (error) {

                    return JSON.stringify({
                        error: error.message,
                    });
                }
            },
        });
    });
}
