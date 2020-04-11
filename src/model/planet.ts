import { Vector3 } from "three";

export interface Planet {
    id: number;
    changed: boolean;
    dead: boolean;
    mass: number;
    radius: number;
    position: Vector3;
    velocity: Vector3;
}
