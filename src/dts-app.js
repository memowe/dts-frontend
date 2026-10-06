import { LitElement, html } from "lit";
import "./dts-collections.js";
import "./dts-resources.js";

const get = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
};

const expand = (template, base, id) => new URL(template.replace(/\{([?&])([^}]+)\}/g, (_, prefix, variables) => {
  const query = variables.split(",").filter(name => name === "id" && id)
    .map(name => `${name}=${encodeURIComponent(id)}`).join("&");
  return query ? `${prefix}${query}` : "";
}), base);

class DtsApp extends LitElement {
  static properties = {
    apiUrl: {},
    collection: { state: true },
    root: { state: true },
    loading: { state: true },
    error: { state: true }
  };

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.start();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("hashchange", this.onHashChange);
  }

  async start() {
    this.loading = true;
    try {
      const entry = await get(this.apiUrl);
      this.collectionUrl = entry.collection;
      this.root = await get(expand(entry.collection, this.apiUrl));
      this.collection = this.root;
      this.links = new Map((this.root.member || [])
        .filter(item => item["@type"] === "Collection")
        .map(item => [item["@id"], item.collection]));
      await this.loadCollection();
      window.addEventListener("hashchange", this.onHashChange);
    } catch (error) {
      this.error = error.message;
      this.loading = false;
    }
  }

  onHashChange = () => this.loadCollection();

  selectCollection(event) {
    location.hash = event.detail
      ? `collection=${encodeURIComponent(event.detail)}`
      : "";
  }

  async loadCollection() {
    const id = new URLSearchParams(location.hash.slice(1)).get("collection");
    this.loading = true;
    this.error = "";
    try {
      this.collection = id
        ? await get(expand(this.links.get(id) || this.collectionUrl, this.apiUrl, id))
        : this.root;
      for (const item of this.collection.member || []) {
        if (item["@type"] === "Collection") this.links.set(item["@id"], item.collection);
      }
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<p>Lade …</p>`;
    if (this.error) return html`<p>Fehler beim Laden: ${this.error}</p>`;

    return html`
      <main class="grid">
        <dts-collections
          .collections=${this.collection?.member?.filter(item => item["@type"] === "Collection")}
          .root=${this.root}
          .selected=${this.collection?.["@id"] === this.root?.["@id"] ? null : this.collection?.["@id"]}
          @collection-select=${this.selectCollection}>
        </dts-collections>
        <dts-resources
          .resources=${this.collection?.member?.filter(item => item["@type"] === "Resource")}>
        </dts-resources>
      </main>
    `;
  }
}

customElements.define("dts-app", DtsApp);
