import * as THREE from "three";
import { FullScreenQuad } from "three/addons";

export class ComputeRenderer {
  private quad: FullScreenQuad;
  private material: THREE.ShaderMaterial;
  private targets: THREE.WebGLRenderTarget[];
  private currentTarget = 0;

  get uniforms() {
    return this.material.uniforms;
  }
  get textures(): THREE.Texture[] {
    return this.targets[this.currentTarget].textures;
  }

  constructor(shader: string, texSize: number, targetCount: number) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      name: "ComputeShader",
      vertexShader: this.passThroughVertexShader(),
      fragmentShader: shader,
      depthTest: false,
      vertexColors: true,
      defines: {
        resolution: `vec2(${texSize.toFixed(1)}, ${texSize.toFixed(1)})`,
      },
    });
    this.quad = new FullScreenQuad(this.material);
    const target0 = new THREE.WebGLRenderTarget(texSize, texSize, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      count: targetCount,
    });
    const target1 = new THREE.WebGLRenderTarget(texSize, texSize, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      count: targetCount,
    });
    this.targets = [target0, target1];
  }
  dispose(): void {
    this.quad.dispose();
    this.material.dispose();
    this.targets[0].dispose();
    this.targets[1].dispose();
  }
  init(renderer: THREE.WebGLRenderer, textures: THREE.DataTexture[]): boolean {
    if (renderer.capabilities.maxVertexTextures === 0) {
      return false;
    }
    if (textures.length !== this.targets[0].textures.length) {
      return false;
    }
    const copyMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      name: "CopyShader",
      vertexShader: this.passThroughVertexShader(),
      fragmentShader: this.copyFragmentShader(this.targets[0].textures.length),
      depthTest: false,
      vertexColors: true,
      defines: {
        resolution: `vec2(${this.targets[0].width.toFixed(1)}, ${this.targets[0].height.toFixed(1)})`,
      },
    });
    textures.forEach((tex, index) => {
      copyMaterial.uniforms[`tex_${index}`] = { value: tex };
      this.material.uniforms[`tex_${index}`] = { value: null };
    });
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const currentRenderTarget = renderer.getRenderTarget();
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.targets[this.currentTarget]);
    this.quad.material = copyMaterial;
    this.quad.render(renderer);
    this.quad.material = this.material;
    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget(currentRenderTarget);
    copyMaterial.dispose();
    return true;
  }
  compute(renderer: THREE.WebGLRenderer): void {
    const current = this.targets[this.currentTarget];
    current.textures.forEach((tex, index) => {
      this.material.uniforms[`tex_${index}`].value = tex;
    });
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const currentRenderTarget = renderer.getRenderTarget();
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;
    this.currentTarget = 1 - this.currentTarget;
    renderer.setRenderTarget(this.targets[this.currentTarget]);
    this.quad.render(renderer);
    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget(currentRenderTarget);
  }
  private passThroughVertexShader(): string {
    return "void main() { gl_Position = vec4(position, 1.0); }";
  }
  private copyFragmentShader(count: number): string {
    const input = Array.from(
      { length: count },
      (_, i) => `uniform sampler2D tex_${i};`,
    ).join("\n");
    const output = Array.from(
      { length: count },
      (_, i) => `layout(location = ${i}) out vec4 out_${i};`,
    ).join("\n");
    const copy = Array.from(
      { length: count },
      (_, i) => `out_${i} = texture2D(tex_${i}, uv);`,
    ).join("\n");
    return `${input}\n${output}\nvoid main() { vec2 uv = gl_FragCoord.xy / resolution.xy;\n${copy} }`;
  }
}
