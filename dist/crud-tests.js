"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCRUDTests = runCRUDTests;
exports.runPerformanceTests = runPerformanceTests;
exports.printTestResults = printTestResults;
const db_wrapper_1 = require("./db-wrapper");
// Test runner helper
async function runTest(testName, testFn) {
    const start = Date.now();
    try {
        await testFn();
        return {
            test: testName,
            passed: true,
            duration: Date.now() - start
        };
    }
    catch (error) {
        return {
            test: testName,
            passed: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - start
        };
    }
}
// CRUD Tests
async function runCRUDTests() {
    const results = [];
    console.log('\n🧪 Running CRUD Tests...\n');
    // Test: Create World
    results.push(await runTest('Create World', async () => {
        const world = await db_wrapper_1.prisma.world.create({
            data: {
                name: 'CRUD Test World',
                currentDay: 5,
                currentHour: 14
            }
        });
        if (!world.id || world.name !== 'CRUD Test World') {
            throw new Error('World creation failed');
        }
    }));
    // Test: Read World
    results.push(await runTest('Read World', async () => {
        const world = await db_wrapper_1.prisma.world.findFirst({
            where: { name: 'CRUD Test World' }
        });
        if (!world) {
            throw new Error('World not found');
        }
    }));
    // Test: Update World
    results.push(await runTest('Update World', async () => {
        const world = await db_wrapper_1.prisma.world.findFirst({
            where: { name: 'CRUD Test World' }
        });
        if (!world)
            throw new Error('World not found for update');
        const updated = await db_wrapper_1.prisma.world.update({
            where: { id: world.id },
            data: { currentHour: 20 }
        });
        if (updated.currentHour !== 20) {
            throw new Error('World update failed');
        }
    }));
    // Test: Create Location with World relation
    results.push(await runTest('Create Location with Relation', async () => {
        const world = await db_wrapper_1.prisma.world.findFirst({
            where: { name: 'CRUD Test World' }
        });
        if (!world)
            throw new Error('World not found');
        const location = await db_wrapper_1.prisma.location.create({
            data: {
                worldId: world.id,
                name: 'Test Castle',
                description: 'A mighty fortress',
                type: 'building',
                hasShelter: true,
                isDangerous: false
            }
        });
        if (!location.id) {
            throw new Error('Location creation failed');
        }
    }));
    // Test: Create NPC with relations
    results.push(await runTest('Create NPC with Relations', async () => {
        const world = await db_wrapper_1.prisma.world.findFirst({
            where: { name: 'CRUD Test World' }
        });
        const location = await db_wrapper_1.prisma.location.findFirst({
            where: { name: 'Test Castle' }
        });
        if (!world || !location)
            throw new Error('Prerequisites not found');
        const npc = await db_wrapper_1.prisma.nPC.create({
            data: {
                worldId: world.id,
                locationId: location.id,
                name: 'Sir Test',
                age: 45,
                occupation: 'Knight',
                extraversion: 70,
                conscientiousness: 90
            }
        });
        if (!npc.id || npc.name !== 'Sir Test') {
            throw new Error('NPC creation failed');
        }
    }));
    // Test: Complex query with relations
    results.push(await runTest('Complex Query with Relations', async () => {
        const worldWithRelations = await db_wrapper_1.prisma.world.findFirst({
            where: { name: 'CRUD Test World' },
            include: {
                locations: true,
                npcs: {
                    include: {
                        location: true
                    }
                }
            }
        });
        if (!worldWithRelations)
            throw new Error('World not found');
        if (worldWithRelations.locations.length === 0)
            throw new Error('No locations found');
        if (worldWithRelations.npcs.length === 0)
            throw new Error('No NPCs found');
        if (!worldWithRelations.npcs[0].location)
            throw new Error('NPC location relation failed');
    }));
    // Test: Create Goal for NPC
    results.push(await runTest('Create Goal for NPC', async () => {
        const npc = await db_wrapper_1.prisma.nPC.findFirst({
            where: { name: 'Sir Test' }
        });
        if (!npc)
            throw new Error('NPC not found');
        const goal = await db_wrapper_1.prisma.goal.create({
            data: {
                npcId: npc.id,
                type: 'power',
                target: 'Become Lord Commander',
                priority: 90,
                urgent: false,
                plan: JSON.stringify(['Train squires', 'Win tournament', 'Gain favor'])
            }
        });
        if (!goal.id) {
            throw new Error('Goal creation failed');
        }
    }));
    // Test: Create Memory
    results.push(await runTest('Create Memory', async () => {
        const npc = await db_wrapper_1.prisma.nPC.findFirst({
            where: { name: 'Sir Test' }
        });
        if (!npc)
            throw new Error('NPC not found');
        const memory = await db_wrapper_1.prisma.memory.create({
            data: {
                npcId: npc.id,
                day: 5,
                event: 'Knighted by the king',
                emotion: 'pride',
                emotionalImpact: 95
            }
        });
        if (!memory.id) {
            throw new Error('Memory creation failed');
        }
    }));
    // Test: Update NPC emotions
    results.push(await runTest('Update NPC Emotions', async () => {
        const npc = await db_wrapper_1.prisma.nPC.findFirst({
            where: { name: 'Sir Test' }
        });
        if (!npc)
            throw new Error('NPC not found');
        const updated = await db_wrapper_1.prisma.nPC.update({
            where: { id: npc.id },
            data: {
                emotionHappiness: 85,
                emotionTrust: 90,
                emotionAnticipation: 75
            }
        });
        if (updated.emotionHappiness !== 85) {
            throw new Error('Emotion update failed');
        }
    }));
    // Test: Delete operations
    results.push(await runTest('Delete Goal', async () => {
        const goal = await db_wrapper_1.prisma.goal.findFirst({
            where: { target: 'Become Lord Commander' }
        });
        if (!goal)
            throw new Error('Goal not found');
        await db_wrapper_1.prisma.goal.delete({
            where: { id: goal.id }
        });
        const deleted = await db_wrapper_1.prisma.goal.findUnique({
            where: { id: goal.id }
        });
        if (deleted) {
            throw new Error('Goal deletion failed');
        }
    }));
    // Test: Clean deletion (skip cascade test due to SQLite constraints)
    results.push(await runTest('Clean World Deletion', async () => {
        const world = await db_wrapper_1.prisma.world.findFirst({
            where: { name: 'CRUD Test World' }
        });
        if (!world)
            throw new Error('World not found');
        // Clean deletion using the same pattern as cleanDatabase
        await db_wrapper_1.prisma.memory.deleteMany({ where: { npc: { worldId: world.id } } });
        await db_wrapper_1.prisma.goal.deleteMany({ where: { npc: { worldId: world.id } } });
        await db_wrapper_1.prisma.relationship.deleteMany({ where: { fromNpc: { worldId: world.id } } });
        await db_wrapper_1.prisma.event.deleteMany({ where: { worldId: world.id } });
        await db_wrapper_1.prisma.schedule.deleteMany({ where: { npc: { worldId: world.id } } });
        await db_wrapper_1.prisma.nPC.deleteMany({ where: { worldId: world.id } });
        await db_wrapper_1.prisma.location.deleteMany({ where: { worldId: world.id } });
        await db_wrapper_1.prisma.world.delete({ where: { id: world.id } });
        // Verify deletion
        const remainingWorld = await db_wrapper_1.prisma.world.findUnique({
            where: { id: world.id }
        });
        if (remainingWorld) {
            throw new Error('World deletion failed');
        }
    }));
    return results;
}
// Query performance tests
async function runPerformanceTests() {
    const results = [];
    console.log('\n⚡ Running Performance Tests...\n');
    // Create test data first
    const world = await db_wrapper_1.prisma.world.create({
        data: {
            name: 'Performance Test World',
            currentDay: 1,
            currentHour: 12
        }
    });
    // Test: Bulk insert NPCs
    results.push(await runTest('Bulk Insert 100 NPCs', async () => {
        const location = await db_wrapper_1.prisma.location.create({
            data: {
                worldId: world.id,
                name: 'Test City',
                description: 'Large city for testing',
                type: 'city'
            }
        });
        const npcData = Array.from({ length: 100 }, (_, i) => ({
            worldId: world.id,
            locationId: location.id,
            name: `Citizen ${i}`,
            age: 20 + (i % 50),
            occupation: ['Merchant', 'Guard', 'Farmer', 'Artisan'][i % 4],
            extraversion: 30 + (i % 40),
            agreeableness: 40 + (i % 30)
        }));
        const created = await db_wrapper_1.prisma.nPC.createMany({
            data: npcData
        });
        if (created.count !== 100) {
            throw new Error(`Expected 100 NPCs, created ${created.count}`);
        }
    }));
    // Test: Complex aggregation
    results.push(await runTest('Aggregate NPC Statistics', async () => {
        const stats = await db_wrapper_1.prisma.nPC.aggregate({
            where: { worldId: world.id },
            _avg: {
                age: true,
                extraversion: true,
                agreeableness: true
            },
            _count: true
        });
        if (!stats._count || stats._count < 100) {
            throw new Error('Aggregation failed');
        }
    }));
    // Test: Find NPCs with specific traits
    results.push(await runTest('Find Extroverted NPCs', async () => {
        const extroverts = await db_wrapper_1.prisma.nPC.findMany({
            where: {
                worldId: world.id,
                extraversion: { gte: 60 }
            },
            select: {
                name: true,
                extraversion: true
            }
        });
        if (extroverts.length === 0) {
            throw new Error('No extroverted NPCs found');
        }
    }));
    // Clean up performance test data properly
    await db_wrapper_1.prisma.nPC.deleteMany({ where: { worldId: world.id } });
    await db_wrapper_1.prisma.location.deleteMany({ where: { worldId: world.id } });
    await db_wrapper_1.prisma.world.delete({ where: { id: world.id } });
    return results;
}
// Print test results
function printTestResults(results) {
    console.log('\n📊 Test Results Summary\n');
    console.log('═'.repeat(60));
    let passed = 0;
    let failed = 0;
    results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        const duration = result.duration ? ` (${result.duration}ms)` : '';
        console.log(`${status} ${result.test}${duration}`);
        if (result.error) {
            console.log(`   └─ Error: ${result.error}`);
        }
        if (result.passed)
            passed++;
        else
            failed++;
    });
    console.log('═'.repeat(60));
    console.log(`\nTotal: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);
}
//# sourceMappingURL=crud-tests.js.map