import * as THREE from "three";

export interface IStage {
    enter(): void;
    leave(): void;
    resize(width: number, height: number): void;
    animate(renderer: THREE.WebGLRenderer, dt: number): void;
    onMouseUp(ev: MouseEvent): void;
    onMouseDown(ev: MouseEvent): void;
    onMouseMove(ev: MouseEvent): void;
    onMouseClick(ev: MouseEvent): void;
}
