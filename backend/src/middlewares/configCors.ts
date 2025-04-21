import type { RequestHandler } from "express";
import cors, { type CorsOptions } from "cors";

export default (port: number, isHttps: boolean): RequestHandler => {
  const whitelist = new Set(
    isHttps
      ? [`https://localhost:${port}`, "https://89.116.214.28:3000"]
      : [`http://localhost:${port}`, "http://89.116.214.28:3000"],
  );

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (origin === undefined || whitelist.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200,
    credentials: true,
  };

  return cors(corsOptions);
};
