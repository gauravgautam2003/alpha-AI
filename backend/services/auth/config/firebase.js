import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json" with {type: "json"};


/**
 * @name firebase authentication
 * @description using this code auth register and login using google account 
 * @type public
 */

export const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
