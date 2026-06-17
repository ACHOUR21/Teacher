/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.(t|j)s',
    '!**/index.(t|j)s',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@eduai/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
    '^@eduai/ai(.*)$': '<rootDir>/../../packages/ai/src$1',
  },
};
