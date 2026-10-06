export const getCollectionIdFromUrl = () => {
  const { hash } = window.location;
  if (!hash || hash === "#/") return null;

  const match = hash.match(/^#\/collections\/([^/]+)\/?$/);
  if (!match) throw new Error("Ungültige Collection-URL");

  return decodeURIComponent(match[1]);
};

export const navigateToCollection = id => {
  window.location.hash = id
    ? `/collections/${encodeURIComponent(id)}`
    : "/";
};

export const onNavigationChange = callback => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
