/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  verbose: true,
}

module.exports = config
