import React, { useEffect, useState } from "react";
import { useService, useMachine } from "@xstate/react";
import { makeStyles } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";

import { snackbarMachine } from "../machines/snackbarMachine";
import { notificationsMachine } from "../machines/notificationsMachine";
import { authService } from "../machines/authMachine";
import AlertBar from "../components/AlertBar";
import { bankAccountsMachine } from "../machines/bankAccountsMachine";
import PrivateRoutesContainer from "./PrivateRoutesContainer";
import { httpClient } from "utils/asyncUtils";

// @ts-ignore
if (window.Cypress) {
  // Expose authService on window for Cypress
  // @ts-ignore
  window.authService = authService;
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
}));

const AppMicrosoft: React.FC = () => {
  //const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0]);

  useEffect(() => {
    if (account) {
      instance
        .acquireTokenSilent({
          scopes: ["User.Read"],
          account: account,
        })
        .then((response) => {
          if (response) {
            console.log("resp: ", response);
            //httpClient.get("https://graph.microsoft.com/v1.0/me");
            //callMsGraph(response.accessToken).then((result) => setApiData(result));
          }
        });
    }
  }, [account, instance]);
  const classes = useStyles();
  const [authState] = useService(authService);
  const [, , notificationsService] = useMachine(notificationsMachine);

  const [, , snackbarService] = useMachine(snackbarMachine);

  const [, , bankAccountsService] = useMachine(bankAccountsMachine);

  const isLoggedIn = authState.matches("authorized");

  return (
    <div className={classes.root}>
      <CssBaseline />

      {isLoggedIn && (
        <PrivateRoutesContainer
          isLoggedIn={isLoggedIn}
          notificationsService={notificationsService}
          authService={authService}
          snackbarService={snackbarService}
          bankAccountsService={bankAccountsService}
        />
      )}
      {authState.matches("unauthorized") && (
        <div>
          <button onClick={() => instance.loginPopup()}>Login</button>
        </div>
      )}
      <AlertBar snackbarService={snackbarService} />
    </div>
  );
};

export default AppMicrosoft;
