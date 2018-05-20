import Router from 'koa-router';
import session from 'koa-generic-session';
import { AUTH_STATE_KEY_PREFIX } from './auth/auth-consts';

import aadAuthRouterFactory from './auth/aad';
import githubAuthRouterFactory from './auth/github';

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