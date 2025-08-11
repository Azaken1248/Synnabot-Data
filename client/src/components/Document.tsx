import { type JSX, type MutableRefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import ValueRenderer from "./ValueRenderer";
import ResolveDiscordNameButton from "./ResolveDiscordName";

type MongoDocument = { [key: string]: any };

type DocumentProps = {
  id: string;
  doc: MongoDocument;
  idx: number;
  collectionName: string;
  highlightedDoc: string | null;
  docRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  search: string;
};

export default function Document({
  id,
  doc,
  idx,
  collectionName,
  highlightedDoc,
  docRefs,
  search,
}: DocumentProps): JSX.Element {
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

  return (
    <div
      ref={(el) => {
        docRefs.current[id] = el;
      }}
      className={`bg-gray-800 rounded-lg p-3 mb-3 shadow-lg max-h-64 overflow-auto transition-all duration-300 ${
        highlightedDoc === id ? "ring-4 ring-yellow-400" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="block text-sm text-gray-500">Document #{idx + 1}</span>
        <button
          onClick={() => copyToClipboard(JSON.stringify(doc, null, 2))}
          className="text-xs text-gray-400 hover:text-white"
          title="Copy full document"
        >
          <FontAwesomeIcon icon={faCopy} /> Copy Document
        </button>
      </div>
      {Object.entries(doc).map(([key, value]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="text-gray-300">{highlightMatch(key)}:</span>
          {key === "discordId" ? (
            <div className="flex items-center gap-3">
              <span>
                <ValueRenderer
                  value={value}
                  path={`${collectionName}-${idx}-${key}`}
                  level={1}
                  search={search}
                />
              </span>
              <ResolveDiscordNameButton id={String(value)} />
            </div>
          ) : (
            <ValueRenderer
              value={value}
              path={`${collectionName}-${idx}-${key}`}
              level={1}
              search={search}
            />
          )}
        </div>
      ))}
    </div>
  );
}
