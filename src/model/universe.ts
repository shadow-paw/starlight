import { Vector3 } from "three";
import { Planet } from "./planet";

const G = 0.1;

export class Universe {
    private planets: Planet[][] = [];
    private active: number;

    constructor() {
        this.active = 0;
        this.planets = new Array<Planet[]>(2);
    }
    getPlanets(): Planet[] {
        return this.planets[this.active];
    }
    private randomVector(length: number): Vector3 {
        const x = Math.random() - 0.5;
        const y = Math.random() - 0.5;
        const z = Math.random() - 0.5;
        const mag = Math.sqrt(x*x + y*y + z*z);
        const scale = length / mag;
        return new Vector3(x * scale, y * scale, z * scale);
    }
    randomize(numPlanets: number, maxR: number, maxVelocity: number): void {
        this.planets[0] = new Array<Planet>(numPlanets);
        this.planets[1] = new Array<Planet>(numPlanets);
        this.active = 0;
        for (let i = 0; i < numPlanets; i++) {
            this.planets[0][i] = {
                mass: Math.random() * 0.999 + 0.001,
                radius: Math.random() * 0.9 + 0.1,
                position: this.randomVector(maxR * Math.random()),
                velocity: this.randomVector(maxVelocity * Math.random()),
            }
        }
        for (let i = 0; i < numPlanets; i++) {
            this.planets[1][i] = {
                mass: 0,
                radius: 0,
                position: new Vector3(),
                velocity: new Vector3(),
            }
        }
    }
    tick(dt: number) {
        const nextIndex = 1 - this.active;
        const current = this.planets[this.active];
        const next = this.planets[nextIndex];
        for (let i = 0; i < current.length; i++) {
            // calculate gravity from all other objects
            const gravity = new Vector3();
            for (let j = 0; j < current.length; j++) {
                if (i === j) continue;
                const dir = new Vector3().subVectors(current[j].position, current[i].position);
                const mag = dir.length();
                const strength = G * current[i].mass * current[j].mass / (mag * mag);
                dir.multiplyScalar(strength / mag);
                gravity.add(dir);
            }
            // contribute to velocity
            next[i].velocity.copy(current[i].velocity);
            next[i].velocity.add(gravity.multiplyScalar(dt));
        }
        // update object positions
        for (let i = 0; i < current.length; i++) {
            next[i].position.copy(current[i].position);
            next[i].position.add(next[i].velocity.clone().multiplyScalar(dt));
        }
        this.active = nextIndex;
    }
}
