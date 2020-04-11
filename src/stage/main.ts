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
        this.scene?.enter();
    }
    leave(): void {
        if (this.scene) {
            this.scene?.leave();
            this.scene = null;
        }
    }
    resize(width: number, height: number): void {
        this.scene?.resize(width, height);
    }
    animate(renderer: THREE.WebGLRenderer, dt: number): void {
        this.scene?.animate(renderer, dt);
    }
    onMouseUp(ev: MouseEvent): void {
        this.scene?.onMouseUp(ev);
    }
    onMouseDown(ev: MouseEvent): void {
        this.scene?.onMouseDown(ev);
    }
    onMouseMove(ev: MouseEvent): void {
        this.scene?.onMouseMove(ev);
    }
    onMouseClick(ev: MouseEvent): void {
        this.scene?.onMouseClick(ev);
    }
}
