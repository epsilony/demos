import { URL } from 'url';

export interface AuthOptions {
    clientId: string;
    redirectUri: string;
    state: string;
    authUrl: string;
    extras: {
        [index: string]: string;
    };
}

export function authUrl(opts: AuthOptions): string {
    const url = new URL(opts.authUrl);
    const params = url.searchParams;

    params.set('client_id', opts.clientId);
    params.set('redirect_uri', opts.redirectUri);
    params.set('state', opts.state);

    for (const key in opts.extras) {
        params.set(key, opts.extras[key]);
    }

    return url.toString();
}