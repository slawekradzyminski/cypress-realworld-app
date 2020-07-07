import createAuth0Client, { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.dev" });

export const auth0CreateLoginUrl = async (config: Auth0ClientOptions) => {
  const auth0 = await createAuth0Client(config);
  const url = await auth0.buildAuthorizeUrl();
  return url;
};

export const auth0Logout = async (config: Auth0ClientOptions) => {
  const auth0 = await createAuth0Client(config);
  return auth0.logout();
};
