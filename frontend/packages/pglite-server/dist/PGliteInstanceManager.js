"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGliteInstanceManager = void 0;
const pglite_1 = require("@electric-sql/pglite");
class PGliteInstanceManager {
    constructor() {
        this.instances = new Map();
        this.cleanupInterval = setInterval(() => {
            this.cleanupInactiveInstances();
        }, 5 * 60 * 1000);
    }
    async getOrCreateInstance(sessionId) {
        const existing = this.instances.get(sessionId);
        if (existing) {
            existing.lastAccessed = new Date();
            return existing.db;
        }
        const db = new pglite_1.PGlite();
        this.instances.set(sessionId, {
            db,
            lastAccessed: new Date(),
        });
        return db;
    }
    cleanupInactiveInstances() {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        for (const [sessionId, instance] of Array.from(this.instances.entries())) {
            if (instance.lastAccessed < thirtyMinutesAgo) {
                instance.db.close?.();
                this.instances.delete(sessionId);
            }
        }
    }
    async executeQuery(sessionId, sql, type) {
        const db = await this.getOrCreateInstance(sessionId);
        if (type === 'DDL') {
            return this.applyDDL(sql, db);
        }
        return this.applyDML(sql, db);
    }
    async applyDDL(ddlText, db) {
        const results = [];
        const statements = ddlText
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean);
        for (const sql of statements) {
            const startTime = performance.now();
            try {
                const result = await db.query(sql);
                const executionTime = Math.round(performance.now() - startTime);
                results.push({
                    sql,
                    result,
                    success: true,
                    id: crypto.randomUUID(),
                    metadata: {
                        executionTime,
                        timestamp: new Date().toLocaleString(),
                    },
                });
            }
            catch (error) {
                const executionTime = Math.round(performance.now() - startTime);
                const errorMessage = error instanceof Error ? error.message : String(error);
                results.push({
                    sql,
                    result: { error: errorMessage },
                    success: false,
                    id: crypto.randomUUID(),
                    metadata: {
                        executionTime,
                        timestamp: new Date().toLocaleString(),
                    },
                });
            }
        }
        return results;
    }
    async applyDML(dmlText, db) {
        const results = [];
        const statements = dmlText
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean);
        for (const sql of statements) {
            const startTime = performance.now();
            try {
                const result = await db.query(sql);
                const executionTime = Math.round(performance.now() - startTime);
                let affectedRows = undefined;
                if (result && typeof result === 'object' && 'rowCount' in result) {
                    affectedRows = result.rowCount;
                }
                results.push({
                    sql,
                    result,
                    success: true,
                    id: crypto.randomUUID(),
                    metadata: {
                        executionTime,
                        affectedRows,
                        timestamp: new Date().toLocaleString(),
                    },
                });
            }
            catch (error) {
                const executionTime = Math.round(performance.now() - startTime);
                const errorMessage = error instanceof Error ? error.message : String(error);
                results.push({
                    sql,
                    result: { error: errorMessage },
                    success: false,
                    id: crypto.randomUUID(),
                    metadata: {
                        executionTime,
                        timestamp: new Date().toLocaleString(),
                    },
                });
            }
        }
        return results;
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        for (const [, instance] of Array.from(this.instances.entries())) {
            instance.db.close?.();
        }
        this.instances.clear();
    }
}
exports.PGliteInstanceManager = PGliteInstanceManager;
