// import crypto from "crypto";
// import jwt from "jsonwebtoken";
// import prisma from "./prisma";

// const ROLE_NAMES = ["Job_finder", "Recruiter", "Admin"] as const;
// type RoleName = (typeof ROLE_NAMES)[number];

// // export const SELF_SELECTABLE_ROLE_NAMES = ["Job_finder", "Recruiter"] as const;

// // export type SelfSelectableRoleName =
// //   (typeof SELF_SELECTABLE_ROLE_NAMES)[number];

// function normalizePhone(input: unknown): string | undefined {
//   if (typeof input !== "string") return undefined;
//   const value = input.trim();
//   return value.length > 0 ? value : undefined;
// }

// function isRoleName(value: unknown): value is RoleName {
//   return (
//     typeof value === "string" &&
//     (ROLE_NAMES as readonly string[]).includes(value)
//   );
// }

// // export function isSelfSelectableRoleName(
// //   value: unknown,
// // ): value is SelfSelectableRoleName {
// //   return (
// //     typeof value === "string" &&
// //     (SELF_SELECTABLE_ROLE_NAMES as readonly string[]).includes(value)
// //   );
// // }

// // export function parseSelfSelectableRoles(
// //   input: unknown,
// // ): SelfSelectableRoleName[] {
// //   if (!Array.isArray(input)) return [];
// //   const roles: SelfSelectableRoleName[] = [];
// //   for (const value of input) {
// //     if (!isSelfSelectableRoleName(value)) continue;
// //     if (!roles.includes(value)) roles.push(value);
// //   }
// //   return roles;
// // }

// function requireEnv(name: string): string {
//   const value = process.env[name];
//   if (typeof value !== "string" || value.length === 0) {
//     throw new Error(`Missing ${name}`);
//   }
//   return value;
// }

// const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
// const REFRESH_TOKEN_TTL_DAYS = 30;

// export function signAccessToken(params: {
//   userId: string;
//   roles: RoleName[];
// }): string {
//   const secret = requireEnv("JWT_ACCESS_SECRET");
//   return jwt.sign({ roles: params.roles }, secret, {
//     subject: params.userId,
//     expiresIn: ACCESS_TOKEN_TTL_SECONDS,
//   });
// }

// function verifyAccessToken(token: string): {
//   userId: string;
//   roles: RoleName[];
// } {
//   const secret = requireEnv("JWT_ACCESS_SECRET");
//   const decoded = jwt.verify(token, secret);
//   if (typeof decoded !== "object" || decoded === null) {
//     throw new Error("Invalid access token");
//   }

//   const userId = typeof decoded.sub === "string" ? decoded.sub : undefined;
//   if (!userId) throw new Error("Invalid access token subject");

//   const roles: RoleName[] = [];
//   const rawRoles = (decoded as { roles?: unknown }).roles;
//   if (Array.isArray(rawRoles)) {
//     for (const value of rawRoles) {
//       if (isRoleName(value) && !roles.includes(value)) roles.push(value);
//     }
//   }

//   return { userId, roles };
// }

// function getBearerToken(request: Request): string | undefined {
//   const authorization = request.headers.get("authorization");
//   if (!authorization) return undefined;
//   const [scheme, token] = authorization.split(" ");
//   if (scheme !== "Bearer" || !token) return undefined;
//   return token;
// }

// function generateRefreshToken(): string {
//   return crypto.randomBytes(32).toString("base64url");
// }

// function sha256Base64Url(value: string): string {
//   return crypto.createHash("sha256").update(value).digest("base64url");
// }

// async function getRolesForUser(userId: string): Promise<RoleName[]> {
//   const rows = await prisma.userRole.findMany({
//     where: { userId },
//     select: { role: true },
//   });

//   const roles: RoleName[] = [];
//   for (const row of rows) {
//     const value = row.role as unknown;
//     if (isRoleName(value) && !roles.includes(value)) roles.push(value);
//   }
//   return roles;
// }

// async function issueTokensForUser(userId: string): Promise<{
//   accessToken: string;
//   refreshToken: string;
//   roles: RoleName[];
// }> {
//   const roles = await getRolesForUser(userId);

//   const accessToken = signAccessToken({ userId, roles });
//   const refreshToken = generateRefreshToken();

//   const expiresAt = new Date();
//   expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

//   // Single-device sessions: revoke any existing active refresh tokens
//   await prisma.refreshToken.updateMany({
//     where: { userId, revokedAt: null },
//     data: { revokedAt: new Date() },
//   });

//   await prisma.refreshToken.create({
//     data: {
//       userId,
//       tokenHash: sha256Base64Url(refreshToken),
//       expiresAt,
//     },
//   });

//   return { accessToken, refreshToken, roles };
// }

// async function rotateRefreshToken(refreshToken: string): Promise<{
//   accessToken: string;
//   refreshToken: string;
//   roles: RoleName[];
// } | null> {
//   const tokenHash = sha256Base64Url(refreshToken);
//   const existing = await prisma.refreshToken.findFirst({
//     where: {
//       tokenHash,
//       revokedAt: null,
//       expiresAt: { gt: new Date() },
//     },
//     select: { id: true, userId: true },
//   });

//   if (!existing) return null;

//   await prisma.refreshToken.update({
//     where: { id: existing.id },
//     data: { revokedAt: new Date() },
//   });

//   return issueTokensForUser(existing.userId);
// }

// async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
//   const tokenHash = sha256Base64Url(refreshToken);
//   const result = await prisma.refreshToken.updateMany({
//     where: { tokenHash, revokedAt: null },
//     data: { revokedAt: new Date() },
//   });
//   return result.count > 0;
// }

// export { revokeRefreshToken };
