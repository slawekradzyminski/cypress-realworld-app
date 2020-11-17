import _ from "lodash";
import axios from "axios";
import dotenv from "dotenv";
import Promise from "bluebird";
import { percyHealthCheck } from "@percy/cypress/task";
import codeCoverageTask from "@cypress/code-coverage/task";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default (on, config) => {
  config.env.defaultPassword = process.env.SEED_DEFAULT_USER_PASSWORD;
  config.env.paginationPageSize = process.env.PAGINATION_PAGE_SIZE;
  config.env.auth_username = process.env.AUTH_USERNAME;
  config.env.auth_password = process.env.AUTH_PASSWORD;
  config.env.idpAuthUsername = process.env.SAML_IDP_AUTH_USERNAME;
  config.env.idpAuthPassword = process.env.SAML_IDP_AUTH_PASSWORD;
  config.env.samlSpLoginUrl = process.env.SAML_SP_LOGIN_URL;
  config.env.samlSpLoginCallbackUrl = process.env.SAML_SP_LOGIN_CALLBACK_URL;
  config.env.samlIdpSsoUrl = process.env.SAML_IDP_SSO_URL;
  config.env.oktaAuthUsername = process.env.SAML_OKTA_AUTH_USERNAME;
  config.env.oktaAuthPassword = process.env.SAML_OKTA_AUTH_PASSWORD;
  config.env.samlOktaAuthn = process.env.SAML_OKTA_AUTHN_API_URL;
  config.env.samlOktaSessionsApi = process.env.SAML_OKTA_SESSIONS_API_URL;
  config.env.samlOktaApp = process.env.SAML_OKTA_APP_LINK;

  const testDataApiEndpoint = `${config.env.apiUrl}/testData`;

  const queryDatabase = ({ entity, query }, callback) => {
    const fetchData = async (attrs) => {
      const { data } = await axios.get(`${testDataApiEndpoint}/${entity}`);
      return callback(data, attrs);
    };

    return Array.isArray(query) ? Promise.map(query, fetchData) : fetchData(query);
  };

  on("task", {
    percyHealthCheck,
    async "db:seed"() {
      // seed database with test data
      const { data } = await axios.post(`${testDataApiEndpoint}/seed`);
      return data;
    },

    // fetch test data from a database (MySQL, PostgreSQL, etc...)
    "filter:database"(queryPayload) {
      return queryDatabase(queryPayload, (data, attrs) => _.filter(data.results, attrs));
    },
    "find:database"(queryPayload) {
      return queryDatabase(queryPayload, (data, attrs) => _.find(data.results, attrs));
    },
  });

  codeCoverageTask(on, config);
  return config;
};
