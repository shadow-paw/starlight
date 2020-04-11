import { Vector3 } from "three";

export interface Planet {
    mass: number;
    radius: number;
    position: Vector3;
    velocity: Vector3;
}
