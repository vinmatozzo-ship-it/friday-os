const { getSupabase } = require("../../src/lib/supabase");
const { callProvider } = require("../../src/lib/providers");
const { listFolder } = require("../../src/lib/msgraph");

const HISTORY_LIMIT = 20;
const MEMORY_LIMIT = 10;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "method not allowed" };
  }

  if (
    !process.env.APP_SHARED_SECRET ||
    event.headers["x-app-token"] !== process.env.APP_SHARED_SECRET
  ) {
    return { statusCode: 401, body: "unauthorized" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "invalid json" };
  }

  const message = (payload.message || "").trim();
  if (!message) return { statusCode: 400, body: "message is required" };

  const provider = payload.provider || process.env.DEFAULT_PROVIDER || "claude";
  const supabase = getSupabase();

  let sessionId = payload.sessionId;
  if (sessionId) {
    const { data, error } = await supabase.from("sessions").select("id").eq("id", sessionId).single();
    if (error || !data) sessionId = null;
  }
  if (!sessionId) {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ title: message.slice(0, 60) })
      .select("id")
      .single();
    if (error) return { statusCode: 500, body: `session create failed: ${error.message}` };
    sessionId = data.id;
  }

  const { data: history, error: historyErr } = await supabase
    .from("messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (historyErr) return { statusCode: 500, body: `history fetch failed: ${historyErr.message}` };

  const { data: memory, error: memoryErr } = await supabase
    .from("agent_memory")
    .select("key, content, category")
    .order("updated_at", { ascending: false })
    .limit(MEMORY_LIMIT);
  if (memoryErr) return { statusCode: 500, body: `memory fetch failed: ${memoryErr.message}` };

  let pvgBrainListing = [];
  try {
    pvgBrainListing = (await listFolder(process.env.ONEDRIVE_FOLDER_PATH || "PVG-Brain")) || [];
  } catch {
    pvgBrainListing = [];
  }

  const systemPrompt = [
    "You are Friday, a personal assistant with access to persisted memory.",
    "Relevant memory entries:",
    ...(memory || []).map((m) => `- [${m.category}] ${m.key}: ${m.content}`),
    pvgBrainListing.length ? "\nFiles currently in the PVG Brain folder:" : "",
    ...pvgBrainListing.map((f) => `- [${f.type}] ${f.name}`),
  ]
    .filter(Boolean)
    .join("\n");

  let reply;
  try {
    reply = await callProvider(provider, {
      systemPrompt,
      history: (history || []).reverse().map((m) => ({ role: m.role, content: m.content })),
      message,
    });
  } catch (err) {
    return { statusCode: 502, body: `provider call failed: ${err.message}` };
  }

  const { error: insertErr } = await supabase.from("messages").insert([
    { session_id: sessionId, role: "user", content: message },
    { session_id: sessionId, role: "assistant", content: reply },
  ]);
  if (insertErr) return { statusCode: 500, body: `message save failed: ${insertErr.message}` };

  await supabase.from("sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, provider, reply }),
  };
};
