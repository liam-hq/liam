"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
exports.executeQuery = executeQuery;
async function executeQuery(sessionId, sql, type) {
    const response = await fetch('/api/pglite/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sessionId,
            sql,
            type,
        }),
    });
    if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error || 'Query execution failed');
    }
    return data.results;
}
exports.query = executeQuery;
