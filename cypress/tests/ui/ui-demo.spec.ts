import { User, Transaction } from "../../../src/models";

const { _ } = Cypress;

// TYPES

type TransactionFeedsCtx = {
  allUsers?: User[];
  user?: User;
};

type NewTransactionTestCtx = {
  allUsers?: User[];
  user?: User;
  contact?: User;
};

type NewTransactionCtx = {
  transactionRequest?: Transaction;
  authenticatedUser?: User;
};

type NotificationsCtx = {
  userA: User;
  userB: User;
  userC: User;
};

// AUTHENTICATION & ONBOARDING

describe("User Sign-up and Login", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("POST", "/users").as("signup");
    cy.route("POST", "/bankAccounts").as("createBankAccount");
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

    cy.toast("User Onboarding", {
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
  });
});

// ADD & DELETE BANK ACCOUNTS

describe("Bank Accounts", function () {
  const ctx: BankAccountsTestCtx = {};

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("POST", "/bankAccounts").as("createBankAccount");
    cy.route("DELETE", "/bankAccounts/*").as("deleteBankAccount");

    cy.database("find", "users").then((user: User) => {
      ctx.user = user;

      return cy.loginByXstate(ctx.user.username);
    });
  });

  it("creates a new bank account", function () {
    cy.toast("Add a Bank Account", {
      duration: 5000,
      blocking: false,
    });

    cy.getBySel("sidenav-bankaccounts").click();

    cy.getBySel("bankaccount-new").click();

    cy.getBySelLike("bankName-input").type("The Best Bank");
    cy.getBySelLike("routingNumber-input").type("987654321");
    cy.getBySelLike("accountNumber-input").type("123456789");
    cy.getBySelLike("submit").click();
  });

  it("soft deletes a bank account", function () {
    cy.toast("Delete a Bank Account", {
      duration: 2000,
      blocking: false,
    });
    cy.visit("/bankaccounts");
    cy.getBySelLike("delete").first().arrow({
      duration: 1000,
      blocking: true,
      text: "Delete Bank",
      textSize: "5vh",
    });
    cy.getBySelLike("delete").first().click();
    cy.wait(2000);
  });
});

// CREATE, ACCEPT, REJECT, and REACT TO TRANSACTIONS

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

    cy.toast("Submit New Transaction", {
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

    cy.toast("Confirm Transaction", {
      duration: 3000,
      blocking: false,
    });

    cy.getBySel("new-transaction-return-to-transactions").click();
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
  });

  it("accepts a transaction request", function () {
    cy.toast("Accept Transaction", {
      duration: 1000,
      blocking: true,
    });
    cy.visit(`/transaction/${ctx.transactionRequest!.id}`);
    cy.wait("@getTransaction");

    cy.getBySelLike("accept-request").arrow({
      duration: 2000,
      blocking: true,
      pointAt: "bottomRight",
      text: "Accept Request",
      textSize: "5vh",
    });

    cy.getBySelLike("accept-request").click();
    cy.wait("@updateTransaction").should("have.property", "status", 204);
  });

  it("rejects a transaction request", function () {
    cy.toast("Reject Transaction", {
      duration: 1000,
      blocking: true,
    });
    cy.visit(`/transaction/${ctx.transactionRequest!.id}`);
    cy.wait("@getTransaction");

    cy.getBySelLike("reject-request").arrow({
      duration: 2000,
      blocking: true,
      pointAt: "bottomRight",
      text: "Reject Request",
      textSize: "5vh",
    });

    cy.getBySelLike("reject-request").click();
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
    });
  });
});

// TRANSACTION FEED

describe("Transaction Feed", function () {
  const ctx: TransactionFeedsCtx = {};

  const feedViews = {
    public: {
      tab: "public-tab",
      tabLabel: "everyone",
      routeAlias: "publicTransactions",
      service: "publicTransactionService",
    },
    contacts: {
      tab: "contacts-tab",
      tabLabel: "friends",
      routeAlias: "contactsTransactions",
      service: "contactTransactionService",
    },
    personal: {
      tab: "personal-tab",
      tabLabel: "mine",
      routeAlias: "personalTransactions",
      service: "personalTransactionService",
    },
  };

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("/transactions*").as(feedViews.personal.routeAlias);
    cy.route("/transactions/public*").as(feedViews.public.routeAlias);
    cy.route("/transactions/contacts*").as(feedViews.contacts.routeAlias);

    cy.database("filter", "users").then((users: User[]) => {
      ctx.user = users[0];
      ctx.allUsers = users;

      cy.loginByXstate(ctx.user.username);
    });
  });

  it("displays transaction feeds", () => {
    cy.visit("/");
    cy.toast("Transactions from Everyone", {
      duration: 1500,
      blocking: true,
    });
    cy.getBySel("nav-contacts-tab").click();
    cy.toast("Transactions from Friends", {
      duration: 1500,
      blocking: true,
    });
    cy.getBySel("nav-personal-tab").click();
    cy.toast("Personal Transactions", {
      duration: 1500,
      blocking: true,
    });
  });
});

// USER SETTINGS

describe("User Settings", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("PATCH", "/users/*").as("updateUser");

    cy.database("find", "users").then((user: User) => {
      cy.loginByXstate(user.username);
    });
  });

  it("updates first name, last name, email and phone number", function () {
    cy.getBySel("sidenav-user-settings").arrow({
      duration: 1500,
      blocking: true,
      text: "Update Profile",
      textSize: "5vh",
    });

    cy.getBySel("sidenav-user-settings").click();

    cy.toast("Update Profile", {
      duration: 5000,
      blocking: false,
    });
    cy.getBySelLike("firstName").clear().type("New First Name");
    cy.getBySelLike("lastName").clear().type("New Last Name");
    cy.getBySelLike("email").clear().type("email@email.com");
    cy.getBySelLike("phoneNumber-input").clear().type("6155551212").blur();

    cy.getBySelLike("submit").should("not.be.disabled");
    cy.getBySelLike("submit").click();
  });
});

// NOTIFICATIONS

describe("Notifications", function () {
  const ctx = {} as NotificationsCtx;

  beforeEach(function () {
    cy.task("db:seed");

    cy.server();
    cy.route("GET", "/notifications").as("getNotifications");
    cy.route("POST", "/transactions").as("createTransaction");
    cy.route("PATCH", "/notifications/*").as("updateNotification");
    cy.route("POST", "/comments/*").as("postComment");

    cy.database("filter", "users").then((users: User[]) => {
      ctx.userA = users[0];
      ctx.userB = users[1];
      ctx.userC = users[2];
    });
  });

  it("shows notifications", () => {
    cy.loginByXstate(ctx.userA.username);
    cy.toast("View Notifications", {
      duration: 3000,
      blocking: false,
    });
    cy.getBySel("nav-top-notifications-count").click();
    cy.getBySelLike("notification-mark-read").first().arrow({
      duration: 1500,
      blocking: true,
      text: "Dismiss Notification",
      textSize: "5vh",
    });

    cy.getBySelLike("notification-mark-read").first().click({ force: true });
  });

  it("Logs out", () => {
    cy.toast("Log Out", {
      duration: 3000,
      blocking: false,
    });

    cy.getBySel("sidenav-signout").arrow({
      duration: 1500,
      blocking: true,
      text: "Logout",
      textSize: "5vh",
    });

    cy.getBySel("sidenav-signout").click();
  });
});
