import type { RequestHandler } from 'express';
import cors, { type CorsOptions } from 'cors';

export default (port: number, isHttps: boolean): RequestHandler => {
  const whitelist = new Set(
    isHttps
      ? [
          'https://www.ibanje.com.br:2443',
          'https://ibanje.com.br:2443',
          'https://186.219.220.219:2443',
          'https://192.168.100.2:2443'
        ]
      : [
          'http://www.ibanje.com.br:280',
          'http://ibanje.com.br:280',
          'http://186.219.220.219:280',
          'http://192.168.100.2:280',
          'http://localhost:3000'
        ]
  );

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (origin === undefined || whitelist.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    optionsSuccessStatus: 200,
    credentials: true
  };

  return cors(corsOptions);
};
