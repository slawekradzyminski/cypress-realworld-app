// @ts-check
///<reference path="../global.d.ts" />

import url from "url";
import { pick, flow } from "lodash/fp";
import { format as formatDate } from "date-fns";
import { isMobile } from "./utils";

Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});

Cypress.Commands.add("getBySelLike", (selector, ...args) => {
  return cy.get(`[data-test*=${selector}]`, ...args);
});

Cypress.Commands.add("login", (username, password, rememberUser = false) => {
  const signinPath = "/signin";
  const log = Cypress.log({
    name: "login",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${username}`],
    // @ts-ignore
    autoEnd: false,
  });

  cy.server();
  cy.route("POST", "/login").as("loginUser");
  cy.route("GET", "checkAuth").as("getUserProfile");

  cy.location("pathname", { log: false }).then((currentPath) => {
    if (currentPath !== signinPath) {
      cy.visit(signinPath);
    }
  });

  log.snapshot("before");

  cy.getBySel("signin-username").type(username);
  cy.getBySel("signin-password").type(password);

  if (rememberUser) {
    cy.getBySel("signin-remember-me").find("input").check();
  }

  cy.getBySel("signin-submit").click();
  cy.wait("@loginUser").then((loginUser: any) => {
    log.set({
      consoleProps() {
        return {
          username,
          password,
          rememberUser,
          userId: loginUser.response.body.user?.id,
        };
      },
    });

    log.snapshot("after");
    log.end();
  });
});

Cypress.Commands.add("loginByApi", (username, password = Cypress.env("defaultPassword")) => {
  return cy.request("POST", `${Cypress.env("apiUrl")}/login`, {
    username,
    password,
  });
});

Cypress.Commands.add("reactComponent", { prevSubject: "element" }, ($el) => {
  if ($el.length !== 1) {
    throw new Error(`cy.component() requires element of length 1 but got ${$el.length}`);
  }
  const key = Object.keys($el.get(0)).find((key) => key.startsWith("__reactInternalInstance$"));

  // @ts-ignore
  const domFiber = $el.prop(key);

  Cypress.log({
    name: "component",
    consoleProps() {
      return {
        component: domFiber,
      };
    },
  });

  return domFiber.return;
});

Cypress.Commands.add("setTransactionAmountRange", (min, max) => {
  cy.getBySel("transaction-list-filter-amount-range-button")
    .scrollIntoView()
    .click({ force: true });

  return cy
    .getBySelLike("filter-amount-range-slider")
    .reactComponent()
    .its("memoizedProps")
    .invoke("onChange", null, [min / 10, max / 10]);
});

Cypress.Commands.add("loginByXstate", (username, password = Cypress.env("defaultPassword")) => {
  const log = Cypress.log({
    name: "loginbyxstate",
    displayName: "LOGIN BY XSTATE",
    message: [`🔐 Authenticating | ${username}`],
    // @ts-ignore
    autoEnd: false,
  });

  cy.server();
  cy.route("POST", "/login").as("loginUser");
  cy.route("GET", "/checkAuth").as("getUserProfile");
  cy.visit("/signin", { log: false }).then(() => {
    log.snapshot("before");
  });

  cy.window({ log: false }).then((win) => win.authService.send("LOGIN", { username, password }));

  return cy.wait("@loginUser").then((loginUser) => {
    log.set({
      consoleProps() {
        return {
          username,
          password,
          // @ts-ignore
          userId: loginUser.response.body.user.id,
        };
      },
    });

    log.snapshot("after");
    log.end();
  });
});

Cypress.Commands.add("logoutByXstate", () => {
  cy.server();
  cy.route("POST", "/logout").as("logoutUser");

  const log = Cypress.log({
    name: "logoutByXstate",
    displayName: "LOGOUT BY XSTATE",
    message: [`🔒 Logging out current user`],
    // @ts-ignore
    autoEnd: false,
  });

  cy.window({ log: false }).then((win) => {
    log.snapshot("before");
    win.authService.send("LOGOUT");
  });

  return cy.wait("@logoutUser").then(() => {
    log.snapshot("after");
    log.end();
  });
});

Cypress.Commands.add("switchUser", (username) => {
  cy.logoutByXstate();
  return cy.loginByXstate(username).then(() => {
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
      cy.getBySel("sidenav-username").contains(username);
      cy.getBySel("sidenav-toggle").click({ force: true });
    } else {
      cy.getBySel("sidenav-username").contains(username);
    }
    cy.getBySel("list-skeleton").should("not.be.visible");
    cy.getBySelLike("transaction-item").should("have.length.greaterThan", 1);
    cy.percySnapshot(`Switch to User ${username}`);
  });
});

Cypress.Commands.add("createTransaction", (payload) => {
  const log = Cypress.log({
    name: "createTransaction",
    displayName: "CREATE TRANSACTION",
    message: [`💸 (${payload.transactionType}): ${payload.sender.id} <> ${payload.receiver.id}`],
    // @ts-ignore
    autoEnd: false,
    consoleProps() {
      return payload;
    },
  });

  return cy
    .window({ log: false })
    .then((win) => {
      log.snapshot("before");
      win.createTransactionService.send("SET_USERS", payload);

      const createPayload = pick(["amount", "description", "transactionType"], payload);

      return win.createTransactionService.send("CREATE", {
        ...createPayload,
        senderId: payload.sender.id,
        receiverId: payload.receiver.id,
      });
    })
    .then(() => {
      log.snapshot("after");
      log.end();
    });
});

Cypress.Commands.add("nextTransactionFeedPage", (service, page) => {
  const log = Cypress.log({
    name: "nextTransactionFeedPage",
    displayName: "NEXT TRANSACTION FEED PAGE",
    message: [`📃 Fetching page ${page} with ${service}`],
    // @ts-ignore
    autoEnd: false,
    consoleProps() {
      return {
        service,
        page,
      };
    },
  });

  return cy
    .window({ log: false })
    .then((win) => {
      log.snapshot("before");
      // @ts-ignore
      return win[service].send("FETCH", { page });
    })
    .then(() => {
      log.snapshot("after");
      log.end();
    });
});

Cypress.Commands.add("pickDateRange", (startDate, endDate) => {
  const log = Cypress.log({
    name: "pickDateRange",
    displayName: "PICK DATE RANGE",
    message: [`🗓 ${startDate.toDateString()} to ${endDate.toDateString()}`],
    // @ts-ignore
    autoEnd: false,
    consoleProps() {
      return {
        startDate,
        endDate,
      };
    },
  });

  const selectDate = (date: number) => {
    return cy.get(`[data-date='${formatDate(date, "yyyy-MM-dd")}']`).click({ force: true });
  };

  // Focus initial viewable date picker range around target start date
  // @ts-ignore: Cypress expects wrapped variable to be a jQuery type
  cy.wrap(startDate.getTime()).then((now) => {
    log.snapshot("before");
    // @ts-ignore
    cy.clock(now, ["Date"]);
  });

  // Open date range picker
  cy.getBySelLike("filter-date-range-button").click({ force: true });
  cy.get(".Cal__Header__root").should("be.visible");

  // Select date range
  selectDate(startDate);
  selectDate(endDate).then(() => {
    log.snapshot("after");
    log.end();
  });

  cy.get(".Cal__Header__root").should("not.be.visible");
});

Cypress.Commands.add("database", (operation, entity, query, logTask = false) => {
  const params = {
    entity,
    query,
  };

  const log = Cypress.log({
    name: "database",
    displayName: "DATABASE",
    message: [`🔎 ${operation}ing within ${entity} data`],
    // @ts-ignore
    autoEnd: false,
    consoleProps() {
      return params;
    },
  });

  return cy.task(`${operation}:database`, params, { log: logTask }).then((data) => {
    log.snapshot();
    log.end();
    return data;
  });
});

Cypress.Commands.add("loginBySamlUI", (username, password) => {
  cy.clearCookies({ domain: null });
  const log = Cypress.log({
    name: "loginBySamlUI",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${username}`],
    // @ts-ignore
    autoEnd: false,
  });
  cy.visit("https://dev-483770.okta.com");

  cy.get('[data-se="o-form-input-username"]').type("kevinold@gmail.com");
  cy.get('[data-se="o-form-input-password"]').type("S3cret1234$$");
  cy.get("#okta-signin-submit").click();
  cy.getCookies({ domain: null }).then((cookies) => {
    console.log("first: ", cookies);
    cookies.forEach((cookie) => {
      cy.setCookie(cookie.name, cookie.value, cookie);
    });
  });

  cy.get(".app-button")
    .invoke("attr", "href")
    .then((href) => {
      cy.visit(href);
    });
});

