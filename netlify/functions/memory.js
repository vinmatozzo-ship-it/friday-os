const { isAuthorized } = require("../../src/lib/auth");
const { getSupabase } = require("../../src/lib/supabase");

exports.handler = async (event) => {
  if (!isAuthorized(event)) {
    return { statusCode: 401, body: "unauthorized" };
  }

  const supabase = getSupabase();

  if (event.httpMethod === "GET") {
    const { data, error } = await supabase
      .from("agent_memory")
      .select("key, content, category, tags, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) return { statusCode: 500, body: `memory fetch failed: ${error.message}` };
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memories: data }),
    };
  }

  if (event.httpMethod === "POST") {
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: "invalid json" };
    }
    if (!payload.key || !payload.content) {
      return { statusCode: 400, body: "key and content are required" };
    }
    const { error } = await supabase.from("agent_memory").upsert({
      key: payload.key,
      content: payload.content,
      category: payload.category || "general",
      source: "chatgpt",
      updated_at: new Date().toISOString(),
    });
    if (error) return { statusCode: 500, body: `memory save failed: ${error.message}` };
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: "{\"ok\":true}" };
  }

  return { statusCode: 405, body: "method not allowed" };
};
