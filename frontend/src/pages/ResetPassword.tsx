// src/pages/ResetPassword.tsx
import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (!token.trim()) {
      setError("Geçersiz token.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm/", {
        token,
        new_password: password,
      });
      setInfo("Şifren başarıyla güncellendi. Giriş ekranına yönlendiriliyorsun.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Şifre sıfırlama sırasında bir hata oluştu. Token geçersiz veya süresi dolmuş olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold">Yeni Şifre Belirle</h1>

      {error && (
        <div className="rounded border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {info && (
        <div className="rounded border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {!initialToken && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Sıfırlama Token
            </label>
            <input
              className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Yeni Şifre
          </label>
          <input
            type="password"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Yeni Şifre (Tekrar)
          </label>
          <input
            type="password"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm text-white"
        >
          {loading ? "Şifre güncelleniyor..." : "Şifreyi Güncelle"}
        </button>
      </form>

      <p className="text-xs text-slate-400">
        Giriş ekranına dön{" "}
        <Link to="/login" className="text-indigo-400 hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;

