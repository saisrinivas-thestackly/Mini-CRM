import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const idParams = z.strictObject({ id: objectId });

const emptyToUndefined = (value) => (value === '' ? undefined : value);

export const optionalQuery = (schema) => z.preprocess(emptyToUndefined, schema.optional());

export const paginationQuery = {
  page: optionalQuery(z.coerce.number().int().min(1)).default(1),
  limit: optionalQuery(z.coerce.number().int().min(1).max(100)).default(10),
  search: optionalQuery(z.string().trim().max(100)),
};

export const trimmed = (max, label) =>
  z.string({ error: `${label} must be text` }).trim().max(max, `${label} must be at most ${max} characters`);

export const requiredText = (max, label) => trimmed(max, label).min(1, `${label} is required`);

export const nullableDate = (label) =>
  z.union([z.null(), z.coerce.date({ error: `${label} must be a valid date` })]);

export const requiredDate = (label) =>
  z.coerce.date({ error: `${label} must be a valid date` });

const DATA_URL = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const imageData = (max, label) =>
  z.string({ error: `${label} must be an image` }).max(max, `${label} is too large`).regex(DATA_URL, `${label} must be a PNG, JPEG or WebP image`);

export const imageList = (count, label) =>
  z.array(imageData(400_000, label), { error: `${label} must be a list of images` }).max(count, `Up to ${count} images allowed`);

export const addressBody = z.strictObject({
  street: trimmed(200, 'Street').optional(),
  city: trimmed(100, 'City').optional(),
  state: trimmed(100, 'State').optional(),
  zip: trimmed(20, 'Zip code').optional(),
});
