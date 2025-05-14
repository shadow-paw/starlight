precision highp float;

const int TOPOLOGY_NORMAL = 0;

uniform float nParticles;
uniform int   spaceTopology;
uniform float spaceRadius;
uniform bool  collisions;
uniform float density;
uniform float G;
uniform float dt;

void main() {
    vec2 xy = gl_FragCoord.xy;
    vec2 uv = xy / resolution.xy;
    vec4 pos = texture2D(texPosition, uv);
    vec4 vel = texture2D(texVelocity, uv);
    // x' = x + vt
    vec4 next_pos = vec4(pos.xyz + vel.xyz * dt, pos.w);
    gl_FragColor = next_pos;
}
