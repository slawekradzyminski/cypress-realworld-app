const apiGraphQL = `${Cypress.env("apiUrl")}/graphql`;

describe("cy.within examples", () => {
  it("standard usage", () => {
    cy.visit("/");

    const userInfo = {
      username: "PainterJoy90",
      password: "s3cret",
    };

    cy.get("form").within({ log: true }, (form) => {
      expect(form.get()).to.have.length(1);
      cy.getBySel("signin-username").type(userInfo.username);
      cy.getBySel("signin-password").type(userInfo.password);
    });
  });

  it("with options {log: false} ", () => {
    cy.visit("/");

    const userInfo = {
      username: "PainterJoy90",
      password: "s3cret",
    };

    cy.get("form").within({ log: false }, (form) => {
      expect(form.get()).to.have.length(1);
      cy.getBySel("signin-username").type(userInfo.username);
      cy.getBySel("signin-password").type(userInfo.password);
      cy.getBySel("signin-submit").contains("Sign In");
    });
  });

  it("with nested .within() and with chaining", () => {
    cy.visit("/");

    cy.get("form").within({ log: true }, () => {
        cy.getBySel("signin-submit").within(() => {
          cy.get("span").contains("Sign In");
        });
      })
      .should("contain", "Sign In");
    cy.log("log after all");
  });

  it("with empty callback", () => {
    cy.visit("/");
    cy.get("form").within(() => {});
    cy.url();
  });
});

describe.skip("Sessions", { retries: 0 }, function () {
  const userInfo = {
    firstName: "Bob",
    lastName: "Ross",
    username: "PainterJoy90",
    password: "s3cret",
  };

  before(function () {
    Cypress.session.clearAllSavedSessions();
    cy.task("db:seed");

    cy.intercept("POST", "/users").as("signup");
    cy.intercept("POST", apiGraphQL, (req) => {
      const { body } = req;

      if (body.hasOwnProperty("operationName") && body.operationName === "CreateBankAccount") {
        req.alias = "gqlCreateBankAccountMutation";
      }
    });
  });

  it("should allow a visitor to sign-up and onboard", function () {
    // Sign-up User
    // cy.visit("/");

    // cy.getBySel("signup").click('topRight')
    // //  { force: true });
    // cy.getBySel("signup-title").should("be.visible").and("contain", "Sign Up");

    // cy.get("form").within((form) => {
    //   expect(form.get()).to.have.length(1);
    //   cy.getBySel("signup-first-name").type(userInfo.firstName);
    //   cy.getBySel("signup-last-name").type(userInfo.lastName);
    //   cy.getBySel("signup-username").type(userInfo.username);
    //   cy.getBySel("signup-password").type(userInfo.password);
    //   cy.getBySel("signup-confirmPassword").type(userInfo.password);
    // });

    // cy.getBySel("signup-submit").click();
    // cy.wait("@signup");

    cy.login(userInfo.username, userInfo.password, { useSession: true });
    cy.visit("/");

    // // Onboarding
    // cy.group("Verify Onboarding Flow", () => {
    //   cy.getBySel("user-onboarding-dialog").should("be.visible");
    //   cy.getBySel("list-skeleton").should("not.exist");
    //   cy.getBySel("nav-top-notifications-count").should("exist");
    //   cy.getBySel("user-onboarding-next").click();

    //   cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");

    //   cy.getBySelLike("bankName-input").type("The Best Bank");
    //   cy.getBySelLike("accountNumber-input").type("123456789");
    //   cy.getBySelLike("routingNumber-input").type("987654321");
    //   cy.visualSnapshot("About to complete User Onboarding");
    //   cy.getBySelLike("submit").click();

    //   cy.wait("@gqlCreateBankAccountMutation");

    //   cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    //   cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
    // });

    cy.getBySel("user-onboarding-next").click();
  });

  it("expect saved session", () => {
    cy.login(userInfo.username, userInfo.password, { useSession: true });
    cy.visit("/");
    cy.get('[data-test="sidenav-username"]').should("contain", userInfo.username);
  });
});
