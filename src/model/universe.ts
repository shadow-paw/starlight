import { Vector3 } from "three";
import { Planet } from "./planet";

const PI = 3.141592675;

export class Universe {
    private planets: Planet[][] = [];
    private active: number;
    G: number;
    onPlanetMerge?: (id1: number, id2: number) => void;

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
                id: i,
                changed: false,
                dead: false,
                mass: Math.random() * (maxMass - 0.1) + 0.1,
                radius: Math.random() * 0.9 + 0.1,
                position: this.randomVector(10, maxR),
                velocity: this.randomVector(0, maxVelocity),
            }
        }
        for (let i=0; i<numPlanets; i++) {
            this.planets[1][i] = {
                id: i,
                changed: false,
                dead: false,
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
        // collsion
        for (let i=0; i<current.length; i++) {
            if (current[i].dead) continue;
            next[i].changed = false;
            for (let j=0; j<current.length; j++) {
                if (i === j || current[j].dead) continue;
                const ds = current[i].position.distanceTo(current[j].position);
                if (ds <= current[i].radius + current[j].radius) {
                    current[i].mass = current[i].mass + current[j].mass;
                    const v1 = 4 * PI / 3 * Math.pow(current[i].radius, 3);
                    const v2 = 4 * PI / 3 * Math.pow(current[j].radius, 3);
                    current[i].radius = Math.pow((v1 + v2) * 3 / (4 * PI), 0.33333);
                    current[j].dead = true;
                    next[i].mass = current[i].mass;
                    next[i].radius = current[i].radius;
                    next[i].changed = true;
                    next[j].dead = true;
                }
            }
        }
        for (let i=0; i<current.length; i++) {
            if (current[i].dead) continue;
            gravity.set(0, 0, 0);
            // calculate gravity from all other objects
            for (let j=0; j<current.length; j++) {
                if (i === j || current[j].dead) continue;
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
            if (next[i].dead) continue;
            next[i].position.copy(current[i].position);
            next[i].position.add(next[i].velocity.clone().multiplyScalar(dt));
        }
        this.active = nextIndex;
    }
}
