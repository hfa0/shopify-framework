require('dotenv').config();
import * as http from 'http';
import * as limiter from 'koa-ratelimit';
import * as Redis from 'ioredis';
import koaHelmet = require('koa-helmet');

export const shareSession = (app) => {
  return (socket, next) => {
    let error = null;
    try {
      const ctx = app.createContext(socket.request, new http.ServerResponse(socket.request));
      socket.session = ctx.session;
      console.log('share');
      return next();
    } catch (err) {
      error = err;
    }
    return next(error);
  }
}


export const verifySocketMessage = (socket, next) => {
  console.log('verify');
  if (!socket.session.accessToken) {
    console.log("no authorization");
    socket.emit('error', "no authorization");
    socket.disconnect();
    return next("no authorization - disconnected");
  }
  return next();
}

export const verifed = (socket, next) => {
  console.log('verifed', socket.session);
  return next();
}


export const rateLimit = limiter({
  db: new Redis({host: "127.0.0.1", port:5000}),
  duration: 60000,
  errorMessage: 'Sometimes You Just Have to Slow Down.',
  id: (ctx) => ctx.ip,
  headers: {
    remaining: 'Rate-Limit-Remaining',
    reset: 'Rate-Limit-Reset',
    total: 'Rate-Limit-Total'
  },
  max: 100,
  disableHeader: false,
})


export const helmet = koaHelmet({
  frameguard: false,
})

