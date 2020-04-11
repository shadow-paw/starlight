import * as THREE from "three";
import { IStage } from "./istage";

export class MainStage implements IStage {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene | null;
    private mesh: THREE.Mesh | null;
    private geometry: THREE.BoxGeometry | null;
    private material: THREE.MeshNormalMaterial | null;

    constructor() {
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
        this.camera.position.z = 1;
    }
    enter(): void {
        this.scene = new THREE.Scene();
        this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        this.material = new THREE.MeshNormalMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }
    leave(): void {
        this.scene.remove(this.mesh);
        this.scene.dispose(); this.scene = null;
        this.mesh = null;
        this.geometry.dispose(); this.geometry = null;
        this.material.dispose(); this.material = null;
    }
    resize(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    animate(renderer: THREE.WebGLRenderer, t: DOMHighResTimeStamp): void {
        if (!this.scene) return;

        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.02;
        renderer.render(this.scene, this.camera);
    }
}
