# app/services/tmdb.py
import os
import requests
from typing import List, Dict, Any

TMDB_API_KEY = os.getenv("TMDB_API_KEY")  # .env'den okuyabilirsin
TMDB_BASE_URL = "https://api.themoviedb.org/3"


class TMDBError(Exception):
    pass


def _get(path: str, params: Dict[str, Any]) -> Dict[str, Any]:
    if not TMDB_API_KEY:
        raise TMDBError("TMDB_API_KEY ayarlı değil.")
    url = f"{TMDB_BASE_URL}{path}"
    query = {"api_key": TMDB_API_KEY, "language": "tr-TR", **params}
    resp = requests.get(url, params=query, timeout=10)
    if resp.status_code != 200:
        raise TMDBError(f"TMDb isteği hata verdi: {resp.status_code} {resp.text}")
    return resp.json()


def search_movies(query: str) -> List[Dict[str, Any]]:
    """
    TMDb'de film arar, basit bir sonuç listesi döner.
    """
    data = _get("/search/movie", {"query": query})
    results = []
    for item in data.get("results", []):
        results.append(
            {
                "external_id": item["id"],
                "title": item.get("title") or item.get("original_title"),
                "original_title": item.get("original_title"),
                "year": (item.get("release_date") or "")[:4] or None,
                "poster_url": f"https://image.tmdb.org/t/p/w500{item['poster_path']}"
                if item.get("poster_path")
                else None,
                "description": item.get("overview") or "",
            }
        )
    return results


def get_movie_details(tmdb_id: int) -> Dict[str, Any]:
    """
    Bir filmi tüm detaylarıyla çeker: yönetmen, oyuncular, türler, süre vb.
    """
    detail = _get(f"/movie/{tmdb_id}", {"append_to_response": "credits"})
    credits = detail.get("credits", {})
    crew = credits.get("crew", [])
    cast = credits.get("cast", [])

    directors = [c["name"] for c in crew if c.get("job") == "Director"]
    writers = [c["name"] for c in crew if c.get("job") in ("Writer", "Screenplay")]
    genres = [g["name"] for g in detail.get("genres", [])]
    top_cast = [c["name"] for c in cast[:5]]

    return {
        "external_id": detail["id"],
        "source": "tmdb",
        "type": "movie",
        "title": detail.get("title") or detail.get("original_title"),
        "original_title": detail.get("original_title"),
        "year": (detail.get("release_date") or "")[:4] or None,
        "poster_url": f"https://image.tmdb.org/t/p/w500{detail['poster_path']}"
        if detail.get("poster_path")
        else None,
        "description": detail.get("overview") or "",
        "runtime_minutes": detail.get("runtime"),
        "directors": directors,
        "writers": writers,
        "genres": genres,
        "cast": top_cast,
    }
