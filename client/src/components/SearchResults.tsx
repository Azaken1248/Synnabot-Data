import { type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt } from "@fortawesome/free-solid-svg-icons";

type SearchResult = {
  collection: string;
  docIndex: number;
  id: string;
};

type SearchResultsProps = {
  results: SearchResult[];
  goToDoc: (collection: string, docIndex: number, id: string) => void;
};

export default function SearchResults({
  results,
  goToDoc,
}: SearchResultsProps): JSX.Element {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-2 text-sm max-h-32 overflow-auto">
      {results.length > 0 ? (
        results.map((res) => (
          <button
            key={res.id}
            onClick={() => goToDoc(res.collection, res.docIndex, res.id)}
            className="block text-left w-full hover:bg-gray-700 px-2 py-1 items-center gap-2"
          >
            <FontAwesomeIcon icon={faFileAlt} />
            {res.collection} → Document #{res.docIndex + 1}
          </button>
        ))
      ) : (
        <p className="text-gray-400">No results found</p>
      )}
    </div>
  );
}
