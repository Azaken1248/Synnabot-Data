import { useEffect, useState, useRef } from "react";
import { useAuth } from "../App";
import Header from "../components/Header";
import SearchResults from "../components/SearchResults";
import DocumentViewer from "../components/DocumentViewer";
import Loader from "../components/Loader";

type MongoDocument = { [key: string]: any };
type MongoData = { [collectionName: string]: MongoDocument[] };

export default function Home() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState<MongoData | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightedDoc, setHighlightedDoc] = useState<string | null>(null);

  const docRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("https://api.data.synnabot.azaken.com/data", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((json: MongoData) => {
        setData(json);
        const collections = Object.keys(json);
        if (collections.length > 0) setActiveCollection(collections[0]);
      })
      .catch(console.error);
  }, []);

  const logout = () => {
    fetch("https://api.data.synnabot.azaken.com/auth/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => setUser(null))
      .catch(console.error);
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

  return (
    <div className="bg-gray-900 text-white min-h-screen font-mono flex flex-col">
      <Header
        data={data}
        activeCollection={activeCollection}
        setActiveCollection={setActiveCollection}
        search={search}
        setSearch={setSearch}
        user={user}
        logout={logout}
      />

      {search && <SearchResults results={searchResults} goToDoc={goToDoc} />}

      <div className="flex-1 p-4 overflow-auto">
        {activeCollection && data ? (
          <DocumentViewer
            collectionName={activeCollection}
            documents={data[activeCollection]}
            highlightedDoc={highlightedDoc}
            docRefs={docRefs}
            search={search}
          />
        ) : (
          <Loader />
        )}
      </div>
    </div>
  );
}
