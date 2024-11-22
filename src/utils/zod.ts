import { z, type ZodTypeDef } from 'zod';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function zodStringJSON<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> (schema: z.ZodType<Output, Def, Input>) {
  return schema.or(z.string().transform(val => JSON.parse(val)).pipe(schema));
}

export const zodStringNumber = z.number().or(z.string().transform(Number).pipe(z.number()));
export const zodStringInt = z.number().int().or(z.string().transform(Number).pipe(z.number().int()));
export const zodStringBoolean = z.boolean().or(z.string().toLowerCase().pipe(z.enum(['true', 'false', '1', '0', ''])).transform(val => val === 'true' || val === '1').pipe(z.boolean()));
export const zodStringBigInt = z.bigint().or(z.string().transform(BigInt).pipe(z.bigint()));

export const zodDate = z.union([z.number(), z.string(), z.date()]).transform(val => new Date(val)).pipe(z.date());

export const zodUInt = z.number().int().gte(1);

export const zodEmptyString = z.string().transform(val => val.length === 0 ? undefined : val);

export const zodCron = z.string().regex(/^\S+ \S+ \S+ \S+ \S+$/);
export const zodEmptyStringCron = zodCron.transform(val => val.length === 0 ? undefined : val);

export const zodNullString = z.string().transform(val => val === 'null' ? null : val).nullable();
