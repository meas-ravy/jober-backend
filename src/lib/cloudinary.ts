import { v2 as cloudinary } from "cloudinary";
import { env } from "@/src/shared/config/env";

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Image upload constants
export const IMAGE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ["jpg", "jpeg", "png", "webp"],
  FOLDERS: {
    COMPANY_LOGO: "company-logos",
    JOB_SEEKER_AVATAR: "job-seeker-avatars",
    JOB_IMAGE: "job-images",
    TIP_IMAGE: "tip-images",
    RESUME: "resumes",
  },
  TRANSFORMATIONS: {
    COMPANY_LOGO: "c_limit,w_1000,h_1000,q_auto,f_auto",
    JOB_SEEKER_AVATAR: "c_limit,w_1000,h_1000,q_auto,f_auto",
    JOB_IMAGE: "c_limit,w_1200,h_800,q_auto,f_auto",
    TIP_IMAGE: "c_limit,w_1200,h_800,q_auto,f_auto",
    RESUME: "q_auto,f_auto",
  },
} as const;

export type ImageType =
  | "company-logo"
  | "job-seeker-avatar"
  | "job-image"
  | "tip-image"
  | "resume";

interface UploadSignatureParams {
  timestamp: number;
  folder: string;
  transformation: string;
}

interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  transformation: string;
}

/**
 * Generate a signed upload signature for direct client-side uploads to Cloudinary
 * @param imageType - Type of image being uploaded
 * @returns Signature and upload parameters
 */
export function generateUploadSignature(
  imageType: ImageType,
): UploadSignatureResponse {
  const timestamp = Math.round(Date.now() / 1000);
  const folder =
    imageType === "company-logo"
      ? IMAGE_UPLOAD_CONFIG.FOLDERS.COMPANY_LOGO
      : imageType === "job-seeker-avatar"
        ? IMAGE_UPLOAD_CONFIG.FOLDERS.JOB_SEEKER_AVATAR
        : imageType === "job-image"
          ? IMAGE_UPLOAD_CONFIG.FOLDERS.JOB_IMAGE
          : imageType === "tip-image"
            ? IMAGE_UPLOAD_CONFIG.FOLDERS.TIP_IMAGE
            : IMAGE_UPLOAD_CONFIG.FOLDERS.RESUME;

  const transformation =
    imageType === "company-logo"
      ? IMAGE_UPLOAD_CONFIG.TRANSFORMATIONS.COMPANY_LOGO
      : imageType === "job-seeker-avatar"
        ? IMAGE_UPLOAD_CONFIG.TRANSFORMATIONS.JOB_SEEKER_AVATAR
        : imageType === "job-image"
          ? IMAGE_UPLOAD_CONFIG.TRANSFORMATIONS.JOB_IMAGE
          : imageType === "tip-image"
            ? IMAGE_UPLOAD_CONFIG.TRANSFORMATIONS.TIP_IMAGE
            : IMAGE_UPLOAD_CONFIG.TRANSFORMATIONS.RESUME;

  // Parameters to sign
  const paramsToSign: UploadSignatureParams = {
    timestamp,
    folder,
    transformation,
  };

  // Generate signature using Cloudinary's utility
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET,
  );

  return {
    signature,
    timestamp,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
    transformation,
  };
}

/**
 * Validate if a URL is from Cloudinary and matches expected format
 * @param url - URL to validate
 * @param imageType - Expected image type
 * @returns true if valid, false otherwise
 */
export function validateCloudinaryUrl(
  url: string,
  imageType: ImageType,
): boolean {
  try {
    const parsedUrl = new URL(url);

    // Check if it's a Cloudinary URL
    if (
      !parsedUrl.hostname.includes("cloudinary.com") ||
      !url.startsWith("https://res.cloudinary.com/")
    ) {
      return false;
    }

    // Check if URL contains the correct cloud name
    if (!url.includes(`/${env.CLOUDINARY_CLOUD_NAME}/`)) {
      return false;
    }

    // Check if URL contains the expected folder
    const expectedFolder =
      imageType === "company-logo"
        ? IMAGE_UPLOAD_CONFIG.FOLDERS.COMPANY_LOGO
        : imageType === "job-seeker-avatar"
          ? IMAGE_UPLOAD_CONFIG.FOLDERS.JOB_SEEKER_AVATAR
          : imageType === "job-image"
            ? IMAGE_UPLOAD_CONFIG.FOLDERS.JOB_IMAGE
            : IMAGE_UPLOAD_CONFIG.FOLDERS.RESUME;

    if (!url.includes(`/${expectedFolder}/`)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if image type is valid
 */
export function isValidImageType(type: unknown): type is ImageType {
  return (
    type === "company-logo" ||
    type === "job-seeker-avatar" ||
    type === "job-image" ||
    type === "tip-image"
  );
}
