// @ts-check
import "@cypress/code-coverage/support";
import "./commands";
import "./auth-commands";
import "@percy/cypress";
import "./auth-provider-commands/auth0";
import "./auth-provider-commands/okta";
import { isMobile } from "./utils";

beforeEach(() => {
  // cy.intercept middleware to remove 'if-none-match' headers from all requests
  // to prevent the server from returning cached responses of API requests
  cy.intercept(
    { url: "http://localhost:3001/**", middleware: true },
    (req) => delete req.headers["if-none-match"]
  );

  if (isMobile()) {
    cy.intercept({ url: "http://localhost:3001/**", middleware: true }, (req) => {
      req.on("response", (res) => {
        res.setThrottle(1000);
      });
    });
  }
});
