import { prisma } from "../config/prisma.js";
import { sendOtpEmail } from "../utils/email.js";
import { ConflictError } from "../utils/error.js"
import bcrypt from "bcrypt";
import { generateAndStoreOtp } from "../utils/otp.js";

export const sendOtpService = async(firstName, lastName, email, password) =>{
    const existingUser = await prisma.user.findUnique({
        where: {email}
    })

    if(existingUser){
        throw new ConflictError("User already exists")
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const meta = { firstName, lastName, email, hashedPassword};

    const { otp, otpSessionId} = await generateAndStoreOtp(meta);


    await sendOtpEmail(email, otp);
    return otpSessionId
}

