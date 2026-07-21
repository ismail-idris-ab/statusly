/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.test.js' }],
  },
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-mmkv$': '<rootDir>/test/mocks/react-native-mmkv.ts',
  },
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/test/**/*.test.ts'],
  transformIgnorePatterns: ['/node_modules/'],
};
