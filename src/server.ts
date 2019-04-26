require('isomorphic-fetch');
require('dotenv').config();
import * as Koa from 'koa';
import * as session from 'koa-session';
import * as next from 'next';
import * as http from 'http';
import * as socketIO from 'socket.io';
import graphQLProxy from '@shopify/koa-shopify-graphql-proxy';
import { ApiVersion } from '@shopify/koa-shopify-graphql-proxy';
import * as bodyparser from 'koa-bodyparser';
const { SHOPIFY_API_SECRET_KEY, NODE_ENV } = process.env;
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
import auth from "./router/user/auth";
import root from './router';
import { shareSession, verifySocketMessage, verifed } from './middleware';
import { Worker, SocketEvent } from './worker';

const worker = new Worker();


nextApp.prepare().then(() => {
  const app = Object.assign(new Koa(), {server:null, io:null})
  app.use(session(app));
  app.use(bodyparser());
  app.keys = [SHOPIFY_API_SECRET_KEY];
  app.use(auth);
  app.use(graphQLProxy({ version: ApiVersion.April19 }));
  app.use(root.routes());

  app.use(async ctx => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
    // console.log('finish')
    return;
  });

  app.server = http.createServer(app.callback());

  app.io = socketIO(app.server, {});

  app.io.on(SocketEvent.CONNECT, worker.registerClient);

  app.io.on(SocketEvent.MESSAGE, (ctx) => {
    console.log('server message', ctx.session)
  })

  app.io.on(SocketEvent.ERROR, (error) => {
    console.log('error', error)
  })

  Object.keys(worker.modules).map((moduleName: any) => 
    app.io.on(moduleName, (ctx) => worker.handle(moduleName, ctx))
  );

  app.io.use(shareSession(app));
  app.io.use(verifySocketMessage);
  app.io.use(verifed);
  
  app.server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
