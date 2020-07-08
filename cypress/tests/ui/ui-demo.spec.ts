import Dinero from "dinero.js";
import { User, Transaction } from "../../../src/models";
import { isMobile } from "../../support/utils";

type NewTransactionTestCtx = {
  allUsers?: User[];
  user?: User;
  contact?: User;
};

type NewTransactionCtx = {
  transactionRequest?: Transaction;
  authenticatedUser?: User;
};

describe("User Sign-up and Login", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("POST", "/users").as("signup");
    cy.route("POST", "/bankAccounts").as("createBankAccount");
  });

  it("should redirect unauthenticated user to signin page", function () {
    cy.visit("/personal");
    cy.location("pathname").should("equal", "/signin");
  });

  it("should allow a visitor to sign-up, login, and logout", function () {
    const userInfo = {
      firstName: "Bob",
      lastName: "Ross",
      username: "PainterJoy90",
      password: "s3cret",
    };

    // Sign-up User
    cy.visit("/");

    cy.toast("Sign-up User", {
      duration: 5000,
      blocking: false,
    });

    cy.getBySel("signup").click();

    cy.getBySel("signup-first-name").type(userInfo.firstName);
    cy.getBySel("signup-last-name").type(userInfo.lastName);
    cy.getBySel("signup-username").type(userInfo.username);
    cy.getBySel("signup-password").type(userInfo.password);
    cy.getBySel("signup-confirmPassword").type(userInfo.password);
    cy.getBySel("signup-submit").click();
    cy.wait("@signup");

    // Login User
    cy.toast("Login User", {
      duration: 2000,
      blocking: false,
    });

    cy.login(userInfo.username, userInfo.password);

    // Onboarding
    cy.getBySel("user-onboarding-dialog").should("be.visible");

    cy.toast("Onboarding & Create Bank Account", {
      duration: 5000,
      blocking: false,
    });

    cy.getBySel("user-onboarding-next").click();

    cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");

    cy.getBySelLike("bankName-input").type("The Best Bank");
    cy.getBySelLike("accountNumber-input").type("123456789");
    cy.getBySelLike("routingNumber-input").type("987654321");
    cy.getBySelLike("submit").click();

    cy.wait("@createBankAccount");

    cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
    cy.getBySel("user-onboarding-next").click();

    cy.getBySel("transaction-list").should("be.visible");

    // Logout User
    cy.toast("Logout User", {
      duration: 2000,
      blocking: true,
    });
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-signout").click();
    cy.location("pathname").should("eq", "/signin");
  });
});

describe("New Transaction", function () {
  const ctx: NewTransactionTestCtx = {};

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("POST", "/transactions").as("createTransaction");

    cy.route("GET", "/users").as("allUsers");
    cy.route("GET", "/notifications").as("notifications");
    cy.route("GET", "/transactions/public").as("publicTransactions");
    cy.route("GET", "/transactions").as("personalTransactions");
    cy.route("GET", "/users/search*").as("usersSearch");
    cy.route("PATCH", "/transactions/*").as("updateTransaction");

    cy.database("filter", "users").then((users: User[]) => {
      ctx.allUsers = users;
      ctx.user = users[0];
      ctx.contact = users[1];

      return cy.loginByXstate(ctx.user.username);
    });
  });

  it("navigates to the new transaction form, selects a user and submits a transaction payment", function () {
    const payment = {
      amount: "35",
      description: "Sushi dinner 🍣",
    };

    cy.getBySelLike("new-transaction").click();
    cy.wait("@allUsers");

    cy.toast("Submits New Transaction Payment", {
      duration: 5000,
      blocking: false,
    });

    cy.getBySel("user-list-search-input").type(ctx.contact!.firstName, { force: true });
    cy.wait("@usersSearch");

    cy.getBySelLike("user-list-item").contains(ctx.contact!.firstName).click({ force: true });

    cy.getBySelLike("amount-input").type(payment.amount);
    cy.getBySelLike("description-input").type(payment.description);
    cy.getBySelLike("submit-payment").click();
    cy.wait(["@createTransaction", "@getUserProfile"]);
    cy.getBySel("alert-bar-success")
      .should("be.visible")
      .and("have.text", "Transaction Submitted!");

    const updatedAccountBalance = Dinero({
      amount: ctx.user!.balance - parseInt(payment.amount) * 100,
    }).toFormat();

    cy.toast("Confirm Transaction History", {
      duration: 3000,
      blocking: false,
    });

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }

    cy.getBySelLike("user-balance").should("contain", updatedAccountBalance);

    if (isMobile()) {
      cy.get(".MuiBackdrop-root").click({ force: true });
    }

    cy.getBySelLike("create-another-transaction").click();
    cy.getBySel("app-name-logo").find("a").click();
    cy.getBySelLike("personal-tab").click().should("have.class", "Mui-selected");
    cy.wait("@personalTransactions");

    cy.getBySel("transaction-list").first().should("contain", payment.description);

    cy.database("find", "users", { id: ctx.contact!.id })
      .its("balance")
      .should("equal", ctx.contact!.balance + parseInt(payment.amount) * 100);
  });
});

describe("Transaction View", function () {
  const ctx: NewTransactionCtx = {};

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("GET", "/transactions").as("personalTransactions");
    cy.route("GET", "/transactions/public").as("publicTransactions");
    cy.route("GET", "/transactions/*").as("getTransaction");
    cy.route("PATCH", "/transactions/*").as("updateTransaction");

    cy.route("GET", "/checkAuth").as("userProfile");
    cy.route("GET", "/notifications").as("getNotifications");
    cy.route("GET", "/bankAccounts").as("getBankAccounts");

    cy.database("find", "users").then((user: User) => {
      ctx.authenticatedUser = user;

      cy.loginByXstate(ctx.authenticatedUser.username);

      cy.database("find", "transactions", {
        receiverId: ctx.authenticatedUser.id,
        status: "pending",
        requestStatus: "pending",
        requestResolvedAt: "",
      }).then((transaction: Transaction) => {
        ctx.transactionRequest = transaction;
      });
    });

    cy.getBySel("nav-personal-tab").click();
    cy.wait("@personalTransactions");
  });

  it("comments on a transaction", function () {
    cy.getBySelLike("transaction-item").first().click({ force: true });
    cy.wait("@getTransaction");

    cy.toast("React to Transactions", {
      duration: 5000,
      blocking: false,
    });

    const comments = ["Thank you!", "Appreciate it."];

    comments.forEach((comment, index) => {
      cy.getBySelLike("comment-input").type(`${comment}{enter}`);
      cy.getBySelLike("comments-list").children().eq(index).contains(comment);
    });

    cy.getBySelLike("comments-list").children().should("have.length", comments.length);
  });
});
