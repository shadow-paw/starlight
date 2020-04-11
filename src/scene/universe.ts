import * as THREE from "three";
import * as DAT from "dat.gui";
import { IScene } from "./iscene";
import { Universe } from "../model/universe";

interface UniverseOptions {
    gravity: number;
    Ru: number;
    planets: number;
    mass: number;
    velocity: number;
}

export class UniverseScene implements IScene {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene | null;
    private geometry: THREE.Geometry | null;
    private material: THREE.Material | null;
    private meshes: THREE.Mesh[];
    private universe: Universe | null;
    private gui: DAT.GUI;
    private options: UniverseOptions;
    private paused: boolean;

    constructor() {
        this.paused = false;
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 4000);
        this.camera.position.set(-100, -100, 1200);
        this.scene = null;
        this.geometry = null;
        this.material = null;
        this.meshes = [];
        this.universe = null;
        this.options = { gravity: 100, Ru: 500, planets: 1000, mass: 100, velocity: 20 };
        this.gui = new DAT.GUI({
            width : 256
        });
        this.gui.add(this.options, 'gravity')
                .name('Gravity')
                .min(0)
                .max(1000)
                .step(10)
                .onFinishChange(() => this.onOptionsUpdated());
        this.gui.add(this.options, 'Ru')
                .name('Size of universe')
                .min(100)
                .max(5000)
                .step(10)
                .onFinishChange(() => this.onOptionsUpdated());
        this.gui.add(this.options, 'planets')
                .name('Planets')
                .min(100)
                .max(3000)
                .step(10)
                .onFinishChange(() => this.onOptionsUpdated());
        this.gui.add(this.options, 'mass')
                .name('Mass')
                .min(10)
                .max(1000)
                .step(10)
                .onFinishChange(() => this.onOptionsUpdated());
        this.gui.add(this.options, 'velocity')
                .name('Initial Velocity')
                .min(1)
                .max(100)
                .step(5)
                .onFinishChange(() => this.onOptionsUpdated());
    }
    enter(): void {
        this.paused = false;
        this.scene = new THREE.Scene();
        this.geometry = new THREE.SphereGeometry(1.0);
        this.material = new THREE.MeshNormalMaterial();
        this.universe = new Universe();
        this.onOptionsUpdated();
    }
    leave(): void {
        // remove previous mesh
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.scene.dispose();
        this.geometry.dispose();
        this.material.dispose();
        this.meshes = [];
        this.universe = null;
        this.geometry = null;
        this.material = null;
        this.scene = null;
    }
    resize(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    animate(renderer: THREE.WebGLRenderer, dt: number): void {
        this.tick(dt);
        if (this.scene) {
            renderer.render(this.scene, this.camera);
        }
    }
    onMouseUp(ev: MouseEvent): void {
    }
    onMouseDown(ev: MouseEvent): void {
    }
    onMouseMove(ev: MouseEvent): void {
        if (ev.buttons === 1) {
            if (ev.shiftKey) {
                const dir = this.camera.position.clone()
                                                .normalize()
                                                .multiplyScalar(ev.movementY > 0 ? 20 : -20);
                this.camera.position.add(dir);
            } else {
                this.camera.rotateY(ev.movementX * -0.01);
                this.camera.rotateX(ev.movementY * -0.01);
            }
        } else if (ev.buttons === 2) {
            this.camera.position.x -= ev.movementX;
            this.camera.position.y -= ev.movementY;
        }
    }
    onMouseClick(ev: MouseEvent): void {
        this.paused = !this.paused;
    }
    private onOptionsUpdated(): void {
        // remove previous mesh
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        // re-create world
        this.universe.G = this.options.gravity * 0.000000667430;
        this.universe.randomize(this.options.planets,
                                this.options.Ru,
                                this.options.mass * 0.01,
                                this.options.velocity * 0.0005);
        const planets = this.universe.getPlanets();
        this.meshes = new Array<THREE.Mesh>(planets.length);
        for (let i=0; i<planets.length; i++) {
            const mesh = new THREE.Mesh(this.geometry, this.material);
            mesh.position.copy(planets[i].position);
            this.meshes[i] = mesh;
            this.scene.add(mesh);
        }
        // reset camera
        this.camera.position.set(-60, -60, 1200);
        this.camera.rotation.set(0, 0, 0);
    }
    private tick(dt: number): void {
        if (!this.universe) return;
        if (this.paused) return;
        this.universe.tick(dt);
        const planets = this.universe.getPlanets();
        for (let i=0; i<planets.length; i++) {
            this.meshes[i].position.copy(planets[i].position);
        }
    }
}
