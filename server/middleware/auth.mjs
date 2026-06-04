import { UnauthorizedError } from "../utils/httpErrors.mjs";

export default function requireAuth(req, _res, next) {
  if (req.session?.auth?.allowed) {
    return next();
  }
  throw new UnauthorizedError("Authentication required");
}
