precision highp float;

const int TOPOLOGY_NORMAL = 0;
const int TOPOLOGY_TORUS = 1;

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
    float mass = vel.w;
    if (mass < 0.0) discard;
    // x' = x + vt
    vec3 next_pos = pos.xyz + vel.xyz * dt;
    if (spaceTopology == TOPOLOGY_TORUS) {
        // treat each dimension as the arc length in a circle
        // x = theta * R, where a is the dimension radius
        // going further you back to where you started
        // thus we can take x' = x mod 2PIR, and we take spaceRadius = 2PIR
        next_pos = mod(next_pos + spaceRadius, spaceRadius * 2.0) - spaceRadius;
    }
    gl_FragColor = vec4(next_pos, pos.w);
}
