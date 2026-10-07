export const getJson = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
};

export const getText = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}`);
  return response.text();
};

export const expandTemplate = (template, base, id) => new URL(template.replace(/\{([?&])([^}]+)\}/g, (_, prefix, variables) => {
  const query = variables.split(",").filter(name => ["id", "resource"].includes(name) && id)
    .map(name => `${name}=${encodeURIComponent(id)}`).join("&");
  return query ? `${prefix}${query}` : "";
}), base);