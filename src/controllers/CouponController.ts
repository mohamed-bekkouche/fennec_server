
import { Request, Response } from "express";
import Coupon from "../models/Coupon";



export const applyCoupon = async (req : Request ,res : Response) : Promise<void> => {
    try {
        const {code} = req.body 
        const coupon = await Coupon.findOne({code})
        if(!coupon) {
            res.status(404).json({message : "coupon not found"})
            return
        }
        if(!coupon.isActive) {
            res.status(400).json({message : "coupon is not active"})
            return
        }
        if(coupon.expiresAt < new Date()) {
            res.status(400).json({message : "coupon expired at : " + coupon.expiresAt.toUTCString()})
            return
        }
        if(coupon.usageLimit && coupon.usageLimit <= coupon.usedCount) {
            res.status(400).json({message : `coupon usage limit reached ${coupon.usageLimit}`})
            return
        }
        res.status(200).json({message : "coupon applied successfully" , coupon})

    } catch (error : any) {
        res.status(500).json({message : "Internal server error" , error : error.message})
    }
}