import { AppError } from "../utils/AppError.js";

export function validate(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.slice(1).join(".")}: ${issue.message}`)
        .join(", ");
      return next(new AppError(message, 400));
    }

    req.validated = result.data;
    return next();
  };
}
