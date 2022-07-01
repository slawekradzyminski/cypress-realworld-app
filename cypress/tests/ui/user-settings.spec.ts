import { User } from "../../../src/models";
import Sidebar, { Settings } from "../../components/Sidebar";
import UserSettingsPage from "../../pages/UserSettingsPage";
import { isMobile } from "../../support/utils";

const sidebar = new Sidebar();
const userSettingsPage = new UserSettingsPage();

describe("User Settings", () => {
  beforeEach(() => {
    cy.task("db:seed");

    cy.intercept("PATCH", "/users/*").as("updateUser");
    cy.intercept("GET", "/notifications*").as("getNotifications");

    cy.database("find", "users").then((user: User) => {
      cy.loginByXstate(user.username);
    });

    sidebar.click(Settings.myAccount);
  });

  it("renders the user settings form", () => {
    // when
    cy.wait("@getNotifications");

    // then
    cy.getBySel("user-settings-form").should("be.visible");
    cy.url().should("contain", "/user/settings");
    cy.visualSnapshot("User Settings Form");
  });

  it("should display user setting form errors", () => {
    // when
    userSettingsPage.triggerFrontEndValidationForFirstName();
    userSettingsPage.triggerFrontEndValidationForLastName();
    userSettingsPage.triggerFrontEndValidationForEmail();
    userSettingsPage.triggerFrontEndValidationForPhoneNumber();

    // then
    cy.getBySelLike("submit").should("be.disabled");
    cy.visualSnapshot("User Settings Form Errors and Submit Disabled");
  });

  it.only("updates first name, last name, email and phone number", () => {
    // when
    userSettingsPage.updateUserDetails();

    // then
    cy.getBySelLike("submit").should("not.be.disabled");
    cy.getBySelLike("submit").click();
    cy.wait("@updateUser").its("response.statusCode").should("equal", 204);

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }

    cy.getBySel("sidenav-user-full-name").should("contain", "New First Name");
    cy.visualSnapshot("User Settings Update Profile");
  });
});
