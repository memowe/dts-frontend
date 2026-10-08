import { LitElement, html } from "lit";
import "./collections.js";
import "./resources.js";
import {
  getNavigationFromUrl,
  navigateTo,
  onNavigationChange
} from "../lib/navigation.js";
import { expandTemplate, getJson, getText } from "../lib/api.js";

class DtsApp extends LitElement {
  static properties = {
    collectionEndpoint: { state: true },
    apiRoot: { state: true },
    isApiRoot: { state: true },
    collection: { state: true },
    root: { state: true },
    collectionPath: { state: true },
    resource: { state: true },
    resourceContent: { state: true },
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
    this.collectionEndpoint = localStorage.getItem("dtsf-collection-endpoint") || "";
  }

  firstUpdated() {
    const dialog = this.querySelector("dialog");
    if (!dialog) return;
    document.documentElement.classList.add("modal-is-open");
    dialog.showModal();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeNavigationListener?.();
    this.removeNavigationListener = null;
    const dialog = this.querySelector("dialog");
    if (dialog?.open) dialog.close();
    document.documentElement.classList.remove("modal-is-open");
  }

  async start() {
    this.loading = true;
    this.error = "";
    try {
      const entry = await getJson(this.collectionEndpoint);
      this.apiRoot = entry["@type"] === "Collection" ? entry : null;
      this.collectionUrl = entry.collection;
      if (!this.isConnected) return;
      this.removeNavigationListener?.();
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

  selectResource(event) {
    navigateTo(event.detail.collections, event.detail.resource);
  }

  async connect(event) {
    event.preventDefault();
    this.collectionEndpoint = event.currentTarget.elements.collectionEndpoint.value.trim();
    localStorage.setItem("dtsf-collection-endpoint", this.collectionEndpoint);
    await this.start();
    if (this.collection) this.closeEndpointDialog();
  }

  closeEndpointDialog() {
    const dialog = this.querySelector("dialog");
    if (!dialog?.open || this.loading) return;
    dialog.close();
    document.documentElement.classList.remove("modal-is-open");
  }

  cancelEndpointDialog(event) {
    event.preventDefault();
  }

  childCollections(collection) {
    return (collection.member || []).filter(item => item["@type"] === "Collection");
  }

  collectionMembers(collection) {
    return collection.member || [];
  }

  async loadRoute(route) {
    const request = (this.routeRequest || 0) + 1;
    this.routeRequest = request;
    this.loading = true;
    this.error = "";
    this.treeStatus = new Map();

    try {
      let apiRoot = this.apiRoot;
      if (!apiRoot) {
        apiRoot = await getJson(expandTemplate(this.collectionUrl, this.collectionEndpoint));
        if (request !== this.routeRequest) return;
        this.apiRoot = apiRoot;
      }

      let root = apiRoot;
      let collection = apiRoot;
      const tree = new Map();
      tree.set(collection["@id"], this.collectionMembers(collection));

      for (const [index, id] of route.collections.entries()) {
        const children = this.childCollections(collection);
        const child = children.find(item => item["@id"] === id);
        const collectionTemplate = child?.collection || (index === 0 ? this.collectionUrl : null);
        if (!collectionTemplate) {
          throw new Error(index ? `Collection not found in path: ${id}` : `Collection not found: ${id}`);
        }
        tree.set(collection["@id"], this.collectionMembers(collection));
        collection = await getJson(expandTemplate(collectionTemplate, this.collectionEndpoint, id));
        if (request !== this.routeRequest) return;
        if (collection["@id"] !== id) throw new Error(`Collection not found: ${id}`);
        if (index === 0) root = collection;
        tree.set(collection["@id"], this.collectionMembers(collection));
      }

      let resource = null;
      let resourceContent = null;
      if (route.resource) {
        resource = (collection.member || []).find(item =>
          item["@type"] === "Resource" && item["@id"] === route.resource
        );
        if (!resource) throw new Error(`Resource not found in Collection: ${route.resource}`);
        resourceContent = await getText(expandTemplate(resource.document, this.collectionEndpoint, route.resource));
        if (request !== this.routeRequest) return;
      }

      this.root = root;
      this.collection = collection;
      this.collectionPath = route.collections;
      this.isApiRoot = route.collections.length === 0;
      this.resource = resource;
      this.resourceContent = resourceContent;
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
      const data = await getJson(expandTemplate(collection.collection, this.collectionEndpoint, id));
      if (request !== this.routeRequest) return;
      this.tree = new Map(this.tree).set(id, this.collectionMembers(data));
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
    return html`
      <dialog aria-labelledby="endpoint-dialog-title" @cancel=${this.cancelEndpointDialog}>
        <article>
          <header>
            <h2 id="endpoint-dialog-title">Connect to DTS</h2>
          </header>
          <form id="collection-endpoint-form" @submit=${this.connect}>
            <label for="collection-endpoint">DTS Collection endpoint</label>
            <fieldset role="group">
              <input
                id="collection-endpoint"
                name="collectionEndpoint"
                type="url"
                .value=${this.collectionEndpoint || ""}
                required>
              <button
                type="submit"
                aria-busy=${this.loading ? "true" : "false"}
                ?disabled=${this.loading}>${this.loading ? "Connecting…" : "Connect"}</button>
            </fieldset>
            ${this.error ? html`<p role="alert">Error loading data: ${this.error}</p>` : ""}
          </form>
        </article>
      </dialog>
      ${this.collection && this.error ? html`<p role="alert">Error loading data: ${this.error}</p>` : ""}
      ${this.collection && this.loading ? html`<p role="status" aria-busy="true">Loading…</p>` : ""}
      ${this.collection && !this.loading && !this.error ? html`
        <div class="grid">
          <dtsf-collections
            .root=${this.root}
            .isApiRoot=${this.isApiRoot}
            .collectionPath=${this.collectionPath || []}
            .tree=${this.tree}
            .treeStatus=${this.treeStatus}
            .selected=${this.resource}
            @collection-expand=${this.loadChildren}
            @resource-select=${this.selectResource}>
          </dtsf-collections>
          <dtsf-resources
            .selected=${this.resource}
            .content=${this.resourceContent}>
          </dtsf-resources>
        </div>
      ` : ""}
    `;
  }
}

customElements.define("dtsf-app", DtsApp);
