import express from "express"
import { createOrder, verifyPayment } from "../controllers/billing.controller.js"

const router = express.Router()

/**
 * @name createOrder
 * @description create order controller for new order using razorpay
 * @access public
 */


router.post("/create", createOrder)

/**
 * @name verify payment
 * @description verify payment after the create order for payment using razorpay
 * @access public
 */


router.post("/create", verifyPayment)

export default router