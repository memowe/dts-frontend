import { LitElement, html } from "lit";

class DtsCollections extends LitElement {
  static properties = {
    root: {},
    isApiRoot: { type: Boolean },
    collectionPath: {},
    selected: {},
    tree: {},
    treeStatus: {},
    openCollections: { state: true },
    collapsedCollections: { state: true }
  };

  createRenderRoot() {
    return this;
  }

  selectResource(collections, resource) {
    this.dispatchEvent(new CustomEvent("resource-select", {
      detail: { collections, resource },
      bubbles: true,
      composed: true
    }));
  }

  collectionExpanded(collection, root = false) {
    const id = collection["@id"];
    if (this.collapsedCollections?.has(id)) return false;
    return root || this.collectionPath?.includes(id) || this.openCollections?.has(id);
  }

  toggleCollection(collection, root = false) {
    const id = collection["@id"];
    const expanded = this.collectionExpanded(collection, root);
    const openCollections = new Set(this.openCollections || []);
    const collapsedCollections = new Set(this.collapsedCollections || []);

    if (expanded) {
      openCollections.delete(id);
      collapsedCollections.add(id);
    } else {
      openCollections.add(id);
      collapsedCollections.delete(id);
    }

    this.openCollections = openCollections;
    this.collapsedCollections = collapsedCollections;

    if (!expanded && Number(collection.totalChildren) !== 0 && !this.tree?.has(id) && !this.treeStatus?.get(id)?.loading) {
      this.dispatchEvent(new CustomEvent("collection-expand", {
        detail: collection,
        bubbles: true,
        composed: true
      }));
    }
  }

  renderResource(resource, collections) {
    const selected = this.selected?.["@id"] === resource["@id"];
    return html`
      <li>
        <button class="tree-item tree-resource" aria-pressed=${selected}
          @click=${() => this.selectResource(collections, resource["@id"])}>
          <span class="tree-marker" aria-hidden="true">📄</span>
          <span>${resource.title}</span>
        </button>
      </li>
    `;
  }

  renderMember(member, collections) {
    return member["@type"] === "Resource"
      ? this.renderResource(member, collections)
      : this.renderCollection(member, [...collections, member["@id"]]);
  }

  renderCollection(collection, collections) {
    const id = collection["@id"];
    const members = this.tree?.get(id) || [];
    const status = this.treeStatus?.get(id);
    if (Number(collection.totalChildren) === 0) {
      return html`
        <li>
          <span class="tree-item tree-collection">
            <span class="tree-marker" aria-hidden="true"></span>
            <span>${collection.title}</span>
          </span>
        </li>
      `;
    }

    const expanded = this.collectionExpanded(collection);
    return html`
      <li>
        <button class="tree-item tree-collection" aria-expanded=${expanded}
          aria-busy=${status?.loading ? "true" : "false"}
          @click=${() => this.toggleCollection(collection)}>
          <span class="tree-marker" aria-hidden="true">${expanded ? "▾" : "▸"}</span>
          <span>${collection.title}</span>
        </button>
        ${status?.error ? html`<p class="tree-message" role="alert">${status.error}</p>` : ""}
        ${status?.loading ? html`<p class="tree-message" aria-busy="true">Loading…</p>` : ""}
        ${expanded && members.length ? html`<ul>${members.map(member => this.renderMember(member, collections))}</ul>` : ""}
      </li>
    `;
  }

  render() {
    const rootPath = this.isApiRoot ? [] : [this.root?.["@id"]];
    const members = this.tree?.get(this.root?.["@id"]) || [];
    const rootExpanded = this.collectionExpanded(this.root, true);
    return html`
      <aside>
        <h2>Collections</h2>
        <ul class="collection-tree">
          <li>
            <button class="tree-item tree-root" aria-expanded=${rootExpanded}
              @click=${() => this.toggleCollection(this.root, true)}>
              <span class="tree-marker" aria-hidden="true">${members.length ? rootExpanded ? "▾" : "▸" : ""}</span>
              <span>${this.root?.title}</span>
            </button>
            ${rootExpanded && members.length ? html`<ul>${members.map(member => this.renderMember(member, rootPath))}</ul>` : ""}
          </li>
        </ul>
      </aside>
    `;
  }
}

customElements.define("dtsf-collections", DtsCollections);
