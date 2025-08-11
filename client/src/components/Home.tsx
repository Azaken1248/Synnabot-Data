import { useEffect, useState, useRef, type JSX } from "react";
import { useAuth } from "../App";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faFileAlt,
  faChevronDown,
  faChevronRight,
  faCopy,
  faSignOutAlt,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "./Loader";
import ResolveDiscordNameButton from "./ResolveDiscordName";

type MongoDocument = { [key: string]: any };
type MongoData = { [collectionName: string]: MongoDocument[] };
type ExpandedMap = Record<string, boolean>;

export default function Home() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState<MongoData | null>(null);
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightedDoc, setHighlightedDoc] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const docRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/data", { credentials: "include" })
      .then((res) => res.json())
      .then((json: MongoData) => {
        setData(json);
        const collections = Object.keys(json);
        if (collections.length > 0) setActiveCollection(collections[0]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowLogout(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    fetch("http://localhost:3000/auth/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => setUser(null))
      .catch(console.error);
  };

  const exportData = async (
    scope: "full" | "collection" | "search",
    format: string
  ) => {
    const params = new URLSearchParams({
      scope,
      format,
      ...(scope === "collection" && activeCollection
        ? { collection: activeCollection }
        : {}),
      ...(scope === "search" ? { search } : {}),
    });

    const res = await fetch(`http://localhost:3000/export?${params}`, {
      credentials: "include",
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${scope}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
                  ? { collection, docIndex: idx, id: `${collection}-${idx}` }
                  : null;
              })
              .filter(Boolean) as {
              collection: string;
              docIndex: number;
              id: string;
            }[]
        )
      : [];

  const getIconForFormat = (format: string) => {
    switch (format) {
      case "json":
        return faFileAlt;
      case "bson":
        return faDatabase;
      case "csv":
        return faFileAlt;
      default:
        return faFileAlt;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-mono flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 flex flex-wrap items-center p-2 gap-2">
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

        <div className="block sm:hidden w-full" ref={exportRef}>
          <button
            onClick={() => setShowExport((prev) => !prev)}
            className="w-full px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faDownload} /> Export
          </button>
          {showExport && (
            <div className="mt-2 w-full bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-[80vh] overflow-auto">
              {["json", "bson", "csv"].map((fmt) => (
                <div
                  key={fmt}
                  className="border-b border-gray-700 last:border-0"
                >
                  <button
                    onClick={() => exportData("full", fmt)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={getIconForFormat(fmt)} />
                    Full DB → {fmt.toUpperCase()}
                  </button>
                  <button
                    onClick={() => exportData("collection", fmt)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={getIconForFormat(fmt)} />
                    Current Collection → {fmt.toUpperCase()}
                  </button>
                  {search && (
                    <button
                      onClick={() => exportData("search", fmt)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={getIconForFormat(fmt)} />
                      Search Results → {fmt.toUpperCase()}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto sm:ml-auto flex items-center gap-2 relative flex-wrap justify-end">
          <div className="hidden sm:block relative" ref={exportRef}>
            <button
              onClick={() => setShowExport((prev) => !prev)}
              className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faDownload} /> Export
            </button>
            {showExport && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-[80vh] overflow-auto">
                {["json", "bson", "csv"].map((fmt) => (
                  <div
                    key={fmt}
                    className="border-b border-gray-700 last:border-0"
                  >
                    <button
                      onClick={() => exportData("full", fmt)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={getIconForFormat(fmt)} />
                      Full DB → {fmt.toUpperCase()}
                    </button>
                    <button
                      onClick={() => exportData("collection", fmt)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={getIconForFormat(fmt)} />
                      Current Collection → {fmt.toUpperCase()}
                    </button>
                    {search && (
                      <button
                        onClick={() => exportData("search", fmt)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={getIconForFormat(fmt)} />
                        Search Results → {fmt.toUpperCase()}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 sm:flex-none sm:w-48 px-2 py-1 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          />

          {user && (
            <div className="relative" ref={dropdownRef}>
              <img
                src={
                  user.avatar ||
                  `https://cdn.discordapp.com/embed/avatars/0.png`
                }
                alt="User avatar"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-700 cursor-pointer hover:opacity-80 transition"
                onClick={() => setShowLogout((prev) => !prev)}
              />
              {showLogout && (
                <div className="absolute right-0 mt-2 w-36 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-gray-700 text-white text-sm"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                        {key === "discordId" ? (
                          <div className="flex items-center gap-3">
                            <span>
                              {renderValue(
                                value,
                                `${activeCollection}-${idx}-${key}`,
                                1
                              )}
                            </span>
                            <ResolveDiscordNameButton id={String(value)} />
                          </div>
                        ) : (
                          renderValue(
                            value,
                            `${activeCollection}-${idx}-${key}`,
                            1
                          )
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </>
        ) : (
          <Loader />
        )}
      </div>
    </div>
  );
}
