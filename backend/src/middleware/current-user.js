import { HttpError } from "../http-error.js";

const USER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function currentUser(request, _response, next) {
  const userId = request.get("X-User-Id")?.trim() || "dev-user";

  if (!USER_ID_PATTERN.test(userId)) {
    next(
      new HttpError(
        400,
        "INVALID_USER_ID",
        "X-User-Id must contain 1-128 letters, numbers, underscores, or hyphens.",
      ),
    );
    return;
  }

  request.user = { id: userId };
  next();
}
