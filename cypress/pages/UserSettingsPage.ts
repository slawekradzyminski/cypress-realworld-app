export default class UserSettingsPage {
  private emailInput = "email-input";

  triggerFrontEndValidationForEmail() {
    cy.getBySelLike(this.emailInput).type("abc").clear().blur();
    cy.get("#user-settings-email-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter an email address");

    cy.getBySelLike(this.emailInput).type("abc@bob.").blur();
    cy.get("#user-settings-email-input-helper-text")
      .should("be.visible")
      .and("contain", "Must contain a valid email address");
  }

  triggerFrontEndValidationForPhoneNumber() {
    cy.getBySelLike("phoneNumber-input").type("abc").clear().blur();
    cy.get("#user-settings-phoneNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Enter a phone number");

    cy.getBySelLike("phoneNumber-input").type("615-555-").blur();
    cy.get("#user-settings-phoneNumber-input-helper-text")
      .should("be.visible")
      .and("contain", "Phone number is not valid");
  }

  triggerFrontEndValidationForLastName() {
    cy.getBySelLike(`lastName-input`).type("Abc").clear().blur();
    cy.get(`#user-settings-lastName-input-helper-text`)
      .should("be.visible")
      .and("contain", `Enter a last name`);
  }

  triggerFrontEndValidationForFirstName() {
    cy.getBySelLike(`firstName-input`).type("Abc").clear().blur();
    cy.get(`#user-settings-firstName-input-helper-text`)
      .should("be.visible")
      .and("contain", `Enter a first name`);
  }

  updateUserDetails() {
    cy.getBySelLike("firstName").clear().type("New First Name");
    cy.getBySelLike("lastName").clear().type("New Last Name");
    cy.getBySelLike("email").clear().type("email@email.com");
    cy.getBySelLike("phoneNumber-input").clear().type("6155551212").blur();
  }
}
