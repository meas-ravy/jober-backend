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
};
