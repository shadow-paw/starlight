precision highp float;

// texPosition: [x, y, z, 0]
// texVelocity: [v.x, v.y, v.z, mass]

#include <common>

const int TOPOLOGY_NORMAL = 0;

uniform float nParticles;
uniform int   spaceTopology;
uniform float spaceRadius;
uniform bool  collisions;
uniform float density;
uniform float G;
uniform float dt;

const float width = resolution.x;
const float height = resolution.y;

void main() {
    vec2 xy = gl_FragCoord.xy;
    if ((xy.y - 0.5) * width > nParticles) discard;
    vec2 uv = xy / resolution.xy;
    vec4 pos = texture2D(texPosition, uv);
    vec4 vel = texture2D(texVelocity, uv);
    float mass = vel.w;
    vec3 acceleration = vec3(0.0);
    if (mass > 0.0) {
        float spaceDiameter = spaceRadius * 2.0;
        float toY = nParticles / width;
        for (float y = 0.0; y < toY; y++) {
            for (float x = 0.0; x < width; x++) {
                vec2 other_uv = vec2(x + 0.5, y + 0.5) / resolution.xy;
                vec4 other_pos = texture2D(texPosition, other_uv);
                vec4 other_vel = texture2D(texVelocity, other_uv);
                float other_mass = other_vel.w;
                vec3 r = other_pos.xyz - pos.xyz;
                float r2 = dot(r, r);
                if (r2 == 0.0) continue;
                acceleration += other_mass / (r2 * sqrt(r2)) * r;
            }
        }
    }
    gl_FragColor = vec4(vel.xyz + acceleration * (G * dt), mass);
}
