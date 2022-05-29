import { User } from "../../../src/models";
import AccountSettings from "../../pages/AccountSettings";
import { isMobile } from "../../support/utils";

const accountSettingsPage = new AccountSettings();

const openAccountSettings = () => {
  if (isMobile()) {
    cy.getBySel("sidenav-toggle").click();
  }

  cy.getBySel("sidenav-user-settings").click();
};

describe("User Settings", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.intercept("PATCH", "/users/*").as("updateUser");
    cy.intercept("GET", "/notifications*").as("getNotifications");

    cy.database("find", "users").then((user: User) => {
      cy.loginByXstate(user.username);
    });
    openAccountSettings();
  });

  it("renders the user settings form", function () {
    // when
    cy.wait("@getNotifications");

    // then
    cy.getBySel("user-settings-form").should("be.visible");
    cy.location("pathname").should("include", "/user/settings");
    cy.visualSnapshot("User Settings Form");
  });

  it("should display user setting form errors", function () {
    // when
    accountSettingsPage.verifyFirstName();
    accountSettingsPage.verifyLastName();
    accountSettingsPage.verifyEmail();
    accountSettingsPage.verifyPhoneNumber();

    // then
    cy.getBySelLike("submit").should("be.disabled");
    cy.visualSnapshot("User Settings Form Errors and Submit Disabled");
  });

  it("updates first name, last name, email and phone number", function () {
    // when
    accountSettingsPage.updateUserDetails();

    // then
    cy.wait("@updateUser").its("response.statusCode").should("equal", 204);
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-user-full-name").should("contain", "New First Name");
    cy.visualSnapshot("User Settings Update Profile");
  });
});
