function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PLASGATE_PRIVATE_KEY: requiredEnv("PLASGATE_PRIVATE_KEY"),
  PLASGATE_SECRET: requiredEnv("PLASGATE_SECRET"),
  PLASGATE_SENDER: requiredEnv("PLASGATE_SENDER"),
  CLOUDINARY_CLOUD_NAME: requiredEnv("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: requiredEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: requiredEnv("CLOUDINARY_API_SECRET"),
};
