import { Schema } from 'convict';

const schema = {
    github: {
        clientSecret: {
            doc: "The application secret.",
            format: String,
            default: "",
            env: "GITHUB_CLIENT_SECRET",
            sensitive: true
        },
        clientId: {
            doc: "The Application Id assigned to the app.",
            format: String,
            default: "",
            env: "GITHUB_CLIENT_ID"
        },
        redirectUri: {
            doc: "The redirect_uri of the app.",
            format: "url",
            default: "http://localhost:8080",
            env: "GITHUB_REDIRECT_URI",
        }
    }
};

export default schema;