import * as THREE from "three";
import { IScene } from "./iscene";
import { Universe } from "../model/universe";

export class UniverseScene implements IScene {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private meshes: THREE.Mesh[];
    private geometry: THREE.Geometry;
    private material: THREE.Material;
    private universe: Universe | null;

    constructor() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 4000);
        this.camera.position.set(-100, -100, 1200);
        this.scene = new THREE.Scene();
        this.geometry = new THREE.SphereGeometry(1.0);
        this.material = new THREE.MeshNormalMaterial();
        this.meshes = [];
        this.universe = null;
    }
    enter(): void {
        this.universe = new Universe();
        this.universe.randomize(1000, 1000, 0.1);

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
    leave(): void {
        // remove previous mesh
        this.meshes.forEach(mesh => this.scene.remove(mesh));

        this.scene.dispose();
        this.geometry.dispose();
        this.material.dispose();
        this.meshes = [];
        this.universe = null;
    }
    resize(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    animate(renderer: THREE.WebGLRenderer, dt: number): void {
        this.tick(dt);
        renderer.render(this.scene, this.camera);
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
