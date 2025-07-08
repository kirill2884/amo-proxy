import { NowRequest, NowResponse } from '@vercel/node';
import * as https from 'https';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHmU8WZ23iO8J8NcY40d_GLGg4Q2NEuz67EzxR9P4rZew2Lv3iHJpOzOdyYysLaG-70g/exec";

export default async function handler(req: NowRequest, res: NowResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const data = JSON.stringify(req.body);

  const url = new URL(SCRIPT_URL);

  const options: https.RequestOptions = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let body = "";
    proxyRes.on("data", (chunk) => (body += chunk));
    proxyRes.on("end", () => {
      console.log("Ответ от Google Script:", body);
      res.status(200).send("OK");
    });
  });

  proxyReq.on("error", (err) => {
    console.error("Ошибка при отправке в Google Script:", err);
    res.status(500).send("Ошибка проксирования");
  });

  proxyReq.write(data);
  proxyReq.end();
}
