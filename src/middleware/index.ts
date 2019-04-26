require('dotenv').config();
import * as http from 'http';
import * as limiter from 'koa-ratelimit';
import * as Redis from 'ioredis';
import koaHelmet = require('koa-helmet');
import { IncomingEventData } from '../worker';
import { ModuleName } from '../modules';

export const shareSession = (app) => {
  return (socket, next) => {
    let error = null;
    try {
      const ctx = app.createContext(socket.request, new http.ServerResponse(socket.request));
      socket.session = ctx.session;
      console.log('server', 'share');
      return next();
    } catch (err) {
      error = err;
    }
    return next(error);
  }
}


export const verifySocketMessage = (socket, next) => {
  console.log("server", 'verify');
  const xHeader = socket.handshake.headers['x-clientid']
  if (!socket.session.accessToken || xHeader !== 'client-id') {
    console.log("server", "no authorization");
    socket.emit('error', "no authorization");
    socket.disconnect();
    return next("no authorization - disconnected");
  }
  return next();
}

export const verifed = (socket, next) => {
  console.log('server', 'verifed', socket.session.shop);
  return next();
}

export const unpackData = (event: ModuleName, dataString: string): [string, IncomingEventData] => {
  let err = null, data = null;
  try {
    data = JSON.parse(dataString);
    err = data.job ? null : 'job param missing';
    err = data.data ? null : 'data param missing'
    data.event = event;
  } catch(error) {
    err = error;
  }
  return [err, data];
}


export const rateLimit = limiter({
  db: new Redis({host: "127.0.0.1", port:5000}),
  duration: 60 * 1000,
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

