import { LitElement, html, nothing } from "lit";

class DtsCollections extends LitElement {
  static properties = {
    root: {},
    apiRoot: { type: Boolean },
    collectionPath: {},
    tree: {},
    treeErrors: {},
    loadingChildren: {}
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

  expand(event, collection) {
    if (event.target.open && collection.totalChildren !== 0 && !this.tree?.has(collection["@id"])) {
      this.dispatchEvent(new CustomEvent("collection-expand", {
        detail: collection,
        bubbles: true,
        composed: true
      }));
    }
  }

  renderCollection(collection, path) {
    const children = this.tree?.get(collection["@id"]) || [];
    const selected = path.at(-1) === this.collectionPath?.at(-1);
    const expanded = this.collectionPath?.includes(collection["@id"]);
    return html`
      <li>
        <details ?open=${expanded ? true : nothing} @toggle=${event => this.expand(event, collection)}>
          <summary>${collection.title}</summary>
          <button aria-pressed=${selected}
            @click=${() => this.select(path)}>Auswählen</button>
          ${this.loadingChildren?.has(collection["@id"]) ? html`<p>Lade …</p>` : ""}
          ${this.treeErrors?.get(collection["@id"])
            ? html`<p role="alert">${this.treeErrors.get(collection["@id"])}</p>`
            : ""}
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
            @click=${() => this.select(this.apiRoot ? [] : [this.root?.["@id"]])}>
            ${this.root?.title}
          </button>
          <ul>
            ${this.tree?.get(this.root?.["@id"])?.map(collection =>
              this.renderCollection(collection, this.apiRoot ? [collection["@id"]] : [this.root["@id"], collection["@id"]])
            )}
          </ul>
        </nav>
      </aside>
    `;
  }
}

customElements.define("dts-collections", DtsCollections);
