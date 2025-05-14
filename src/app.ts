import { container } from "tsyringe";
import * as THREE from "three";
import { CSS2DRenderer } from "three/addons";
import { WebGL } from "three/examples/jsm/Addons";
import * as Stats from "stats.js";
import { styles as typescaleStyles } from "@material/web/typography/md-typescale-styles.js";
import { Simulator } from "./simulator/simulator";

export class Application {
  private renderer: THREE.WebGLRenderer;
  private css: CSS2DRenderer;
  private simulator: Simulator;
  private stats: Stats;

  constructor() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.css = new CSS2DRenderer();
    this.css.domElement.style.position = "absolute";
    this.css.domElement.style.top = "0px";
    container.register<THREE.WebGLRenderer>(THREE.WebGLRenderer, {
      useValue: this.renderer,
    });
    container.register<CSS2DRenderer>(CSS2DRenderer, {
      useValue: this.css,
    });
    this.simulator = new Simulator();
    this.stats = new Stats();
    $(this.stats.dom).css("pointer-events", "auto");
  }
  init(): void {
    document.adoptedStyleSheets.push(typescaleStyles.styleSheet!);
    $("#container_3d").append(this.renderer.domElement);
    $("#container_3d").append(this.css.domElement);
    $("#container_stats").append(this.stats.dom);
    window.addEventListener("resize", this.onWindowResized, false);
    document.body.addEventListener("keydown", this.onKeyDown, false);
    this.simulator.init();
    this.onWindowResized();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  }
  fini(): void {
    this.simulator.dispose();
    document.body.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("resize", this.onWindowResized);
    this.stats.dom.remove();
    this.css.domElement.remove();
    this.renderer.domElement.remove();
  }
  start(): void {
    if (!WebGL.isWebGL2Available()) {
      $("#container_dom").append(WebGL.getWebGL2ErrorMessage());
      return;
    }
    requestAnimationFrame(this.render);
    console.log("App started.");
  }
  private shouldIgnoreKey(ev: KeyboardEvent): boolean {
    const keysToIgnore = ["F5", "F12"];
    return keysToIgnore.indexOf(ev.key) !== -1;
  }
  private onKeyDown = (ev: KeyboardEvent): void => {
    if (this.shouldIgnoreKey(ev)) return;
    this.simulator.onKeyDown(ev);
  };
  private render = (_timestamp: DOMHighResTimeStamp): void => {
    this.stats.begin();
    this.simulator.render();
    this.stats.end();
    requestAnimationFrame(this.render);
  };
  private onWindowResized = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.css.setSize(width, height);
    this.simulator.setSize(width, height);
  };
}
