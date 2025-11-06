import { PrismaClient } from '@prisma/client';
export declare function getDatabase(): PrismaClient;
export declare function disconnectDatabase(): Promise<void>;
export declare function safeJsonParse<T>(json: string, fallback: T): T;
export declare function safeJsonStringify(data: unknown): string;
//# sourceMappingURL=database.d.ts.map