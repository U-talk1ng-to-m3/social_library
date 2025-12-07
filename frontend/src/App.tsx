// src/App.tsx
import { useContext } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


import { AuthContext } from "./context/AuthContext";

import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import DiscoverSearch from "./pages/DiscoverSearch";
import ContentDetail from "./pages/ContentDetail";
import Library from "./pages/Library";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

function App() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    // AuthContext'te kullanıcı varsa direkt oraya git
    if (auth?.user && auth.user.username) {
      navigate(`/profile/${auth.user.username}`);
    } else {
      // Her ihtimale karşı login'e at
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-bold text-lg text-indigo-400">
              Social Library
            </Link>

            <Link
              to="/discover"
              className="text-sm text-slate-300 hover:text-indigo-400"
            >
              Keşfet
            </Link>

            <Link
              to="/discover/search"
              className="text-sm text-slate-300 hover:text-indigo-400"
            >
              Harici Arama
            </Link>

            <Link
              to="/library"
              className="text-sm text-slate-300 hover:text-indigo-400"
            >
              Kütüphanem
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {!auth?.isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800"
                >
                  Giriş
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Kayıt Ol
                </Link>
              </>
            )}

            {auth?.isAuthenticated && (
              <>
                <button
                  onClick={handleProfileClick}
                  className="px-3 py-1 rounded border border-slate-700 text-xs sm:text-sm hover:bg-slate-800"
                >
                  Profilim
                </button>

                <button
                  onClick={auth.logout}
                  className="px-3 py-1 rounded border border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Çıkış
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* İçerik Alanı */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Feed />} />

          <Route path="/discover" element={<Discover />} />
          <Route path="/discover/search" element={<DiscoverSearch />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
	  <Route path="/reset-password" element={<ResetPassword />} />


          <Route path="/content/:id" element={<ContentDetail />} />

          <Route path="/library" element={<Library />} />

          <Route path="/profile/:username" element={<Profile />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

