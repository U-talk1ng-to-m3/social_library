// src/pages/Discover.tsx
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchContents } from "../api/content";
import type { Content } from "../types";

<Link
  to="/discover/search"
  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white"
>
  Harici API ile Ara (TMDb / Google Books)
</Link>


const Discover = () => {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "book">("all");
  const [results, setResults] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await searchContents(query, typeFilter);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("İçerikler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Sayfa ilk açıldığında boş arama ile çağır (keşfet gibi)
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Keşfet</h1>
        <p className="text-sm text-slate-400">
          Film ve kitapları arayın, detay sayfasından puan verip yorum yapın.
        </p>
      </div>

      {/* Arama & Filtreler */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-slate-950/70 p-4 rounded-xl border border-slate-800"
      >
        <input
          className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Film veya kitap ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as "all" | "movie" | "book")
          }
        >
          <option value="all">Hepsi</option>
          <option value="movie">Filmler</option>
          <option value="book">Kitaplar</option>
        </select>

        <button
          type="submit"
          className="rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
        >
          Ara
        </button>
      </form>

      {/* Hata / Yükleniyor */}
      {loading && <div className="text-slate-300 text-sm">Yükleniyor...</div>}
      {error && (
        <div className="rounded bg-red-500/10 border border-red-500 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Sonuçlar */}
      {!loading && !error && results.length === 0 && (
        <div className="text-slate-400 text-sm">
          Henüz içerik bulunamadı. Veritabanında içerik yoksa, önce birkaç film/kitap
          eklemen gerekebilir.
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <Link
            key={item.id}
            to={`/content/${item.id}`}
            className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col shadow-sm hover:border-indigo-500/70 transition-colors"
          >
            {item.poster_url && (
              <img
                src={item.poster_url}
                alt={item.title}
                className="w-full h-56 object-cover border-b border-slate-800"
              />
            )}

            <div className="p-3 flex-1 flex flex-col gap-2">
              <div>
                <h2 className="font-semibold text-slate-100 line-clamp-2">
                  {item.title}
                </h2>
                {item.year && (
                  <p className="text-xs text-slate-400 mt-1">
                    {item.year} · {item.type === "movie" ? "Film" : "Kitap"}
                  </p>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-slate-400 line-clamp-3 mt-1">
                  {item.description}
                </p>
              )}

              {item.average_rating !== undefined &&
                item.average_rating !== null && (
                  <div className="mt-auto text-xs text-yellow-300">
                    Ortalama Puan: {item.average_rating.toFixed(1)}{" "}
                    {item.rating_count && (
                      <span className="text-slate-400">
                        ({item.rating_count} oy)
                      </span>
                    )}
                  </div>
                )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Discover;

