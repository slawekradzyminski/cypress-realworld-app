import { User } from "models";

/// <reference types="Cypress" />

describe("Cypress Test Runner Demo", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.database("find", "users").then((user: User) => {
      cy.login(user.username, "s3cret", true);
    });
  });
  it("create new transaction", function () {
    cy.get("[data-test=nav-top-new-transaction]").click();
    cy.get("[data-test=user-list-item-qywYp6hS0U]").click();
    cy.get("#amount").clear();
    cy.get("#amount").type("$100");
    cy.get("#transaction-create-description-input").clear();
    cy.get("#transaction-create-description-input").type("sushi");
    cy.get("[data-test=transaction-create-submit-payment]").click();
    cy.get("[data-test=new-transaction-return-to-transactions]").click();
    cy.contains("sushi");
  });
});
