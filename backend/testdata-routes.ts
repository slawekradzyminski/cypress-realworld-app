///<reference path="types.ts" />

import debug from "debug";
import express from "express";
import { getAllForEntity, seedDatabase, getUserById, createUser } from "./database";
import { validateMiddleware } from "./helpers";
import { isValidEntityValidator } from "./validators";
import { DbSchema } from "../src/models/db-schema";
const router = express.Router();

// Routes

//POST /testData/seed
router.post("/seed", (req, res) => {
  seedDatabase();
  res.sendStatus(200);
});

router.post("/setUserOnSession", (req, res) => {
  const { profile } = req.body;
  const dbUser = getUserById(profile.id);
  if (!dbUser) {
    createUser({
      id: profile.sub,
      username: profile.nickname,
      firstName: profile.displayName,
      email: profile.email,
      avatar: profile.picture,
    });
  }

  // @ts-ignore
  req.session.passport = {};
  req.session!.passport.user = profile.sub;

  req.session?.save(() => {
    //  debug("sessions saved %o", req.session);
    //  debug("is authenticated %s", req.isAuthenticated());
  });
  res.send(200);
});

router.get("/getSessionId", (req, res) => {
  res.status(200).json({ sessionId: req.session?.id });
});

//GET /testData/:entity
router.get("/:entity", validateMiddleware([...isValidEntityValidator]), (req, res) => {
  const { entity } = req.params;
  const results = getAllForEntity(entity as keyof DbSchema);

  res.status(200);
  res.json({ results });
});

export default router;
