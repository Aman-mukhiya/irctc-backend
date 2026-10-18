import config from "../config/index.js";
import { TooManyRequestsError } from "./error.js";
import otpGenerator from "otp-generator";
import crypto from "crypto";

const OTP_TTL = parseInt(config.OTP_TTL || "300");
import {redis} from "../config/redis.js";

const RATE_MAX = parseInt(config.OTP_MAX_VERIFY_ATTEMPTS);
const HMAC_SECRET = config.HMAC_SECRET;

const hmacFor = (email, otp) => {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(email + ":" + otp)
    .digest("hex"); // converting to hex is important if not you cannot store and compare the raw bytes like this<Buffer ... 0e 1b 1e 2a 2d 3b 4f 5f 7c 8c 8d 9a>
};
export const generateAndStoreOtp = async (meta) => {
  // how many otp's you can send in an hour
  const rateKey = `otp:rate:${meta.email}`;
  const sentCount = parseInt((await redis.get(rateKey)) || "0");

  if (sentCount >= RATE_MAX) {
    throw new TooManyRequestsError(
      "Too many OTP requests. Try again later.",
      "OTP_RATE_LIMIT",
    );
  }

  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  const otpSessionId = crypto.randomUUID();
  const hashed = hmacFor(meta.email, otp);
  await redis.set(
    `otp:session:${otpSessionId}`,
    JSON.stringify({
      hashedOtp: hashed,
      meta,
    }),
    "EX",
    OTP_TTL,
  );
  await redis.incr(rateKey);
  await redis.expire(rateKey, 3600);
  return { otp, otpSessionId };
};
