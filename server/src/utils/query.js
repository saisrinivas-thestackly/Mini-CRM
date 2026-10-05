import mongoose from 'mongoose';

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toObjectId(id) {
  return new mongoose.Types.ObjectId(String(id));
}

export function parseSort(sort) {
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  return { [field]: direction, _id: direction };
}

export async function paginate(Model, filter, { page, limit, sort, populate, select }) {
  let query = Model.find(filter)
    .sort(parseSort(sort))
    .skip((page - 1) * limit)
    .limit(limit);
  if (populate) query = query.populate(populate);
  if (select) query = query.select(select);

  const [data, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
