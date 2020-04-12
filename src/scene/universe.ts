import * as THREE from "three";
import * as DAT from "dat.gui";
import { IScene } from "./iscene";
import { Universe } from "../model/universe";
import { SimpleGestureDetector } from "../input/gesture/simple";

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
    private gesture: SimpleGestureDetector;

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
        this.gesture = new SimpleGestureDetector();
        this.gesture.onClick = (points) => {
            if (points === 1) this.onMouseClick(1);
        };
        this.gesture.onDrag = (dx, dy) => {
            // TODO: handle pixel density
            this.onDrag(dx * 2, dy * 2);
        };
        this.gesture.onPan = (dx, dy) => this.onPan(dx, dy);
        this.gesture.onZoom = (delta) => this.onZoom(delta);
    }
    enter(): void {
        this.paused = false;
        this.scene = new THREE.Scene();
        this.geometry = new THREE.SphereGeometry(1);
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
    onMouseDown(ev: MouseEvent): void {
    }
    onMouseUp(ev: MouseEvent): void {
    }
    onMouseMove(ev: MouseEvent): void {
        if (ev.buttons === 1) {
            this.onDrag(ev.movementX, ev.movementY);
        } else if (ev.buttons === 2) {
            this.onPan(ev.movementX, -ev.movementY);
        }
    }
    onMouseClick(button: number): void {
        if (button === 1) {
            this.paused = !this.paused;
        }
    }
    onMouseWheel(ev: WheelEvent): void {
        this.onZoom(ev.deltaY > 0 ? 20 : -20);
    }
    onTouchStart(ev: TouchEvent): void {
        this.gesture.touchStart(ev);
    }
    onTouchEnd(ev: TouchEvent): void {
        this.gesture.touchEnd(ev);
    }
    onTouchCancel(ev: TouchEvent): void {
        this.gesture.touchCancel(ev);
    }
    onTouchMove(ev: TouchEvent): void {
        this.gesture.touchMove(ev);
    }
    private onDrag(dx: number, dy: number) {
        this.camera.rotateY(dx * 0.001);
        this.camera.rotateX(dy * 0.001);
    }
    private onPan(dx: number, dy: number) {
        this.camera.position.x -= dx;
        this.camera.position.y -= dy;
    }
    private onZoom(delta: number) {
        const lookAt = new THREE.Vector3(0, 0, -1);
        lookAt.applyQuaternion(this.camera.quaternion)
              .normalize()
              .multiplyScalar(delta);
        this.camera.position.sub(lookAt);
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
        this.camera.position.set(-30, -30, 600);
        this.camera.rotation.set(0, 0, 0);
    }
    private tick(dt: number): void {
        if (!this.universe) return;
        if (this.paused) return;
        this.universe.tick(dt);
        const planets = this.universe.getPlanets();
        for (let i=0; i<planets.length; i++) {
            if (planets[i].changed) {
                this.meshes[i].scale.setLength(planets[i].radius);
            }
            this.meshes[i].visible = !planets[i].dead;
            this.meshes[i].position.copy(planets[i].position);
        }
    }
}
