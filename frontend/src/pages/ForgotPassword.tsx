// src/pages/ForgotPassword.tsx
import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/password-reset/request/", {
        identifier,
      });

      const token = res.data.token;

      if (token) {
        // Demo için: token'ı kullanarak reset sayfasına yönlendiriyoruz
        navigate(`/reset-password?token=${encodeURIComponent(token)}`);
      } else {
        setInfo(
          "Eğer bu bilgilerle bir hesap varsa şifre sıfırlama bağlantısı oluşturuldu. Lütfen e-posta kutunu kontrol et."
        );
      }
    } catch (err) {
      console.error(err);
      setError("İstek sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold">Şifremi Unuttum</h1>
      <p className="text-xs text-slate-400">
        Kayıt olurken kullandığın kullanıcı adını veya e-posta adresini gir.
      </p>

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
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Kullanıcı adı veya e-posta
          </label>
          <input
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm text-white"
        >
          {loading ? "İstek gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
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

export default ForgotPassword;

