import { useState, useRef, useEffect, type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFileAlt,
  faDatabase,
} from "@fortawesome/free-solid-svg-icons";

type ExportMenuProps = {
  activeCollection: string | null;
  search: string;
  isMobile: boolean;
};

export default function ExportMenu({
  activeCollection,
  search,
  isMobile,
}: ExportMenuProps): JSX.Element {
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    const res = await fetch(
      `https://api.data.synnabot.azaken.com/export?${params}`,
      {
        credentials: "include",
      }
    );
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

  const buttonClasses = isMobile
    ? "w-full px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center justify-center gap-2"
    : "px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 flex items-center gap-2";

  const dropdownClasses = isMobile
    ? "mt-2 w-full bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-[80vh] overflow-auto"
    : "absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-[80vh] overflow-auto";

  return (
    <div className={isMobile ? "w-full" : "relative"} ref={exportRef}>
      <button
        onClick={() => setShowExport((prev) => !prev)}
        className={buttonClasses}
      >
        <FontAwesomeIcon icon={faDownload} /> Export
      </button>
      {showExport && (
        <div className={dropdownClasses}>
          {["json", "bson", "csv"].map((fmt) => (
            <div key={fmt} className="border-b border-gray-700 last:border-0">
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
  );
}
