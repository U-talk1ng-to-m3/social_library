// src/pages/Feed.tsx
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import type { Content } from "../types";

interface ActivityUser {
  id: number;
  username: string;
}

interface Activity {
  id: number;
  activity_type: "rating" | "review";
  created_at: string;
  user: ActivityUser;
  content: Content;
  rating_score?: number;
  review_text?: string;
}

const Feed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auth = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<Activity[]>("/activities/");
        setActivities(res.data);
      } catch (err) {
        console.error(err);
        setError("Akış yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.isAuthenticated) {
      load();
    } else {
      setLoading(false);
    }
  }, [auth]);

  if (!auth?.isAuthenticated) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Sosyal Akış</h1>
        <p className="text-sm text-slate-300">
          Akışı görebilmek için giriş yapmalısın.
        </p>
        <div className="flex gap-2">
          <Link
            to="/login"
            className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white"
          >
            Giriş Yap
          </Link>
          <Link
            to="/register"
            className="px-3 py-2 rounded border border-slate-600 hover:bg-slate-800 text-sm"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Sosyal Akış</h1>

      {loading && (
        <div className="text-sm text-slate-300">Yükleniyor...</div>
      )}

      {error && (
        <div className="rounded border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="text-sm text-slate-400">
          Henüz hiç aktivite yok. Bir film/kitaba puan vererek veya yorum yaparak
          akışı doldurabilirsin.
        </div>
      )}

      <div className="space-y-3">
        {activities.map((a) => {
          const isRating = a.activity_type === "rating";
          const isReview = a.activity_type === "review";

          const formattedDate = new Date(a.created_at).toLocaleString("tr-TR");

          // Review excerpt
          let excerpt: string | null = null;
          if (isReview && a.review_text) {
            excerpt =
              a.review_text.length > 200
                ? a.review_text.slice(0, 200) + "..."
                : a.review_text;
          }

          return (
            <div
              key={a.id}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4 flex gap-3 hover:border-indigo-500/70 transition-colors"
            >
              {/* Poster */}
              {a.content.poster_url && (
                <Link
                  to={`/content/${a.content.id}`}
                  className="shrink-0 w-16 sm:w-20"
                >
                  <img
                    src={a.content.poster_url}
                    alt={a.content.title}
                    className="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-lg border border-slate-800"
                  />
                </Link>
              )}

              {/* Sağ taraftaki içerik */}
              <div className="flex-1 space-y-2">
                {/* Header: avatar gibi ilk harf + kullanıcı adı + tarih */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">
                      {a.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-100">
                        {a.user.username}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-indigo-300">
                    {isRating ? "Puan verdi" : "Yorum yaptı"}
                  </span>
                </div>

                {/* İçerik başlığı */}
                <div>
                  <Link
                    to={`/content/${a.content.id}`}
                    className="text-sm font-semibold text-slate-100 hover:text-indigo-400"
                  >
                    {a.content.title}
                  </Link>
                  {a.content.year && (
                    <span className="ml-2 text-xs text-slate-500">
                      ({a.content.year})
                    </span>
                  )}
                </div>

                {/* Aktivite detayı */}
                {isRating && typeof a.rating_score === "number" && (
                  <div className="text-sm text-yellow-300">
                    Puan:{" "}
                    <span className="font-bold">
                      {a.rating_score} / 10
                    </span>
                  </div>
                )}

                {isReview && excerpt && (
                  <div className="text-xs text-slate-200 whitespace-pre-line">
                    {excerpt}
                    {a.review_text && a.review_text.length > 200 && (
                      <Link
                        to={`/content/${a.content.id}`}
                        className="ml-1 text-[11px] text-indigo-400 hover:underline"
                      >
                        devamını oku
                      </Link>
                    )}
                  </div>
                )}

                {/* Footer: butonlar (şimdilik sadece görsel olarak) */}
                <div className="flex gap-2 pt-1">
                  <button className="px-2 py-1 rounded-full border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800">
                    Beğen
                  </button>
                  <Link
                    to={`/content/${a.content.id}`}
                    className="px-2 py-1 rounded-full border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800"
                  >
                    Yorum Yap
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Feed;

