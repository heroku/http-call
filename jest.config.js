module.exports = {
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
}
