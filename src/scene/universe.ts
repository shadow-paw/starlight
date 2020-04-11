import * as THREE from "three";
import * as DAT from "dat.gui";
import { IScene } from "./iscene";
import { Universe } from "../model/universe";

interface UniverseOptions {
    gravity: number;
    numPlanets: number;
    maxR: number;
    maxVelocity: number;
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

    constructor() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 4000);
        this.camera.position.set(-100, -100, 1200);
        this.scene = null;
        this.geometry = null;
        this.material = null;
        this.meshes = [];
        this.universe = null;
        this.options = { gravity: 50, numPlanets: 1000, maxR: 1000, maxVelocity: 50 };
        this.gui = new DAT.GUI({
            width : 256
        });
        this.gui.add(this.options, 'gravity')
                .name('Gravity')
                .min(0)
                .max(100)
                .step(10)
                .onFinishChange(() => this.onOptionsUpdated());
        this.gui.add(this.options, 'maxR')
                .name('Size of universe')
                .min(100)
                .max(2000)
                .step(10)
                .onFinishChange(() => this.onOptionsUpdated());
        this.gui.add(this.options, 'numPlanets')
                .name('Planets')
                .min(100)
                .max(2500)
                .step(10)
                .onFinishChange(() => this.onOptionsUpdated());
        this.gui.add(this.options, 'maxVelocity')
                .name('Initial Velocity')
                .min(1)
                .max(100)
                .step(5)
                .onFinishChange(() => this.onOptionsUpdated());
    }
    enter(): void {
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
        renderer.render(this.scene, this.camera);
    }
    private onOptionsUpdated(): void {
        // remove previous mesh
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        // re-create world
        this.universe.G = this.options.gravity * 0.001;
        this.universe.randomize(this.options.numPlanets, this.options.maxR, this.options.maxVelocity / 1000);
        const planets = this.universe.getPlanets();
        this.meshes = new Array<THREE.Mesh>(planets.length);
        for (let i=0; i<planets.length; i++) {
            const mesh = new THREE.Mesh(this.geometry, this.material);
            mesh.position.x = planets[i].position.x;
            mesh.position.y = planets[i].position.y;
            mesh.position.z = planets[i].position.z;
            this.meshes[i] = mesh;
            this.scene.add(mesh);
        }
    }
    private tick(dt: number): void {
        if (!this.universe) return;
        this.universe.tick(dt);
        const planets = this.universe.getPlanets();
        for (let i=0; i<planets.length; i++) {
            this.meshes[i].position.x = planets[i].position.x;
            this.meshes[i].position.y = planets[i].position.y;
            this.meshes[i].position.z = planets[i].position.z;
        }
    }
}
