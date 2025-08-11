import { type JSX, type MutableRefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase } from "@fortawesome/free-solid-svg-icons";
import Document from "./Document";

type MongoDocument = { [key: string]: any };

type DocumentViewerProps = {
  collectionName: string;
  documents: MongoDocument[];
  highlightedDoc: string | null;
  docRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  search: string;
};

export default function DocumentViewer({
  collectionName,
  documents,
  highlightedDoc,
  docRefs,
  search,
}: DocumentViewerProps): JSX.Element {
  return (
    <>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faDatabase} /> {collectionName}
      </h2>
      {documents.length === 0 ? (
        <p className="text-gray-500">No documents</p>
      ) : (
        documents.map((doc, idx) => {
          const id = `${collectionName}-${idx}`;
          return (
            <Document
              key={id}
              id={id}
              doc={doc}
              idx={idx}
              collectionName={collectionName}
              highlightedDoc={highlightedDoc}
              docRefs={docRefs}
              search={search}
            />
          );
        })
      )}
    </>
  );
}
