import _ from "lodash";
import axios from "axios";
import dotenv from "dotenv";
import Promise from "bluebird";
import codeCoverageTask from "@cypress/code-coverage/task";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default (on, config) => {
  config.env.defaultPassword = process.env.SEED_DEFAULT_USER_PASSWORD;
  config.env.paginationPageSize = process.env.PAGINATION_PAGE_SIZE;
  config.env.auth0_domain = process.env.AUTH0_DOMAIN;
  config.env.auth0_clientID = process.env.AUTH0_CLIENTID;
  config.env.auth0_clientSecret = process.env.AUTH0_CLIENTSECRET;
  config.env.auth0_audience = process.env.AUTH0_AUDIENCE;
  config.env.auth0_scope = process.env.AUTH0_SCOPE;
  config.env.auth0_username = process.env.AUTH0_USERNAME;
  config.env.auth0_password = process.env.AUTH0_PASSWORD;
  config.env.auth0_redirect_uri = process.env.AUTH0_REDIRECT_URI;
  config.env.auth0_cacheLocation = process.env.AUTH0_CACHE_LOCATION;

  const testDataApiEndpoint = `${config.env.apiUrl}/testData`;

  const queryDatabase = ({ entity, query }, callback) => {
    const fetchData = async (attrs) => {
      const { data } = await axios.get(`${testDataApiEndpoint}/${entity}`);
      return callback(data, attrs);
    };

    return Array.isArray(query) ? Promise.map(query, fetchData) : fetchData(query);
  };

  on("task", {
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
