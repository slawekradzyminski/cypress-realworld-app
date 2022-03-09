const config = {
  projectId: "7s5okt",
  integrationFolder: "cypress/tests",
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: './cypress/support/index.ts',
    // specPattern:  'cypress/tests/**/*.cy.ts',
    viewportHeight: 1000,
    specPattern: ['cypress/tests/ui/*.spec.ts'], // correct - one tests
    viewportWidth: 1280,
    setupNodeEvents(on, config) {
      const e2ePluginSetup = require("./cypress/plugins").default;

      return e2ePluginSetup(on, config);
    },
  },
  retries: {
    runMode: 0,
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
  experimentalStudio: true,
  experimentalSessionSupport: true,
};

export default config;
