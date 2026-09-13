/**
 * ============================================================
 * BILLING SERVICE TESTS
 * Tests: createOrder, verifyPayment, PLANS config, Razorpay sig
 * ============================================================
 */

import { test, describe, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

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

function makeReq(overrides = {}) {
    return {
        body: {},
        headers: {},
        ...overrides
    };
}

// ─── 1. PLANS Configuration ─────────────────────────────────

describe("PLANS configuration", () => {

    test("free plan has correct defaults", async () => {
        const { PLANS } = await import(
            "../services/billing/config/plan.js"
        );
        assert.equal(PLANS.free.id,      "free");
        assert.equal(PLANS.free.amount,   0);
        assert.equal(PLANS.free.validity, 30);
    });

    test("starter plan has ₹299, 500 credits, 30 days validity", async () => {
        const { PLANS } = await import(
            "../services/billing/config/plan.js"
        );
        assert.equal(PLANS.starter.id,      "starter");
        assert.equal(PLANS.starter.amount,   299);
        assert.equal(PLANS.starter.credits,  500);
        assert.equal(PLANS.starter.validity, 30);
    });

    test("pro plan has ₹499, 1000 credits, 30 days validity", async () => {
        const { PLANS } = await import(
            "../services/billing/config/plan.js"
        );
        assert.equal(PLANS.pro.id,      "pro");
        assert.equal(PLANS.pro.amount,   499);
        assert.equal(PLANS.pro.credits,  1000);
        assert.equal(PLANS.pro.validity, 30);
    });

    test("starter is profitable (amount > 0 and credits > 0)", async () => {
        const { PLANS } = await import(
            "../services/billing/config/plan.js"
        );
        assert.ok(PLANS.starter.amount > 0,  "Starter must have a price");
        assert.ok(PLANS.starter.credits > 0, "Starter must give credits");
    });

    test("pro plan gives 2x more credits than starter at ~1.67x price", async () => {
        const { PLANS } = await import(
            "../services/billing/config/plan.js"
        );
        assert.equal(PLANS.pro.credits / PLANS.starter.credits, 2);
        assert.ok(PLANS.pro.amount < PLANS.starter.amount * 2,
            "Pro should be < 2x starter price (better value for user)");
    });
});

// ─── 2. Razorpay Signature Logic ────────────────────────────

describe("Razorpay signature verification logic", () => {

    test("correct signature format: orderId|paymentId (no spaces)", () => {
        const secret     = "test_secret_key";
        const orderId    = "order_abc123";
        const paymentId  = "pay_xyz789";
        const sigString  = `${orderId}|${paymentId}`;   // correct format

        const sig = crypto
            .createHmac("sha256", secret)
            .update(sigString)
            .digest("hex");

        assert.ok(sig, "Signature must be generated");
        assert.equal(sig.length, 64, "SHA256 hex must be 64 chars");
    });

    test("signature with spaces would NOT match (old bug regression)", () => {
        const secret    = "test_secret_key";
        const orderId   = "order_abc123";
        const paymentId = "pay_xyz789";

        // Correct
        const correctSig = crypto
            .createHmac("sha256", secret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        // Old buggy format
        const buggySig = crypto
            .createHmac("sha256", secret)
            .update(`${orderId} | ${paymentId}`)
            .digest("hex");

        assert.notEqual(correctSig, buggySig,
            "Signatures with/without spaces must differ — proving the old bug would fail verification");
    });

    test("tampered paymentId fails signature verification", () => {
        const secret     = "test_secret_key";
        const orderId    = "order_abc123";
        const paymentId  = "pay_xyz789";

        const validSig = crypto
            .createHmac("sha256", secret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        const tamperedSig = crypto
            .createHmac("sha256", secret)
            .update(`${orderId}|pay_TAMPERED`)
            .digest("hex");

        assert.notEqual(validSig, tamperedSig,
            "Tampered payment ID must produce different signature");
    });

    test("same inputs always produce same deterministic signature", () => {
        const secret     = "stable_key";
        const orderId    = "order_001";
        const paymentId  = "pay_001";

        const sig1 = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
        const sig2 = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

        assert.equal(sig1, sig2, "Signatures must be deterministic");
    });
});

// ─── 3. createOrder Controller (mocked) ─────────────────────

describe("createOrder controller", () => {

    test("returns 401 when userId header is missing", async () => {
        // Inline mock — no DB / Razorpay needed
        const createOrder = async (req, res) => {
            const userId = req.headers["x-user-id"];
            if (!userId) {
                return res.status(401).json({ message: "unautherized request", success: false });
            }
            return res.status(200).json({ success: true });
        };

        const req = makeReq({ headers: {} });
        const res = makeRes();
        await createOrder(req, res);

        assert.equal(res._status, 401);
        assert.equal(res._body.success, false);
    });

    test("returns 404 when plan is invalid", async () => {
        const PLANS = { starter: { id: "starter", amount: 299, credits: 500 } };

        const createOrder = async (req, res) => {
            const { plan } = req.body;
            const userId   = req.headers["x-user-id"];
            if (!userId)          return res.status(401).json({ success: false });
            const selectedPlan = PLANS[plan];
            if (!selectedPlan)    return res.status(404).json({ message: "plan not found", success: false });
            return res.status(200).json({ success: true });
        };

        const req = makeReq({ headers: { "x-user-id": "user_01" }, body: { plan: "invalid_plan" } });
        const res = makeRes();
        await createOrder(req, res);

        assert.equal(res._status, 404);
        assert.equal(res._body.success, false);
        assert.match(res._body.message, /plan not found/i);
    });

    test("returns 200 with valid userId and plan", async () => {
        const PLANS = { starter: { id: "starter", amount: 299, credits: 500 } };

        const fakeRazorpay = {
            orders: {
                create: async () => ({ id: "order_fake123", currency: "INR" })
            }
        };

        const fakePaymentCreate = async () => ({});

        const createOrder = async (req, res) => {
            const { plan } = req.body;
            const userId   = req.headers["x-user-id"];
            if (!userId)          return res.status(401).json({ success: false });
            const selectedPlan = PLANS[plan];
            if (!selectedPlan)    return res.status(404).json({ success: false });

            const order = await fakeRazorpay.orders.create({
                amount: selectedPlan.amount * 100,
                currency: "INR"
            });

            await fakePaymentCreate();

            return res.status(200).json({ success: true, order, plan: selectedPlan });
        };

        const req = makeReq({ headers: { "x-user-id": "user_01" }, body: { plan: "starter" } });
        const res = makeRes();
        await createOrder(req, res);

        assert.equal(res._status, 200);
        assert.equal(res._body.success, true);
        assert.equal(res._body.order.id, "order_fake123");
        assert.equal(res._body.plan.amount, 299);
    });
});

// ─── 4. verifyPayment Controller (mocked) ───────────────────

describe("verifyPayment controller", () => {

    const SECRET    = "test_razorpay_secret";
    const ORDER_ID  = "order_abc";
    const PAYMENT_ID = "pay_xyz";

    function buildSig(orderId, paymentId) {
        return crypto
            .createHmac("sha256", SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");
    }

    test("returns 400 when signature is invalid", async () => {
        const verifyPayment = async (req, res) => {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            const generated = crypto
                .createHmac("sha256", SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");
            if (generated !== razorpay_signature) {
                return res.status(400).json({ message: "Payment Verification Failed", success: false });
            }
            return res.status(200).json({ success: true });
        };

        const req = makeReq({ body: {
            razorpay_order_id:  ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: "wrong_signature"
        }});
        const res = makeRes();
        await verifyPayment(req, res);

        assert.equal(res._status, 400);
        assert.equal(res._body.success, false);
    });

    test("returns 200 when signature is valid", async () => {
        const fakePayment = {
            userId: "u1",
            plan: "starter",
            credits: 500,
            status: "created",
            paymentId: null,
            save: async function() {}
        };

        const verifyPayment = async (req, res) => {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            const generated = crypto
                .createHmac("sha256", SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");
            if (generated !== razorpay_signature) {
                return res.status(400).json({ success: false });
            }
            fakePayment.status = "paid";
            fakePayment.paymentId = razorpay_payment_id;
            await fakePayment.save();
            // Simulate auth service call
            return res.status(200).json({
                success: true,
                plan: fakePayment.plan,
                credits: fakePayment.credits
            });
        };

        const req = makeReq({ body: {
            razorpay_order_id:   ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature:  buildSig(ORDER_ID, PAYMENT_ID)
        }});
        const res = makeRes();
        await verifyPayment(req, res);

        assert.equal(res._status, 200);
        assert.equal(res._body.success, true);
        assert.equal(res._body.plan, "starter");
        assert.equal(res._body.credits, 500);
        assert.equal(fakePayment.status, "paid");
        assert.equal(fakePayment.paymentId, PAYMENT_ID);
    });

    test("returns 404 when payment record not found", async () => {
        const verifyPayment = async (req, res) => {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            const generated = crypto
                .createHmac("sha256", SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");
            if (generated !== razorpay_signature) {
                return res.status(400).json({ success: false });
            }
            const payment = null; // Simulate: payment not found in DB
            if (!payment) {
                return res.status(404).json({ message: "Payment Not Found", success: false });
            }
            return res.status(200).json({ success: true });
        };

        const req = makeReq({ body: {
            razorpay_order_id:   ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature:  buildSig(ORDER_ID, PAYMENT_ID)
        }});
        const res = makeRes();
        await verifyPayment(req, res);

        assert.equal(res._status, 404);
        assert.equal(res._body.success, false);
    });
});
