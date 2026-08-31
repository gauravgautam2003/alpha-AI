import { PLANS } from "../config/plan.js";
import { razorpay } from "../config/razorpay.js";
import Payment from "../models/payment.model.js";

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