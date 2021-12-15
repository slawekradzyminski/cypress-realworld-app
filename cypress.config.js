const config = {
  baseUrl: "http://localhost:3000",
  projectId: "7s5okt",
  integrationFolder: "cypress/tests",
  e2e: {
    viewportHeight: 1000,
    viewportWidth: 1280,
    setupNodeEvents(on, config) {
      const e2ePluginSetup = require("./cypress/plugins").default;

      return e2ePluginSetup(on, config);
    },
  },
  retries: {
    runMode: 2,
    openMode: 1,
  },
  env: {
    apiUrl: "http://localhost:3001",
    mobileViewportWidthBreakpoint: 414,
    coverage: false,
    codeCoverage: {
      url: "http://localhost:3001/__coverage__",
    },
  },
  experimentalStudio: true,
  experimentalSessionSupport: true,
};

export default config;
