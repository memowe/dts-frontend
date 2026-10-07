import { LitElement, html } from "lit";

class DtsResources extends LitElement {
  static properties = {
    resources: {},
    selected: {},
    content: {}
  };

  createRenderRoot() {
    return this;
  }

  select(id) {
    this.dispatchEvent(new CustomEvent("resource-select", {
      detail: id,
      bubbles: true,
      composed: true
    }));
  }

  renderResource(resource, selected = false) {
    return html`
      <article>
        <h3>
          ${selected ? resource.title : html`
            <button @click=${() => this.select(resource["@id"])}>${resource.title}</button>
          `}
        </h3>
        ${resource.description ? html`<p>${resource.description}</p>` : ""}
      </article>
    `;
  }

  render() {
    return html`
      <section>
        <h2>Resources</h2>
        ${this.selected
          ? html`${this.renderResource(this.selected, true)}
            <pre>${this.content}</pre>
            <button @click=${() => this.select(null)}>All resources</button>`
          : this.resources?.map(resource => this.renderResource(resource))}
      </section>
    `;
  }
}

customElements.define("dts-resources", DtsResources);
