import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons";
import { CSS2DRenderer } from "three/addons";

export class Renderer {
  renderer: THREE.WebGLRenderer;
  gpu: GPUComputationRenderer;
  css: CSS2DRenderer;

  constructor() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.gpu = new GPUComputationRenderer(1024, 1024, this.renderer); // texture size
    this.css = new CSS2DRenderer();
    this.css.domElement.style.position = "absolute";
    this.css.domElement.style.top = "0px";
  }

  attach(domElement: JQuery<HTMLElement>): void {
    domElement.append(this.renderer.domElement);
    domElement.append(this.css.domElement);
  }

  detach(): void {
    this.css.domElement.remove();
    this.renderer.domElement.remove();
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.css.setSize(width, height);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);
    this.css.render(scene, camera);
  }
}
