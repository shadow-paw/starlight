import * as THREE from "three";
import { IStage } from "./stage/istage";
import { MainStage } from "./stage/main";

export class Application {
    private run: boolean;
    private animateTimer: number | undefined;
    private renderer: THREE.WebGLRenderer;
    private stage: IStage | null;

    constructor() {
        this.stage = null;
        this.run = false;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', () => this.on_resize(), false);
    }
    start() {
        this.stage = new MainStage();
        this.stage.enter();
        this.run = true;
        this.animate(performance.now());
    }
    stop() {
        this.run = false;
        if (this.animateTimer) {
            cancelAnimationFrame(this.animateTimer);
            this.animateTimer = undefined;
        }
        if (this.stage) {
            this.stage.leave();
            this.stage = null;
        }
    }
    private animate(t: DOMHighResTimeStamp) {
        if (!this.run) return;
        this.animateTimer = requestAnimationFrame((x) => this.animate(x));
        this.on_animate(t);
    }
    private on_resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.stage.resize(window.innerWidth, window.innerHeight);
    }
    private on_animate(t: DOMHighResTimeStamp) {
        this.stage.animate(this.renderer, t);
    }
}
