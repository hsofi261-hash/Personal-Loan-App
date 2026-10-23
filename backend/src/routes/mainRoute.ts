import express from "express";
import { loginWithPhone, createLoan, markAsRepaid, getLoans, getSummary, getLoanDetails } from "../controllers/MainControll";
import { upload } from "../config/uploads";

const router = express.Router();

// 1. Mock Phone Login / Send OTP
router.post("/login", loginWithPhone);
router.post("/loans", upload.single('receipt'), createLoan);
router.patch("/loans/:id/repaid", markAsRepaid);

router.get("/loans", getLoans);
router.get("/loans/summary", getSummary);
router.get("/loans/:id", getLoanDetails);


export default router;