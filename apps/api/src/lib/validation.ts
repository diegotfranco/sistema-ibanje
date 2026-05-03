import { z } from 'zod';

export const IdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export type IdParam = z.infer<typeof IdParamSchema>;
