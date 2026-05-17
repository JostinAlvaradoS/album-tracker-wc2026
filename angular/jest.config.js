/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/environments/**',
    // Bootstrap puro — sin lógica testeable como unidad.
    '!src/app/app.config.ts',
    '!src/app/app.routes.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],

  // Mantenemos la pirámide cubierta: global sobre 85%, dominio sobre 90%.
  // Si bajás de estos números, CI rompe — antídoto a la regresión silenciosa.
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 80,
      lines: 85,
    },
    'src/app/core/services/': {
      statements: 90,
      branches: 80,
      functions: 80,
      lines: 90,
    },
    'src/app/core/guards/': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'src/app/core/config/': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
