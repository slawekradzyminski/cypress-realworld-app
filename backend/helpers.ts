import dotenv from "dotenv";
import { set } from "lodash";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";

dotenv.config({ path: ".env.local" });
dotenv.config();

const microsoftJwtConfig = {
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
  }),

  // Validate the audience and the issuer.
  audience: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
  issuer: `https://login.microsoftonline.com/${process.env.REACT_APP_MICROSOFT_TENANT_ID}/v2.0`,
  algorithms: ["RS256"],
};

export const checkJwt = jwt(microsoftJwtConfig).unless({ path: ["/testData/*"] });

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    // @ts-ignore
    // Map sub to id on req.user
    if (req.user?.sub) {
      /* istanbul ignore next */
      // @ts-ignore
      set(req.user, "id", req.user.sub);
    }
    return next();
  }
  /* istanbul ignore next */
  res.status(401).send({
    error: "Unauthorized",
  });
};

export const validateMiddleware = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation: any) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(422).json({ errors: errors.array() });
  };
};
