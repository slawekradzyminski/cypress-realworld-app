import createAuth0Client, { Auth0ClientOptions, Auth0Client } from "@auth0/auth0-spa-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.dev" });

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  client_id: process.env.AUTH0_CLIENTID!,
  redirect_uri: process.env.AUTH0_REDIRECT_URI,
  // @ts-ignore
  cacheLocation: process.env.AUTH0_CACHE_LOCATION!,
});

export const auth0CreateLoginUrl = async (config: Auth0ClientOptions) => {
  const auth0 = await createAuth0Client(config);
  const url = await auth0.buildAuthorizeUrl();
  return url;
};

export const auth0Logout = async (config: Auth0ClientOptions) => {
  const auth0 = await createAuth0Client(config);
  return auth0.logout();
};
