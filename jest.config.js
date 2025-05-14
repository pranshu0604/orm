/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",  // to resolve @ alias
  },
  setupFiles: ["./jest.setup.js"],  // to load environment variables
};