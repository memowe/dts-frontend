import { LitElement, html } from "lit";
import "./dts-collections.js";
import "./dts-resources.js";
import {
  getNavigationFromUrl,
  navigateTo,
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
    apiRoot: { state: true },
    isApiRoot: { state: true },
    collection: { state: true },
    root: { state: true },
    collectionPath: { state: true },
    resource: { state: true },
    tree: { state: true },
    treeStatus: { state: true },
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
    this.removeNavigationListener?.();
    this.removeNavigationListener = null;
  }

  async start() {
    this.loading = true;
    try {
      const entry = await get(this.apiUrl);
      this.collectionUrl = entry.collection;
      if (!this.isConnected) return;
      this.removeNavigationListener = onNavigationChange(this.onHashChange);
      await this.loadRoute(getNavigationFromUrl());
    } catch (error) {
      this.error = error.message;
      this.loading = false;
    }
  }

  onHashChange = () => {
    try {
      this.loadRoute(getNavigationFromUrl());
    } catch (error) {
      this.routeRequest = (this.routeRequest || 0) + 1;
      this.error = error.message;
      this.loading = false;
    }
  };

  selectCollection(event) {
    navigateTo(event.detail);
  }

  selectResource(event) {
    navigateTo(this.collectionPath || [], event.detail);
  }

  childCollections(collection) {
    return (collection.member || []).filter(item => item["@type"] === "Collection");
  }

  async loadRoute(route) {
    const request = (this.routeRequest || 0) + 1;
    this.routeRequest = request;
    this.loading = true;
    this.error = "";
    this.treeStatus = new Map();

    try {
      let root;
      let collection;
      const tree = new Map();

      if (route.collections.length) {
        root = await get(expand(this.collectionUrl, this.apiUrl, route.collections[0]));
        if (request !== this.routeRequest) return;
        if (root["@id"] !== route.collections[0]) {
          throw new Error(`Collection not found: ${route.collections[0]}`);
        }
        collection = root;
        tree.set(collection["@id"], this.childCollections(collection));

        for (const id of route.collections.slice(1)) {
          const children = this.childCollections(collection);
          const child = children.find(item => item["@id"] === id);
          if (!child) throw new Error(`Collection not found in path: ${id}`);
          tree.set(collection["@id"], children);
          collection = await get(expand(child.collection, this.apiUrl, id));
          if (request !== this.routeRequest) return;
          if (collection["@id"] !== id) throw new Error(`Collection not found: ${id}`);
          tree.set(collection["@id"], this.childCollections(collection));
        }
      } else {
        let apiRoot = this.apiRoot;
        if (!apiRoot) {
          apiRoot = await get(expand(this.collectionUrl, this.apiUrl));
          if (request !== this.routeRequest) return;
          this.apiRoot = apiRoot;
        }
        root = apiRoot;
        collection = apiRoot;
        tree.set(collection["@id"], this.childCollections(collection));
      }

      let resource = null;
      if (route.resource) {
        resource = (collection.member || []).find(item =>
          item["@type"] === "Resource" && item["@id"] === route.resource
        );
        if (!resource) throw new Error(`Resource not found in Collection: ${route.resource}`);
      }

      this.root = root;
      this.collection = collection;
      this.collectionPath = route.collections;
      this.isApiRoot = route.collections.length === 0;
      this.resource = resource;
      this.tree = tree;
    } catch (error) {
      if (request === this.routeRequest) this.error = error.message;
    } finally {
      if (request === this.routeRequest) this.loading = false;
    }
  }

  async loadChildren(event) {
    const collection = event.detail;
    const id = collection["@id"];
    if (this.tree.has(id) || this.treeStatus?.get(id)?.loading) return;
    const request = this.routeRequest;
    this.treeStatus = new Map(this.treeStatus || []).set(id, { loading: true });

    try {
      const data = await get(expand(collection.collection, this.apiUrl, id));
      if (request !== this.routeRequest) return;
      this.tree = new Map(this.tree).set(id, this.childCollections(data));
    } catch (error) {
      if (request !== this.routeRequest) return;
      this.treeStatus = new Map(this.treeStatus).set(id, { error: error.message });
    } finally {
      if (request === this.routeRequest) {
        if (this.treeStatus.get(id)?.loading) {
          const treeStatus = new Map(this.treeStatus);
          treeStatus.delete(id);
          this.treeStatus = treeStatus;
        }
      }
    }
  }

  render() {
    if (this.loading) return html`<p>Loading…</p>`;
    if (this.error) return html`<p>Error loading data: ${this.error}</p>`;

    return html`
      <main class="grid">
        <dts-collections
          .root=${this.root}
          .isApiRoot=${this.isApiRoot}
          .collectionPath=${this.collectionPath || []}
          .tree=${this.tree}
          .treeStatus=${this.treeStatus}
          @collection-select=${this.selectCollection}
          @collection-expand=${this.loadChildren}>
        </dts-collections>
        <dts-resources
          .resources=${this.collection?.member?.filter(item => item["@type"] === "Resource")}
          .selected=${this.resource}
          @resource-select=${this.selectResource}>
        </dts-resources>
      </main>
    `;
  }
}

customElements.define("dts-app", DtsApp);
