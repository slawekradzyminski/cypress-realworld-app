import { User } from "models";

before(() => {
  const usernames = ["userA", "userB", "userC"];

  cy.database("filter", "users").then((users: User[]) => {
    usernames.forEach((username, index) => {
      cy.defineSession({
        name: username,
        steps() {
          cy.loginByXstate(users[index].username);
        },
      });
    });
  });
});
