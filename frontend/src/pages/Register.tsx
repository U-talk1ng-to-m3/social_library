import { FormEvent, useState } from "react";
import { register as registerApi } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerApi(username, email, password);
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Kayıt sırasında bir hata oluştu. Kullanıcı adı veya e-posta kullanımda olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md mt-10 bg-slate-950/60 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Kayıt Ol</h1>

        {error && (
          <div className="mb-4 rounded bg-red-500/10 border border-red-600 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Kullanıcı Adı
            </label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="kullanici_adi"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">E-posta</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Şifre</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Zaten hesabın var mı?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

