// src/pages/Library.tsx
import { useEffect, useState } from "react";
import { fetchLibrary } from "../api/library";
import type { LibraryEntry, LibraryStatus } from "../types";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const statusLabels: Record<LibraryStatus, string> = {
  watched: "İzlediklerim",
  watchlist: "İzleme Listem",
  read: "Okuduklarım",
  to_read: "Okuyacaklarım",
};

const Library = () => {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LibraryStatus>("watched");

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLibrary();
        setEntries(data);
      } catch (err) {
        console.error(err);
        setError("Kütüphane yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth, navigate]);

  const filtered = entries.filter((e) => e.status === activeTab);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kütüphanem</h1>

      {/* Sekmeler */}
      <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
        {(Object.keys(statusLabels) as LibraryStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-3 py-1 rounded-full border ${
              activeTab === status
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
            }`}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      {loading && <div className="text-slate-300 text-sm">Yükleniyor...</div>}

      {error && (
        <div className="rounded bg-red-500/10 border border-red-500 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-slate-400 text-sm">
          Bu sekmede henüz hiç içerik yok.
        </div>
      )}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <Link
            key={entry.id}
            to={`/content/${entry.content.id}`}
            className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col hover:border-indigo-500/70 transition-colors"
          >
            {entry.content.poster_url && (
              <img
                src={entry.content.poster_url}
                alt={entry.content.title}
                className="w-full h-48 object-cover border-b border-slate-800"
              />
            )}

            <div className="p-3 space-y-1">
              <h2 className="font-semibold text-slate-100 text-sm">
                {entry.content.title}
              </h2>
              {entry.content.year && (
                <p className="text-xs text-slate-400">
                  {entry.content.year} ·{" "}
                  {entry.content.type === "movie" ? "Film" : "Kitap"}
                </p>
              )}
              <p className="text-[10px] text-slate-500">
                {new Date(entry.created_at).toLocaleDateString("tr-TR")} tarihinde eklendi
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Library;

