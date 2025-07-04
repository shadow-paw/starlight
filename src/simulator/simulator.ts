import * as THREE from "three";
import * as DAT from "dat.gui";
import {
  CSS2DRenderer,
  LineMaterial,
  LineSegments2,
  LineSegmentsGeometry,
  OrbitControls,
} from "three/addons";
import { container } from "tsyringe";
import { SpaceTopology, WorldState, WorldStateOptions } from "./state";
import TemperatureSpectrum from "@assets/temperature_spectrum.png";

interface SimulatorOptions {
  stateOptions: WorldStateOptions;
}

export class Simulator {
  private renderer: THREE.WebGLRenderer;
  private css: CSS2DRenderer;
  private controls: OrbitControls;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private texTemperature: THREE.Texture;
  private state: WorldState;
  private cameraScale: number = 1.0;
  private options: SimulatorOptions;
  private paused: boolean = false;
  private gui: {
    root: DAT.GUI;
    gravity: {
      folder: DAT.GUI;
      strength: DAT.GUIController | null;
      MONDa0: DAT.GUIController | null;
    };
  };

  constructor() {
    this.renderer = container.resolve(THREE.WebGLRenderer);
    this.css = container.resolve(CSS2DRenderer);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000000);
    this.controls = new OrbitControls(this.camera, $("#container_3d")[0]);
    this.controls.update();
    this.state = new WorldState(this.renderer);
    // load textures
    const texLoader = new THREE.TextureLoader();
    this.texTemperature = texLoader.load(TemperatureSpectrum);
    this.options = {
      stateOptions: {
        spaceTopology: "normal",
        spaceRadius: 1000,
        collisions: true,
        gravityLaw: "newton",
        gravity: 1,
        gravityMondA0: 100,
        nParticles: 10000,
        density: 1,
        initialDistribution: "spherical",
        initialMass: 100,
        initialVelocity: 100,
      },
    };
    const gui = new DAT.GUI({
      autoPlace: true,
      width: 256,
    });
    $(gui.domElement).css("pointer-events", "auto");
    const guiPhysics = gui.addFolder("Physics");
    guiPhysics.open();
    guiPhysics
      .add(this.options.stateOptions, "spaceRadius", 1000, 10000, 100)
      .name("Universe Size")
      .onChange(() => this.onOptionsUpdated());
    guiPhysics
      .add(this.options.stateOptions, "spaceTopology", {
        Normal: "normal",
        Torus: "torus",
      })
      .name("Topology")
      .onChange(() => this.onOptionsUpdated());
    guiPhysics
      .add(this.options.stateOptions, "collisions")
      .name("Collisions")
      .onChange(() => this.onOptionsUpdated());
    const guiGravity = gui.addFolder("Gravity");
    guiGravity.open();
    guiGravity
      .add(this.options.stateOptions, "gravityLaw", {
        Disabled: "none",
        Newton: "newton",
        MOND: "mond",
      })
      .name("Law")
      .onChange(() => {
        this.updateGravityMenu();
        this.onOptionsUpdated();
      });
    const gravityStrength = guiGravity
      .add(this.options.stateOptions, "gravity", -100, 100, 1)
      .name("Strength")
      .onChange(() => this.onOptionsUpdated());
    const guiInitialCondition = gui.addFolder("Initial Condition");
    guiInitialCondition.open();
    guiInitialCondition
      .add(this.options.stateOptions, "nParticles", 10, 20000, 10)
      .name("Particles")
      .onChange(() => this.onOptionsUpdated());
    guiInitialCondition
      .add(this.options.stateOptions, "initialDistribution", {
        Spherical: "spherical",
        Cubical: "cubical",
      })
      .name("Distribution")
      .onChange(() => this.onOptionsUpdated());
    guiInitialCondition
      .add(this.options.stateOptions, "initialMass", 0, 1000, 1)
      .name("Initial Mass")
      .onChange(() => this.onOptionsUpdated());
    guiInitialCondition
      .add(this.options.stateOptions, "initialVelocity", 0, 5000, 1)
      .name("Initial Velocity")
      .onChange(() => this.onOptionsUpdated());
    this.gui = {
      root: gui,
      gravity: {
        folder: guiGravity,
        strength: gravityStrength,
        MONDa0: null,
      },
    };
  }
  dispose(): void {
    this.scene.clear();
    this.texTemperature.dispose();
    this.controls.dispose();
    this.state.dispose();
    this.gui.root.domElement.remove();
  }
  init(): void {
    $("#container_dom").append(this.gui.root.domElement);
    this.scene.clear();
    this.onOptionsUpdated();
  }
  setSize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.cameraScale =
      height /
      (Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * this.camera.fov) /
        this.camera.zoom);
    this.state.updateCameraScale(this.cameraScale);
  }
  onOptionsUpdated(): void {
    this.scene.clear();
    this.camera.position.set(
      this.options.stateOptions.spaceRadius * 1.5,
      this.options.stateOptions.spaceRadius * 1.5,
      this.options.stateOptions.spaceRadius * 3,
    );
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.controls.update();
    this.state.restart(this.options.stateOptions, this.texTemperature);
    this.state.updateCameraScale(this.cameraScale);
    if (this.state.model) {
      this.scene.add(this.state.model);
    }
    this.addBound(this.scene, this.options.stateOptions.spaceTopology);
    this.state.tick();
  }
  onKeyDown(ev: KeyboardEvent): void {
    if (ev.key == " ") {
      this.paused = !this.paused;
    } else if (ev.key == "r") {
      this.onOptionsUpdated();
    }
  }
  render() {
    if (!this.paused) {
      this.state.tick();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.css.render(this.scene, this.camera);
  }
  private updateGravityMenu(): void {
    if (
      this.options.stateOptions.gravityLaw == "newton" ||
      this.options.stateOptions.gravityLaw == "mond"
    ) {
      if (this.gui.gravity.strength == null) {
        this.gui.gravity.strength = this.gui.gravity.folder
          .add(this.options.stateOptions, "gravity", -100, 100, 1)
          .name("Strength")
          .onChange(() => this.onOptionsUpdated());
      }
    } else {
      this.gui.gravity.strength?.remove();
      this.gui.gravity.strength = null;
    }
    if (this.options.stateOptions.gravityLaw == "mond") {
      if (this.gui.gravity.MONDa0 == null) {
        this.gui.gravity.MONDa0 = this.gui.gravity.folder
          .add(this.options.stateOptions, "gravityMondA0", 1, 1000, 1)
          .name("MOND: a₀")
          .onChange(() => this.onOptionsUpdated());
      }
    } else {
      this.gui.gravity.MONDa0?.remove();
      this.gui.gravity.MONDa0 = null;
    }
  }
  private addBound(scene: THREE.Scene, topology: SpaceTopology): void {
    if (topology == "torus") {
      const box = new THREE.BoxGeometry(
        this.options.stateOptions.spaceRadius * 2,
        this.options.stateOptions.spaceRadius * 2,
        this.options.stateOptions.spaceRadius * 2,
      );
      const line = new LineSegments2(
        new LineSegmentsGeometry().fromEdgesGeometry(
          new THREE.EdgesGeometry(box),
        ),
        new LineMaterial({
          dashed: true,
          color: 0x2f2f2f,
          opacity: 0.4,
          depthTest: false,
          transparent: true,
        }),
      );
      scene.add(line);
    }
  }
}
