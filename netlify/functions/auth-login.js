exports.handler = async () => {
  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${process.env.URL || "https://friday-os-jarvis.netlify.app"}/api/auth-callback`,
    response_mode: "query",
    scope: "Files.Read offline_access",
  });
  return {
    statusCode: 302,
    headers: {
      location: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/authorize?${params}`,
    },
  };
};
