import { LitElement, html } from "lit";

class DtsCollections extends LitElement {
  static properties = {
    collections: {},
    root: {},
    selected: {},
    tree: {}
  };

  createRenderRoot() {
    return this;
  }

  select(id) {
    this.dispatchEvent(new CustomEvent("collection-select", {
      detail: id,
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

  renderCollection(collection) {
    const children = this.tree?.get(collection["@id"]) || [];
    return html`
      <li>
        <details @toggle=${event => this.expand(event, collection)}>
          <summary>${collection.title}</summary>
          <button aria-pressed=${this.selected === collection["@id"]}
            @click=${() => this.select(collection["@id"])}>Auswählen</button>
          ${children.length ? html`<ul>${children.map(child => this.renderCollection(child))}</ul>` : ""}
        </details>
      </li>
    `;
  }

  render() {
    return html`
      <aside>
        <h2>Collections</h2>
        <nav>
          <button aria-pressed=${!this.selected}
            @click=${() => this.select(null)}>${this.root?.title}</button>
          <ul>
            ${this.collections?.map(collection => this.renderCollection(collection))}
          </ul>
        </nav>
      </aside>
    `;
  }
}

customElements.define("dts-collections", DtsCollections);
