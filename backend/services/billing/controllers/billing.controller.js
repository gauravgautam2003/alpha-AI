import { PLANS } from "../config/plan.js";
import { razorpay } from "../config/razorpay.js";
import Payment from "../models/payment.model.js";
import axios from "axios"
import crypto from "crypto"


export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.headers["x-user-id"]

        if (!userId) {
            return res.status(401).json({
                message: "unautherized request",
                success: false
            })
        }

        const selectedPlan = PLANS[plan]

        if (!selectedPlan) {
            return res.status(404).json({
                message: "plan not found",
                success: false
            })
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`,
        })

        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created"
        })

        return req.status(200).json({
            message: "Create order successfully created",
            success: true,
            order,
            plan: selectedPlan
        })
    } catch (error) {
        return req.status(500).json({
            message: `Create order failed: ${error}`,
            success: false,
        })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

        const generateSignature = crypto
                                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                                .update(`${razorpay_order_id} | ${razorpay_payment_id}`)
                                .digest("hex")

        if (generateSignature !== razorpay_signature) {
            return res.status(400).json({
                message: "Payment Verification Failed",
                success: false
            })
        }

        const payment = await Payment.findOne({ orderId: razorpay_order_id })

        if (!payment) {
            return res.status(404).json({
                message: "Payment Not Found",
                success: false
            })
        }

        payment.status = "paid"
        payment.paymentId = razorpay_payment_id
        await payment.save()

        await axios.post(`${process.env.AUTH_SERVICE}/update-plan`, {
            userId: payment.userId,
            plan: payment.plan,
            credits: payment.credits
        })

        return res.status(200).json({
            message: "Payment verified",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: `verify payment error ${error.message}`,
            success: true
        })
    }
}