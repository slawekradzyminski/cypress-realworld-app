import { User } from "../../../src/models";
import BankAccountsPage from "../../pages/BankAccounts";
import { isMobile } from "../../support/utils";

const apiGraphQL = `${Cypress.env("apiUrl")}/graphql`;
const bankAccounts = "/bankaccounts";

type BankAccountsTestCtx = {
  user?: User;
};

const bankAccountPage = new BankAccountsPage();

describe("Bank Accounts", () => {
  const ctx: BankAccountsTestCtx = {};

  beforeEach(() => {
    cy.task("db:seed");
    cy.intercept("GET", "/notifications").as("getNotifications");

    cy.intercept("POST", apiGraphQL, (req) => {
      const { body } = req;

      if (body.hasOwnProperty("operationName") && body.operationName === "ListBankAccount") {
        req.alias = "gqlListBankAccountQuery";
      }

      if (body.hasOwnProperty("operationName") && body.operationName === "CreateBankAccount") {
        req.alias = "gqlCreateBankAccountMutation";
      }

      if (body.hasOwnProperty("operationName") && body.operationName === "DeleteBankAccount") {
        req.alias = "gqlDeleteBankAccountMutation";
      }
    });

    cy.database("find", "users").then((user: User) => {
      ctx.user = user;

      return cy.loginByXstate(ctx.user.username);
    });
  });

  it("creates a new bank account", () => {
    cy.wait("@getNotifications");
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }

    cy.getBySel("sidenav-bankaccounts").click();

    cy.getBySel("bankaccount-new").click();
    cy.location("pathname").should("eq", "/bankaccounts/new");
    cy.visualSnapshot("Display New Bank Account Form");

    cy.getBySelLike("bankName-input").type("The Best Bank");
    cy.getBySelLike("routingNumber-input").type("987654321");
    cy.getBySelLike("accountNumber-input").type("123456789");
    cy.visualSnapshot("Fill out New Bank Account Form");
    cy.getBySelLike("submit").click();

    cy.wait("@gqlCreateBankAccountMutation");

    cy.getBySelLike("bankaccount-list-item")
      .should("have.length", 2)
      .eq(1)
      .should("contain", "The Best Bank");
    cy.visualSnapshot("Bank Account Created");
  });

  it("should display bank account form errors - account number", () => {
    // when
    cy.visit(bankAccounts + "/new");

    // then
    bankAccountPage.verifyEmptyAccountNumberAlert();
    bankAccountPage.verifyTooShortAccountNumberAlert();
    bankAccountPage.verifyTooLongAccountNumberAlert();

    bankAccountPage.verifySumbitButtonDisabled();
  });

  it("should display bank account form errors - bank name", () => {
    // when
    cy.visit(bankAccounts + "/new");

    // then
    bankAccountPage.verifyEmptyBankNameAlert();
    bankAccountPage.verifyTooShortBankNameAlert();

    bankAccountPage.verifySumbitButtonDisabled();
  });

  it("should display bank account form errors - routing number", () => {
    // when
    cy.visit(bankAccounts + "/new");

    // then
    bankAccountPage.verifyEmptyRoutingNumberAlert();
    bankAccountPage.verifyInvalidRoutingNumberAlert();
    bankAccountPage.verifyTooShortRoutingNumberAlert();

    bankAccountPage.verifySumbitButtonDisabled();
    cy.visualSnapshot("Bank Account Form with Errors and Submit button disabled");
  });

  it("should open new bank account page", () => {
    // given
    cy.visit(bankAccounts);

    // when
    bankAccountPage.clickCreate();

    // then
  });

  it("soft deletes a bank account", () => {
    cy.visit(bankAccounts);
    cy.getBySelLike("delete").first().click();

    cy.wait("@gqlDeleteBankAccountMutation");
    cy.getBySelLike("list-item").children().contains("Deleted");
    cy.visualSnapshot("Soft Delete Bank Account");
  });

  // TODO: [enhancement] the onboarding modal assertion can be removed after adding "onboarded" flag to user profile
  it("renders an empty bank account list state with onboarding modal", () => {
    cy.wait("@getNotifications");
    cy.intercept("POST", apiGraphQL, (req) => {
      const { body } = req;
      if (body.hasOwnProperty("operationName") && body.operationName === "ListBankAccount") {
        req.alias = "gqlListBankAccountQuery";
        req.continue((res) => {
          res.body.data.listBankAccount = [];
        });
      }
    });

    cy.visit(bankAccounts);
    cy.wait("@getNotifications");
    cy.wait("@gqlListBankAccountQuery");

    cy.getBySel("bankaccount-list").should("not.exist");
    cy.getBySel("empty-list-header").should("contain", "No Bank Accounts");
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.getBySel("nav-top-notifications-count").should("exist");
    cy.visualSnapshot("User Onboarding Dialog is Visible");
  });
});
