import { badRequest } from '../utils/httpError.js';

function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || null,
    message: issue.message,
  }));
}

export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid || {};
    for (const key of ['params', 'query', 'body']) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key] ?? {});
      if (!result.success) {
        const errors = formatIssues(result.error);
        const first = errors[0];
        const message = first.field ? `${first.field}: ${first.message}` : first.message;
        return next(badRequest(message, errors));
      }
      req.valid[key] = result.data;
    }
    return next();
  };
}
