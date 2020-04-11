import * as THREE from "three";
import { IStage } from "./istage";
import { IScene } from "../scene/iscene";
import { UniverseScene } from "../scene/universe";

export class MainStage implements IStage {
    private scene: IScene | null;

    constructor() {
        this.scene = null;
    }
    enter(): void {
        this.scene = new UniverseScene();
        this.scene.enter();
    }
    leave(): void {
        if (this.scene) {
            this.scene.leave();
            this.scene = null;
        }
    }
    resize(width: number, height: number): void {
        this.scene.resize(width, height);
    }
    animate(renderer: THREE.WebGLRenderer, dt: number): void {
        if (!this.scene) return;
        this.scene.animate(renderer, dt);
    }
    onMouseUp(ev: MouseEvent): void {
        if (this.scene) this.scene.onMouseUp(ev);
    }
    onMouseDown(ev: MouseEvent): void {
        if (this.scene) this.scene.onMouseDown(ev);
    }
    onMouseMove(ev: MouseEvent): void {
        if (this.scene) this.scene.onMouseMove(ev);
    }
    onMouseClick(ev: MouseEvent): void {
        if (this.scene) this.scene.onMouseClick(ev);
    }
}
