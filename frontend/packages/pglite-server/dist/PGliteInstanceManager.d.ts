import { PGlite } from '@electric-sql/pglite';
import type { QueryType, SqlResult } from './types';
export declare class PGliteInstanceManager {
    private instances;
    private cleanupInterval;
    constructor();
    getOrCreateInstance(sessionId: string): Promise<PGlite>;
    private cleanupInactiveInstances;
    executeQuery(sessionId: string, sql: string, type: QueryType): Promise<SqlResult[]>;
    private applyDDL;
    private applyDML;
    destroy(): void;
}
