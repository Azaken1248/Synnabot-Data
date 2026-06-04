import { BadRequestError } from "../utils/httpErrors.mjs";

const VALID_EXPORT_TYPES = new Set(["json", "bson", "csv"]);
const VALID_EXPORT_SCOPES = new Set(["full", "collection", "search"]);
const VALID_RESOLVE_TYPES = new Set([
  "discord-user",
  "discord-server",
  "client",
  "server",
]);

export function validateExportQuery(req, _res, next) {
  const type = req.query.type || req.query.format || "json";
  const scope = req.query.scope || "full";

  if (!VALID_EXPORT_TYPES.has(type)) {
    throw new BadRequestError(
      `Invalid export type "${type}". Must be one of: ${[...VALID_EXPORT_TYPES].join(", ")}`
    );
  }

  if (!VALID_EXPORT_SCOPES.has(scope)) {
    throw new BadRequestError(
      `Invalid export scope "${scope}". Must be one of: ${[...VALID_EXPORT_SCOPES].join(", ")}`
    );
  }

  if (scope === "collection" && !req.query.collection) {
    throw new BadRequestError(
      'Collection name is required when scope is "collection"'
    );
  }

  if (scope === "search" && !req.query.collection) {
    throw new BadRequestError(
      'Collection name is required when scope is "search"'
    );
  }

  req.exportParams = {
    type,
    scope,
    collection: req.query.collection,
    query: req.query.query || req.query.search,
  };

  next();
}

export function validateResolveParams(req, _res, next) {
  const { type } = req.params;

  if (!VALID_RESOLVE_TYPES.has(type)) {
    throw new BadRequestError(
      `Invalid resolve type "${type}". Must be one of: ${[...VALID_RESOLVE_TYPES].join(", ")}`
    );
  }

  if (!req.params.id) {
    throw new BadRequestError("ID parameter is required");
  }

  next();
}
