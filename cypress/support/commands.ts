// @ts-check
///<reference path="../global.d.ts" />

import jwt_decode from "jwt-decode";
import { WebAuth } from "auth0-js";
import createAuth0Client from "@auth0/auth0-spa-js";
import { pick } from "lodash/fp";
import { format as formatDate } from "date-fns";

const auth = new WebAuth({
  domain: Cypress.env("auth0_domain"),
  clientID: Cypress.env("auth0_clientID"),
});

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
  cy.wait("@loginUser").then((loginUser) => {
    log.set({
      consoleProps() {
        return {
          username,
          password,
          rememberUser,
          // @ts-ignore
          userId: loginUser.response.body.user.id,
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
  return cy.loginByXstate(username);
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

  const selectDate = (date) => {
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

// @ts-ignore
Cypress.Commands.add("loginByAuth0", (username, password) => {
  Cypress.log({
    name: "loginByAuth0",
    displayName: "LOGIN BY AUTH0",
    message: [`🔒 Login as ${username}`],
  });

  cy.wrap(
    new Cypress.Promise((resolve, reject) => {
      auth.client.login(
        {
          realm: "Username-Password-Authentication",
          username,
          password,
          scope: Cypress.env("auth0_scope"),
          audience: Cypress.env("auth0_audience"),
          // @ts-ignore
          client_secret: Cypress.env("auth0_clientSecret"),
        },
        (err, response) => {
          if (err) {
            return reject(new Error(err.description));
          }

          resolve(response);
        }
      );
    })
  ).then((response: any) => {
    return new Cypress.Promise((resolve, reject) => {
      auth.client.userInfo(response.accessToken, (err, user) => {
        if (err) {
          return reject(err);
        }

        resolve(user);
      });
    }).then((profile: any) => {
      // Send user to backend to be set on session
      cy.request("POST", "http://localhost:3001/testData/setUserOnSession", {
        profile,
      });
    });
  });
});

Cypress.Commands.add("logoutByAuth0", (returnTo) => {
  const logoutUrl = auth.client.buildLogoutUrl({
    clientID: Cypress.env("auth0_clientID"),
  });

  cy.request(logoutUrl).then(() => {
    cy.request("POST", "http://localhost:3001/logout");
  });
});

// @ts-ignore
Cypress.Commands.add("loginByAuth0v2", (username, password) => {
  Cypress.log({
    name: "loginByAuth0",
    displayName: "LOGIN BY AUTH0",
    message: [`🔒 Login as ${username}`],
  });

  cy.wrap(
    new Cypress.Promise((resolve, reject) => {
      auth.client.login(
        {
          realm: "Username-Password-Authentication",
          username,
          password,
          scope: Cypress.env("auth0_scope"),
          audience: Cypress.env("auth0_audience"),
          // @ts-ignore
          client_secret: Cypress.env("auth0_clientSecret"),
        },
        (err, response) => {
          if (err) {
            return reject(new Error(err.description));
          }

          resolve(response);
        }
      );
    })
  ).then((response: any) => {
    localStorage.setItem("accessToken", response.accessToken);
    return new Cypress.Promise((resolve, reject) => {
      auth.client.userInfo(response.accessToken, (err, user) => {
        if (err) {
          return reject(err);
        }

        resolve(user);
      });
    }).then((user: any) => {
      localStorage.setItem("user", JSON.stringify(user));
    });
  });
});

Cypress.Commands.add("loginByAuth0v3", (username, password) => {
  Cypress.log({
    name: "loginByAuth0",
    displayName: "LOGIN BY AUTH0",
    message: [`🔒 Login as ${username}`],
  });

  createAuth0Client({
    domain: Cypress.env("auth0_domain"),
    client_id: Cypress.env("auth0_clientID"),
    redirect_uri: "http://localhost:3000",
    cacheLocation: "localstorage",
  }).then((auth0: any) => {
    console.log("auth0: ", auth0);

    auth0.buildAuthorizeUrl().then((url: any) => {
      const client_id = Cypress.env("auth0_clientID");
      const client_secret = Cypress.env("auth0_clientSecret");
      const audience = Cypress.env("auth_audience");
      const scope = "openid profile email";

      console.log("URL: ", url);

      const options = {
        method: "POST",
        url,
        body: {
          grant_type: "password",
          username,
          password,
          audience,
          scope,
          client_id,
          client_secret,
        },
      };

      cy.request(options).then(({ body }) => {
        const { accessToken, idToken } = body;
        const user = jwt_decode(idToken);
        window.localStorage.setItem("accessToken", accessToken);
        window.localStorage.setItem("user", user);
      });
    });
    //localStorage.setItem("accessToken", auth0.accessToken);
  });
});

Cypress.Commands.add("loginByAuth0v4", (username: string, password: string) => {
  Cypress.log({
    name: "loginViaAuth0 v4",
  });

  const options = {
    method: "POST",
    url: `https://${Cypress.env("auth0_domain")}/oauth/token`,
    body: {
      grant_type: "password",
      username,
      password,
      audience: Cypress.env("auth0_audience"),
      scope: "openid profile email",
      client_id: Cypress.env("auth0_clientID"),
      client_secret: Cypress.env("auth0_clientSecret"),
    },
  };
  cy.request(options).then((body: any) => {
    const { access_token, expires_in, id_token } = body;
    const auth0State = {
      nonce: "",
      state: "some-random-state",
    };
    const callbackUrl = `/callback#access_token=${access_token}&scope=openid&id_token=${id_token}&expires_in=${expires_in}&token_type=Bearer&state=${auth0State.state}`;
    cy.visit(callbackUrl, {
      onBeforeLoad(win) {
        win.document.cookie = "com.auth0.auth.some-random-state=" + JSON.stringify(auth0State);
      },
    });
  });
});

Cypress.Commands.add("loginByAuth0Node", (username: string, password: string) => {
  cy.log(`Logging in as ${username}`);
  const client_id = Cypress.env("auth0_clientID");
  const client_secret = Cypress.env("auth0_clientSecret");
  const audience = Cypress.env("auth_audience");
  const scope = "openid profile email";

  const options = {
    method: "POST",
    url: `https://${Cypress.env("auth0_domain")}/authorize`,
    body: {
      grant_type: "password",
      username,
      password,
      audience,
      scope,
      client_id,
      client_secret,
    },
  };

  cy.request(options).then(({ body }) => {
    const { accessToken, idToken } = body;
    const user = jwt_decode(idToken);
    window.localStorage.setItem("accessToken", accessToken);
    window.localStorage.setItem("user", user);
  });
});

Cypress.Commands.add("loginByAuth0Spa", (username: string, password: string) => {
  cy.log(`Logging in as ${username}`);
  const client_id = Cypress.env("auth0_clientID");
  const client_secret = Cypress.env("auth0_clientSecret");
  const audience = Cypress.env("auth_audience");
  const scope = "openid profile email";

  const options = {
    method: "POST",
    url: Cypress.env("auth0_domain"),
    body: {
      grant_type: "password",
      username,
      password,
      audience,
      scope,
      client_id,
      client_secret,
    },
  };
  cy.request(options).then(({ body }) => {
    const { access_token, expires_in, id_token } = body;
    const key = `@@auth0spajs@@::${client_id}::${audience}::${scope}`;
    const auth0Cache = {
      body: {
        client_id,
        access_token,
        id_token,
        scope,
        expires_in,
        decodedToken: {
          user: jwt_decode(id_token),
        },
      },
      expiresAt: Math.floor(Date.now() / 1000) + expires_in,
    };
    window.localStorage.setItem(key, JSON.stringify(auth0Cache));
  });
});
