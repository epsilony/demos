import { Schema } from 'convict';

const schema = {
    aad: {
        clientSecret: {
            doc: "The application secret that created in the Azure Portal for app under Keys.",
            format: String,
            default: "",
            env: "AAD_CLIENT_SECRET",
            sensitive: true
        },
        clientId: {
            doc: "The Application Id assigned to the app.",
            format: String,
            default: "",
            env: "AAD_CLIENT_ID"
        },
        redirectUri: {
            doc: "The redirect_uri of the app.",
            format: "url",
            default: "http://localhost:8080",
            env: "AAD_REDIRECT_URI"
        }
    }
};

export default schema;