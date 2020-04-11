import { Vector3 } from "three";
import { Planet } from "./planet";

export class Universe {
    private planets: Planet[][] = [];
    private active: number;
    G: number;

    constructor() {
        this.G = 1;
        this.active = 0;
        this.planets = new Array<Planet[]>(2);
    }
    getPlanets(): Planet[] {
        return this.planets[this.active];
    }
    private randomVector(minLength: number, maxLength: number): Vector3 {
        const x = Math.random() - 0.5;
        const y = Math.random() - 0.5;
        const z = Math.random() - 0.5;
        const r = Math.random() * (maxLength - minLength) + minLength;
        const mag = Math.sqrt(x*x + y*y + z*z);
        const scale = r / mag;
        return new Vector3(x * scale, y * scale, z * scale);
    }
    randomize(numPlanets: number, maxR: number, maxMass: number, maxVelocity: number): void {
        this.planets[0] = new Array<Planet>(numPlanets);
        this.planets[1] = new Array<Planet>(numPlanets);
        this.active = 0;
        for (let i=0; i<numPlanets; i++) {
            this.planets[0][i] = {
                mass: Math.random() * (maxMass - 0.1) + 0.1,
                radius: Math.random() * 0.9 + 0.1,
                position: this.randomVector(10, maxR),
                velocity: this.randomVector(0, maxVelocity),
            }
        }
        for (let i=0; i<numPlanets; i++) {
            this.planets[1][i] = {
                mass: this.planets[0][i].mass,
                radius: this.planets[0][i].radius,
                position: new Vector3(),
                velocity: new Vector3(),
            }
        }
    }
    tick(dt: number) {
        const nextIndex = 1 - this.active;
        const current = this.planets[this.active];
        const next = this.planets[nextIndex];
        const gravity = new Vector3();
        const dir = new Vector3();
        for (let i=0; i<current.length; i++) {
            gravity.set(0, 0, 0);
            // calculate gravity from all other objects
            for (let j=0; j<current.length; j++) {
                if (i === j) continue;
                dir.subVectors(current[j].position, current[i].position);
                const mag2 = dir.lengthSq();
                if (mag2 > 0) {
                    const strength = this.G * current[i].mass * current[j].mass / (mag2);
                    dir.multiplyScalar(strength / Math.sqrt(mag2));
                    gravity.add(dir);
                }
            }
            // contribute to velocity
            next[i].velocity.copy(current[i].velocity);
            next[i].velocity.add(gravity.multiplyScalar(dt));
        }
        // update object positions
        for (let i=0; i<current.length; i++) {
            next[i].position.copy(current[i].position);
            next[i].position.add(next[i].velocity.clone().multiplyScalar(dt));
        }
        this.active = nextIndex;
    }
}
