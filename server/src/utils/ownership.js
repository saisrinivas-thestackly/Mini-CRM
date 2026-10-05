import { notFound } from './httpError.js';

export async function findOwned(Model, id, ownerId, label, populate) {
  let query = Model.findOne({ _id: id, owner: ownerId });
  if (populate) query = query.populate(populate);
  const doc = await query;
  if (!doc) throw notFound(`${label} not found`);
  return doc;
}

export async function assertOwned(Model, id, ownerId, label) {
  if (!id) return null;
  const exists = await Model.exists({ _id: id, owner: ownerId });
  if (!exists) throw notFound(`${label} not found`);
  return exists;
}
