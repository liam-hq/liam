export interface BuildingSchemasOverride {
    public: {
        Tables: {
            building_schemas: {
                Insert: {
                    organization_id?: string | null;
                };
                Update: {
                    organization_id?: string | null;
                };
            };
        };
    };
}
