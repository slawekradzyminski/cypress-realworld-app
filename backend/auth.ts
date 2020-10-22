import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import passport from "passport";
import express, { Request, Response } from "express";
import { User } from "../src/models/user";
import { getUserBy, getUserById } from "./database";

const LocalStrategy = require("passport-local").Strategy;
const saml = require("passport-saml");
const router = express.Router();

// configure passport for local strategy
passport.use(
  new LocalStrategy(function (username: string, password: string, done: Function) {
    const user = getUserBy("username", username);

    const failureMessage = "Incorrect username or password.";
    if (!user) {
      return done(null, false, { message: failureMessage });
    }

    // validate password
    if (!bcrypt.compareSync(password, user.password)) {
      return done(null, false, { message: failureMessage });
    }

    return done(null, user);
  })
);

//${org.externalKey} is given by okta
const samlStrategy = new saml.Strategy(
  {
    path: "/loginSaml/callback",
    entryPoint:
      "https://dev-483770.okta.com/app/cypressdev483770_cypressrwasamltest_1/exk17luvzoFAR6We94x7/sso/saml",
    issuer: "http://www.okta.com/exk17luvzoFAR6We94x7",
  },
  function (profile: any, done: Function) {
    return done(null, profile);
  }
);
passport.use("samlStrategy", samlStrategy);

passport.serializeUser(function (user: User, done) {
  console.log("-----------------------------");
  console.log("serialize user");
  console.log(user);
  console.log("-----------------------------");

  // @ts-ignore
  done(null, process.env.REACT_APP_SAML ? user.uid : user.id);
});

passport.deserializeUser(function (id: string, done) {
  console.log("-----------------------------");
  console.log("deserialize user");
  console.log("ID:", id);
  const user = getUserById(id);
  console.log("User:", user);
  console.log("-----------------------------");
  done(null, user);
});

// authentication routes

router.get(
  "/loginSaml",
  function (req, res, next) {
    console.log("-----------------------------");
    console.log("/Start loginSaml handler");
    next();
  },
  passport.authenticate("samlStrategy")
);

router.post(
  "/loginSaml/callback",
  function (req, res, next) {
    console.log("-----------------------------");
    console.log("/Start loginSaml callback ");
    next();
  },
  passport.authenticate("samlStrategy"),
  function (req, res) {
    console.log("-----------------------------");
    console.log("loginSaml call back dumps");
    console.log(req.user);
    console.log("-----------------------------");
    //res.send("Login Saml Successful");
    res.send({
      user: {
        // @ts-ignore
        uid: req.user?.uid,
        email: req.user?.email,
        // @ts-ignore
        eduPersonAffiliation: req.user?.eduPersonAffiliation,
      },
    });
  }
);

router.post("/login", passport.authenticate("local"), (req: Request, res: Response): void => {
  if (req.body.remember) {
    req.session!.cookie.maxAge = 24 * 60 * 60 * 1000 * 30; // Expire in 30 days
  } else {
    req.session!.cookie.expires = false;
  }

  res.send({ user: req.user });
});

router.post("/logout", (req: Request, res: Response): void => {
  res.clearCookie("connect.sid");
  req.logout();
  req.session!.destroy(function (err) {
    res.redirect("/");
  });
});

router.get("/checkAuth", (req, res) => {
  /* istanbul ignore next */
  if (!req.user) {
    res.status(401).json({ error: "User is unauthorized" });
  } else {
    res.status(200).json({ user: req.user });
  }
});

export default router;
