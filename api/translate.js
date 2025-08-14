import fetch from "node-fetch";
import crypto from "crypto";

const appKey = process.env.YOUDAO_APP_KEY; // 在 Vercel 环境变量里设置
const appSecret = process.env.YOUDAO_APP_SECRET; // 不放在前端

function truncate(q) {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { q, to = "zh-CHS" } = req.body || {};
  if (!q) {
    return res.status(400).json({ error: "Missing q" });
  }

  const salt = Date.now();
  const curtime = Math.floor(Date.now() / 1000);
  const signStr = appKey + truncate(q) + salt + curtime + appSecret;
  const sign = crypto.createHash("sha256").update(signStr).digest("hex");

  const url = "https://openapi.youdao.com/api";
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
    const response = await fetch(url, {
      method: "POST",
      body: params,
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
