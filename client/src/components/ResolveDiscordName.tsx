import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function ResolveDiscordNameButton({ id }: { id: string }) {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchName = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/resolve/discord-user/${id}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to resolve");
      }
      const data = await res.json();
      setName(data.name);
    } catch (err: any) {
      setError(err.message);
      setName(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <FontAwesomeIcon icon={faSpinner} spin className="text-gray-400" />;
  if (name) return <span className="text-yellow-400">({name})</span>;
  if (error)
    return (
      <button onClick={fetchName} className="text-red-500 underline">
        Retry
      </button>
    );

  return (
    <button
      onClick={fetchName}
      className="text-blue-400 underline hover:text-blue-300 flex items-center gap-1"
      title="Resolve Discord Name"
    >
      <FontAwesomeIcon icon={faUser} />
    </button>
  );
}
