module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  // Use SWC instead of Babel for Jest transforms
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '@swc/jest',
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
};