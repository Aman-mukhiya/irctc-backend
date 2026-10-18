import express from 'express';
const router = express.Router();
import {sendOTP} from '../controllers/auth.controller.js';

router.post("/send-otp", sendOTP);
// router.post("/verify-otp", verifyOTP);
// router.post("/login", login);
// router.get("/refresh", rotateRefreshToken);

export default router;