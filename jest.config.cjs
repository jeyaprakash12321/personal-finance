/** @type {import('jest').Config} */
module.exports = {
  roots: ["<rootDir>/apps/api/src", "<rootDir>/apps/web/src"],
  testMatch: ["**/*.jest.test.ts"],
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.cjs"],
  coverageProvider: "v8",
  transform: {
    "^.+\\.tsx?$": ["@swc/jest", {
      jsc: {
        parser: { syntax: "typescript", tsx: true },
        target: "es2022",
      },
      module: { type: "commonjs" },
    }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  collectCoverageFrom: [
    "apps/api/src/lib/**/*.ts",
    "apps/web/src/lib/**/*.ts",
    "!**/*.test.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};
