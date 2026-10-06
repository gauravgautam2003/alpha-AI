import admin from "firebase-admin";

import { readFileSync } from "node:fs";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ?? readFileSync(new URL("../serviceAccountKey.json", import.meta.url), "utf8");
const serviceAccount = JSON.parse(serviceAccountJson);


/**
 * @name firebase authentication
 * @description using this code auth register and login using google account 
 * @type public
 */

export const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
