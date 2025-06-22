precision mediump float;

#include <common>

uniform sampler2D texPosition;
uniform sampler2D texVelocity;
uniform sampler2D texTemperature;
uniform float density;
uniform float cameraScale;
out vec4 vColor;

float radiusFromMass(float mass) {
    return max(pow((3.0 / (4.0 * PI)) * mass / density, 1.0 / 3.0), 0.1);
}
vec4 colorFromMass(float mass) {
    float x = clamp(log(mass / 100.0) / 30.0, 0.0, 1.0);
    return texture2D(texTemperature, vec2(x, 0.0));
}
void main() {
    vec4 pos = texture2D(texPosition, uv);
    vec4 vel = texture2D(texVelocity, uv);
    float mass = vel.w;
    if (mass < 0.0) {
        vColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
        vColor = colorFromMass(mass);
    }
    vec4 mvp = modelViewMatrix * vec4(pos.xyz, 1.0);
    gl_PointSize = radiusFromMass(mass) * cameraScale / -mvp.z;
    gl_Position = projectionMatrix * mvp;
}
