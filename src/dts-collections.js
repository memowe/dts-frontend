import { LitElement, html } from "lit";

class DtsCollections extends LitElement {
  static properties = {
    collections: {},
    root: {},
    selected: {}
  };

  createRenderRoot() {
    return this;
  }

  select(event, id) {
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("collection-select", {
      detail: id,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <aside>
        <h2>Collections</h2>
        <nav>
          <ul>
            <li>
              <a href="#" aria-current=${this.selected ? "false" : "page"}
                @click=${event => this.select(event, null)}>${this.root?.title}</a>
            </li>
            ${this.collections?.map(collection => html`
              <li>
                <a href="#collection=${encodeURIComponent(collection["@id"])}"
                  aria-current=${this.selected === collection["@id"] ? "page" : "false"}
                  @click=${event => this.select(event, collection["@id"])}>${collection.title}</a>
              </li>
            `)}
          </ul>
        </nav>
      </aside>
    `;
  }
}

customElements.define("dts-collections", DtsCollections);
