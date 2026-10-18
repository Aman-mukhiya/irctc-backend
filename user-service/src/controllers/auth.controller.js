import  config  from "../config/index.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/error.js";
// import getDeviceFingerprint from "../utils/deviceFingerPrint";
import { sendOtpService } from "../services/auth.service.js";

export const sendOTP = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    throw new BadRequestError("All fields are mandatory");
  }

  if (password != confirmPassword) {
    throw new BadRequestError("Password mismatch");
  }
  // here otp might cause some problem cause lack of {} or not
  const otpSessionId = await sendOtpService(
    firstName,
    lastName,
    email,
    password,
  );
  res
    .cookie("otp_session", otpSessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: config.OTP_TTL * 1000,
    })
    .status(200)
    .json({
      success: true,
      message: "OTP sent successfully",
    });
});
