export interface SendResult {
  ok: boolean;
  error?: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cache: TokenCache | undefined;

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET not set (see .env.example) — required to send via Microsoft Graph."
    );
  }

  if (cache && cache.expiresAt > Date.now() + 30_000) return cache.accessToken;

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get Microsoft Graph access token: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cache = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cache.accessToken;
}

/**
 * Sends via Microsoft Graph using an app-only (client credentials) token —
 * no interactive login, no SMTP/Basic Auth. Requires the Azure AD app to
 * have the Mail.Send application permission with admin consent granted,
 * and EMAIL_USER to be the mailbox it sends as.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<SendResult> {
  try {
    const sender = process.env.EMAIL_USER;
    if (!sender) throw new Error("EMAIL_USER not set (see .env.example) — the mailbox the agent sends as.");

    const token = await getAccessToken();
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "Text", content: body },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `${res.status} ${await res.text()}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
