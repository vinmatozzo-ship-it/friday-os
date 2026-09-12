const { getSupabase } = require("./supabase");

const TENANT_ID = process.env.MS_TENANT_ID;
const CLIENT_ID = process.env.MS_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

async function getRefreshToken() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("ms_graph_tokens")
    .select("refresh_token")
    .eq("id", "default")
    .single();
  if (error || !data) return null;
  return data.refresh_token;
}

async function saveRefreshToken(refreshToken) {
  const supabase = getSupabase();
  await supabase
    .from("ms_graph_tokens")
    .upsert({ id: "default", refresh_token: refreshToken, updated_at: new Date().toISOString() });
}

async function getAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: "Files.Read offline_access",
    }),
  });
  if (!res.ok) throw new Error(`ms token refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await saveRefreshToken(data.refresh_token);
  }
  return data.access_token;
}

async function listFolder(path) {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${encodedPath}:/children?$select=name,folder,file,webUrl`,
    { headers: { authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`ms graph list failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.value || []).map((item) => ({
    name: item.name,
    type: item.folder ? "folder" : "file",
  }));
}

module.exports = { getAccessToken, listFolder, saveRefreshToken };
