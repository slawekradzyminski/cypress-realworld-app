import { isMobile } from "../support/utils";

export enum Settings {
  myAccount = "My Account",
  home = "Home",
  backAccounts = "Bank Accounts",
  notifications = "Notifications",
  logout = "Logout",
}

export default class Sidebar {
  open(_value: Settings) {
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    switch (_value) {
      case Settings.home:
        return cy.getBySel("sidenav-home").click();
      case Settings.myAccount:
        return cy.getBySel("sidenav-user-settings").click();
      case Settings.backAccounts:
        return cy.getBySel("sidenav-bankaccounts").click();
      case Settings.notifications:
        return cy.getBySel("sidenav-notifications").click();
      case Settings.logout:
        return cy.getBySel("sidenav-signout").click();
    }
  }
}
