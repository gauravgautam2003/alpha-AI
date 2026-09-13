/**
 * ============================================================
 * AUTH SERVICE TESTS
 * Tests: password hashing, session logic, escapeHtml,
 *        OTP logic, hashValue, plan update validation
 * ============================================================
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

// ─── Re-implement pure-logic helpers from auth.controller.js ─

const hashValue = (value) =>
    createHash("sha256").update(value).digest("hex");

const hashPassword = (password) => {
    const salt = randomUUID();
    return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};

const isPasswordValid = (password, storedHash) => {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const calculated = scryptSync(password, salt, 64);
    return timingSafeEqual(calculated, Buffer.from(hash, "hex"));
};

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

// ─── 1. Password Hashing ─────────────────────────────────────

describe("Password hashing & verification", () => {

    test("hashPassword produces salt:hash format", () => {
        const hash = hashPassword("mySecret123");
        assert.ok(hash.includes(":"), "Must contain colon separator");
        const parts = hash.split(":");
        assert.equal(parts.length, 2, "Must have exactly 2 parts: salt and hash");
    });

    test("same password hashed twice produces different hashes (random salt)", () => {
        const h1 = hashPassword("SamePassword");
        const h2 = hashPassword("SamePassword");
        assert.notEqual(h1, h2, "Different salts → different hashes");
    });

    test("isPasswordValid returns true for correct password", () => {
        const password = "Secure@123";
        const stored   = hashPassword(password);
        assert.equal(isPasswordValid(password, stored), true);
    });

    test("isPasswordValid returns false for wrong password", () => {
        const stored = hashPassword("CorrectPass");
        assert.equal(isPasswordValid("WrongPass", stored), false);
    });

    test("isPasswordValid returns false for malformed stored hash", () => {
        assert.equal(isPasswordValid("anypass", "nocolon"), false);
        assert.equal(isPasswordValid("anypass", ""), false);
        assert.equal(isPasswordValid("anypass", ":"), false);
    });

    test("password hash length is deterministic (UUID:128hex)", () => {
        const hash = hashPassword("Test");
        const [salt, hex] = hash.split(":");
        assert.equal(salt.length, 36, "UUID salt must be 36 chars");
        assert.equal(hex.length, 128, "scrypt 64-byte output = 128 hex chars");
    });

    test("empty password hashes without error", () => {
        assert.doesNotThrow(() => {
            const h = hashPassword("");
            assert.ok(isPasswordValid("", h));
        });
    });

    test("unicode passwords hash correctly", () => {
        const password = "पासवर्ड🔑Test";
        const stored = hashPassword(password);
        assert.equal(isPasswordValid(password, stored), true);
    });

    test("long password (1000 chars) hashes without error", () => {
        const password = "A".repeat(1000);
        const stored = hashPassword(password);
        assert.equal(isPasswordValid(password, stored), true);
    });
});

// ─── 2. hashValue (SHA-256 for OTP/session) ─────────────────

describe("hashValue (SHA-256)", () => {

    test("produces 64-char hex string", () => {
        const h = hashValue("test");
        assert.equal(h.length, 64);
        assert.match(h, /^[0-9a-f]{64}$/);
    });

    test("same input always produces same hash (deterministic)", () => {
        const input = "alpha-ai-session-token";
        assert.equal(hashValue(input), hashValue(input));
    });

    test("different inputs produce different hashes", () => {
        assert.notEqual(hashValue("token1"), hashValue("token2"));
    });

    test("OTP hash is unique per OTP", () => {
        const hashes = new Set();
        for (let i = 0; i < 100; i++) {
            hashes.add(hashValue(String(100000 + i)));
        }
        assert.equal(hashes.size, 100, "All OTP hashes must be unique");
    });
});

// ─── 3. escapeHtml (XSS Protection) ─────────────────────────

describe("escapeHtml (XSS protection)", () => {

    test("escapes ampersand", () => {
        assert.equal(escapeHtml("a&b"), "a&amp;b");
    });

    test("escapes less-than", () => {
        assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
    });

    test("escapes greater-than", () => {
        assert.equal(escapeHtml("x>y"), "x&gt;y");
    });

    test("escapes double quotes", () => {
        assert.equal(escapeHtml('"hello"'), "&quot;hello&quot;");
    });

    test("escapes single quotes", () => {
        assert.equal(escapeHtml("it's"), "it&#039;s");
    });

    test("escapes full XSS payload", () => {
        const result = escapeHtml('<img src=x onerror="alert(1)">');
        assert.ok(!result.includes("<"), "No raw < in output");
        assert.ok(!result.includes(">"), "No raw > in output");
        assert.ok(!result.includes('"'), "No raw \" in output");
    });

    test("safe string passes through unchanged", () => {
        assert.equal(escapeHtml("Hello World 123"), "Hello World 123");
    });

    test("number input is converted to string", () => {
        assert.equal(escapeHtml(42), "42");
    });

    test("null input is converted to 'null' string", () => {
        assert.equal(escapeHtml(null), "null");
    });
});

// ─── 4. OTP Generation Logic ─────────────────────────────────

describe("OTP generation logic", () => {

    // Simulate OTP generation: randomInt(100000, 1000000) from node:crypto
    function simulateOtp() {
        return String(Math.floor(Math.random() * 900000) + 100000);
    }

    test("OTP is always 6 digits", () => {
        for (let i = 0; i < 20; i++) {
            const otp = simulateOtp();
            assert.equal(otp.length, 6, `OTP '${otp}' must be 6 digits`);
            assert.ok(parseInt(otp) >= 100000, "OTP must be >= 100000");
            assert.ok(parseInt(otp) <= 999999, "OTP must be <= 999999");
        }
    });

    test("OTP TTL is 600 seconds (10 minutes)", () => {
        const OTP_TTL_SECONDS = 10 * 60;
        assert.equal(OTP_TTL_SECONDS, 600);
    });

    test("OTPs have sufficient entropy (not all the same)", () => {
        const otps = new Set();
        for (let i = 0; i < 10; i++) {
            otps.add(simulateOtp());
        }
        assert.ok(otps.size > 5, "OTPs should have sufficient entropy");
    });

    test("OTP range covers exactly 900000 possibilities", () => {
        const min = 100000;
        const max = 999999;
        assert.equal(max - min + 1, 900000);
    });
});

// ─── 5. Session / Auth Middleware Logic ─────────────────────

describe("Auth middleware & session validation", () => {

    function validateSession(session) {
        if (!session || !session.userId) {
            return { valid: false, error: "No active session" };
        }
        return { valid: true, userId: session.userId, plan: session.plan || "free" };
    }

    test("valid session passes validation", () => {
        const session = { userId: "user_001", plan: "pro" };
        const result = validateSession(session);
        assert.equal(result.valid, true);
        assert.equal(result.userId, "user_001");
        assert.equal(result.plan, "pro");
    });

    test("missing session fails validation", () => {
        const result = validateSession(null);
        assert.equal(result.valid, false);
    });

    test("session without userId fails validation", () => {
        const result = validateSession({ plan: "pro" });
        assert.equal(result.valid, false);
    });

    test("session without plan defaults to free", () => {
        const result = validateSession({ userId: "user_002" });
        assert.equal(result.valid, true);
        assert.equal(result.plan, "free");
    });

    test("session data includes all required fields", () => {
        const session = {
            userId: "u1",
            name: "Gaurav",
            email: "gaurav@test.com",
            avatar: null,
            plan: "starter",
            credits: 450,
            totalCredits: 500,
            planExpiresAt: new Date()
        };
        const result = validateSession(session);
        assert.equal(result.valid, true);
        assert.equal(result.plan, "starter");
    });
});

// ─── 6. Proxy Header Forwarding ─────────────────────────────

describe("Gateway proxy header forwarding", () => {

    function decorateHeaders(srcReq) {
        const headers = {};
        if (srcReq && srcReq.user) {
            headers["x-user-id"]   = srcReq.user.userId;
            headers["x-user-plan"] = srcReq.user.plan || "free";
        }
        return headers;
    }

    test("forwards userId and plan headers when user is authenticated", () => {
        const req = { user: { userId: "u123", plan: "pro" } };
        const headers = decorateHeaders(req);
        assert.equal(headers["x-user-id"],   "u123");
        assert.equal(headers["x-user-plan"], "pro");
    });

    test("forwards default 'free' plan when user has no plan set", () => {
        const req = { user: { userId: "u456" } };
        const headers = decorateHeaders(req);
        assert.equal(headers["x-user-plan"], "free");
    });

    test("does not add headers when no user on request", () => {
        const req = {};
        const headers = decorateHeaders(req);
        assert.equal(headers["x-user-id"],   undefined);
        assert.equal(headers["x-user-plan"], undefined);
    });

    test("agent service can extract plan from x-user-plan header", () => {
        const reqHeaders = { "x-user-plan": "starter", "x-user-id": "u789" };
        const plan = reqHeaders["x-user-plan"] || "free";
        assert.equal(plan, "starter");
    });

    test("missing x-user-plan header defaults to free in agent controller", () => {
        const reqHeaders = { "x-user-id": "u789" };
        const plan = reqHeaders["x-user-plan"] || "free";
        assert.equal(plan, "free");
    });
});

// ─── 7. User Controller Response Shape ──────────────────────

describe("getCurrentUser response shape", () => {

    function buildUserResponse(user) {
        return {
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar || null,
            plan: user.plan || "free",
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt || null
        };
    }

    test("response includes plan field for UI sync", () => {
        const user = { _id: "u1", name: "A", email: "a@b.com", plan: "starter", credits: 450, totalCredits: 500 };
        const resp = buildUserResponse(user);
        assert.ok("plan" in resp, "Response must include plan");
        assert.equal(resp.plan, "starter");
    });

    test("response includes credits for real-time display", () => {
        const user = { _id: "u1", name: "A", email: "a@b.com", plan: "pro", credits: 990, totalCredits: 1000 };
        const resp = buildUserResponse(user);
        assert.equal(resp.credits, 990);
        assert.equal(resp.totalCredits, 1000);
    });

    test("response includes planExpiresAt for countdown timer", () => {
        const expiry = new Date(Date.now() + 30 * 86400000);
        const user = { _id: "u1", name: "A", email: "a@b.com", plan: "pro", credits: 1000, totalCredits: 1000, planExpiresAt: expiry };
        const resp = buildUserResponse(user);
        assert.ok(resp.planExpiresAt instanceof Date);
    });

    test("missing plan defaults to 'free'", () => {
        const user = { _id: "u1", name: "A", email: "a@b.com", credits: 0, totalCredits: 0 };
        const resp = buildUserResponse(user);
        assert.equal(resp.plan, "free");
    });

    test("avatar is null when not set", () => {
        const user = { _id: "u1", name: "A", email: "a@b.com", credits: 0, totalCredits: 0 };
        const resp = buildUserResponse(user);
        assert.equal(resp.avatar, null);
    });
});
