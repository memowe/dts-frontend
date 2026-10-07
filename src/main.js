const { apiUrl } = await fetch("config.json").then(response => response.json());
document.querySelector("dtsf-app").apiUrl = apiUrl;
await import("./components/app.js");
