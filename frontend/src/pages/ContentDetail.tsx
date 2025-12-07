// src/pages/ContentDetail.tsx
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

import {
  fetchReviews,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from "../api/review";
import { rateContent } from "../api/rating";
import { addToLibrary } from "../api/library";
import type { Content } from "../types";

type LibraryStatus = "watched" | "watchlist" | "read" | "to_read" | null;

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const auth = useContext(AuthContext);

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userRating, setUserRating] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const contentId = Number(id);

  // İçerik detayını yükle
  useEffect(() => {
    const load = async () => {
      if (!contentId) return;
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<Content>(`/contents/${contentId}/`);
        setContent(res.data);

        // Kullanıcının bu içerikle ilgili library durumunu ve rating'ini
        // backend'de ayrı endpointler varsa buradan çekebilirsin.
        // Şimdilik sadece reviews'leri yüklüyoruz.
        const revs = await fetchReviews(contentId);
        setReviews(revs);
      } catch (err) {
        console.error(err);
        setError("İçerik yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [contentId]);

  // Puan verme
  const handleRate = async () => {
    if (!content || !auth?.isAuthenticated) return;
    if (!userRating || userRating < 1 || userRating > 10) {
      alert("Lütfen 1 ile 10 arasında bir puan seç.");
      return;
    }

    try {
      setRatingLoading(true);
      await rateContent(content.id, userRating);
      alert("Puanın kaydedildi!");
      // İstersen burada tekrar içerik detayını fetch edip average_rating'i güncelleyebilirsin
    } catch (err) {
      console.error(err);
      alert("Puan kaydedilirken bir hata oluştu.");
    } finally {
      setRatingLoading(false);
    }
  };

  // Kütüphaneye ekleme / durum değiştirme
  const handleLibraryStatus = async (status: Exclude<LibraryStatus, null>) => {
    if (!content || !auth?.isAuthenticated) return;
    try {
      setLibraryLoading(true);
      await addToLibrary(content.id, status);
      setLibraryStatus(status);
    } catch (err) {
      console.error(err);
      alert("Kütüphane durumu güncellenirken bir hata oluştu.");
    } finally {
      setLibraryLoading(false);
    }
  };

  // Yeni yorum ekleme
  const handleAddReview = async () => {
    if (!content || !auth?.isAuthenticated) return;
    if (!reviewText.trim()) {
      alert("Yorum boş olamaz.");
      return;
    }

    try {
      setReviewLoading(true);
      const created = await createReview(content.id, reviewText.trim());
      setReviews((prev) => [created, ...prev]);
      setReviewText("");
    } catch (err) {
      console.error(err);
      alert("Yorum eklenirken bir hata oluştu.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-300">Yükleniyor...</div>;
  }

  if (error || !content) {
    return (
      <div className="text-red-300">
        {error || "İçerik bulunamadı veya yüklenemedi."}
      </div>
    );
  }

  const isMovie = content.type === "movie";
  const isBook = content.type === "book";

  return (
    <div className="space-y-6">
      {/* Üst Kısım - Poster + Başlık + Künye */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Poster */}
        {content.poster_url && (
          <img
            src={content.poster_url}
            alt={content.title}
            className="w-full md:w-48 h-auto max-h-72 object-cover rounded-xl border border-slate-800"
          />
        )}

        {/* Metinler */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {content.title}
            </h1>
            {content.original_title && (
              <p className="text-xs text-slate-400 italic">
                {content.original_title}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            {content.year && (
              <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700">
                {content.year}
              </span>
            )}
            <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              {isMovie ? "Film" : isBook ? "Kitap" : "İçerik"}
            </span>

            {isMovie && content.runtime_minutes && (
              <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700">
                Süre: {content.runtime_minutes} dk
              </span>
            )}

            {isBook && content.page_count && (
              <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700">
                Sayfa: {content.page_count}
              </span>
            )}

            {content.genres && content.genres.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700">
                Türler: {content.genres.join(", ")}
              </span>
            )}
          </div>

          {/* Yönetmen / Yazar / Oyuncu bilgileri */}
          <div className="space-y-1 text-xs text-slate-300">
            {isMovie && content.directors && content.directors.length > 0 && (
              <p>
                <span className="font-semibold">Yönetmen:</span>{" "}
                {content.directors.join(", ")}
              </p>
            )}
            {isMovie && content.cast && content.cast.length > 0 && (
              <p>
                <span className="font-semibold">Oyuncular:</span>{" "}
                {content.cast.join(", ")}
              </p>
            )}
            {isBook && content.authors && content.authors.length > 0 && (
              <p>
                <span className="font-semibold">Yazar:</span>{" "}
                {content.authors.join(", ")}
              </p>
            )}
          </div>

          {/* Ortalama Puan */}
          <div className="text-sm text-slate-200">
            Ortalama Puan:{" "}
            <span className="font-semibold">
              {content.average_rating ? content.average_rating.toFixed(1) : "—"}
            </span>{" "}
            {content.rating_count
              ? `(${content.rating_count} oy)`
              : "(henüz oy yok)"}
          </div>
        </div>
      </div>

      {/* Açıklama */}
      {content.description && (
        <div className="border border-slate-800 bg-slate-950/80 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-line">
          {content.description}
        </div>
      )}

      {/* Puan Verme + Kütüphaneye Ekleme */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Puan Ver */}
        <div className="border border-slate-800 bg-slate-950/80 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Puan Ver</h2>

          {!auth?.isAuthenticated && (
            <p className="text-xs text-slate-400">
              Puan verebilmek için giriş yapmalısın.
            </p>
          )}

          {auth?.isAuthenticated && (
            <>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={userRating}
                  onChange={(e) => setUserRating(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-sm text-center">
                  {userRating || "-"}
                </span>
              </div>
              <button
                disabled={ratingLoading}
                onClick={handleRate}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-xs text-white"
              >
                {ratingLoading ? "Kaydediliyor..." : "Puanı Kaydet"}
              </button>
            </>
          )}
        </div>

        {/* Kütüphane Durumu */}
        <div className="border border-slate-800 bg-slate-950/80 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Kütüphanem</h2>

          {!auth?.isAuthenticated && (
            <p className="text-xs text-slate-400">
              Kütüphane durumunu değiştirebilmek için giriş yapmalısın.
            </p>
          )}

          {auth?.isAuthenticated && (
            <div className="flex flex-wrap gap-2">
              <button
                disabled={libraryLoading}
                onClick={() => handleLibraryStatus("watched")}
                className={`px-3 py-1 rounded-full text-xs border ${
                  libraryStatus === "watched"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                İzledim
              </button>
              <button
                disabled={libraryLoading}
                onClick={() => handleLibraryStatus("watchlist")}
                className={`px-3 py-1 rounded-full text-xs border ${
                  libraryStatus === "watchlist"
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                İzlenecek
              </button>
              <button
                disabled={libraryLoading}
                onClick={() => handleLibraryStatus("read")}
                className={`px-3 py-1 rounded-full text-xs border ${
                  libraryStatus === "read"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Okudum
              </button>
              <button
                disabled={libraryLoading}
                onClick={() => handleLibraryStatus("to_read")}
                className={`px-3 py-1 rounded-full text-xs border ${
                  libraryStatus === "to_read"
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Okunacak
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Yorumlar */}
      <div className="border border-slate-800 bg-slate-950/80 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold mb-1">Yorumlar</h2>

        {/* Yeni yorum formu */}
        {auth?.isAuthenticated ? (
          <div className="space-y-2 mb-4">
            <textarea
              rows={3}
              className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
              placeholder="Düşüncelerini paylaş..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <button
              disabled={reviewLoading}
              onClick={handleAddReview}
              className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-xs text-white"
            >
              {reviewLoading ? "Gönderiliyor..." : "Yorumu Gönder"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-2">
            Yorum yazmak için giriş yapmalısın.
          </p>
        )}

        {/* Yorum listesi */}
        {reviews.length === 0 && (
          <p className="text-xs text-slate-400">
            Henüz yorum yok. İlk yorumu sen yaz!
          </p>
        )}

        {reviews.map((rev) => {
          const isEditing = editingReviewId === rev.id;
          return (
            <div
              key={rev.id}
              className="border border-slate-800 rounded-xl bg-slate-950/80 p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">
                    {rev.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">
                      {rev.username}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rev.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                </div>

                {rev.is_owner && !isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingReviewId(rev.id);
                        setEditText(rev.text);
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "Yorumu silmek istediğine emin misin?"
                          )
                        )
                          return;
                        try {
                          await deleteReview(rev.id);
                          setReviews((prev) =>
                            prev.filter((r) => r.id !== rev.id)
                          );
                        } catch (err) {
                          console.error(err);
                          alert("Yorum silinirken bir hata oluştu.");
                        }
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-red-500 text-red-300 hover:bg-red-500/10"
                    >
                      Sil
                    </button>
                  </div>
                )}
              </div>

              {/* Yorum metni veya edit alanı */}
              {!isEditing && (
                <p className="text-xs text-slate-200 whitespace-pre-line mt-1">
                  {rev.text}
                </p>
              )}

              {isEditing && (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={3}
                    className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-xs"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingReviewId(null);
                        setEditText("");
                      }}
                      className="px-2 py-1 text-[10px] rounded border border-slate-700 hover:bg-slate-800"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const updated = await updateReview(rev.id, editText);
                          setReviews((prev) =>
                            prev.map((r) => (r.id === rev.id ? updated : r))
                          );
                          setEditingReviewId(null);
                          setEditText("");
                        } catch (err) {
                          console.error(err);
                          alert("Yorum güncellenirken bir hata oluştu.");
                        }
                      }}
                      className="px-2 py-1 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentDetail;

