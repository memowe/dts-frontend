# DTS-Browser

Kleiner Browser-Prototyp für Collections und Resources einer DTS-1.0-API.
Lit 3 wird per Import Map über ein CDN geladen; ein Buildsystem ist nicht nötig.

Die API-Adresse wird in `config.json` unter `apiUrl` konfiguriert.
Die URL bildet die Collection-Hierarchie als Hash-Route ab, zum Beispiel
`#/collections/<root-id>/<child-id>`. Eine ausgewählte Resource steht optional
am Ende der Route (`/resources/<resource-id>`).
Die erste Collection bildet die Wurzel des angezeigten Teilbaums; jede folgende
Collection muss ein direktes Kind der vorherigen sein.

Lokal starten:

```sh
python -m http.server
```

GitHub Pages veröffentlicht die statischen Dateien direkt, ohne Build-Schritt.
