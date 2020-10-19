import _ from "lodash";
import { readFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";
import Promise from "bluebird";
import saml2 from "saml2-js";
import { percyHealthCheck } from "@percy/cypress/task";
import codeCoverageTask from "@cypress/code-coverage/task";

dotenv.config();

const serviceProviderOptions = {
  entity_id: "http://localhost:3000/samlMetadata",
  private_key: readFileSync(__dirname + "/../../backend/certs/key.pem").toString(),
  certificate: readFileSync(__dirname + "/../../backend/certs/cert.pem").toString(),
  assert_endpoint: "http://localhost:3000/loginSaml",
  force_authn: true,
  auth_context: { comparison: "exact", class_refs: ["urn:oasis:names:tc:SAML:1.0:am:password"] },
  nameid_format: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sign_get_request: false,
  allow_unencrypted_assertion: true,
};

const identityProviderOptions = {
  sso_login_url: "http://localhost:8080/simplesaml/saml2/idp/SSOService.php",
  sso_logout_url: "http://localhost:8080/simplesaml/saml2/idp/SingleLogoutService.php",
  certificates: [readFileSync(__dirname + "/../../backend/certs/idp_key.pem").toString()],
  force_authn: true,
  sign_get_request: false,
  allow_unencrypted_assertion: false,
};

const serviceProvider = new saml2.ServiceProvider(serviceProviderOptions);
const identityProvider = new saml2.IdentityProvider(identityProviderOptions);

export default (on, config) => {
  config.env.defaultPassword = process.env.SEED_DEFAULT_USER_PASSWORD;
  config.env.paginationPageSize = process.env.PAGINATION_PAGE_SIZE;

  const testDataApiEndpoint = `${config.env.apiUrl}/testData`;

  const queryDatabase = ({ entity, query }, callback) => {
    const fetchData = async (attrs) => {
      const { data } = await axios.get(`${testDataApiEndpoint}/${entity}`);
      return callback(data, attrs);
    };

    return Array.isArray(query) ? Promise.map(query, fetchData) : fetchData(query);
  };

  const loginViaSaml = ({ username, password }) => {
    const authEndpoint = "http://localhost:8080/simplesaml/module.php/core/loginuserpass.php";
    return serviceProvider.create_login_request_url(
      identityProvider,
      {},
      async (error, loginUrl, requestId) => {
        if (error) {
          console.log(error);
        }

        console.log("LoginUrl: ", loginUrl);
        console.log("requestId: ", requestId);

        /*
        try {
          const { data } = await axios.post(authEndpoint, { username, password });
          console.log("login response", data);
        } catch (error) {
          console.log(error);
        }*/

        return loginUrl;
      }
    );
    // Pass identity provider into a service provider function with options and a callback.
    //sp.post_assert(idp, {}, callback);
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
    loginBySaml({ username, password }) {
      return loginViaSaml({ username, password });
    },
  });

  codeCoverageTask(on, config);
  return config;
};
