precision lowp float;

in  vec4 vColor;
out vec4 oColor;

void main() {
    float f = length(gl_PointCoord - vec2(0.5, 0.5));
    if (f > 0.5 || vColor.w == 0.0) {
        discard;
    }
    oColor = vColor;
}
