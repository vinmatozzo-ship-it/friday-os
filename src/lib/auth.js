// Accepts either the phone UI's x-app-token header or a standard
// Authorization: Bearer <token> header (what ChatGPT Actions sends),
// both checked against the same shared secret.
function isAuthorized(event) {
  const secret = process.env.APP_SHARED_SECRET;
  if (!secret) return false;

  const headers = event.headers || {};
  if (headers["x-app-token"] === secret) return true;

  const authHeader = headers["authorization"] || headers["Authorization"];
  if (authHeader && authHeader.replace(/^Bearer\s+/i, "") === secret) return true;

  return false;
}

module.exports = { isAuthorized };
