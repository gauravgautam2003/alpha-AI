import assert from "node:assert/strict";
import test from "node:test";
import { normalizeServiceUrl } from "../shared/serviceUrl.js";

test("preserves service URLs that already include a protocol", () => {
    assert.equal(
        normalizeServiceUrl("http://auth:8001", "AUTH_SERVICE"),
        "http://auth:8001"
    );
});

test("adds HTTP for Render private service hostports", () => {
    assert.equal(
        normalizeServiceUrl("auth.internal:8001", "AUTH_SERVICE"),
        "http://auth.internal:8001"
    );
});

test("fails clearly when a service address is missing", () => {
    assert.throws(
        () => normalizeServiceUrl(undefined, "AUTH_SERVICE"),
        /AUTH_SERVICE environment variable is required/
    );
});
