import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { env } from "@/src/shared/config/env";
import prisma from "@/src/lib/prisma";
import { OAuthProvider } from "@/src/app/generated/prisma/client";

// Initialize Google OAuth Client
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Type definitions
export interface OAuthUserData {
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface GoogleTokenPayload {
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface LinkedInTokenPayload {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Verify Google ID Token and extract user data
 */
export async function verifyGoogleToken(
  payload: GoogleTokenPayload,
): Promise<OAuthUserData> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: [env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_ID_IOS],
    });

    const tokenPayload = ticket.getPayload();
    if (!tokenPayload) {
      throw new Error("Invalid Google token payload");
    }

    return {
      providerId: tokenPayload.sub,
      email: tokenPayload.email || "",
      name: tokenPayload.name,
      avatarUrl: tokenPayload.picture,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Google token verification failed: ${message}`);
  }
}

/**
 * Verify LinkedIn Access Token and extract user data
 */
export async function verifyLinkedInToken(
  payload: LinkedInTokenPayload,
): Promise<OAuthUserData> {
  try {
    const response = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${payload.accessToken}`,
        },
        timeout: 10000,
      },
    );

    const data = response.data;

    return {
      providerId: data.sub,
      email: data.email || "",
      name: data.name,
      avatarUrl: data.picture,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      throw new Error(
        `LinkedIn token verification failed (${status}): ${message}`,
      );
    }
    throw new Error("LinkedIn token verification failed");
  }
}

/**
 * Create or update OAuth user in database
 */
export async function createOrUpdateOAuthUser(
  provider: OAuthProvider,
  userData: OAuthUserData,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
  },
): Promise<{ userId: string; isNewUser: boolean }> {
  try {
    // Check if OAuth account exists
    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: userData.providerId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingAccount) {
      // Update existing account with new tokens
      await prisma.oAuthAccount.update({
        where: { id: existingAccount.id },
        data: {
          email: userData.email,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          providerAccessToken: tokens.accessToken,
          providerRefreshToken: tokens.refreshToken,
          updatedAt: new Date(),
        },
      });

      return {
        userId: existingAccount.userId,
        isNewUser: false,
      };
    }

    // Create new user and OAuth account
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        oauthAccounts: {
          create: {
            provider,
            providerId: userData.providerId,
            email: userData.email,
            name: userData.name,
            avatarUrl: userData.avatarUrl,
            providerAccessToken: tokens.accessToken,
            providerRefreshToken: tokens.refreshToken,
          },
        },
      },
    });

    return {
      userId: newUser.id,
      isNewUser: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create/update OAuth user: ${message}`);
  }
}

/**
 * Revoke Google OAuth token
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    await axios.post(
      "https://oauth2.googleapis.com/revoke",
      null,
      {
        params: { token },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 5000,
      },
    );
    return true;
  } catch (error) {
    console.error("Failed to revoke Google token:", error);
    return false;
  }
}

/**
 * Revoke LinkedIn OAuth token
 * Note: LinkedIn doesn't have an official revoke endpoint,
 * so we just remove it from our database
 */
export async function revokeLinkedInToken(
  _token: string,
): Promise<boolean> {
  // LinkedIn has no official token revocation endpoint
  // Token will expire naturally or user must revoke access manually on LinkedIn
  return true;
}

/**
 * Revoke all OAuth tokens for a user
 */
export async function revokeAllUserOAuthTokens(
  userId: string,
): Promise<void> {
  try {
    // Find all OAuth accounts for user
    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId },
    });

    // Revoke tokens based on provider
    const revokePromises = oauthAccounts.map(async (account) => {
      if (account.provider === "Google") {
        // Try to revoke both access and refresh tokens
        if (account.providerRefreshToken) {
          await revokeGoogleToken(account.providerRefreshToken);
        }
        if (account.providerAccessToken) {
          await revokeGoogleToken(account.providerAccessToken);
        }
      } else if (account.provider === "LinkedIn") {
        // LinkedIn doesn't support revocation
        if (account.providerRefreshToken) {
          await revokeLinkedInToken(account.providerRefreshToken);
        }
      }

      // Clear tokens from database
      await prisma.oAuthAccount.update({
        where: { id: account.id },
        data: {
          providerAccessToken: null,
          providerRefreshToken: null,
        },
      });
    });

    await Promise.allSettled(revokePromises);
  } catch (error) {
    console.error("Error revoking OAuth tokens:", error);
    // Don't throw - logout should succeed even if revocation fails
  }
}

/**
 * Type guard for OAuthProvider
 */
export function isValidOAuthProvider(
  provider: unknown,
): provider is OAuthProvider {
  return provider === "Google" || provider === "LinkedIn";
}
