import express from 'express';
import 'dotenv/config';
import configCors from '@/middlewares/configCors';
import createSession from '@/middlewares/createSession';
import routes from '@/routes/index';
import { sql } from '@/db/postgres';
import { errorHandler } from '@/middlewares/errorHandler';
import shutdown from '@/utils/shutdown';

async function init() {
  // const port = Number(process.env.PORT) || 5000;
  const port = 5000;
  const url = process.env.BASE_URL || 'localhost';
  let secureCookie = false;

  try {
    const app = express();
    if (app.get('env') === 'production') {
      app.set('trust proxy', 1); // trust first proxy
      secureCookie = true; // serve secure cookies
    }
    // app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(configCors(3000, false));

    app.use(createSession(secureCookie));
    // app.use(cookieParser());

    app.use(routes);
    app.use(errorHandler);

    const server = app.listen(port, () => {
      console.log(`Servidor escutando a porta http://${url}:${port}`);
    });

    const exitHandler = shutdown(server, sql, {
      coredump: false,
      timeout: 500
    });

    process.on('uncaughtException', exitHandler(1, 'Unexpected Error'));
    process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'));
    process.on('SIGTERM', exitHandler(0, 'SIGTERM'));
    process.on('SIGINT', exitHandler(0, 'SIGINT'));
  } catch (error) {
    console.error(error);
  }
}

init();
