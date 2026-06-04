import { stringify as csvStringify } from "csv-stringify/sync";
import { BSON } from "bson";
import { BadRequestError } from "../utils/httpErrors.mjs";
import * as dataService from "./data.service.mjs";

export async function getExportData({ scope, collection, query }) {
  switch (scope) {
    case "collection":
      return dataService.getCollection(collection);
    case "search":
      return dataService.queryCollection(collection, query);
    case "full":
    default:
      return dataService.getAllCollections();
  }
}

function serializeJson(data) {
  return {
    content: JSON.stringify(data),
    contentType: "application/json",
    filename: "export.json",
  };
}

function serializeBson(data) {
  return {
    content: BSON.serialize(data),
    contentType: "application/octet-stream",
    filename: "export.bson",
  };
}

function serializeCsv(data) {
  if (!Array.isArray(data)) {
    throw new BadRequestError(
      'CSV export only works on a single collection (use scope="collection")'
    );
  }
  return {
    content: csvStringify(data, { header: true }),
    contentType: "text/csv",
    filename: "export.csv",
  };
}

export function serialize(type, data) {
  switch (type) {
    case "json":
      return serializeJson(data);
    case "bson":
      return serializeBson(data);
    case "csv":
      return serializeCsv(data);
    default:
      throw new BadRequestError(`Unsupported export type: ${type}`);
  }
}
