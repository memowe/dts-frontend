import { LitElement, html } from "lit";
import "./dts-collections.js";
import "./dts-resources.js";
import {
  getCollectionIdFromUrl,
  navigateToCollection,
  onNavigationChange
} from "./collection-navigation.js";

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
    tree: { state: true },
    loading: { state: true },
    error: { state: true }
  };

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.removeNavigationListener = onNavigationChange(this.onHashChange);
    this.start();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeNavigationListener?.();
  }

  async start() {
    this.loading = true;
    try {
      const entry = await get(this.apiUrl);
      this.collectionUrl = entry.collection;
      this.root = await get(expand(entry.collection, this.apiUrl));
      this.collection = this.root;
      this.tree = new Map([[this.root["@id"], this.childCollections(this.root)]]);
      this.links = new Map((this.root.member || [])
        .filter(item => item["@type"] === "Collection")
        .map(item => [item["@id"], item.collection]));
      await this.loadCollection(getCollectionIdFromUrl());
    } catch (error) {
      this.error = error.message;
      this.loading = false;
    }
  }

  onHashChange = () => {
    try {
      this.loadCollection(getCollectionIdFromUrl());
    } catch (error) {
      this.error = error.message;
      this.loading = false;
    }
  };

  selectCollection(event) {
    navigateToCollection(event.detail);
  }

  childCollections(collection) {
    return (collection.member || []).filter(item => item["@type"] === "Collection");
  }

  async loadChildren(event) {
    const collection = event.detail;
    const id = collection["@id"];
    if (this.tree.has(id)) return;
    this.tree = new Map(this.tree).set(id, []);
    try {
      const data = await get(expand(collection.collection, this.apiUrl, id));
      this.tree = new Map(this.tree).set(id, this.childCollections(data));
      for (const child of this.childCollections(data)) this.links.set(child["@id"], child.collection);
    } catch (error) {
      this.error = error.message;
    }
  }

  async loadCollection(id) {
    this.loading = true;
    this.error = "";
    try {
      this.collection = id
        ? await get(expand(this.links.get(id) || this.collectionUrl, this.apiUrl, id))
        : this.root;
      this.tree = new Map(this.tree).set(this.collection["@id"], this.childCollections(this.collection));
      for (const item of this.childCollections(this.collection)) this.links.set(item["@id"], item.collection);
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
          .collections=${this.childCollections(this.root)}
          .root=${this.root}
          .selected=${this.collection?.["@id"] === this.root?.["@id"] ? null : this.collection?.["@id"]}
          .tree=${this.tree}
          @collection-select=${this.selectCollection}
          @collection-expand=${this.loadChildren}>
        </dts-collections>
        <dts-resources
          .resources=${this.collection?.member?.filter(item => item["@type"] === "Resource")}>
        </dts-resources>
      </main>
    `;
  }
}

customElements.define("dts-app", DtsApp);
