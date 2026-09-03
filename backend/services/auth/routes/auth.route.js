import express from "express";
import { deductCredits, login, logout, updateUserPayment } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @name login router
 * @description login user using auth controller with /auth/login
 * @type public
 */

router.post("/login", login);

/**
 * @name logout router
 * @description logout user using auth controller with /auth/logout
 * @type public
 */

router.post("/logout", logout);

/**
 * @name updateUserPayment
 * @description update user plan using auth controller with /auth/update-plan
 * @type public
 */

router.post("/update-plan", updateUserPayment);

/**
 * @name deductCredits
 * @description deduct credits when user use agent using /auth/deduct-credits
 * @type public
 */

router.post("/deduct-credits", deductCredits);

export default router
