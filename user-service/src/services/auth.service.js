import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { sendOtpEmail, verifyOtpEmail } from "../utils/email.js";
import { BadRequestError, ConflictError } from "../utils/error.js";
import { generateAndStoreOtp, verifyOtpMethod } from "../utils/otp.js";

export const sendOtpService = async (firstName, lastName, email, password) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const meta = { firstName, lastName, email, hashedPassword };

  const { otp, otpSessionId } = await generateAndStoreOtp(meta);

  await sendOtpEmail(email, otp);
  return otpSessionId;
};

export const verifyOtpService = async (otp, otpSessionId) => {
  const meta = await verifyOtpMethod(otp, otpSessionId);

  if( meta === null){
    throw new BadRequestError("Invalid or expired OTP", "OTP_INVALID")
  }

  console.log(`This is the last name : ${meta.lastName}`)

  const user = await prisma.user.create({
    data: {
      firstName: meta.firstName,
      lastName: meta.lastName,
      email: meta.email,
      password: meta.hashedPassword
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    }
  })

  await verifyOtpEmail(meta);
  return user;

};
