// Thin adapters that normalize each provider's chat API to
// callProvider(name, { systemPrompt, history, message }) -> Promise<string>

async function callClaude({ systemPrompt, history, message }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...history, { role: "user", content: message }],
    }),
  });
  if (!res.ok) throw new Error(`claude: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.map((b) => b.text).join("") ?? "";
}

async function callOpenAICompatible({ baseUrl, apiKey, model, systemPrompt, history, message }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${baseUrl}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const PROVIDERS = {
  claude: callClaude,
  gpt: (args) =>
    callOpenAICompatible({
      baseUrl: "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4.1",
      ...args,
    }),
  kimi: (args) =>
    callOpenAICompatible({
      baseUrl: "https://api.moonshot.cn/v1",
      apiKey: process.env.MOONSHOT_API_KEY,
      model: process.env.MOONSHOT_MODEL || "kimi-k2-0905-preview",
      ...args,
    }),
  qwen: (args) =>
    callOpenAICompatible({
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: process.env.DASHSCOPE_API_KEY,
      model: process.env.DASHSCOPE_MODEL || "qwen-max",
      ...args,
    }),
};

async function callProvider(name, args) {
  const fn = PROVIDERS[name];
  if (!fn) throw new Error(`unknown provider: ${name}`);
  return fn(args);
}

module.exports = { callProvider, PROVIDERS };
