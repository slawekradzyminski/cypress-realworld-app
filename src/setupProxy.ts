import { Express } from "express";
import createProxyMiddleware from "http-proxy-middleware";

export default function (app: Express) {
  app.use(
    "/loginAuthZero",
    createProxyMiddleware({
      target: "http://localhost:3001",
      changeOrigin: true,
      logLevel: "debug",
    })
  );
  /*app.use(
    createProxyMiddleware(["/loginAuthZero", "/login", "/callback", "/logout"], {
      target: `http://localhost:3001`,
      changeOrigin: true,
      logLevel: "debug",
    })
  );*/
}
