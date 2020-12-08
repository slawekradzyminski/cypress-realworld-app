import React from "react";
import ReactDOM from "react-dom";
import { Router } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { Configuration, PublicClientApplication } from "@azure/msal-browser";
import { createMuiTheme, ThemeProvider } from "@material-ui/core";

import App from "./containers/App";
import AppMicrosoft from "./containers/AppMicrosoft";
import { history } from "./utils/historyUtils";

const mSalConfiguration: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID!,
  },
};

const pca = new PublicClientApplication(mSalConfiguration);

const theme = createMuiTheme({
  palette: {
    secondary: {
      main: "#fff",
    },
  },
});

if (process.env.REACT_APP_MICROSOFT) {
  ReactDOM.render(
    <Router history={history}>
      <ThemeProvider theme={theme}>
        <MsalProvider instance={pca}>
          <AppMicrosoft />
        </MsalProvider>
      </ThemeProvider>
    </Router>,
    document.getElementById("root")
  );
} else {
  ReactDOM.render(
    <Router history={history}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </Router>,
    document.getElementById("root")
  );
}
