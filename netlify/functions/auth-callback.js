const { saveRefreshToken } = require("../../src/lib/msgraph");

exports.handler = async (event) => {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  if (!code) return { statusCode: 400, body: "missing code" };

  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.URL || "https://friday-os-jarvis.netlify.app"}/api/auth-callback`,
        scope: "Files.Read offline_access",
      }),
    }
  );
  if (!res.ok) {
    return { statusCode: 502, body: `token exchange failed: ${res.status} ${await res.text()}` };
  }
  const data = await res.json();
  await saveRefreshToken(data.refresh_token);

  return {
    statusCode: 200,
    headers: { "content-type": "text/html" },
    body: "<p>PVG Brain connected. You can close this tab.</p>",
  };
};
