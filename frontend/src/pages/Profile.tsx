// src/pages/Profile.tsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  fetchProfileByUsername,
  fetchUserLibrary,
  fetchUserActivities,
  updateMyProfile,
} from "../api/profile";
import type { Content } from "../types";

interface ProfileData {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  is_me: boolean;
  is_following: boolean;
  follow_id: number | null;
}

interface LibraryEntry {
  id: number;
  status: "watched" | "watchlist" | "read" | "to_read";
  created_at: string;
  content: Content;
}

interface Activity {
  id: number;
  activity_type: "rating" | "review";
  created_at: string;
  content: Content;
  rating_score?: number;
  review_text?: string;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"library" | "activity">("library");
  const [editing, setEditing] = useState(false);
  const [editAvatar, setEditAvatar] = useState("");
  const [editBio, setEditBio] = useState("");

  useEffect(() => {
    if (!username) return;

    const load = async () => {
      try {
        setLoading(true);
        const p = await fetchProfileByUsername(username);
        if (!p) {
          alert("Profil bulunamadı.");
          navigate("/");
          return;
        }
        setProfile(p);
        setEditAvatar(p.avatar_url || "");
        setEditBio(p.bio || "");

        const [lib, acts] = await Promise.all([
          fetchUserLibrary(p.user_id),
          fetchUserActivities(p.user_id),
        ]);
        setLibrary(lib);
        setActivities(acts);
      } catch (err) {
        console.error(err);
        alert("Profil yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username, navigate]);

  const handleSaveProfile = async () => {
    try {
      const updated = await updateMyProfile({
        avatar_url: editAvatar,
        bio: editBio,
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Profil güncellenirken bir hata oluştu.");
    }
  };

  if (loading) {
    return <div className="text-slate-300">Yükleniyor...</div>;
  }

  if (!profile) {
    return <div className="text-red-300">Profil bulunamadı.</div>;
  }

  const isMe = profile.is_me;

  return (
    <div className="space-y-6">
      {/* Üst kısım: avatar + isim + bio + istatistikler */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <p className="text-xs text-slate-400">
              {profile.followers_count} takipçi · {profile.following_count} takip
            </p>
            {profile.bio && !editing && (
              <p className="mt-2 text-sm text-slate-200 whitespace-pre-line">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-2 sm:mt-0">
          {isMe ? (
            <>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 rounded border border-slate-600 text-sm hover:bg-slate-800"
                >
                  Profili Düzenle
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400">
              (Takip et / bırak kısmını istersek ekleyebiliriz)
            </span>
          )}
        </div>
      </div>

      {/* Profil düzenleme alanı */}
      {isMe && editing && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Avatar URL
            </label>
            <input
              className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Biyografi
            </label>
            <textarea
              rows={3}
              className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 rounded border border-slate-600 text-xs hover:bg-slate-800"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex gap-3 text-sm border-b border-slate-800">
        <button
          onClick={() => setTab("library")}
          className={`pb-2 ${
            tab === "library"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Kütüphane
        </button>
        <button
          onClick={() => setTab("activity")}
          className={`pb-2 ${
            tab === "activity"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Son Aktiviteler
        </button>
      </div>

      {/* İçerik */}
      {tab === "library" && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {library.length === 0 && (
            <p className="text-sm text-slate-400">
              Bu kullanıcının kütüphanesinde henüz içerik yok.
            </p>
          )}

          {library.map((entry) => (
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
                <h2 className="font-semibold text-sm">
                  {entry.content.title}
                </h2>
                <p className="text-xs text-slate-400">
                  {entry.content.year} ·{" "}
                  {entry.content.type === "movie" ? "Film" : "Kitap"}
                </p>
                <p className="text-[10px] text-slate-500">
                  Durum: {entry.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-3">
          {activities.length === 0 && (
            <p className="text-sm text-slate-400">
              Bu kullanıcı henüz bir aktivite gerçekleştirmemiş.
            </p>
          )}

          {activities.map((a) => (
            <Link
              key={a.id}
              to={`/content/${a.content.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-950/80 p-3 hover:border-indigo-500/70 transition-colors"
            >
              <div className="flex gap-3">
                {a.content.poster_url && (
                  <img
                    src={a.content.poster_url}
                    alt={a.content.title}
                    className="w-14 h-20 object-cover rounded border border-slate-700"
                  />
                )}
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">
                    {new Date(a.created_at).toLocaleString("tr-TR")} ·{" "}
                    {a.activity_type === "rating"
                      ? "Puan verdi"
                      : "Yorum yaptı"}
                  </div>
                  <div className="text-sm font-semibold">
                    {a.content.title}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;

