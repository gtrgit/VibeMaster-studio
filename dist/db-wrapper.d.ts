import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "error";
    } | {
        emit: "stdout";
        level: "info";
    } | {
        emit: "stdout";
        level: "warn";
    })[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/library").DefaultArgs>;
export { prisma };
export declare function checkDatabaseConnection(): Promise<boolean>;
export declare function seedDatabase(): Promise<void>;
export declare function cleanDatabase(): Promise<void>;
//# sourceMappingURL=db-wrapper.d.ts.map