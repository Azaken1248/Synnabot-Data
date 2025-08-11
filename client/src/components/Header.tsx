import { useState, useRef, useEffect, type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import ExportMenu from "./ExportMenu";

type MongoDocument = { [key: string]: any };
type MongoData = { [collectionName: string]: MongoDocument[] };
type UserType = {
  id: string;
  tag: string;
  allowed: boolean;
  avatar?: string;
} | null;

type HeaderProps = {
  data: MongoData | null;
  activeCollection: string | null;
  setActiveCollection: (collection: string) => void;
  search: string;
  setSearch: (search: string) => void;
  user: UserType;
  logout: () => void;
};

export default function Header({
  data,
  activeCollection,
  setActiveCollection,
  search,
  setSearch,
  user,
  logout,
}: HeaderProps): JSX.Element {
  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
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

      <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row items-center gap-2">
        <div className="w-full block sm:hidden">
          <ExportMenu
            search={search}
            activeCollection={activeCollection}
            isMobile={true}
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 sm:flex-none sm:w-48 px-2 py-1 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          />

          <div className="hidden sm:block">
            <ExportMenu
              search={search}
              activeCollection={activeCollection}
              isMobile={false}
            />
          </div>

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
    </div>
  );
}
