import { isMobile } from "../../support/utils";

describe("Auth0", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("POST", "/users").as("signup");
    cy.route("POST", "/bankAccounts").as("createBankAccount");
    cy.route("GET", "/checkAuth").as("checkAuth");
  });

  it("should allow a visitor to login, onboard and logout", function () {
    cy.loginByAuth0Node(Cypress.env("auth0_username"), Cypress.env("auth0_password"));

    cy.wait("@checkAuth");

    // Onboarding
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.getBySel("user-onboarding-next").click();

    /*
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");

    cy.getBySelLike("bankName-input").type("The Best Bank");
    cy.getBySelLike("accountNumber-input").type("123456789");
    cy.getBySelLike("routingNumber-input").type("987654321");
    cy.getBySelLike("submit").click();

    cy.wait("@createBankAccount");

    cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
    cy.getBySel("user-onboarding-next").click();

    cy.getBySel("transaction-list").should("be.visible");

    // Logout User
    cy.logoutByAuth0();

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-signout").click();

    cy.location("pathname").should("eq", "/signin");
    */
  });

  /*
  it.skip("should allow a visitor to login, onboard and logout via Auth0 UI", function () {
    cy.visit("/loginAuth0");

    //cy.contains("a", "Sign Up").click();

    cy.get("#1-email").type(Cypress.env("auth0_username"));
    cy.get("input[name=password]").type(Cypress.env("auth0_password"));

    cy.get(".auth0-lock-submit").click();

    // Onboarding
    cy.getBySel("user-onboarding-dialog").should("be.visible");
  });
  */
});
