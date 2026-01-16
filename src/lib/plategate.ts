import { env } from "../shared/config/env";

async function sendOTP(phone: string, otp: string): Promise<String> {
  const baseUrl = "https://cloudapi.plasgate.com";
  const url = new URL(`${baseUrl}/rest/send`);
  url.searchParams.set("private_key", env.PLASGATE_PRIVATE_KEY);
  url.searchParams.set("secret", env.PLASGATE_SECRET);
  url.searchParams.set("sender", env.PLASGATE_SENDER);

  const to = phone.replace(/[^\d]/g, "");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Secret": env.PLASGATE_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: env.PLASGATE_SENDER,
      to,
      content: `Your Jober verification code is: ${otp}. Valid for 5 minutes.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Plasgate OTP failed: ${response.status}`);
  }

  const data = await response.json();
  return data.message ?? "OTP sent";
}

export { sendOTP };
