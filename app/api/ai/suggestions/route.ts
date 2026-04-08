import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { demoSuggestions } from "@/lib/demo-data";
import { env } from "@/lib/env";

const bodySchema = z.object({
  url: z.string().optional().default("")
});

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());

  if (!env.openAiKey) {
    return NextResponse.json({
      suggestions: demoSuggestions.map((suggestion) => ({
        ...suggestion,
        title: body.url ? `${suggestion.title} for ${body.url}` : suggestion.title
      }))
    });
  }

  const openai = new OpenAI({ apiKey: env.openAiKey });
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: "You are a senior conversion-rate-optimization strategist. Return valid JSON only."
      },
      {
        role: "user",
        content: `Analyze this page and propose a portfolio of AI-generated A/B tests for ${body.url}. Cover multiple experiment families when relevant: visual, popup, recommendation, custom_code, funnel, content, layout, pricing. Return JSON with key "suggestions", where each item has type, title, hypothesis, expectedImpact (low|medium|high), optional primaryMetric, optional targetSelector, optional approvalState (draft|ready_for_review|approved), and changes array.`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "optify_suggestions",
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["visual", "custom_code", "popup", "recommendation", "funnel", "pricing", "content", "layout"] },
                  title: { type: "string" },
                  hypothesis: { type: "string" },
                  expectedImpact: { type: "string", enum: ["low", "medium", "high"] },
                  primaryMetric: { type: "string", enum: ["page_view", "click", "conversion", "add_to_cart", "cta_click", "checkout_start", "purchase"] },
                  targetSelector: { type: "string" },
                  approvalState: { type: "string", enum: ["draft", "ready_for_review", "approved"] },
                  changes: { type: "array", items: { type: "string" } }
                },
                required: ["type", "title", "hypothesis", "expectedImpact", "changes"],
                additionalProperties: false
              }
            }
          },
          required: ["suggestions"],
          additionalProperties: false
        }
      }
    }
  });

  const output = JSON.parse(response.output_text);
  return NextResponse.json(output);
}
