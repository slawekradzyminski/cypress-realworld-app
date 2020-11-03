// @ts-check
///<reference path="../global.d.ts" />

import url from "url";
import { pick, filter } from "lodash/fp";
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
const idpUrl = "http://localhost:8080/simplesaml/saml2/idp/SSOService.php?spentityid=saml-poc";
const authN = "https://dev-483770.okta.com/api/v1/authn";

Cypress.Commands.add("loginBySamlApi", (username, password) => {
  cy.clearCookies({ domain: null });
  const log = Cypress.log({
    name: "loginBySaml",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${username}`],
    // @ts-ignore
    autoEnd: false,
  });

  const serviceProviderUrl = "http://localhost:3000/loginSaml";
  // Visit Service Provider (Node + passport + passport-saml)
  cy.request({ url: serviceProviderUrl }).then((resp) => {
    cy.log(resp);
  });

  /*
  cy.request({ url: serviceProviderUrl, followRedirect: false }).then((resp) => {
    cy.log(resp);
    const samlRequestUrl = resp.redirectedToUrl;
  });
  */

  /*
  cy.request("POST", authN, {
    username: "kevinold@gmail.com",
    password: "S3cret1234$$",
    //stateToken: "00BClWr4T-mnIqPV8dHkOQlwEIXxB4LLSfBVt7BxsM",
  }).then((authN) => {
    cy.getCookies({ domain: null }).then((cookies) => {
      console.log("all cookies: ", cookies);
      cookies.forEach((cookie) => {
        cy.setCookie(cookie.name, cookie.value, cookie);
      });
    });
  });
  */
});

//
//
//
Cypress.Commands.add("loginBySamlApiFull", (username, password) => {
  cy.clearCookies({ domain: null });
  const log = Cypress.log({
    name: "loginBySaml",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${username}`],
    // @ts-ignore
    autoEnd: false,
  });

  const serviceProviderUrl = "http://localhost:3000/loginSaml";
  const idpUrl = "http://localhost:8080/simplesaml/saml2/idp/SSOService.php?spentityid=saml-poc";

  cy.request(serviceProviderUrl).then((resp) => {
    //cy.log(resp);
    const redirect = url.parse(resp.redirects[0].split(" ")[1], { parseQueryString: true });
    cy.log(redirect);

    cy.log(redirect.query);
    cy.request({
      method: "POST",
      url: `${redirect.host}${redirect.pathname}`,
      form: true,
      body: {
        username: "kevinold@gmail.com",
        password: "secret123",
        // @ts-ignore
        ...redirect.query,
      },
    }).then((respA) => {
      cy.log("AUTHENTICATED");
      cy.getCookies({ domain: null }).then((cookies) => {
        console.log("first: ", cookies);
        cookies.forEach((cookie) => {
          cy.setCookie(cookie.name, cookie.value, cookie);
        });
        /*const cookiesToKeep = filter((o) => {
          return o.name === "PHPSESSIDIDP";
        }, cookies);
        console.log("first keep: ", cookiesToKeep);*/
      });
      cy.log(respA);
      // GET to serviceProviderUrl
      cy.request(serviceProviderUrl).then((resp) => {
        // Login to Okta via authn
        // POST https://dev-483770.okta.com/api/v1/authn
        const authN = "https://dev-483770.okta.com/api/v1/authn";
        cy.request("POST", authN, {
          username: "kevinold@gmail.com",
          password: "Secret123$",
        }).then((authN) => {
          cy.getCookies({ domain: null }).then((cookies) => {
            console.log("second: ", cookies);
            cookies.forEach((cookie) => {
              cy.setCookie(cookie.name, cookie.value, cookie);
            });
          });
          // Should be redirected to idP from Okta
          cy.request(serviceProviderUrl).then((idpResp) => {
            console.log(idpResp);
            cy.getCookies({ domain: null }).then((cookies) => {
              console.log("all: ", cookies);
            });
            cy.visit("/");
          });
        });
      });
    });
  });

  log.snapshot();
  log.end();
});

Cypress.Commands.add("loginBySamlApiOld", (username, password) => {
  const log = Cypress.log({
    name: "loginBySaml",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${username}`],
    // @ts-ignore
    autoEnd: false,
  });

  const idpUrl = "http://localhost:8080/simplesaml/saml2/idp/SSOService.php?spentityid=saml-poc";

  cy.request(idpUrl).then((resp) => {
    //cy.log(resp);
    const redirect = url.parse(resp.redirects[0].split(" ")[1], { parseQueryString: true });
    cy.log(redirect);

    cy.log(redirect.query);
    cy.request({
      method: "POST",
      url: `${redirect.host}${redirect.pathname}`,
      form: true,
      body: {
        username,
        password,
        // @ts-ignore
        ...redirect.query,
      },
    }).then((respA) => {
      cy.log("AUTHENTICATED");
      cy.log(respA);

      /*cy.request("http://localhost:3000/loginSaml").then((resp) => {
          cy.log(resp);
          const redirect = url.parse(resp.redirects[0].split(" ")[1], { parseQueryString: true });
          cy.log(redirect);
          cy.request(redirect.href).then((respRedirect) => {
            cy.log(respRedirect);
            //cy.request("http://localhost:3000/checkAuth").then((respAuth) => {
            //  cy.log(respAuth);
            //});
          });
        });*/
      //cy.window({ log: false }).then((win) => win.authService.send("SAML", { user: re }));

      log.snapshot();
      log.end();
      cy.visit("/");
    });
  });
});
