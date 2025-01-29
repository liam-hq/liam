import { picklist } from 'valibot'

export const queryParamSchema = picklist(['active', 'hidden'])
