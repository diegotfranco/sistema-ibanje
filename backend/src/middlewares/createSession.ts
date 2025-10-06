import { RedisStore } from "connect-redis";
import session from "express-session";
import { redisClient } from "db/redis.js";
import type { RequestHandler } from "express";

export default (secureCookie: boolean): RequestHandler => {
  const sessionOptions = {
    name: "sid",
    store: new RedisStore({
      client: redisClient,
      prefix: "ibanje:sessions:", // Automatically adds this prefix to all session keys
    }),
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    secret: "keyboard cat",
    cookie: {
      secure: secureCookie, // only over https
      httpOnly: true, // prevents client side JS from reading it
      maxAge: 1000 * 60 * 30, // max age in milliseconds
    },
  };
  return session(sessionOptions);
};
