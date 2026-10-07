const { apiUrl } = await fetch("config.json").then(response => response.json());
await import("./components/app.js");
const app = document.querySelector("dtsf-app");
app.apiUrl = apiUrl;
app.start();
