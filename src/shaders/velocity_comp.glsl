precision highp float;

// texPosition: [x, y, z, 0]
// texVelocity: [v.x, v.y, v.z, mass]

#include <common>

const int TOPOLOGY_NORMAL = 0;
const int TOPOLOGY_TORUS = 1;

uniform float nParticles;
uniform int   spaceTopology;
uniform float spaceRadius;
uniform bool  collisions;
uniform float density;
uniform float G;
uniform float dt;

const float width = resolution.x;
const float height = resolution.y;

float radiusFromMass(float mass) {
    return pow((3.0 / (4.0 * PI)) * mass / density, 1.0 / 3.0);
}
void main() {
    vec2 xy = gl_FragCoord.xy;
    if ((xy.y - 0.5) * width > nParticles) discard;
    vec2 uv = xy / resolution.xy;
    vec4 pos = texture2D(texPosition, uv);
    vec4 vel = texture2D(texVelocity, uv);
    float id = uv.y * resolution.x + uv.x;
    float mass = vel.w;
    float radius = radiusFromMass(mass);
    vec3 acceleration = vec3(0.0);
    if (G != 0.0 && mass > 0.0) {
        float spaceDiameter = spaceRadius * 2.0;
        float toY = nParticles / width;
        for (float y = 0.0; y < toY; y++) {
            for (float x = 0.0; x < width; x++) {
                vec2 other_uv = vec2(x + 0.5, y + 0.5) / resolution.xy;
                vec4 other_pos = texture2D(texPosition, other_uv);
                vec4 other_vel = texture2D(texVelocity, other_uv);
                if (other_pos.xyz == pos.xyz) continue;
                float other_mass = other_vel.w;
                if (other_mass <= 0.0) continue;

                vec3 r = other_pos.xyz - pos.xyz;
                if (spaceTopology == TOPOLOGY_TORUS) {
                    // treat each dimension as the arc length in a circle
                    // x = theta * R, where a is the dimension radius
                    // going further you back to where you started
                    // thus we can take x' = x mod 2PIR, and we take spaceRadius = 2PIR
                    r.xyz = mod(r.xyz + spaceRadius, spaceDiameter) - spaceRadius;
                }
                float r2 = dot(r, r);

                if (collisions) {
                    float other_id = other_uv.y * width + other_uv.x;
                    float other_radius = radiusFromMass(other_mass);
                    float collisionRange = (radius + other_radius) * 0.9;
                    if (r2 <= collisionRange * collisionRange) {
                        float other_id = other_uv.y * width + other_uv.x;
                        if (id < other_id) {
                            vel.xyz = (vel.xyz * mass + other_vel.xyz * other_mass) / (mass + other_mass);
                            mass += other_mass;
                            continue;
                        } else {
                            vel.xyz = vec3(0.0);
                            acceleration = vec3(0.0);
                            mass = -1.0;
                            y = height;
                            break;
                        }
                    }
                }
                acceleration += other_mass / (r2 * sqrt(r2)) * r;
            }
        }
    }
    gl_FragColor = vec4(vel.xyz + acceleration * (G * dt), mass);
}
