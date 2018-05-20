import convict from 'convict';
import githubSchema from './github-schema';
import aadSchema from './aad-schema';

import lodash from 'lodash';

const keySchema = {
    keys: [{
        doc: 'Cookie Secret Keys',
        format: String,
        default: "",
        env: "AAD_CLIENT_SECRET",
        sensitive: true
    }]
};

const schema = lodash.assign(
    {
        env: {
            doc: "The application environment.",
            format: ["production", "development", "test"],
            default: "development",
            env: "NODE_ENV"
        }
    },
    keySchema,
    githubSchema,
    aadSchema);

const config = convict(schema);

config.loadFile("config.json");

config.validate();

export default config;