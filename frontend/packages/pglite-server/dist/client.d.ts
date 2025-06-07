export interface SqlResult {
    sql: string;
    result: unknown;
    success: boolean;
    id: string;
    metadata: {
        executionTime: number;
        timestamp: string;
        affectedRows?: number;
    };
}
export declare function executeQuery(sessionId: string, sql: string, type: 'DDL' | 'DML'): Promise<SqlResult[]>;
export declare const query: typeof executeQuery;
