// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ['./**/*.js', '!./jest.config.js', '!**/coverage/**'],
  setupFiles: ['<rootDir>/__test__/setEnvVars.js'],
  coverageReporters: ['clover', 'json', 'lcov', 'text', 'cobertura'],
};

module.exports = config;
