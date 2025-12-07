// src/pages/Login.tsx
import { FormEvent, useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // username veya email
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!auth) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.login(identifier, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Giriş başarısız. Kullanıcı adı/e-posta veya şifre hatalı olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <h1 className="text-xl font-bold">Giriş Yap</h1>

      {error && (
        <div className="rounded border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Kullanıcı adı veya email */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Kullanıcı adı veya e-posta
          </label>
          <input
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        {/* Şifre */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">Şifre</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {/* Giriş butonu */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      {/* Şifremi Unuttum */}
      <p className="text-xs text-slate-400">
        Şifreni mi unuttun?{" "}
        <Link to="/forgot-password" className="text-indigo-400 hover:underline">
          Şifremi unuttum
        </Link>
      </p>

      {/* Kayıt linki */}
      <p className="text-xs text-slate-400">
        Hesabın yok mu?{" "}
        <Link to="/register" className="text-indigo-400 hover:underline">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
};

export default Login;

