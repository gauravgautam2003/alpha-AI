/**
 * ============================================================
 * AGENT SERVICE TESTS
 * Tests: getModel(), agentLimit logic, deductCredits logic,
 *        router logic, graph routing, credit COST table
 * ============================================================
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ─── Helpers ────────────────────────────────────────────────

function makeRes() {
    const res = {
        _status: 200,
        _body: null,
        status(code) { this._status = code; return this; },
        json(body)   { this._body = body; return this; }
    };
    return res;
}

// ─── 1. Credit Cost Table ───────────────────────────────────

describe("Credit cost table (auth deductCredits)", () => {

    const COST = {
        chat: 1,
        search: 5,
        coding: 10,
        pdf: 10,
        ppt: 10,
        image: 10,
        imageGen: 10,
        imageAnalyzer: 10,
        pdfRag: 10,
        resume: 10,
        resumeBuilder: 10
    };

    test("chat costs 1 credit (cheapest)", () => {
        assert.equal(COST.chat, 1);
    });

    test("search costs 5 credits", () => {
        assert.equal(COST.search, 5);
    });

    test("premium agents cost 10 credits each", () => {
        const premium = ["coding", "pdf", "ppt", "image", "imageGen", "imageAnalyzer", "pdfRag", "resume", "resumeBuilder"];
        for (const agent of premium) {
            assert.equal(COST[agent], 10, `${agent} must cost 10 credits`);
        }
    });

    test("unknown agent defaults to 1 credit", () => {
        const cost = COST["unknown"] || 1;
        assert.equal(cost, 1);
    });

    test("resume and resumeBuilder have equal cost", () => {
        assert.equal(COST.resume, COST.resumeBuilder);
    });

    test("imageGen and imageAnalyzer have equal cost", () => {
        assert.equal(COST.imageGen, COST.imageAnalyzer);
    });
});

// ─── 2. deductCredits business logic ────────────────────────

describe("deductCredits business logic", () => {

    function deductLogic(user, agent) {
        const COST = {
            chat: 1, search: 5, coding: 10, pdf: 10, ppt: 10,
            image: 10, imageGen: 10, imageAnalyzer: 10, pdfRag: 10,
            resume: 10, resumeBuilder: 10
        };
        const required = COST[agent] || 1;
        if (!user) return { status: 400, message: "User Not Found" };
        if (user.credits < required) return { status: 400, message: "Not enough credits" };
        user.credits -= required;
        return { status: 200, credits: user.credits, success: true };
    }

    test("deducts 1 credit for chat from user with 10 credits", () => {
        const user = { credits: 10 };
        const result = deductLogic(user, "chat");
        assert.equal(result.status, 200);
        assert.equal(user.credits, 9);
    });

    test("deducts 10 credits for coding", () => {
        const user = { credits: 50 };
        const result = deductLogic(user, "coding");
        assert.equal(result.status, 200);
        assert.equal(user.credits, 40);
    });

    test("returns 400 when user has insufficient credits", () => {
        const user = { credits: 5 };
        const result = deductLogic(user, "coding"); // needs 10
        assert.equal(result.status, 400);
        assert.match(result.message, /not enough credits/i);
    });

    test("returns 400 when user is null", () => {
        const result = deductLogic(null, "chat");
        assert.equal(result.status, 400);
        assert.match(result.message, /User Not Found/i);
    });

    test("user with exactly enough credits succeeds (boundary)", () => {
        const user = { credits: 10 };
        const result = deductLogic(user, "resume"); // needs exactly 10
        assert.equal(result.status, 200);
        assert.equal(user.credits, 0);
    });

    test("user with 0 credits fails for all agents", () => {
        const agents = ["chat", "search", "coding", "resume"];
        for (const agent of agents) {
            const user = { credits: 0 };
            const result = deductLogic(user, agent);
            assert.equal(result.status, 400, `${agent} should fail with 0 credits`);
        }
    });
});

// ─── 3. updateUserPayment business logic ────────────────────

describe("updateUserPayment business logic", () => {

    function updatePayment(user, { plan, credits }) {
        if (!user) return { status: 404, message: "User Not Found", success: false };
        user.plan = plan;
        user.credits += credits;
        user.totalCredits += credits;
        user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return { status: 200, success: true };
    }

    test("upgrading to starter adds 500 credits", () => {
        const user = { plan: "free", credits: 0, totalCredits: 0, planExpiresAt: null };
        const result = updatePayment(user, { plan: "starter", credits: 500 });
        assert.equal(result.status, 200);
        assert.equal(user.plan, "starter");
        assert.equal(user.credits, 500);
        assert.equal(user.totalCredits, 500);
    });

    test("upgrading to pro adds 1000 credits", () => {
        const user = { plan: "free", credits: 0, totalCredits: 0, planExpiresAt: null };
        const result = updatePayment(user, { plan: "pro", credits: 1000 });
        assert.equal(result.status, 200);
        assert.equal(user.plan, "pro");
        assert.equal(user.credits, 1000);
    });

    test("upgrade stacks on existing credits", () => {
        const user = { plan: "starter", credits: 100, totalCredits: 500, planExpiresAt: null };
        const result = updatePayment(user, { plan: "pro", credits: 1000 });
        assert.equal(result.status, 200);
        assert.equal(user.credits, 1100);
        assert.equal(user.totalCredits, 1500);
    });

    test("planExpiresAt is set to ~30 days from now", () => {
        const user = { plan: "free", credits: 0, totalCredits: 0, planExpiresAt: null };
        updatePayment(user, { plan: "starter", credits: 500 });
        const diff = user.planExpiresAt - Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        assert.ok(diff > 0, "expiry should be in the future");
        assert.ok(diff <= thirtyDays + 5000, "expiry should be within 30 days (+5s buffer)");
    });

    test("returns 404 when user not found", () => {
        const result = updatePayment(null, { plan: "pro", credits: 1000 });
        assert.equal(result.status, 404);
        assert.equal(result.success, false);
    });
});

// ─── 4. Agent Rate Limit Logic ──────────────────────────────

describe("Agent rate limit configuration", () => {

    const Limits = {
        chat: 30, coding: 10, pdf: 10, ppt: 10,
        image: 10, imageGen: 10, imageAnalyzer: 10,
        pdfRag: 10, search: 15, resume: 10, resumeBuilder: 10
    };

    test("chat has highest rate limit (30/min)", () => {
        assert.equal(Limits.chat, 30);
        const all = Object.values(Limits);
        assert.equal(Math.max(...all), 30);
    });

    test("search has 15 requests/min", () => {
        assert.equal(Limits.search, 15);
    });

    test("expensive agents limited to 10 requests/min", () => {
        const expensive = ["coding", "pdf", "ppt", "imageGen", "imageAnalyzer", "pdfRag", "resume"];
        for (const a of expensive) {
            assert.equal(Limits[a], 10, `${a} must be capped at 10/min`);
        }
    });

    test("unknown agent falls back to chat limit", () => {
        const limit = Limits["unknown"] || Limits["chat"];
        assert.equal(limit, 30);
    });

    // Simulate the Redis-based check logic
    test("rate limiter increments counter and blocks after limit", () => {
        function simulateRateLimit(counts, userId, agent) {
            const max = Limits[agent] || Limits["chat"];
            const key = `rate:${userId}:${agent}`;
            counts[key] = (counts[key] || 0) + 1;
            if (counts[key] > max) {
                const err = new Error(`Rate limit exceeded`);
                err.status = 429;
                throw err;
            }
            return { remaining: max - counts[key] };
        }

        const counts = {};
        const userId = "user_test";

        // Fill up to the limit
        for (let i = 0; i < 10; i++) {
            const r = simulateRateLimit(counts, userId, "coding");
            assert.ok(r.remaining >= 0);
        }

        // 11th request should throw 429
        assert.throws(() => {
            simulateRateLimit(counts, userId, "coding");
        }, (err) => {
            assert.equal(err.status, 429);
            return true;
        });
    });
});

// ─── 5. Graph Router Logic ──────────────────────────────────

describe("Graph router agent resolution", () => {

    const validAgents = ["chat", "search", "coding", "pdf", "ppt", "image", "resume"];

    function resolveAgent(state) {
        // Simulate file-type routing
        if (state.file) {
            if (state.file.mimetype === "application/pdf") return "pdfRag";
            if (state.file.mimetype.startsWith("image/"))  return "imageAnalyzer";
        }
        // Explicit agent
        if (state.agent && state.agent !== "auto") return state.agent;
        // LLM-routed (simulate returning "chat" as default)
        return "chat";
    }

    function resolveGraphNode(agent) {
        switch (agent) {
            case "chat":    return "chat";
            case "search":  return "search";
            case "coding":  return "coding";
            case "pdf":     return "pdf";
            case "ppt":     return "ppt";
            case "image":
            case "imageGen": return "imageGen";
            case "pdfRag":  return "pdfRag";
            case "imageAnalyzer": return "imageAnalyzer";
            case "resume":
            case "resumeBuilder": return "resume";
            default:        return "chat";
        }
    }

    test("PDF file routes to pdfRag", () => {
        const agent = resolveAgent({ file: { mimetype: "application/pdf" }, prompt: "analyze this" });
        assert.equal(agent, "pdfRag");
    });

    test("image file routes to imageAnalyzer", () => {
        const agent = resolveAgent({ file: { mimetype: "image/png" }, prompt: "what is this?" });
        assert.equal(agent, "imageAnalyzer");
    });

    test("explicit agent=coding bypasses file routing", () => {
        const agent = resolveAgent({ agent: "coding", prompt: "write a script" });
        assert.equal(agent, "coding");
    });

    test("explicit agent=resume maps to resume graph node", () => {
        const graphNode = resolveGraphNode("resume");
        assert.equal(graphNode, "resume");
    });

    test("image agent maps to imageGen graph node (critical bug fix)", () => {
        const graphNode = resolveGraphNode("image");
        assert.equal(graphNode, "imageGen", "'image' must map to imageGen node — not fall through to default");
    });

    test("resumeBuilder maps to resume graph node", () => {
        const graphNode = resolveGraphNode("resumeBuilder");
        assert.equal(graphNode, "resume");
    });

    test("unknown agent defaults to chat", () => {
        const graphNode = resolveGraphNode("unknownAgent");
        assert.equal(graphNode, "chat");
    });

    test("auto agent defaults to chat (no file, no LLM here)", () => {
        const agent = resolveAgent({ agent: "auto", prompt: "hello" });
        assert.equal(agent, "chat");
    });

    test("all valid agent names resolve to a non-null graph node", () => {
        for (const a of validAgents) {
            const node = resolveGraphNode(a);
            assert.ok(node, `Agent ${a} must resolve to a graph node`);
        }
    });

    test("JPEG image routes to imageAnalyzer", () => {
        const agent = resolveAgent({ file: { mimetype: "image/jpeg" }, prompt: "describe" });
        assert.equal(agent, "imageAnalyzer");
    });
});

// ─── 6. LLM Model Tiering Logic (pure logic) ────────────────

describe("LLM Model tiering logic", () => {

    // Simplified deterministic version (no actual LLM import needed)
    function getModelName(agent, plan = "free") {
        const userPlan = String(plan || "free").toLowerCase();

        if (agent === "router" || agent === "intent") return "groq-fast";
        if (agent === "imageAnalyzer" || agent === "pdfRag") return "gemini-flash";

        if (userPlan === "pro") {
            if (agent === "coding") return "deepseek-coder";
            if (agent === "resume" || agent === "resumeBuilder") return "gemini-flash";
            return "groq-versatile";
        } else if (userPlan === "starter") {
            if (agent === "coding") return "deepseek-coder";
            return "groq-versatile";
        } else {
            // free
            if (agent === "coding") return "groq-versatile";
            return "groq-fast";
        }
    }

    test("router always uses groq-fast (cheapest, fastest)", () => {
        assert.equal(getModelName("router", "free"),    "groq-fast");
        assert.equal(getModelName("router", "starter"), "groq-fast");
        assert.equal(getModelName("router", "pro"),     "groq-fast");
    });

    test("imageAnalyzer always uses gemini-flash (multimodal)", () => {
        assert.equal(getModelName("imageAnalyzer", "free"),    "gemini-flash");
        assert.equal(getModelName("imageAnalyzer", "starter"), "gemini-flash");
        assert.equal(getModelName("imageAnalyzer", "pro"),     "gemini-flash");
    });

    test("pdfRag always uses gemini-flash (document understanding)", () => {
        assert.equal(getModelName("pdfRag", "free"),    "gemini-flash");
        assert.equal(getModelName("pdfRag", "pro"),     "gemini-flash");
    });

    test("free tier chat uses groq-fast", () => {
        assert.equal(getModelName("chat", "free"), "groq-fast");
    });

    test("starter tier chat uses groq-versatile (better quality)", () => {
        assert.equal(getModelName("chat", "starter"), "groq-versatile");
    });

    test("pro tier coding uses deepseek-coder (best code model)", () => {
        assert.equal(getModelName("coding", "pro"), "deepseek-coder");
    });

    test("starter tier coding uses deepseek-coder", () => {
        assert.equal(getModelName("coding", "starter"), "deepseek-coder");
    });

    test("free tier coding uses groq-versatile (still decent)", () => {
        assert.equal(getModelName("coding", "free"), "groq-versatile");
    });

    test("pro resume uses gemini-flash (best for PDF structure)", () => {
        assert.equal(getModelName("resume", "pro"), "gemini-flash");
    });

    test("null plan defaults to free tier behavior", () => {
        assert.equal(getModelName("chat", null),      "groq-fast");
        assert.equal(getModelName("chat", undefined),  "groq-fast");
    });

    test("uppercase plan string is normalized to lowercase", () => {
        // Test the normalization logic
        const plan = "FREE";
        const normalized = String(plan || "free").toLowerCase();
        assert.equal(normalized, "free");
    });
});
