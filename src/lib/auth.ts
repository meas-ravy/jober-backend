import jwt from "jsonwebtoken";

import { isRoleName, RoleName } from "./role";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getBearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization");
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return undefined;
  return token;
}

function verifyAccessToken(token: string): {
  userId: string;
  roles: RoleName[];
} {
  const secret = requireEnv("JWT_ACCESS_SECRET");
  const decoded = jwt.verify(token, secret);

  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid access token");
  }

  const userId = typeof decoded.sub === "string" ? decoded.sub : undefined;
  if (!userId) {
    throw new Error("Invalid access token subject");
  }

  const roles: RoleName[] = [];
  const rawRoles = (decoded as { roles?: unknown }).roles;
  if (Array.isArray(rawRoles)) {
    for (const value of rawRoles) {
      if (isRoleName(value) && !roles.includes(value)) roles.push(value);
    }
  }

  return { userId, roles };
}

export { getBearerToken, verifyAccessToken };
