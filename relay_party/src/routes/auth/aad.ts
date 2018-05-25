import Router from 'koa-router';
import { URL } from 'url';
import request from 'request-promise-native';
import { AUTH_STATE_KEY_PREFIX } from './auth-consts';
import { authUrl } from './auth-utils';

const AAD_AUTH_URL_BASE = 'https://login.microsoftonline.com/common/oauth2';
const AAD_AUTH_URL = AAD_AUTH_URL_BASE + '/authorize';
const AAD_TOKEN_URL = AAD_AUTH_URL_BASE + '/token';
const MS_GRAPH_URL = 'https://graph.microsoft.com/v1.0/me/';

const AAD_STATE_KEY_PREFIX = AUTH_STATE_KEY_PREFIX + 'aad:';

export default function authRouterFactory(prefix: string, clientId: string, redirectUri: string, clientSecret: string): Router {
    const router = new Router();

    router.prefix(prefix);

    router.get('AzureAD login', '/login', (ctx) => {
        ctx.redirect(authUrl(
            {
                authUrl: AAD_AUTH_URL,
                clientId: clientId,
                redirectUri: redirectUri,
                state: ctx._loginState,
                extras: {
                    response_mode: 'form_post',
                    response_type: 'code'
                }
            }));
    });

    router.post('AzureAD callback', '/cb', async (ctx, next) => {
        const reqBody = ctx.request.body;
        const cbState = reqBody.state;
        const stateKey = AAD_STATE_KEY_PREFIX + cbState;

        if (!cbState || !ctx.session[stateKey]) {
            ctx.status = 404;
            console.log(`state missmatch: ${cbState}`);
            return;
        }

        delete ctx.session[stateKey];

        const error = reqBody.error;
        if (error) {
            console.log({ error: error, errorDescription: reqBody.error_descrtiption });
            return;
        }

        const code = reqBody.code;
        const adminConsent = reqBody.admin_consent === 'True';
        const sessionState = reqBody.session_state;

        const callbackValues = { code: code, adminConsent: adminConsent, sessionState: sessionState };
        console.log(callbackValues);

        const tokenResponseBody = await request.post(AAD_TOKEN_URL, {
            form:
                {
                    client_id: clientId,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                    client_secret: clientSecret,
                    resource: 'https://graph.microsoft.com'
                }
        });

        const tokenResponse = JSON.parse(tokenResponseBody);
        console.log(tokenResponse);

        const graphResponseBody = await request.get(MS_GRAPH_URL, {
            headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const graphResponse = JSON.parse(graphResponseBody);

        ctx.body = graphResponse;
    });

    return router;
}