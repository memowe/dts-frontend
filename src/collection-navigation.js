const encode = value => {
  const segment = encodeURIComponent(value);
  return segment === "resources" ? "%72esources" : segment;
};

const decode = value => {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error("Ungültige URL-Kodierung");
  }
};

export const getNavigationFromUrl = () => {
  const { hash } = window.location;
  if (!hash || hash === "#/") return { collections: [], resource: null };

  const segments = hash.slice(2).split("/");
  if (segments[0] === "resources" && segments.length === 2 && segments[1]) {
    return { collections: [], resource: decode(segments[1]) };
  }
  if (segments[0] !== "collections") throw new Error("Ungültige Navigations-URL");

  const resourceIndex = segments.indexOf("resources", 1);
  const collectionSegments = segments.slice(1, resourceIndex === -1 ? undefined : resourceIndex);
  if (!collectionSegments.length || collectionSegments.some(segment => !segment)) {
    throw new Error("Ungültige Navigations-URL");
  }

  const collections = collectionSegments.map(decode);
  let resource = null;
  if (resourceIndex !== -1) {
    if (resourceIndex !== segments.length - 2 || !segments.at(-1)) {
      throw new Error("Ungültige Navigations-URL");
    }
    resource = decode(segments.at(-1));
  }

  return { collections, resource };
};

export const navigateTo = (collections, resource = null) => {
  if (!collections.length) {
    window.location.hash = resource ? `/resources/${encode(resource)}` : "/";
    return;
  }

  const path = collections.map(encode).join("/");
  const resourcePath = resource ? `/resources/${encode(resource)}` : "";
  window.location.hash = `/collections/${path}${resourcePath}`;
};

export const onNavigationChange = callback => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
