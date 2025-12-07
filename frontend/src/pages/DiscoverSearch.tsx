import { useState } from "react";
import {
  searchExternalMovies,
  searchExternalBooks,
  importExternalContent,
} from "../api/external";
import { useNavigate } from "react-router-dom";

const DiscoverSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"movie" | "book">("movie");

  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data =
        mode === "movie"
          ? await searchExternalMovies(query)
          : await searchExternalBooks(query);
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Arama sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (r: any) => {
    try {
      const content = await importExternalContent(
        mode === "movie" ? "tmdb" : "google_books",
        r.external_id
      );

      navigate(`/content/${content.id}`);
    } catch (err) {
      console.error(err);
      alert("İçerik platforma eklenirken bir hata oluştu.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Keşfet – Harici Arama</h1>

      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          placeholder="Film veya kitap ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="px-2 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
        >
          <option value="movie">Filmler</option>
          <option value="book">Kitaplar</option>
        </select>

        <button
          onClick={handleSearch}
          className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white"
        >
          Ara
        </button>
      </div>

      {loading && <div className="text-slate-300 text-sm">Yükleniyor...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {results.map((r, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden"
          >
            {r.poster_url && (
              <img
                src={r.poster_url}
                alt={r.title}
                className="w-full h-64 object-cover"
              />
            )}

            <div className="p-4 space-y-1">
              <h2 className="font-semibold">{r.title}</h2>
              <p className="text-sm text-slate-400">{r.year}</p>

              <button
                onClick={() => handleImport(r)}
                className="mt-3 w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm text-white"
              >
                Platforma Ekle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoverSearch;

