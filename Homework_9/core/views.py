import re
from pathlib import Path
import requests
from django.conf import settings
from django.http import HttpResponse, Http404
from django.shortcuts import render

RETURN_BUTTON_HTML = """
<a href="/"
   style="position:fixed;bottom:20px;right:20px;z-index:9999;
          background:#d7263d;color:#d0fef5;
          padding:10px 18px;border-radius:6px;
          text-decoration:none;font-family:monospace;
          font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);
          pointer-events:auto;">
  &#8592; Home
</a>
"""

def home_view(request):
    return render(request, "core/home.html")

def rewrite_static_paths(html: str, prefix: str) -> str:
    """
    Rewrites relative asset paths (src/href not starting with http, https, /, or data:)
    to point to /static/<prefix>/<asset_path>.
    """
    def replace_asset(match):
        attr = match.group(1)
        path = match.group(2)
        return f'{attr}="/static/{prefix}/{path}"'

    pattern = r'(src|href)="(?!https?://|/|data:)([^"]+)"'
    return re.sub(pattern, replace_asset, html)

def inject_return_button(html: str) -> str:
    if "</body>" in html:
        return html.replace("</body>", f"{RETURN_BUTTON_HTML}</body>", 1)
    return html + RETURN_BUTTON_HTML

def portfolio_view(request):
    portfolio_dir = settings.BASE_DIR.parent / "Homework_8"
    html_files = list(portfolio_dir.glob("*.html"))
    if not html_files:
        raise Http404("Portfolio index file not found")
    
    with open(html_files[0], "r", encoding="utf-8") as f:
        content = f.read()
    
    modified_html = rewrite_static_paths(content, "portfolio")
    modified_html = inject_return_button(modified_html)
    return HttpResponse(modified_html, content_type="text/html; charset=utf-8")

def game_view(request):
    game_dir = settings.BASE_DIR.parent / "Homework_6"
    html_files = list(game_dir.glob("*.html"))
    if not html_files:
        raise Http404("Game index file not found")
    
    with open(html_files[0], "r", encoding="utf-8") as f:
        content = f.read()
    
    modified_html = rewrite_static_paths(content, "game")
    modified_html = inject_return_button(modified_html)
    return HttpResponse(modified_html, content_type="text/html; charset=utf-8")

def get_threat_rating(vote_average: float) -> str:
    rating = round(vote_average, 1)
    if rating >= 8.5:
        return f"LEVEL {rating}: MANDATORY POPCORN CONSUMPTION"
    elif rating >= 7.0:
        return f"LEVEL {rating}: HIGHLY RECOMMENDED BY THE BUREAU"
    elif rating >= 5.0:
        return f"LEVEL {rating}: CLEARED FOR CIVILIAN VIEWING"
    else:
        return f"LEVEL {rating}: PROCEED WITH EXTREME SKEPTICISM"

def api_view(request):
    api_key = getattr(settings, "TMDB_API_KEY", None)
    if not api_key:
        return render(
            request,
            "core/api_movies.html",
            {"error": "Bureau Error 401: Missing Security Clearance (TMDB_API_KEY not configured)."},
        )
    
    url = "https://api.themoviedb.org/3/trending/movie/week"
    headers = {"accept": "application/json"}
    params = {}

    if len(api_key) > 100:
        headers["Authorization"] = f"Bearer {api_key}"
    else:
        params["api_key"] = api_key

    try:
        response = requests.get(url, headers=headers, params=params, timeout=8)
        if response.status_code != 200:
            return render(
                request,
                "core/api_movies.html",
                {
                    "error": f"Bureau Error {response.status_code}: Upstream Cinema Registry refused clearance ({response.text[:200]})."
                },
            )
        
        data = response.json()
        raw_movies = data.get("results", [])
        
        movies = []
        for item in raw_movies:
            vote = float(item.get("vote_average", 0.0))
            pop = float(item.get("popularity", 0.0))
            movies.append({
                "case_file_id": f"#BOCA-{item.get('id', 'UNKNOWN')}",
                "title": item.get("title") or item.get("original_title") or "Untitled Motion Picture",
                "release_date": item.get("release_date", "CLASSIFIED"),
                "threat_rating": get_threat_rating(vote),
                "hype_index": f"{pop:.1f} Citizen Commotion Units",
                "overview": item.get("overview") or "No synopsis declassified.",
            })
            
        return render(request, "core/api_movies.html", {"movies": movies})

    except requests.RequestException as e:
        return render(
            request,
            "core/api_movies.html",
            {
                "error": f"Bureau Network Failure: Inter-agency communication link severed ({e})."
            },
        )
