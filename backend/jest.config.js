/** Jest configuration for the Prodigy Finance backend (NestJS + TypeScript). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '.*[.-]spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/test/jest.setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '.module.ts$', 'main.ts$'],
};
