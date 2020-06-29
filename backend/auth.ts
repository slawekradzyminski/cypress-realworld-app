import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import passport from "passport";
import express, { Request, Response } from "express";
import { User } from "../src/models/user";
import { getUserBy, getUserById } from "./database";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.dev" });

const Auth0Strategy = require("passport-auth0");
const LocalStrategy = require("passport-local").Strategy;
const router = express.Router();

passport.use(
  new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENTID,
      clientSecret: process.env.AUTH0_CLIENTSECRET,
      callbackURL: "/callback",
    },
    // @ts-ignore
    function (accessToken, refreshToken, extraParams, profile, done) {
      // accessToken is the token to call Auth0 API (not needed in the most cases)
      // extraParams.id_token has the JSON Web Token
      // profile has all the information from the user
      console.log("in auth0 strategy");
      return done(null, profile);
    }
  )
);

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

passport.serializeUser(function (user: User, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id: string, done) {
  const user = getUserById(id);
  done(null, user);
});

// authentication routes
router.get(
  "/loginAuth0",
  passport.authenticate("auth0", {
    scope: "openid email profile",
  }),
  function (req, res) {
    res.redirect("/");
  }
);

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
router.get("/callback", function (req, res, next) {
  passport.authenticate("auth0", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      // @ts-ignore
      const returnTo = req.session.returnTo;
      // @ts-ignore
      delete req.session.returnTo;
      res.redirect(returnTo || "/");
    });
  })(req, res, next);
});

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
