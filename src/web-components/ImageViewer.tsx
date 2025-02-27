import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { PhotoView, PhotoProvider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

class ImageViewer extends HTMLElement {
  private root: ReactDOM.Root | null = null;
  private src: string = '';
  private alt: string = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['src', 'alt'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'src') this.src = newValue;
    if (name === 'alt') this.alt = newValue;
    this.render();
  }

  private ImageComponent = () => {
    const [showModal, setShowModal] = React.useState(false);

    return (
      <PhotoProvider maskOpacity={0.5}>
        <PhotoView src={this.src}>
          <img src={this.src} alt={this.alt} onClick={() => setShowModal(true)} />
        </PhotoView>
      </PhotoProvider>
    );
  };

  private render() {
    if (!this.shadowRoot) return;

    if (!this.root) {
      this.root = ReactDOM.createRoot(this.shadowRoot);
    }
    this.root.render(<this.ImageComponent />);
  }
}

customElements.define('copus-image-viewer', ImageViewer);
