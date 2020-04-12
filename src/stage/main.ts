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
    onMouseDown(ev: MouseEvent): void {
        this.scene?.onMouseDown(ev);
    }
    onMouseUp(ev: MouseEvent): void {
        this.scene?.onMouseUp(ev);
    }
    onMouseMove(ev: MouseEvent): void {
        this.scene?.onMouseMove(ev);
    }
    onMouseWheel(ev: WheelEvent): void {
        this.scene?.onMouseWheel(ev);
    }
    onMouseClick(button: number): void {
        this.scene?.onMouseClick(button);
    }
    onTouchStart(ev: TouchEvent): void {
        this.scene?.onTouchStart(ev);
    }
    onTouchEnd(ev: TouchEvent): void {
        this.scene?.onTouchEnd(ev);
    }
    onTouchCancel(ev: TouchEvent): void {
        this.scene?.onTouchCancel(ev);
    }
    onTouchMove(ev: TouchEvent): void {
        this.scene?.onTouchMove(ev);
    }
}
