import { LitElement, html } from "lit";

class DtsResources extends LitElement {
  static properties = {
    selected: {},
    content: {}
  };

  createRenderRoot() {
    return this;
  }

  renderResource(resource) {
    return html`
      <article>
        <h3>${resource.title}</h3>
        ${resource.description ? html`<p>${resource.description}</p>` : ""}
      </article>
    `;
  }

  render() {
    return html`
      <section>
        <h2>Resource</h2>
        ${this.selected
          ? html`${this.renderResource(this.selected)}
            <pre><code data-caption="TEI/XML">${this.content}</code></pre>`
          : html`<p>Select a resource</p>`}
      </section>
    `;
  }
}

customElements.define("dtsf-resources", DtsResources);
