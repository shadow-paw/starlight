precision highp float;

#include <common>

// tex_0: [pos.x, pos.y, pos.z, raduis]
// tex_1: [vel.x, vel.y, vel.z, mass]
uniform sampler2D tex_0;
uniform sampler2D tex_1;
layout(location = 0) out vec4 out_0;
layout(location = 1) out vec4 out_1;

const int TOPOLOGY_NORMAL    = 0;
const int TOPOLOGY_TORUS     = 1;
const int GRAVITY_LAW_NONE   = 0;
const int GRAVITY_LAW_NEWTON = 1;
const int GRAVITY_LAW_MOND   = 2;

uniform float nParticles;
uniform int   spaceTopology;
uniform float spaceRadius;
uniform bool  collisions;
uniform float density;
uniform int   gravityLaw;
uniform float gravityMondA0;
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
    vec4 pos = texture2D(tex_0, uv);
    vec4 vel = texture2D(tex_1, uv);
    float mass = vel.w;
    if (mass < 0.0) {
        out_0 = pos;
        out_1 = vel;
        return;
    }
    float id = uv.y * resolution.x + uv.x;
    float radius = pos.w;

    float spaceDiameter = spaceRadius * 2.0;
    vec3 acceleration = vec3(0.0);

    vec3 gravity = vec3(0.0);
    float toY = nParticles / width;
    for (float y = 0.0; y < toY; y++) {
        for (float x = 0.0; x < width; x++) {
            vec2 other_uv = vec2(x + 0.5, y + 0.5) / resolution.xy;
            vec4 other_pos = texture2D(tex_0, other_uv);
            vec4 other_vel = texture2D(tex_1, other_uv);
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
                float other_radius = other_pos.w;
                float collisionRange = (radius + other_radius) * 0.9;
                if (r2 <= collisionRange * collisionRange) {
                    float other_id = other_uv.y * width + other_uv.x;
                    if (id < other_id) {
                        vel.xyz = (vel.xyz * mass + other_vel.xyz * other_mass) / (mass + other_mass);
                        mass += other_mass;
                        radius = radiusFromMass(mass);
                        continue;
                    } else {
                        vel.xyz = vec3(0.0);
                        mass = -1.0;
                        gravity = vec3(0.0);
                        y = height;
                        break;
                    }
                }
            }

            if (gravityLaw == GRAVITY_LAW_NEWTON) {
                // a = GM/r²
                gravity += other_mass / (r2 * sqrt(r2)) * r;
            } else if (gravityLaw == GRAVITY_LAW_MOND) {
                // μ(a/a₀) * a = GM/r²
                // newton regime for a ≥ a₀, μ(a/a₀) = 1:
                //      1 * a = GM/r²
                //          a = GM/r²
                // modified regime for a < a₀, μ(a/a₀) = a/a₀:
                //   a/a₀ * a = GM/r²
                //          a = sqrt(GMa₀)/r
                float a_newton = G * other_mass / (r2 * sqrt(r2));          // a = GM/r²            (r³ to normalize r vector)
                float a_mond   = sqrt(G * other_mass * gravityMondA0) / r2; // a = sqrt(GM * a₀)/r  (r² to normalize r vector)
                float regime   = step(gravityMondA0, a_newton);             // regime = a < a₀ ? 0 : 1
                float a        = mix(a_mond, a_newton, regime);             // pick forumla by regime
                gravity += a * r;
            }
        }
        if (gravityLaw == GRAVITY_LAW_NEWTON) {
            acceleration += gravity * G;
        } else {
            // G is inside MOND formula
            acceleration += gravity;
        }
    }

    // Update next frame
    // v = v + at
    vec3 next_vel = vel.xyz + acceleration * dt;
    // x = x + vt + ½at²
    vec3 next_pos = pos.xyz + next_vel.xyz * dt + acceleration * dt * dt / 2.0;

    if (spaceTopology == TOPOLOGY_TORUS) {
        // treat each dimension as the arc length in a circle
        // x = theta * R, where a is the dimension radius
        // going further you back to where you started
        // thus we can take x' = x mod 2PIR, and we take spaceRadius = 2PIR
        next_pos = mod(next_pos + spaceRadius, spaceDiameter) - spaceRadius;
    }
    out_0 = vec4(next_pos, radius);
    out_1 = vec4(next_vel, mass);
}
