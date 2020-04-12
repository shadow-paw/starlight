import * as THREE from "three";
import { InputHandler } from "../input/handler";

export interface IScene extends InputHandler {
    enter(): void;
    leave(): void;
    resize(width: number, height: number): void;
    animate(renderer: THREE.WebGLRenderer, dt: number): void;
}
