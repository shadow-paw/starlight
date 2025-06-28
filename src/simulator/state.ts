import * as THREE from "three";
import { GPUComputationRenderer, Variable } from "three/addons";
import ParticleVertexShader from "@/shaders/particle_vert.glsl";
import ParticleFragmentShader from "@/shaders/particle_frag.glsl";
import ComputePositionShader from "@/shaders/position_comp.glsl";
import ComputeVelocityShader from "@/shaders/velocity_comp.glsl";

interface RenderState {
  gpu: GPUComputationRenderer;
  varPosition: Variable;
  varVelocity: Variable;
  texPosition: THREE.DataTexture;
  texVelocity: THREE.DataTexture;
  particleGeometry: THREE.BufferGeometry;
  particleUniforms: { [uniform: string]: THREE.IUniform };
  particles: THREE.Points;
}

export type SpaceTopology = "normal" | "torus";

export interface WorldStateOptions {
  spaceTopology: SpaceTopology;
  spaceRadius: number;
  collisions: boolean;
  gravity: number;
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
      this.renderState.texPosition.dispose();
      this.renderState.gpu.dispose();
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
  restart(options: WorldStateOptions, texTemperature: THREE.Texture): void {
    this.dispose();
    const texSize = this.calculateTextureSize(options.nParticles);
    const gpu = new GPUComputationRenderer(texSize, texSize, this.renderer);
    // initial condition
    // texPosition: [x, y, z, 0]
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
      if (options.initialDistribution == "spherical") {
        // spherical volume, cubic root so more particles the further based on volume ratio
        const x = this.randomVector(
          Math.cbrt(Math.random()) * options.spaceRadius,
        );
        positions[posIndex++] = x[0];
        positions[posIndex++] = x[1];
        positions[posIndex++] = x[2];
        positions[posIndex++] = 0;
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
        positions[posIndex++] = 0;
      }
      const v = this.randomVector(
        Math.random() * options.initialVelocity * 0.01,
      );
      velocities[velocityIndex++] = v[0];
      velocities[velocityIndex++] = v[1];
      velocities[velocityIndex++] = v[2];
      velocities[velocityIndex++] = options.initialMass;
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
    const varVelocity = gpu.addVariable(
      "texVelocity",
      ComputeVelocityShader,
      texVelocity,
    );
    const varPosition = gpu.addVariable(
      "texPosition",
      ComputePositionShader,
      texPosition,
    );
    for (const v of [varPosition, varVelocity]) {
      v.material.uniforms["nParticles"] = {
        value: options.nParticles,
      };
      v.material.uniforms["spaceTopology"] = {
        value: this.spaceTopology(options.spaceTopology),
      };
      v.material.uniforms["spaceRadius"] = {
        value: options.spaceRadius,
      };
      v.material.uniforms["collisions"] = {
        value: options.collisions,
      };
      v.material.uniforms["density"] = {
        value: options.density,
      };
      v.material.uniforms["G"] = {
        value: 0.00066743 * options.gravity,
      };
      v.material.uniforms["dt"] = {
        value: 1.0,
      };
    }
    gpu.setVariableDependencies(varVelocity, [varPosition, varVelocity]);
    gpu.setVariableDependencies(varPosition, [varPosition, varVelocity]);
    gpu.init();

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
      gpu,
      varPosition,
      varVelocity,
      texPosition,
      texVelocity,
      particleGeometry,
      particleUniforms,
      particles,
    };
  }
  updateCameraScale(value: number): void {
    if (this.renderState) {
      this.renderState.particleUniforms["cameraScale"].value = value;
    }
  }
  tick(): void {
    if (!this.renderState) return;
    this.renderState.gpu.compute();
    this.renderState.particleUniforms["texPosition"].value =
      this.renderState.gpu.getCurrentRenderTarget(
        this.renderState.varPosition,
      ).texture;
    this.renderState.particleUniforms["texVelocity"].value =
      this.renderState.gpu.getCurrentRenderTarget(
        this.renderState.varVelocity,
      ).texture;
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
