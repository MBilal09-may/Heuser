from django.urls import path
from . import views

urlpatterns = [
    path("", views.home_view, name="home"),
    path("portfolio/", views.portfolio_view, name="portfolio"),
    path("game/", views.game_view, name="game"),
    path("api/", views.api_view, name="api"),
]
