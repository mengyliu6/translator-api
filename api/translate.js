// pages/api/translate.js
import fetch from "node-fetch";
import crypto from "crypto";

const appKey = process.env.YOUDAO_APP_KEY;
const appSecret = process.env.YOUDAO_APP_SECRET;

function truncate(q) {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log(req.body);
  // ✅ 解析 JSON body
  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON", log: req.body });
  }

  const { q, to = "zh-CHS" } = body;
  if (!q) return res.status(400).json({ error: "Missing q" });

  const salt = Date.now();
  const curtime = Math.floor(Date.now() / 1000);
  const signStr =
    appKey.str.slice(3) + truncate(q) + salt + curtime + appSecret;
  const sign = crypto.createHash("sha256").update(signStr).digest("hex");

  const params = new URLSearchParams({
    q,
    from: "auto",
    to,
    appKey,
    salt,
    sign,
    signType: "v3",
    curtime,
  });

  try {
    const youdaoRes = await fetch("https://openapi.youdao.com/api", {
      method: "POST",
      body: params,
    });
    const data = await youdaoRes.json();
    res.status(200).json({ translation: data.translation || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
