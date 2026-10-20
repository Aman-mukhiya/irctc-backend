import crypto from "crypto";
import otpGenerator from "otp-generator";
import config from "../config/index.js";
import { redis } from "../config/redis.js";
import { TooManyRequestsError } from "./error.js";

const OTP_TTL = parseInt(config.OTP_TTL || "300");

const RATE_MAX = parseInt(config.OTP_MAX_VERIFY_ATTEMPTS);
const HMAC_SECRET = config.OTP_HMAC_SECRET;

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
    `otp:session:${otpSessionId}`, // this is the key
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

const ATTEMPT_MAX = parseInt(config.OTP_MAX_VERIFY_ATTEMPTS || "5");

export const verifyOtpMethod = async (otp, otpSessionId) => {
  const rawData = await redis.get(`otp:session:${otpSessionId}`);
  if (!rawData) return null;

  const { hashedOtp: storedOtp, meta } = JSON.parse(rawData);
  const attemptsKey = `otp:attempts:${meta.email}`;
  const attemptsCount = parseInt((await redis.get(attemptsKey)) || 0);

  if (attemptsCount >= ATTEMPT_MAX) {
    throw new TooManyRequestsError("Too many attempts to verify otp");
  }

  const hashedOtp = hmacFor(meta.email, otp);

  if (
    crypto.timingSafeEqual(
      Buffer.from(hashedOtp, "hex"),
      Buffer.from(storedOtp, "hex"),
    )
  ) {
    await redis.del(`otp:session:${otpSessionId}`, attemptsKey);
    await redis.del(`otp:rate:${meta.email}`);

    return meta;
  } else {
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, config.OTP_TTL);
    return null;
  }
};
