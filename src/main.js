const { apiUrl } = await fetch("config.json").then(response => response.json());
document.querySelector("dts-app").apiUrl = apiUrl;
await import("./components/app.js");
