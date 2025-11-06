"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
// Database connection and utilities
const client_1 = require("@prisma/client");
// Singleton pattern for Prisma client
let prisma;
function getDatabase() {
    if (!prisma) {
        prisma = new client_1.PrismaClient({
            log: ['error', 'warn'],
            // Uncomment for debugging:
            // log: ['query', 'error', 'warn'],
        });
    }
    return prisma;
}
async function disconnectDatabase() {
    if (prisma) {
        await prisma.$disconnect();
    }
}
// Helper to safely parse JSON fields
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
// Helper to stringify JSON fields
function safeJsonStringify(data) {
    try {
        return JSON.stringify(data);
    }
    catch {
        return '[]';
    }
}
//# sourceMappingURL=database.js.map