"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllTests = runAllTests;
const db_wrapper_1 = require("./db-wrapper");
const crud_tests_1 = require("./crud-tests");
// ASCII Art Banner
function printBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     VibeMaster Database Test Suite                        ║
║     Tauri + Prisma + SQLite Integration                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
}
// Main test runner
async function runAllTests() {
    printBanner();
    try {
        // Step 1: Check database connection
        console.log('🔌 Checking database connection...');
        const isConnected = await (0, db_wrapper_1.checkDatabaseConnection)();
        if (!isConnected) {
            throw new Error('Failed to connect to database');
        }
        // Step 2: Clean database before tests
        console.log('\n🧹 Cleaning database before tests...');
        await (0, db_wrapper_1.cleanDatabase)();
        // Step 3: Seed initial test data
        console.log('\n🌱 Seeding test data...');
        await (0, db_wrapper_1.seedDatabase)();
        // Step 4: Run CRUD tests
        const crudResults = await (0, crud_tests_1.runCRUDTests)();
        // Step 5: Run performance tests
        const perfResults = await (0, crud_tests_1.runPerformanceTests)();
        // Step 6: Print all results
        const allResults = [...crudResults, ...perfResults];
        (0, crud_tests_1.printTestResults)(allResults);
        // Step 7: Clean up
        console.log('🧹 Cleaning up test data...');
        await (0, db_wrapper_1.cleanDatabase)();
        // Step 8: Final verification
        console.log('\n✨ Verifying final state...');
        const worldCount = await db_wrapper_1.prisma.world.count();
        const npcCount = await db_wrapper_1.prisma.nPC.count();
        console.log(`Worlds: ${worldCount} | NPCs: ${npcCount}`);
        if (worldCount > 0 || npcCount > 0) {
            console.warn('⚠️  Warning: Some test data was not cleaned up properly');
        }
        else {
            console.log('✅ All test data cleaned successfully');
        }
        // Calculate success
        const failedTests = allResults.filter(r => !r.passed).length;
        if (failedTests === 0) {
            console.log('\n🎉 All tests passed! The database integration is working correctly.');
            process.exit(0);
        }
        else {
            console.error(`\n❌ ${failedTests} tests failed. Please check the errors above.`);
            process.exit(1);
        }
    }
    catch (error) {
        console.error('\n💥 Fatal error during tests:', error);
        process.exit(1);
    }
    finally {
        // Always disconnect
        await db_wrapper_1.prisma.$disconnect();
    }
}
// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=run-tests.js.map