/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.js$',
  transform: {
    '^.+\\.js$': ['babel-jest', { babelrc: false, configFile: false }],
  },
  collectCoverageFrom: [
    '**/*.js',
    '!**/*.spec.js',
    '!**/index.js',
    '!**/main.js',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@eduai/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
    '^@eduai/ai(.*)$': '<rootDir>/../../packages/ai/src$1',
  },
};
