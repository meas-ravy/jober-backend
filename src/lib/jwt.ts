import jwt from "jsonwebtoken";
import { getRolesForUser, isRoleName, RoleName } from "./role";
import { sha256Base64Url } from "../shared/config/basehash";
import prisma from "./prisma";

// 30 days access token (no refresh token needed)
const accessTokenExpire = 30 * 24 * 60 * 60;

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
  roles: RoleName[];
}> {
  const roles = await getRolesForUser(userId);
  const accessToken = signInAccessToken({ userId, roles });

  return { accessToken, roles };
}

export async function verifyAccessToken(
  accessToken: string,
): Promise<{ userId: string; roles: RoleName[] }> {
  const secret = process.env.JWT_ACCESS_SECRET;
  const decoded = jwt.verify(accessToken, secret!) as {
    sub: string;
    roles: unknown[];
  };

  const roles = decoded.roles.filter(isRoleName);

  return {
    userId: decoded.sub,
    roles,
  };
}

// Add old token to blocklist
export async function revokeAccessToken(
  token: string,
  reason?: string
): Promise<void> {
  const tokenHash = sha256Base64Url(token);
  const decoded = jwt.decode(token) as { exp?: number; sub?: string };
  
  if (!decoded?.exp || !decoded?.sub) return;
  
  const expiresAt = new Date(decoded.exp * 1000);
  
  await prisma.revokedToken.create({
    data: {
      tokenHash,
      userId: decoded.sub,
      expiresAt,
      reason,
    },
  });
}

// Check if token is revoked
export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = sha256Base64Url(token);
  
  const revoked = await prisma.revokedToken.findUnique({
    where: { tokenHash },
  });
  
  return revoked !== null;
}

// Cleanup expired revoked tokens
export async function cleanupRevokedTokens(): Promise<number> {
  const result = await prisma.revokedToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  
  return result.count;
}

export { issueTokensForUser };
