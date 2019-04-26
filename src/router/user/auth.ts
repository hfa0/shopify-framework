const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const dotenv = require('dotenv');
dotenv.config();

const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
  TUNNEL_URL,
  API_VERSION
} = process.env;

const auth = createShopifyAuth({
  apiKey: SHOPIFY_API_KEY,
  secret: SHOPIFY_API_SECRET_KEY,
  scopes: ['read_products', 'write_products'],
  async afterAuth(ctx) {
    const { shop, accessToken } = ctx.session;
    ctx.cookies.set('shopOrigin', shop, { httpOnly: false });
    
    const stringifiedBillingParams = JSON.stringify({
      recurring_application_charge: {
        name: 'Recurring charge',
        price: 20.01,
        return_url: TUNNEL_URL,
        test: true
      }
    });
    const options: any = {
      method: 'POST',
      body: stringifiedBillingParams,
      credentials: 'include',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    };

    const confirmationURL = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges.json`,
      options
    )
      .then(response => response.json())
      .then(
        jsonData => jsonData.recurring_application_charge.confirmation_url
      )
      .catch(error => console.log('error', error));
    ctx.redirect(confirmationURL);
  }
})

export default auth