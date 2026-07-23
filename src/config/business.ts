export interface BusinessInfo {
  businessName: string;
  senderName: string;
  senderEmail: string;
  address: string;
}

export function loadBusinessInfo(): BusinessInfo {
  const businessName = process.env.BUSINESS_NAME;
  const senderName = process.env.SENDER_NAME;
  const senderEmail = process.env.SENDER_EMAIL;
  const address = process.env.BUSINESS_ADDRESS;

  if (!businessName || !senderName || !senderEmail || !address) {
    throw new Error(
      "Missing business identity env vars. Set BUSINESS_NAME, SENDER_NAME, SENDER_EMAIL, BUSINESS_ADDRESS in .env " +
        "(BUSINESS_ADDRESS is required so outreach emails carry a physical sender address, per CAN-SPAM/GDPR rules)."
    );
  }
  return { businessName, senderName, senderEmail, address };
}
