import express from "express";
import { login, logout } from "../controllers/auth.controller.js";

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

router.get("/logout", logout);

export default router