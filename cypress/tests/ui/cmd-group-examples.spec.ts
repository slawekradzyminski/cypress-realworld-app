const apiGraphQL = `${Cypress.env("apiUrl")}/graphql`;

describe("cy.within examples", () => {
  const userInfo = {
    username: "PainterJoy90",
    password: "s3cret",
  };

  // basic example of .within might be used
  it("standard usage", () => {
    cy.visit("/");

    cy.get("form")
      .should("be.visible") // chained command - show chained command next to chained within for design comparison
      .within({ log: true }, () => {
        cy.get("[data-test=signin-username]").type(userInfo.username);
        cy.get("[data-test=signin-password]").type(userInfo.password);
        cy.get("[data-test=signin-submit]").contains("Sign In");
      });
  });

  // basic example of .within where an error occurred
  it("with failure in callback", () => {
    cy.visit("/");
    cy.get("form").within(() => {
      cy.get("span").contains("ERROR");
    });
  });

  it("standard usage with chained command off of .within", () => {
    cy.visit("/");

    cy.get("form")
      .within(() => {
        cy.get("[data-test=signin-username]").type(userInfo.username);
      })
      .should("contain", "Sign In");
    cy.log("log after all for visuals");
  });

  describe("when .within command log will appear empty", () => {
    it("with empty callback", () => {
      cy.visit("/");

      cy.get("form").within((form) => {
        console.log(form);
      });
    });

    // example where .within command log appears empty
    it("with commands in callback all have {log: false}", () => {
      cy.visit("/");

      cy.get("form").within(() => {
        cy.get("[data-test=signin-username]", { log: false }).type(userInfo.username, { log: false });
        cy.get("[data-test=signin-password]", { log: false }).type(userInfo.password, { log: false });
        cy.get("[data-test=signin-submit]", { log: false });
      });
    });

    it("with commands in callback all have {log: false} & error occurs", () => {
      cy.visit("/");

      cy.get("form").within(() => {
        cy.get("[data-test=signin-username]", { log: false }).type(userInfo.username, { log: false });
        cy.get("[data-test=signin-password]", { log: false }).type(userInfo.password, { log: false });
        cy.get("[data-test=signin-submit]", { log: false }).contains("ERROR", { log: false });
      });
    });
  });

  // .within command has logging disabled to hide log in Command Log
  //
  // usage ex: user implemented a custom command that was often used where they preferred to
  //    the logs were hidden because they clutter the console
  context("{log: false}", () => {
    // the commands in the callback are also disabled
    //
    // frequency: standard
    context("commands in callback are also disabled", () => {
      it("displays no log messages", () => {
        cy.visit("/");

        cy.get("form", { log: false })
          .should("be.visible") // chained command - show chained command next to chained within for design comparison
          .within({ log: false }, (form) => {
            cy.get("[data-test=signin-username]", { log: false }).type(userInfo.username, { log: false });
            cy.get("[data-test=signin-password]", { log: false }).type(userInfo.password, { log: false });
            cy.get("[data-test=signin-submit]", { log: false });
          });
        cy.log("Successfully logged in");
      });

      it("displays error message when error occurs", () => {
        cy.visit("/");

        cy.get("form", { log: false })
          .should("be.visible") // chained command - show chained command next to chained within for design comparison
          .within({ log: false }, (form) => {
            cy.get("[data-test=signin-username]", { log: false }).type(userInfo.username);
            cy.get("[data-test=signin-password]", { log: false }).type(userInfo.password);
            cy.get("[data-test=signin-submit]", { log: false }).contains("ERROR");
          });
        cy.log("Successfully logged in");
      });
    });

    // the sub-commands in the callback were not disabled
    //
    // frequency: edge-case/non-standard
    context("commands in callback were not disabled", () => {
      it("with options {log:false} & sub-commands have log true", () => {
        cy.visit("/");

        cy.get("form", { log: true })
          .should("be.visible") // chained command - show chained command next to chained within for design comparison
          .within({ log: false }, (form) => {
            expect(form.get()).to.have.length(1);
            cy.get("[data-test=signin-username]").type(userInfo.username);
            cy.get("[data-test=signin-password]").type(userInfo.password);
            cy.get("[data-test=signin-submit]").contains("Sign In");
          });
      });

      it("displays error message when error occurs", () => {
        cy.visit("/");

        cy.get("form", { log: true })
          .should("be.visible") // chained command - show chained command next to chained within for design comparison
          .within({ log: false }, (form) => {
            expect(form.get()).to.have.length(1);
            cy.get("[data-test=signin-username]").type(userInfo.username);
            cy.get("[data-test=signin-password]").type(userInfo.password);
            cy.get("[data-test=signin-submit]").contains("Error");
          });
      });
    });
  });

  describe("nesting", () => {
    it("with nested .within", () => {
      cy.visit("/");

      cy.get("form").within(() => {
        cy.get("[data-test=signin-submit]").within(() => {
          cy.get("span").contains("Sign In");
        });
      });
      cy.log("log after all for visiuals");
    });
  });
});

