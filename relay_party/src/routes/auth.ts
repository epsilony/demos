import Router from 'koa-router';
import session from 'koa-generic-session';
import { AUTH_STATE_KEY_PREFIX } from './auth/auth-consts';

import aadAuthRouterFactory from './auth/aad';
import githubAuthRouterFactory from './auth/github';

import uuid from 'uuid/v4';

const AAD_STATE_KEY_PREFIX = AUTH_STATE_KEY_PREFIX + 'aad:';
const GITHUB_STATE_KEY_PREFIX = AUTH_STATE_KEY_PREFIX + 'github:';

const TYPE_TO_STATE_KEY_PREFIX: { [index: string]: string } = {
    'aad': AAD_STATE_KEY_PREFIX,
    'github': GITHUB_STATE_KEY_PREFIX
};

function authRouterFactory(prefix: string, options: any): Router {

    const router = new Router();
    router.prefix(prefix);

    router.use(session({
        cookie: {
            path: prefix
        }
    }));

    router.use(async (ctx, next) => {
        for (const key in ctx.session) {
            if (!key.startsWith(AUTH_STATE_KEY_PREFIX)) {
                continue;
            }
            if (ctx.session[key] < new Date().getTime()) {
                delete ctx.session[key];
            }
        }
        await next();
    });

    router.get('state_assign', '/:type/login', async (ctx, next) => {
        let type = ctx.params.type as string;
        if (!type) {
            ctx.status = 404;
            return;
        }
        type = type.toLowerCase();
        const prefix = TYPE_TO_STATE_KEY_PREFIX[type];
        if (!prefix) {
            ctx.status = 404;
            return;
        }
        const state = uuid();
        ctx.session[prefix + state] = new Date().getTime() + 60 * 1000;
        ctx._loginState = state;
        await next();
    });

    const github = options.github;

    if (github) {
        const githubAuthRouter = githubAuthRouterFactory('/github', github.clientId, github.redirectUri, github.clientSecret);
        router.use(githubAuthRouter.routes())
            .use(githubAuthRouter.allowedMethods());
    }

    const aad = options.aad;

    if (aad) {
        const aadAuthRouter = aadAuthRouterFactory('/aad', aad.clientId, aad.redirectUri, aad.clientSecret);
        router.use(aadAuthRouter.routes())
            .use(aadAuthRouter.allowedMethods());
    }

    return router;
}

export default authRouterFactory;