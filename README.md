# DTS Browser

A small browser prototype for Collections and Resources from a DTS 1.0 API.
Lit 3 is loaded from a CDN through an import map; no build system is required.

Configure the API URL in `config.json` under `apiUrl`. By default, the app
expects a local DTS service at `http://localhost:8080/`. If you serve the
frontend with `python -m http.server` on port 8000, the service must allow that
origin through CORS.

The URL represents the Collection hierarchy as a hash route, for example
`#/collections/<root-id>/<child-id>`. An optional selected Resource appears at
the end of the route (`/resources/<resource-id>`); for a Resource in the API
root, the route is `#/resources/<resource-id>`.

The first Collection is the root of the displayed subtree; each subsequent
Collection must be a direct child of the previous one.

## Run locally

```sh
python -m http.server
```

GitHub Pages serves the static files directly, without a build step. For a
GitHub Pages deployment, set `apiUrl` to a reachable DTS service; `localhost`
always refers to each visitor's own computer.

## Copyright and License

Copyright (c) 2026 Mirko Westermeier

Released under the [MIT License](LICENSE).
