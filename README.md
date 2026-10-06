# DTS-Browser

Kleiner Browser-Prototyp für Collections und Resources einer DTS-1.0-API.
Lit 3 wird per Import Map über ein CDN geladen; ein Buildsystem ist nicht nötig.

Die API-Adresse wird in `config.json` unter `apiUrl` konfiguriert.
Die ausgewählte Collection wird als Hash-Route gespeichert (`#/collections/<id>`).

Lokal starten:

```sh
python -m http.server
```

GitHub Pages veröffentlicht die statischen Dateien direkt, ohne Build-Schritt.
