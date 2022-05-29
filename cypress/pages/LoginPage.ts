import { NewUser } from "../util/types";

export default class LoginPage {
  login(userInfo: NewUser) {
    cy.intercept("POST", "/login").as("loginUser");
    cy.getBySel("signin-username").type(userInfo.username);
    cy.getBySel("signin-password").type(userInfo.password);
    cy.getBySel("signin-submit").click();
    cy.wait("@loginUser");
  }
}