// These tests are using the custom login command to create the session.
//    see cypress/support/commands and ctrl + F 'login' to see implementation.
// The options passed are to force usage of session & the number of errors
// that occur during validation.
//
// NOTE: these tests are currently relying on the order they've been written.
//      Let me know if I need to update these so they are easier to work with.
describe("Sessions", { retries: 0 }, function () {
  // const userInfo = {
  //   firstName: "Bob",
  //   lastName: "Ross",
  //   username: "PainterJoy90",
  //   password: "s3cret",
  // };

  // const userInfo = {
  //   // username: "Allie2",
  //   // password: "$2a$10$5PXHGtcsckWtAprT5/JmluhR13f16BL8SIGhvAKNP.Dhxkt69FfzW",
  //   username: "Tavares_Barrows",
  //   password: "$2a$10$5PXHGtcsckWtAprT5/JmluhR13f16BL8SIGhvAKNP.Dhxkt69FfzW",
  // };
  let userInfo;

  before(function () {
    Cypress.session.clearAllSavedSessions();
    cy.task("db:seed");

    cy.database("find", "users").then((user) => {
      userInfo = {
        username: user.username,
        password: "s3cret",
      };
      // cy.login(user.username, "s3cret", { rememberUser: true });
    });
    cy.intercept("POST", "/users").as("signup");
    cy.intercept("POST", apiGraphQL, (req) => {
      const { body } = req;

      if (body.hasOwnProperty("operationName") && body.operationName === "CreateBankAccount") {
        req.alias = "gqlCreateBankAccountMutation";
      }
    });
  });

  it("new session - create new session & fails session validation", function () {

    cy.login(userInfo.username, userInfo.password, { useSession: true, failValidation: 1 });
    cy.visit("/");

    cy.get('[data-test="sidenav-username"]').should("contain", userInfo.username);
  });

  it("new session - create session successfully", function () {
    Cypress.session.clearAllSavedSessions();
    cy.login(userInfo.username, userInfo.password, { useSession: true, failValidation: 0 });
    cy.visit("/");

    cy.get('[data-test="sidenav-username"]').should("contain", userInfo.username);
  });

  it("saved session - restores successfully", () => {
    cy.login(userInfo.username, userInfo.password, { useSession: true, failValidation: 0 });
    cy.visit("/");
    cy.get('[data-test="sidenav-username"]').should("contain", userInfo.username);
  });

  it("saved session - fails session validation and re-creates session", () => {
    cy.login(userInfo.username, userInfo.password, { useSession: true, failValidation: 1 });
    cy.visit("/");
    cy.get('[data-test="sidenav-username"]').should("contain", userInfo.username);
  });

  it("saved session - fails session validation and re-creates session and fails validation again", () => {
    cy.login(userInfo.username, userInfo.password, { useSession: true, failValidation: 2 });
    cy.visit("/");
    cy.get('[data-test="sidenav-username"]').should("contain", userInfo.username);
  });
});
