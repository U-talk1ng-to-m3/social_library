# app/services/google_books.py
import requests
from typing import List, Dict, Any


class GoogleBooksError(Exception):
    pass


GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1/volumes"


def search_books(query: str) -> List[Dict[str, Any]]:
    resp = requests.get(GOOGLE_BOOKS_BASE, params={"q": query}, timeout=10)
    if resp.status_code != 200:
        raise GoogleBooksError(f"Google Books hata verdi: {resp.status_code} {resp.text}")
    data = resp.json()
    results = []

    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        image_links = info.get("imageLinks", {})
        results.append(
            {
                "external_id": item["id"],
                "title": info.get("title"),
                "original_title": info.get("title"),
                "year": (info.get("publishedDate") or "")[:4] or None,
                "poster_url": image_links.get("thumbnail")
                or image_links.get("smallThumbnail"),
                "description": info.get("description") or "",
            }
        )
    return results


def get_book_details(volume_id: str) -> Dict[str, Any]:
    url = f"{GOOGLE_BOOKS_BASE}/{volume_id}"
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        raise GoogleBooksError(
            f"Google Books detay isteği hata verdi: {resp.status_code} {resp.text}"
        )
    data = resp.json()
    info = data.get("volumeInfo", {})
    image_links = info.get("imageLinks", {})

    return {
        "external_id": data["id"],
        "source": "google_books",
        "type": "book",
        "title": info.get("title"),
        "original_title": info.get("title"),
        "year": (info.get("publishedDate") or "")[:4] or None,
        "poster_url": image_links.get("thumbnail")
        or image_links.get("smallThumbnail"),
        "description": info.get("description") or "",
        "page_count": info.get("pageCount"),
        "authors": info.get("authors") or [],
        "genres": info.get("categories") or [],
    }
