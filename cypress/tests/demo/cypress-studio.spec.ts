import { User } from "models";

describe("Cypress Studio Demo", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.database("find", "users").then((user: User) => {
      cy.loginByUi(user.username, "s3cret", true);
    });
  });
  it("create new transaction", function () {
    // Extend test with Cypress Studio
  });
  it("create new bank account", function () {
    // Extend test with Cypress Studio
  });
});
