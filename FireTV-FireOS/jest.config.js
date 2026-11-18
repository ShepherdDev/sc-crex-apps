module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src', '<rootDir>/../TV-Shared/test'],
  // Shared files have no node_modules of their own; use this project's.
  modulePaths: ['<rootDir>/node_modules'],
  moduleNameMapper: {'^@shared/(.*)$': '<rootDir>/../TV-Shared/src/$1'},
};
