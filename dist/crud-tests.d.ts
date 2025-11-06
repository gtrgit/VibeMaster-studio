interface TestResult {
    test: string;
    passed: boolean;
    error?: string;
    duration?: number;
}
export declare function runCRUDTests(): Promise<TestResult[]>;
export declare function runPerformanceTests(): Promise<TestResult[]>;
export declare function printTestResults(results: TestResult[]): void;
export {};
//# sourceMappingURL=crud-tests.d.ts.map