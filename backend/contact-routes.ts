///<reference path="types.ts" />

import express from "express";

import { getContactsByUsername, removeContactById, createContactForUser } from "./database";
import { ensureAuthenticated, validateMiddleware, checkJwt } from "./helpers";
import { shortIdValidation } from "./validators";
const router = express.Router();

// Routes
//GET /contacts/:username
router.get("/:username", (req, res) => {
  const { username } = req.params;

  const contacts = getContactsByUsername(username);

  res.status(200);
  res.json({ contacts });
});

//POST /contacts (scoped-user)
router.post(
  "/",
  checkJwt,
  ensureAuthenticated,
  validateMiddleware([shortIdValidation("contactUserId")]),
  (req, res) => {
    const { contactUserId } = req.body;
    /* istanbul ignore next */
    const contact = createContactForUser(req.user?.id!, contactUserId);

    res.status(200);
    res.json({ contact });
  }
);
//DELETE /contacts/:contactId (scoped-user)
router.delete(
  "/:contactId",
  checkJwt,
  ensureAuthenticated,
  validateMiddleware([shortIdValidation("contactId")]),
  (req, res) => {
    const { contactId } = req.params;

    const contacts = removeContactById(contactId);

    res.status(200);
    res.json({ contacts });
  }
);

export default router;
