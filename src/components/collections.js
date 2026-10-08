import { LitElement, html } from "lit";
import { getNavigationPath } from "../lib/navigation.js";

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

  collectionExpanded(collection, root = false) {
    const id = collection["@id"];
    if (this.collapsedCollections?.has(id)) return false;
    return root || this.collectionPath?.includes(id) || this.openCollections?.has(id);
  }

  toggleCollection(event, collection, root = false) {
    const id = collection["@id"];
    const expanded = event.currentTarget.open;
    const openCollections = new Set(this.openCollections || []);
    const collapsedCollections = new Set(this.collapsedCollections || []);

    if (expanded) {
      openCollections.add(id);
      collapsedCollections.delete(id);
    } else {
      openCollections.delete(id);
      collapsedCollections.add(id);
    }

    this.openCollections = openCollections;
    this.collapsedCollections = collapsedCollections;

    if (expanded && Number(collection.totalChildren) !== 0 && !this.tree?.has(id) && !this.treeStatus?.get(id)?.loading) {
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
        <a aria-current=${selected ? "page" : "false"}
          href=${`#${getNavigationPath(collections, resource["@id"])}`}>📄 ${resource.title}
        </a>
      </li>
    `;
  }

  renderMembers(members, collections) {
    return html`
      <ul class="unlist" style="padding-inline-start: 0.75rem">
        ${members.map(member => this.renderMember(member, collections))}
      </ul>
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
      return html`<li>${collection.title}</li>`;
    }

    const expanded = this.collectionExpanded(collection);
    return html`
      <li>
        <details ?open=${expanded} @toggle=${event => this.toggleCollection(event, collection)}>
          <summary>${collection.title}</summary>
          ${status?.error ? html`<p role="alert">${status.error}</p>` : ""}
          ${status?.loading ? html`<p aria-busy="true">Loading…</p>` : ""}
          ${expanded && members.length ? this.renderMembers(members, collections) : ""}
        </details>
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
        <ul class="unlist" style="padding-inline-start: 0">
          <li>
            <details ?open=${rootExpanded} @toggle=${event => this.toggleCollection(event, this.root, true)}>
              <summary>${this.root?.title}</summary>
              ${rootExpanded && members.length ? this.renderMembers(members, rootPath) : ""}
            </details>
          </li>
        </ul>
      </aside>
    `;
  }
}

customElements.define("dtsf-collections", DtsCollections);
