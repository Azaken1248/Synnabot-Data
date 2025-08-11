import { useState, type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";

type ValueRendererProps = {
  value: unknown;
  path: string;
  level: number;
  search: string;
};

type ExpandedMap = Record<string, boolean>;

export default function ValueRenderer({
  value,
  path,
  level,
  search,
}: ValueRendererProps): JSX.Element {
  const [expanded, setExpanded] = useState<ExpandedMap>({});

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
              <ValueRenderer
                value={item}
                path={`${path}-${idx}`}
                level={level + 1}
                search={search}
              />
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
              <ValueRenderer
                value={v}
                path={`${path}.${k}`}
                level={level + 1}
                search={search}
              />
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
}
