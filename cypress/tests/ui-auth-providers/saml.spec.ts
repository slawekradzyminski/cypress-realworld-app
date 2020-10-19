import url from "url";
import qs from "qs";
import { isMobile } from "../../support/utils";

describe("User Sign-up and Login", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("POST", "/bankAccounts").as("createBankAccount");

    //cy.loginBySamlApi(Cypress.env("auth0_username"), Cypress.env("auth0_password"));
    cy.request(
      "http://localhost:8080/simplesaml/saml2/idp/SSOService.php?spentityid=saml-poc"
    ).then((resp) => {
      //cy.log(resp);
      const redirect = url.parse(resp.redirects[0].split(" ")[1], { parseQueryString: true });
      cy.log(redirect);

      cy.log(redirect.query);
      cy.request("POST", `${redirect.protocol}//${redirect.host}/${redirect.pathname}`, {
        username: "user1",
        password: "user1pass",
        // @ts-ignore
        ...redirect.query,
      }).then((resp) => {
        cy.log("AUTHENTICATED");
      });
    });
  });
  it("should allow a visitor to login, onboard and logout", function () {
    cy.contains("Get Started").should("be.visible");

    // Onboarding
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.getBySel("user-onboarding-next").click();

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
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-signout").click();

    cy.location("pathname").should("eq", "/");
  });

  it.skip("shows onboarding", function () {
    cy.contains("Get Started").should("be.visible");
  });
});
