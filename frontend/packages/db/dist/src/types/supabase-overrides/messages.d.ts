export interface MessagesOverride {
    public: {
        Tables: {
            messages: {
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
