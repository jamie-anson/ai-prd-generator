/**
 * @file testSetup.ts
 * @description Provides universal setup and teardown logic for tests.
 * 
 * This utility centralizes the mock management for Sinon, ensuring that all stubs
 * and spies are automatically restored after each test. This prevents test pollution,
 * where a mock from one test incorrectly affects another.
 */

import * as sinon from 'sinon';

export class TestSetup {
    /**
     * Should be called in a `beforeEach` block.
     * Currently, this is a placeholder for any future global setup.
     */
    public static beforeEach(): void {
        // No global setup needed yet, but provides a hook for the future.
    }

    /**
     * Should be called in an `afterEach` block.
     * Restores all Sinon stubs, spies, and mocks to their original implementations.
     */
    public static afterEach(): void {
        sinon.restore();
    }
}
