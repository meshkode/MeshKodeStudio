export default {
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': 'ts-jest' },
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
};
