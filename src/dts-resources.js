import { LitElement, html } from "lit";

class DtsResources extends LitElement {
  static properties = {
    resources: {}
  };

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <section>
        <h2>Resources</h2>
        ${this.resources?.map(resource => html`
          <article>
            <h3>${resource.title}</h3>
            ${resource.description ? html`<p>${resource.description}</p>` : ""}
          </article>
        `)}
      </section>
    `;
  }
}

customElements.define("dts-resources", DtsResources);
