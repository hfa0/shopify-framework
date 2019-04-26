
export async function publicTest(ctx, next) {

  console.log('cxt-public', ctx.session);
  ctx.response.body = JSON.stringify({'hello' : 'i', 'am' : 'public test'})
  next();
}

export async function privateTest(ctx, next) {

  console.log('cxt-private', ctx.session);
  ctx.response.body = JSON.stringify({'hello' : 'i', 'am' : 'private test'})
  next();
}