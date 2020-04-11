import * as THREE from "three";

export interface IStage {
    enter(): void;
    leave(): void;
    resize(width: number, height: number): void;
    animate(renderer: THREE.WebGLRenderer, dt: number): void;
}
