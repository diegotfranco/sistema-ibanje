import type { RequestHandler } from 'express';
import cors, { type CorsOptions } from 'cors';
import { Errors } from '@/utils/errorFactory';

export default (isHttps: boolean): RequestHandler => {
  const whitelist = new Set(
    isHttps ? ['https://ibanje.com.br', 'https://www.ibanje.com.br'] : ['http://localhost']
  );

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (origin === undefined || whitelist.has(origin)) {
        callback(null, true);
      } else {
        callback(Errors.forbidden('Not allowed by CORS'));
      }
    },
    optionsSuccessStatus: 200,
    credentials: true
  };

  return cors(corsOptions);
};
