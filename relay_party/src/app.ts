import Koa from 'koa';
import views from 'koa-views';
import json from 'koa-json';
import onerror from 'koa-onerror';
import bodyparser from 'koa-bodyparser';
import logger from 'koa-logger';

import index from './routes/index';
import authFactory from './routes/auth';
import debug from 'debug';

import config from './config';
import lodash from 'lodash';

debug(config.toString());

const auth = authFactory(
  '/auth',
  {
    github: config.get('github'),
    aad: config.get('aad')
  });

const app = new Koa();

app.keys = config.get("keys") as Array<string>;

// error handler
onerror(app);

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}));
app.use(json());
app.use(logger());

app.use(views(__dirname + '/views', {
  extension: 'pug'
}));

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date().getTime() - start.getTime();
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
app.use(index.routes()).use(index.allowedMethods());
app.use(auth.routes()).use(auth.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

export default app;