Cypress.Commands.add("storeAllCookies", () => {
  return cy.getCookies({ domain: null }).then((cookies) => {
    //console.log("storing cookies: ", cookies);
    cookies.forEach((cookie) => {
      cy.setCookie(cookie.name, cookie.value, cookie);
    });
  });
});

// Service Provider Initiated Flow
// 1. Visit Service Provider (follow redirects)
// 2. Programmatically authenticate with Okta Authn endpoint (store cookies)
// 3. Create Okta Session with sessionToken
// 4. Visit Okta RWA App with "onetimetoken" parameter with cookieToken to obtain SAMLResponse for Identity Provider
// 5. Post SAMLResponse to Identity Provider SSO Endpoint
// 6. Programmatically Authenticate with Identity Provider (store cookies) (provider specific)
// 7. Post SAMLResponse to Service Provider Callback
Cypress.Commands.add("loginBySamlApiOrig", () => {
  cy.clearCookies({ domain: null });
  const log = Cypress.log({
    name: "loginBySaml",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${Cypress.env("oktaAuthUsername")}`],
    // @ts-ignore
    autoEnd: false,
  });

  // 1. Visit Service Provider (follow redirects) (sets connect.sid cookie)
  cy.request(Cypress.env("samlSpLoginUrl")).then((resp) => {
    // 2. Programmatically authenticate with Okta Authn (store cookies)
    cy.request("POST", Cypress.env("samlOktaAuthn"), {
      username: Cypress.env("oktaAuthUsername"),
      password: Cypress.env("oktaAuthPassword"),
    }).then((authN) => {
      cy.log("AUTHENTICATED: Okta");

      // 3. Create Okta Session with sessionToken
      // https://developer.okta.com/docs/reference/api/sessions/#create-session-with-session-token
      cy.request("POST", Cypress.env("samlOktaSessionsApi"), {
        sessionToken: authN.body.sessionToken,
      }).then((resp) => {
        // 4. Visit Okta RWA App with "onetimetoken" parameter with cookieToken to obtain SAMLResponse for Identity Provider
        cy.request({
          method: "GET",
          url: Cypress.env("samlOktaApp"),
          qs: { onetimetoken: resp.body.cookieToken },
        }).then((samlResp) => {
          // Parse SAMLResponse from HTML returned by Okta
          const $html = Cypress.$(samlResp);
          const SAMLResponse = $html.find("form input[name=SAMLResponse]").attr("value");

          // 5. Post SAMLResponse to Identity Provider SSO Endpoint
          cy.request({
            method: "POST",
            url: Cypress.env("samlIdpSsoUrl"),
            body: { SAMLResponse },
          }).then((idpResp) => {
            // Parse redirect for AuthState, used in identity provider programatic login (provider specific)
            const redirect = url.parse(idpResp.redirects[0].split(" ")[1], {
              parseQueryString: true,
            });

            // 6. Programmatically Authenticate with Identity Provider (store cookies) (provider specific)
            cy.request({
              method: "POST",
              url: `${redirect.host}${redirect.pathname}?`,
              form: true,
              body: {
                username: Cypress.env("idpAuthUsername"),
                password: Cypress.env("idpAuthPassword"),
                // @ts-ignore
                ...redirect.query,
              },
            }).then((idpResp) => {
              cy.log("AUTHENTICATED: Identity Provider");
              cy.storeAllCookies();

              // Parse SAMLResponse from HTML returned by Identity Provider
              const $html = Cypress.$(idpResp.body);
              const SAMLResponse = $html.find("form input[name=SAMLResponse]").attr("value");

              // 7. Post SAMLResponse to Service Provider Callback
              cy.request({
                method: "POST",
                url: Cypress.env("samlSpLoginCallbackUrl"),
                body: { SAMLResponse },
              }).then((respB) => {
                cy.log("Logged into Service Provider (Application)");
                cy.log(respB);
                log.end();
              });
            });
          });
        });
      });
    });
  });
});

const serviceProviderInit = () => {
  return cy.request({ url: Cypress.env("samlSpLoginUrl"), log: false });
};

const authenticateWithOktaAuthn = () => {
  // 2. Programmatically authenticate with Okta Authn (store cookies)
  return cy
    .request({
      method: "POST",
      url: Cypress.env("samlOktaAuthn"),
      body: {
        username: Cypress.env("oktaAuthUsername"),
        password: Cypress.env("oktaAuthPassword"),
      },
      log: false,
    })
    .its("body.sessionToken", { log: false });
};

const createOktaSession = (sessionToken: string) => {
  // 3. Create Okta Session with sessionToken
  // https://developer.okta.com/docs/reference/api/sessions/#create-session-with-session-token
  return cy
    .request({
      method: "POST",
      url: Cypress.env("samlOktaSessionsApi"),
      body: {
        sessionToken,
      },
      log: false,
    })
    .its("body.cookieToken", { log: false });
};

const getOktaSamlResponse = (cookieToken: string) => {
  // 4. Visit Okta RWA App with "onetimetoken" parameter with cookieToken to obtain SAMLResponse for Identity Provider
  return cy
    .request({
      method: "GET",
      url: Cypress.env("samlOktaApp"),
      qs: { onetimetoken: cookieToken },
      log: false,
    })
    .then((samlResp) => {
      // Parse SAMLResponse from HTML returned by Okta
      const $html = Cypress.$(samlResp);
      const SAMLResponse = $html.find("form input[name=SAMLResponse]").attr("value");
      return SAMLResponse;
    });
};

const getIdentityProviderRedirect = (SAMLResponse: any) => {
  // 5. Post SAMLResponse to Identity Provider SSO Endpoint
  return cy
    .request({
      method: "POST",
      url: Cypress.env("samlIdpSsoUrl"),
      body: { SAMLResponse },
      log: false,
    })
    .then((idpResp) => {
      // Parse redirect for AuthState, used in identity provider programatic login (provider specific)
      // @ts-ignore
      const redirect = url.parse(idpResp.redirects[0].split(" ")[1], {
        parseQueryString: true,
      });
      return redirect;
    });
};

const authenticateWithIdentityProvider = (redirect: any) => {
  // 6. Programmatically Authenticate with Identity Provider (store cookies) (provider specific)
  return cy
    .request({
      method: "POST",
      url: `${redirect.host}${redirect.pathname}?`,
      form: true,
      body: {
        username: Cypress.env("idpAuthUsername"),
        password: Cypress.env("idpAuthPassword"),
        // @ts-ignore
        ...redirect.query,
      },
      log: false,
    })
    .then((idpResp) => {
      // Parse SAMLResponse from HTML returned by Identity Provider
      const $html = Cypress.$(idpResp.body);
      const SAMLResponse = $html.find("input[name=SAMLResponse]").attr("value");
      return SAMLResponse;
    });
};

const postServiceProviderCallback = (SAMLResponse: any) => {
  // 7. Post SAMLResponse to Service Provider Callback
  cy.request({
    method: "POST",
    url: Cypress.env("samlSpLoginCallbackUrl"),
    body: { SAMLResponse },
    log: false,
  });
};

Cypress.Commands.add("loginBySamlApi", () => {
  cy.clearCookies({ domain: null, log: false });

  const log = Cypress.log({
    name: "loginBySaml",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${Cypress.env("oktaAuthUsername")}`],
    // @ts-ignore
    autoEnd: false,
  });

  // Service Provider Initiated Flow
  // 1. Visit Service Provider (follow redirects)
  // 2. Programmatically authenticate with Okta Authn endpoint (store cookies)
  // 3. Create Okta Session with sessionToken
  // 4. Visit Okta RWA App with "onetimetoken" parameter with cookieToken to obtain SAMLResponse for Identity Provider
  // 5. Post SAMLResponse to Identity Provider SSO Endpoint
  // 6. Programmatically Authenticate with Identity Provider (store cookies) (provider specific)
  // 7. Post SAMLResponse to Service Provider Callback
  return serviceProviderInit()
    .then(authenticateWithOktaAuthn)
    .then(createOktaSession)
    .then(getOktaSamlResponse)
    .then(getIdentityProviderRedirect)
    .then(authenticateWithIdentityProvider)
    .then(postServiceProviderCallback)
    .then(() => log.end());
});
