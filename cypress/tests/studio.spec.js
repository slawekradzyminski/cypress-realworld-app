// studio.spec.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test
/* === Test Created with Cypress Studio === */
it('login', function() {
  /* ==== Generated with Cypress Studio ==== */
  cy.visit('http://localhost:3000/');
  cy.get('#username').clear();
  cy.get('#username').type('Katharina_Bernier');
  cy.get('#password').clear();
  cy.get('#password').type('s3cret');
  cy.get('.MuiFormControlLabel-root > .MuiTypography-root').click();
  cy.get('.PrivateSwitchBase-input-14').check();
  cy.get('[data-test=signin-submit]').click();
  /* ==== End Cypress Studio ==== */
});
