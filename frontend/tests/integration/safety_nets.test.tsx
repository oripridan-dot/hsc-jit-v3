import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { safeFetch } from '../../src/lib/apiClient';
import { useCopilot } from '../../src/hooks/useCopilot';
import { WorkbenchBrandHeader } from '../../src/components/WorkbenchBrandHeader';
import { z } from 'zod';
import React from 'react';

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('System Safety Nets & Nervous System', () => {
    
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Data Guard Layer (safeFetch)', () => {
        const TestSchema = z.object({
            id: z.string(),
            value: z.number()
        });
        const FALLBACK = { id: 'fallback', value: 0 };

        it('should pass valid data through transparently', async () => {
            const validData = { id: 'test', value: 123 };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => validData
            });

            const result = await safeFetch('/api/test', TestSchema);
            expect(result).toEqual(validData);
        });

        it('should catch schema violations and use fallback if provided', async () => {
            const invalidData = { id: 'test', value: "NOT_A_NUMBER" }; // Wrong type
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => invalidData
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = await safeFetch('/api/test', TestSchema, FALLBACK);
            expect(result).toEqual(FALLBACK);
            expect(consoleSpy).toHaveBeenCalled(); // Should log the Zod error
        });

        it('should throw error on schema violation if no fallback provided', async () => {
            const invalidData = { id: 'test' }; // Missing field
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => invalidData
            });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(safeFetch('/api/test', TestSchema)).rejects.toThrow('Data contract violation');
        });

        it('should handle network errors gracefully with fallback', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network Error'));
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await safeFetch('/api/test', TestSchema, FALLBACK);
            expect(result).toEqual(FALLBACK);
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('2. Brain Bridge (useCopilot Hook)', () => {
        // Simple component to test the hook
        function TestComponent() {
            const { ask, answer, sources, loading, error } = useCopilot();
            return (
                <div>
                   <button onClick={() => ask('test query')}>Ask</button>
                   {loading && <span>Loading...</span>}
                   {error && <div data-testid="error">Error: {error}</div>}
                   {answer && <div data-testid="answer">{answer}</div>}
                   {sources.length > 0 && <div data-testid="sources-count">{sources.length}</div>}
                </div>
            );
        }

        it('should successfully connect to RAG backend and update state', async () => {
            const mockResponse = {
                insight: "The Roland Jupiter-8 is a classic.",
                products: [{ id: 'p1', name: 'Jupiter-8' }]
            };
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            render(<TestComponent />);
            
            await act(async () => {
                screen.getByText('Ask').click();
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/v1/rag/query',
                expect.objectContaining({ method: 'POST' })
            );

            await waitFor(() => {
                expect(screen.getByTestId('answer').textContent).toContain("The Roland Jupiter-8 is a classic.");
                expect(screen.getByTestId('sources-count').textContent).toContain("1");
            });
        });

        it('should handle backend failures', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Backend Down'));
            
            render(<TestComponent />);
            
            await act(async () => {
                screen.getByText('Ask').click();
            });

            await waitFor(() => {
                 expect(screen.getByTestId('error').textContent).toContain('Error: Backend Down');
            });
        });
    });

    describe('3. Data Freshness UI (WorkbenchBrandHeader)', () => {
        it('should show "SYCNING..." when no date is provided', () => {
            render(<WorkbenchBrandHeader brandName="Roland" />);
            expect(screen.getByText(/SYNCING.../i)).toBeTruthy();
        });

        it('should indicate OFFICIAL SITE when source url is present', () => {
            render(<WorkbenchBrandHeader brandName="Roland" sourceUrl="https://roland.com" />);
            expect(screen.getByText(/OFFICIAL SITE/i)).toBeTruthy();
        });

        it('should indicate CACHE when source url is missing', () => {
            render(<WorkbenchBrandHeader brandName="Roland" />);
            expect(screen.getByText(/CACHE/i)).toBeTruthy();
        });

        it('should format data age correctly for old data (Stale)', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 10); // 10 days ago
            
            render(<WorkbenchBrandHeader brandName="Roland" lastUpdated={oldDate.toISOString()} />);
            
            expect(screen.getByText(/DATA AGE:/i)).toBeTruthy();
            expect(screen.getByText(/1 week ago/i)).toBeTruthy();
        });
    });
});
