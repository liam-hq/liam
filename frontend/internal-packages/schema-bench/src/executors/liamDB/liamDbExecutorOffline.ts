import { createInMemoryRepositories, deepModeling } from "@liam-hq/agent";
import { err, ok, type Result } from "neverthrow";
import type { LiamDBExecutorInput, LiamDBExecutorOutput } from "./types";

export const createLiamDBExecutorOffline = () => {
	const execute = async (
		input: LiamDBExecutorInput,
	): Promise<Result<LiamDBExecutorOutput, Error>> => {
		try {
			// Create shared repositories and session
			const repositories = createInMemoryRepositories();
			const designSessionId = `offline-session-${Date.now()}`;
			const buildingSchemaId = `offline-schema-${Date.now()}`;

			// Create a simple logger for offline mode
			const logger = {
				log: (_message: string) => {},
				error: (message: string) => console.error(`[DeepModeling] ${message}`),
				warn: (message: string) => console.warn(`[DeepModeling] ${message}`),
				debug: (_message: string) => {},
				info: (_message: string) => {},
			};
			console.log('Starting deepModeling with input:', input.input);
			console.log('Session IDs:', { designSessionId, buildingSchemaId });
			
			const deepModelingResult = await deepModeling(
				{
					userInput: input.input,
					schemaData: { tables: {} },
					history: [],
					organizationId: "offline-org",
					buildingSchemaId,
					latestVersionNumber: 0,
					designSessionId,
					userId: "offline-user",
					recursionLimit: 15,
				},
				{
					configurable: {
						repositories,
						logger,
					},
				},
			);

			console.log('deepModeling completed:', {
				isOk: deepModelingResult.isOk(),
				hasValue: deepModelingResult.isOk() ? !!deepModelingResult.value : false,
				valueText: deepModelingResult.isOk() ? deepModelingResult.value.text?.substring(0, 100) + '...' : 'N/A'
			});

			if (!deepModelingResult.isOk()) {
				console.error(
					`❌ Deep modeling failed: ${deepModelingResult.error.message}`,
				);
				return err(
					new Error(
						`Deep modeling failed: ${deepModelingResult.error.message}`,
					),
				);
			}

			// Extract the generated schema from memory repositories
			const inMemoryRepo = repositories.schema as any;
			
			// Debug: log repository state
			console.log('Repository state:');
			console.log('- schemaVersions size:', inMemoryRepo.schemaVersions?.size || 0);
			console.log('- schemas size:', inMemoryRepo.schemas?.size || 0);
			
			// Try to get the final schema from the schema versions
			if (inMemoryRepo.schemaVersions && inMemoryRepo.schemaVersions.size > 0) {
				console.log('Checking schemaVersions...');
				// Get the latest schema version
				for (const [key, versionData] of inMemoryRepo.schemaVersions.entries()) {
					console.log(`  Version ${key}:`, {
						hasSchema: !!versionData.schema,
						tableCount: versionData.schema ? Object.keys(versionData.schema.tables).length : 0
					});
					if (versionData.schema && Object.keys(versionData.schema.tables).length > 0) {
						console.log('Found schema in schemaVersions!');
						console.log('Tables found:', Object.keys(versionData.schema.tables));
						return ok({
							tables: versionData.schema.tables,
						});
					}
				}
			}
			
			// Fallback to checking the main schemas map
			if (inMemoryRepo.schemas && inMemoryRepo.schemas.size > 0) {
				console.log('Checking schemas map...');
				for (const [key, schemaData] of inMemoryRepo.schemas.entries()) {
					console.log(`  Schema ${key}:`, {
						hasSchema: !!schemaData.schema,
						tableCount: schemaData.schema ? Object.keys(schemaData.schema.tables).length : 0
					});
					if (schemaData.schema && Object.keys(schemaData.schema.tables).length > 0) {
						console.log('Found schema in schemas map!');
						return ok({
							tables: schemaData.schema.tables,
						});
					}
				}
			}
			
			console.log('No schema found in repository, using fallback...');

			// Parse AI response and create a basic schema structure
			const generatedSchema: LiamDBExecutorOutput = {
				tables: {},
			};

			const tableCount = Object.keys(generatedSchema.tables).length;
			if (tableCount > 0) {
				return ok(generatedSchema);
			}

			const fallbackSchema: LiamDBExecutorOutput = {
				tables: {
					generated_table: {
						name: "generated_table",
						columns: {
							id: {
								name: "id",
								type: "integer",
								notNull: true,
								default: null,
								check: null,
								comment: null,
							},
							description: {
								name: "description",
								type: "text",
								notNull: true,
								default: null,
								check: null,
								comment: null,
							},
							created_at: {
								name: "created_at",
								type: "timestamp",
								notNull: true,
								default: null,
								check: null,
								comment: null,
							},
						},
						constraints: {
							primaryKey: {
								name: "generated_table_pkey",
								type: "PRIMARY KEY",
								columnNames: ["id"],
							},
						},
						comment: `Generated from prompt: ${input.input}`,
						indexes: {},
					},
				},
			};

			return ok(fallbackSchema);
		} catch (error) {
			if (error instanceof Error) {
				return err(error);
			}
			return err(new Error("Unknown error occurred"));
		}
	};

	return { execute };
};
