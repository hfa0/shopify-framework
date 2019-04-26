const Router = require("koa-router")
import processPayment from './user/payment';
import { verifyRequest } from '@shopify/koa-shopify-auth';
import {publicTest, privateTest} from "./test";

const root = new Router();
const publicRouter = new Router();
const privateRouter = new Router();

/** public routes */
publicRouter.get('/test', publicTest);

/** private routes */
privateRouter.get('/test', privateTest);
privateRouter.post('/test-post', async (ctx, next) => {
  console.log('test-post', ctx.request.body)
});

/** root router */
root.get('/', processPayment);
root.use('/public', publicRouter.routes());
root.use('/private', verifyRequest(), privateRouter.routes());

export default root;

