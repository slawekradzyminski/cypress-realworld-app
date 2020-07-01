///<reference path="types.ts" />

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
  let dbUser = getUserById(profile.id);

  if (!dbUser) {
    dbUser = createUser({
      id: profile.sub,
      username: profile.nickname,
      firstName: profile.displayName,
      email: profile.email,
      avatar: profile.picture,
    });
  }

  req.logIn(dbUser, (err) => {
    if (err) {
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});

//GET /testData/:entity
router.get("/:entity", validateMiddleware([...isValidEntityValidator]), (req, res) => {
  const { entity } = req.params;
  const results = getAllForEntity(entity as keyof DbSchema);

  res.status(200);
  res.json({ results });
});

export default router;
