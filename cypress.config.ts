import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "da6v7k",
  viewportHeight: 1000,
  viewportWidth: 1280,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  env: {
    apiUrl: "http://localhost:3001",
    mobileViewportWidthBreakpoint: 414,
    coverage: false,
    codeCoverage: {
      url: "http://localhost:3001/__coverage__",
    },
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.ts").default(on, config);
    },
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/tests/**/*.{js,jsx,ts,tsx}",
  },
});
