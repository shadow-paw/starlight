import * as THREE from "three";
import * as Stats from "stats.js";
import { IStage } from "./stage/istage";
import { MainStage } from "./stage/main";

export class Application {
    private run: boolean;
    private stats: Stats;
    private animateTimer: number | undefined;
    private renderer: THREE.WebGLRenderer;
    private lastT: DOMHighResTimeStamp;
    private stage: IStage | null;

    constructor() {
        this.lastT = 0;
        this.stage = null;
        this.run = false;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', () => this.on_resize(), false);

        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);
    }
    start() {
        this.stage = new MainStage();
        this.stage.enter();
        this.run = true;
        this.lastT = performance.now();
        this.animate(this.lastT);
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
        this.stats.begin();
        this.on_animate(t);
        this.stats.end();
        this.animateTimer = requestAnimationFrame((x) => this.animate(x));
    }
    private on_resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.stage.resize(window.innerWidth, window.innerHeight);
    }
    private on_animate(t: DOMHighResTimeStamp) {
        const dt = t - this.lastT;
        this.lastT = t;
        this.stage.animate(this.renderer, dt);
    }
}
