const { isAuthorized } = require("../../src/lib/auth");
const { listFolder } = require("../../src/lib/msgraph");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "method not allowed" };
  }
  if (!isAuthorized(event)) {
    return { statusCode: 401, body: "unauthorized" };
  }

  const path = (event.queryStringParameters && event.queryStringParameters.path) ||
    process.env.ONEDRIVE_FOLDER_PATH ||
    "PVG-Brain";

  let items;
  try {
    items = await listFolder(path);
  } catch (err) {
    return { statusCode: 502, body: `graph list failed: ${err.message}` };
  }
  if (items === null) {
    return { statusCode: 409, body: "PVG Brain not connected yet — visit /api/auth-login first" };
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path, items }),
  };
};
