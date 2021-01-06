import { User } from "models";

cy.defineSession({
  name: "myUser",
  steps() {
    cy.database("find", "users").then((user: User) => {
      cy.login(user.username, "s3cret", true);
    });
  },
});

cy.defineSession({
  name: "myUserByXstate",
  steps() {
    cy.database("find", "users").then((user: User) => {
      cy.loginByXstate(user.username);
    });
  },
});
