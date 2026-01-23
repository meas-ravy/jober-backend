import crypto from "crypto";
import { sha256Base64Url } from "../shared/config/basehash";
import prisma from "./prisma";

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;
const MAX_OTP_REQUESTS_PER_HOUR = 3;

function generateOTP(): string {
  return crypto.randomInt(1000, 10000).toString();
}

// Hash OTP for secure storage
function hashOTP(phone: string, otp: string): string {
  return sha256Base64Url(`${otp}:${phone}`);
}

// verify OTP by comparing hashed values
function verifyOTP(otp: string, phone: string, hash: string): boolean {
  return hashOTP(phone, otp) === hash;
}

async function checkRateLimit(phone: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentRequests = await prisma.phoneOtp.count({
    where: {
      phone,
      createdAt: { gte: oneHourAgo },
    },
  });

  return recentRequests < MAX_OTP_REQUESTS_PER_HOUR;
}

async function createOTP(phone: string): Promise<string> {
  const withinLimit = await checkRateLimit(phone);
  if (!withinLimit) {
    throw new Error("Too many OTP requests. Please try again later.");
  }

  const otp = generateOTP();
  const otpHash = hashOTP(phone, otp);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Remove previous unused OTPs
  await prisma.phoneOtp.deleteMany({
    where: {
      phone,
      consumedAt: null,
    },
  });

  await prisma.phoneOtp.create({
    data: {
      phone,
      codeHash: otpHash,
      expiresAt,
    },
  });

  return otp;
}

async function verifyAndConsumeOTP(
  phone: string,
  otp: string,
): Promise<boolean> {
  return prisma.$transaction(async tx => {
    const otpRecord = await tx.phoneOtp.findFirst({
      where: {
        phone,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) return false;

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new Error(
        "Maximum verification attempts exceeded. Please request a new OTP.",
      );
    }

    const isValid = verifyOTP(otp, phone, otpRecord.codeHash);

    if (!isValid) {
      await tx.phoneOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    await tx.phoneOtp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });

    return true;
  });
}

export { generateOTP, createOTP, verifyAndConsumeOTP };
