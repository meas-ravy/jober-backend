import jwt from "jsonwebtoken";
import { sha256Base64Url } from "../shared/config/basehash";
import { getRolesForUser, isRoleName, RoleName } from "./role";
import crypto from "crypto";
import prisma from "./prisma";

const accessTokenExpire = 15 * 60;
const refreshTokenExpire = 30;

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function signInAccessToken(params: {
  userId: string;
  roles: RoleName[];
}): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  return jwt.sign({ roles: params.roles }, secret!, {
    subject: params.userId,
    expiresIn: accessTokenExpire,
  });
}

async function issueTokensForUser(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  roles: RoleName[];
}> {
  const roles = await getRolesForUser(userId);

  const accessToken = signInAccessToken({ userId, roles });
  const refreshToken = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + refreshTokenExpire);

  // Single-device sessions: revoke any existing active refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256Base64Url(refreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken, roles };
}

export async function rotateRefreshToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  roles: RoleName[];
} | null> {
  const tokenHash = sha256Base64Url(refreshToken);
  const existing = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true },
  });

  if (!existing) return null;

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return issueTokensForUser(existing.userId);
}

async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
  const tokenHash = sha256Base64Url(refreshToken);
  const result = await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export { issueTokensForUser, revokeRefreshToken };
