/**
 * Vitest Configuration - Unit & Integration Tests
 * v3.7 - Complete test setup
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/mockData.ts'
            ],
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80
        },
        include: ['tests/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
