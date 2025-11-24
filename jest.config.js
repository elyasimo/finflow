module.exports = {
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/components/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
    },
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
  ],
}; 