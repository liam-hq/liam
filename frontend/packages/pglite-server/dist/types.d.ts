import type { PGlite } from '@electric-sql/pglite';
export interface SqlResult {
    sql: string;
    result: {
        error?: string;
    } | Record<string, unknown>;
    success: boolean;
    id: string;
    metadata?: {
        executionTime?: number;
        affectedRows?: number;
        timestamp?: string;
    };
}
export interface PGliteInstance {
    db: PGlite;
    lastAccessed: Date;
}
export type QueryType = 'DDL' | 'DML';
