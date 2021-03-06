import Router from 'koa-router';
import { URL } from 'url';
import uuid from 'uuid/v4';
import request from 'request-promise-native';
import { AUTH_STATE_KEY_PREFIX } from './auth-consts';
import logger from '../../utils/logger';
import { authUrl } from './auth-utils';

const GITHUB_AUTH_URL_BASE = 'https://github.com/login/oauth';
const GITHUB_AUTH_URL = GITHUB_AUTH_URL_BASE + '/authorize';
const GITHUB_TOKEN_URL = GITHUB_AUTH_URL_BASE + '/access_token';
const GITHUB_USER_API_URL = 'https://api.github.com/user';

const GITHUB_STATE_KEY_PREFIX = AUTH_STATE_KEY_PREFIX + 'github:';

export default function githubAuthRouterFactory(prefix: string, clientId: string, redirectUri: string, clientSecret: string): Router {
    const router = new Router();

    router.prefix(prefix);

    router.get('GitHub login', '/login', (ctx) => {
        ctx.redirect(authUrl(
            {
                authUrl: GITHUB_AUTH_URL,
                clientId: clientId,
                redirectUri: redirectUri,
                state: ctx._loginState,
                extras: { scope: "user" }
            }));
    });

    router.get('GitHub callback', '/cb', async (ctx, next) => {
        const reqParams = ctx.query;
        const cbState = reqParams.state;
        const stateKey = GITHUB_STATE_KEY_PREFIX + cbState;

        if (!cbState || !ctx.session[stateKey]) {
            ctx.status = 404;
            console.log(`state missmatch: ${cbState}`);
            return;
        }

        delete ctx.session[stateKey];

        const error = reqParams.error;
        if (error) {
            console.log({ error: error, errorDescription: reqParams.error_descrtiption, errorUri: reqParams.error_uri });
            return;
        }

        const code = reqParams.code;

        const callbackValues = { code: code };
        console.log(callbackValues);

        const tokenResponseBody = await request.post(GITHUB_TOKEN_URL, {
            form: {
                client_id: clientId,
                code: code,
                redirect_uri: redirectUri,
                client_secret: clientSecret,
                state: cbState
            },
            headers: {
                Accept: 'application/json'
            }
        });

        const tokenResponse = JSON.parse(tokenResponseBody);
        console.log(tokenResponse);

        const userResponseBody = await request.get(GITHUB_USER_API_URL, {
            headers: {
                Authorization: `${tokenResponse.token_type} ${tokenResponse.access_token}`,
                "User-Agent": 'epsilony.net'
            }
        });

        const userResponse = JSON.parse(userResponseBody);
        ctx.body = userResponse;
    });

    return router;
}