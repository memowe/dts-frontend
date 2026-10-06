import { LitElement, html } from "lit";

class DtsCollections extends LitElement {
  static properties = {
    root: {},
    isApiRoot: { type: Boolean },
    collectionPath: {},
    tree: {},
    treeStatus: {},
    openCollections: { state: true }
  };

  createRenderRoot() {
    return this;
  }

  select(path) {
    this.dispatchEvent(new CustomEvent("collection-select", {
      detail: path,
      bubbles: true,
      composed: true
    }));
  }

  toggle(event, collection) {
    const id = collection["@id"];
    const openCollections = new Set(this.openCollections || []);
    if (event.target.open) {
      openCollections.add(id);
    } else {
      openCollections.delete(id);
    }
    this.openCollections = openCollections;

    if (event.target.open && collection.totalChildren !== 0 && !this.tree?.has(id)) {
      this.dispatchEvent(new CustomEvent("collection-expand", {
        detail: collection,
        bubbles: true,
        composed: true
      }));
    }
  }

  renderCollection(collection, path) {
    const children = this.tree?.get(collection["@id"]) || [];
    const status = this.treeStatus?.get(collection["@id"]);
    const selected = path.at(-1) === this.collectionPath?.at(-1);
    const expanded = this.collectionPath?.includes(collection["@id"])
      || this.openCollections?.has(collection["@id"]);
    return html`
      <li>
        <details ?open=${expanded} @toggle=${event => this.toggle(event, collection)}>
          <summary>${collection.title}</summary>
          <button aria-pressed=${selected}
            @click=${() => this.select(path)}>Select</button>
          ${status?.loading ? html`<p>Loading…</p>` : ""}
          ${status?.error ? html`<p role="alert">${status.error}</p>` : ""}
          ${children.length ? html`<ul>${children.map(child =>
            this.renderCollection(child, [...path, child["@id"]])
          )}</ul>` : ""}
        </details>
      </li>
    `;
  }

  render() {
    return html`
      <aside>
        <h2>Collections</h2>
        <nav>
          <button aria-pressed=${!this.collectionPath?.length || this.collectionPath.at(-1) === this.root?.["@id"]}
            @click=${() => this.select(this.isApiRoot ? [] : [this.root?.["@id"]])}>
            ${this.root?.title}
          </button>
          <ul>
            ${this.tree?.get(this.root?.["@id"])?.map(collection =>
              this.renderCollection(collection, this.isApiRoot ? [collection["@id"]] : [this.root["@id"], collection["@id"]])
            )}
          </ul>
        </nav>
      </aside>
    `;
  }
}

customElements.define("dts-collections", DtsCollections);
