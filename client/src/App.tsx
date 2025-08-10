import { useEffect, useState, useRef, type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faFileAlt,
  faChevronDown,
  faChevronRight,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";

type MongoDocument = { [key: string]: any };
type MongoData = { [collectionName: string]: MongoDocument[] };
type ExpandedMap = Record<string, boolean>;

export default function App() {
  const [data, setData] = useState<MongoData | null>(null);
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightedDoc, setHighlightedDoc] = useState<string | null>(null);
  const docRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("http://localhost:3000/data")
      .then((res) => res.json())
      .then((json: MongoData) => {
        setData(json);
        const collections = Object.keys(json);
        if (collections.length > 0) setActiveCollection(collections[0]);
      })
      .catch(console.error);
  }, []);

  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getValueClass = (value: unknown): string => {
    if (value === null) return "text-gray-400";
    if (typeof value === "string") return "text-green-400";
    if (typeof value === "number") return "text-blue-400";
    if (typeof value === "boolean") return "text-yellow-400";
    if (value instanceof Date) return "text-purple-400";
    return "text-white";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const highlightMatch = (text: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500 text-black rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const renderValue = (
    value: unknown,
    path: string,
    level: number
  ): JSX.Element => {
    const indent = { marginLeft: `${level * 12}px` };

    if (Array.isArray(value)) {
      const isOpen = expanded[path];
      return (
        <div style={indent}>
          <button
            onClick={() => toggleExpand(path)}
            className="text-gray-400 hover:text-white"
          >
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{" "}
            Array[{value.length}]
          </button>
          {isOpen &&
            value.map((item, idx) => (
              <div key={idx} style={{ marginLeft: `${(level + 1) * 12}px` }}>
                {renderValue(item, `${path}-${idx}`, level + 1)}
              </div>
            ))}
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      const isOpen = expanded[path];
      return (
        <div style={indent}>
          <button
            onClick={() => toggleExpand(path)}
            className="text-gray-400 hover:text-white"
          >
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{" "}
            Object
          </button>
          {isOpen &&
            Object.entries(value).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center gap-2"
                style={{ marginLeft: `${(level + 1) * 12}px` }}
              >
                <span className="text-gray-300">{highlightMatch(k)}:</span>
                {renderValue(v, `${path}.${k}`, level + 1)}
              </div>
            ))}
        </div>
      );
    }

    return (
      <span className={getValueClass(value)}>
        {highlightMatch(String(value))}
        <button
          onClick={() => copyToClipboard(String(value))}
          className="ml-2 text-xs text-gray-500 hover:text-gray-300"
          title="Copy value"
        >
          <FontAwesomeIcon icon={faCopy} />
        </button>
      </span>
    );
  };

  const goToDoc = (collection: string, _docIndex: number, id: string) => {
    setActiveCollection(collection);
    setHighlightedDoc(id);
    setTimeout(() => {
      docRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    setTimeout(() => setHighlightedDoc(null), 2000);
  };

  const searchResults =
    search && data
      ? Object.entries(data).flatMap(
          ([collection, docs]) =>
            docs
              .map((doc, idx) => {
                const match = JSON.stringify(doc)
                  .toLowerCase()
                  .includes(search.toLowerCase());
                return match
                  ? {
                      collection,
                      docIndex: idx,
                      id: `${collection}-${idx}`,
                    }
                  : null;
              })
              .filter(Boolean) as {
              collection: string;
              docIndex: number;
              id: string;
            }[]
        )
      : [];

  return (
    <div className="bg-gray-900 text-white min-h-screen font-mono flex flex-col">
      {/* Nav */}
      <div className="bg-gray-800 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center p-2 gap-2">
        {/* Scrollable tabs */}
        <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-thin scrollbar-thumb-gray-600">
          {data &&
            Object.keys(data).map((collection) => (
              <button
                key={collection}
                onClick={() => setActiveCollection(collection)}
                className={`px-4 py-2 rounded whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                  activeCollection === collection
                    ? "bg-gray-700 font-bold"
                    : "hover:bg-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faDatabase} />
                {collection}
              </button>
            ))}
        </div>

        {/* Search bar */}
        <div className="flex-shrink-0 w-full sm:w-auto sm:ml-auto">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-48 px-2 py-1 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Search Results */}
      {search && (
        <div className="bg-gray-800 border-b border-gray-700 p-2 text-sm max-h-32 overflow-auto">
          {searchResults.length > 0 ? (
            searchResults.map((res) => (
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
      )}

      {/* Data Viewer */}
      <div className="flex-1 p-4 overflow-auto">
        {activeCollection && data ? (
          <>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faDatabase} /> {activeCollection}
            </h2>
            {data[activeCollection].length === 0 ? (
              <p className="text-gray-500">No documents</p>
            ) : (
              data[activeCollection].map((doc, idx) => {
                const id = `${activeCollection}-${idx}`;
                return (
                  <div
                    key={id}
                    ref={(el) => {
                      docRefs.current[id] = el;
                    }}
                    className={`bg-gray-800 rounded-lg p-3 mb-3 shadow-lg max-h-64 overflow-auto transition-all duration-300 ${
                      highlightedDoc === id ? "ring-4 ring-yellow-400" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="block text-sm text-gray-500">
                        Document #{idx + 1}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(JSON.stringify(doc, null, 2))
                        }
                        className="text-xs text-gray-400 hover:text-white"
                        title="Copy full document"
                      >
                        <FontAwesomeIcon icon={faCopy} /> Copy Document
                      </button>
                    </div>
                    {Object.entries(doc).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-gray-300">
                          {highlightMatch(key)}:
                        </span>
                        {renderValue(
                          value,
                          `${activeCollection}-${idx}-${key}`,
                          1
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
