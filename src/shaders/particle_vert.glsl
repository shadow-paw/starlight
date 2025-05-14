precision mediump float;

#include <common>

uniform sampler2D texPosition;
uniform sampler2D texVelocity;
uniform float density;
uniform float cameraScale;
out vec4 vColor;

void main() {
    vec4 pos = texture2D(texPosition, uv);
    vec4 vel = texture2D(texVelocity, uv);
    float mass = vel.w;
    vec4 mvp = modelViewMatrix * vec4(pos.xyz, 1.0);
    vColor = vec4(1.0, 1.0, 1.0, 1.0);
    gl_PointSize = cameraScale / -mvp.z;
    gl_Position = projectionMatrix * mvp;
}
