import * as THREE from "three";
import { ComputeRenderer } from "@/renderer/compute";
import ComputePhysicsShader from "@/shaders/physics_comp.glsl";
import ParticleVertexShader from "@/shaders/particle_vert.glsl";
import ParticleFragmentShader from "@/shaders/particle_frag.glsl";

interface RenderState {
  physics: ComputeRenderer;
  particleGeometry: THREE.BufferGeometry;
  particleUniforms: { [uniform: string]: THREE.IUniform };
  particles: THREE.Points;
}

export type SpaceTopology = "normal" | "torus";
export type GravityLaw = "none" | "newton" | "mond";

export interface WorldStateOptions {
  spaceTopology: SpaceTopology;
  spaceRadius: number;
  collisions: boolean;
  gravityLaw: GravityLaw;
  gravity: number;
  gravityMondA0: number;
  density: number;
  nParticles: number;
  initialDistribution: "cubical" | "spherical";
  initialMass: number;
  initialVelocity: number;
}

export class WorldState {
  private renderer: THREE.WebGLRenderer;
  private renderState: RenderState | null;

  get model(): THREE.Object3D | null {
    return this.renderState?.particles || null;
  }

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.renderState = null;
  }
  dispose(): void {
    if (this.renderState) {
      this.renderState.particleGeometry.dispose();
      this.renderState.physics.dispose();
      this.renderState = null;
    }
  }
  private randomVector(length: number): number[] {
    const theta = Math.acos(Math.random() * 2 - 1);
    const phi = Math.random() * Math.PI * 2;
    const sinTheta = Math.sin(theta);
    const x = length * sinTheta * Math.cos(phi);
    const y = length * sinTheta * Math.sin(phi);
    const z = length * Math.cos(theta);
    return [x, y, z];
  }
  private spaceTopology(name: SpaceTopology): number {
    if (name == "normal") return 0;
    if (name == "torus") return 1;
    return 0;
  }
  private gravityLaw(law: GravityLaw): number {
    if (law == "none") return 0;
    if (law == "newton") return 1;
    if (law == "mond") return 2;
    return 0;
  }
  restart(options: WorldStateOptions, texTemperature: THREE.Texture): void {
    this.dispose();
    const texSize = this.calculateTextureSize(options.nParticles);
    // initial condition
    // texPosition: [x, y, z, radius]
    // texVelocity: [v.x, v.y, v.z, mass]
    const positions = new Float32Array(texSize * texSize * 4);
    const velocities = new Float32Array(texSize * texSize * 4);
    const uvs = new Float32Array(options.nParticles * 2);
    let posIndex = 0,
      velocityIndex = 0,
      uvIndex = 0;
    const particlesPerAxis = Math.floor(Math.cbrt(options.nParticles));
    const particlesPerAxis2 = particlesPerAxis * particlesPerAxis;
    const separation = (options.spaceRadius * 2) / particlesPerAxis;
    for (let i = 0; i < options.nParticles; i++) {
      const mass = options.initialMass;
      const radius = Math.cbrt(
        (mass * 3.0) / (4.0 * Math.PI) / options.density,
      );
      if (options.initialDistribution == "spherical") {
        // spherical volume, cubic root so more particles the further based on volume ratio
        const x = this.randomVector(
          Math.cbrt(Math.random()) * options.spaceRadius,
        );
        positions[posIndex++] = x[0];
        positions[posIndex++] = x[1];
        positions[posIndex++] = x[2];
        positions[posIndex++] = radius;
      } else if (options.initialDistribution == "cubical") {
        // generate cube volume
        const x = i % particlesPerAxis;
        const y = Math.floor(i / particlesPerAxis) % particlesPerAxis;
        const z = Math.floor(i / particlesPerAxis2) % particlesPerAxis;
        positions[posIndex++] =
          -options.spaceRadius + (x + (Math.random() * 0.2 - 0.1)) * separation;
        positions[posIndex++] =
          -options.spaceRadius + (y + (Math.random() * 0.2 - 0.1)) * separation;
        positions[posIndex++] =
          -options.spaceRadius + (z + (Math.random() * 0.2 - 0.1)) * separation;
        positions[posIndex++] = radius;
      }
      const v = this.randomVector(
        Math.random() * options.initialVelocity * 0.01,
      );
      velocities[velocityIndex++] = v[0];
      velocities[velocityIndex++] = v[1];
      velocities[velocityIndex++] = v[2];
      velocities[velocityIndex++] = mass;
      uvs[uvIndex++] = (i % texSize) / (texSize - 1);
      uvs[uvIndex++] = Math.floor(i / texSize) / (texSize - 1);
    }
    const texPosition = new THREE.DataTexture(
      positions,
      texSize,
      texSize,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    const texVelocity = new THREE.DataTexture(
      velocities,
      texSize,
      texSize,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    texPosition.needsUpdate = true;
    texVelocity.needsUpdate = true;

    const physics = new ComputeRenderer(ComputePhysicsShader, texSize, 2);
    this.applyUniforms(physics, options);
    physics.init(this.renderer, [texPosition, texVelocity]);
    texPosition.dispose();
    texVelocity.dispose();

    // create render objects
    const particleGeometry = new THREE.BufferGeometry();
    // NOTE: position attribute is not used as we use positions from the computed texture
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions.slice(0, options.nParticles * 4), 4),
    );
    particleGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    const particleUniforms = {
      texPosition: { value: null },
      texVelocity: { value: null },
      texTemperature: { value: texTemperature },
      cameraScale: { value: 1.0 },
      density: { value: options.density },
    };
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: particleUniforms,
        vertexShader: ParticleVertexShader,
        fragmentShader: ParticleFragmentShader,
        depthTest: false,
        vertexColors: true,
      }),
    );
    particles.matrixAutoUpdate = false;
    particles.updateMatrix();

    this.renderState = {
      physics,
      particleGeometry,
      particleUniforms,
      particles,
    };
  }
  private applyUniforms(
    physics: ComputeRenderer,
    options: WorldStateOptions,
  ): void {
    physics.uniforms["nParticles"] = {
      value: options.nParticles,
    };
    physics.uniforms["spaceTopology"] = {
      value: this.spaceTopology(options.spaceTopology),
    };
    physics.uniforms["spaceRadius"] = {
      value: options.spaceRadius,
    };
    physics.uniforms["collisions"] = {
      value: options.collisions,
    };
    physics.uniforms["density"] = {
      value: options.density,
    };
    physics.uniforms["gravityLaw"] = {
      value: this.gravityLaw(options.gravityLaw),
    };
    physics.uniforms["G"] = {
      value: 0.000066743 * options.gravity,
    };
    physics.uniforms["gravityMondA0"] = {
      value: 0.0000000012 * options.gravityMondA0,
    };
    physics.uniforms["dt"] = {
      value: 1.0,
    };
  }
  updateCameraScale(value: number): void {
    if (this.renderState) {
      this.renderState.particleUniforms["cameraScale"].value = value;
    }
  }
  tick(): void {
    if (!this.renderState) return;
    this.renderState.physics.compute(this.renderer);
    const textures = this.renderState.physics.textures;
    this.renderState.particleUniforms["texPosition"].value = textures[0];
    this.renderState.particleUniforms["texVelocity"].value = textures[1];
  }
  private calculateTextureSize(nParticles: number): number {
    const maxSize = this.renderer.capabilities.maxTextureSize;
    const sizes = [128, 256, 512, 1024, 2048, 4096, 8192, 16384];
    for (const s of sizes) {
      if (s > maxSize) break;
      if (nParticles <= s * s) return s;
    }
    return maxSize;
  }
}
