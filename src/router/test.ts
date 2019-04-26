
export async function publicTest(ctx, next) {

  console.log('server', 'cxt-public', ctx.session.accessToken);
  ctx.response.body = JSON.stringify({'hello' : 'i', 'am' : 'public test'})
  next();
}

export async function privateTest(ctx, next) {

  console.log('server', 'cxt-private', ctx.session.accessToken);
  ctx.response.body = JSON.stringify({'hello' : 'i', 'am' : 'private test'})
  next();
}