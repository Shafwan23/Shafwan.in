/* SHAFWAN® — shared WebGL bits for the scene engine: a full-screen
   triangle, the value-noise + curl chunk every shader borrows, and a
   program builder that warns instead of throwing. */

export const VERT_QUAD = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

export const NOISE = `
  vec2 hash2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
  float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(dot(hash2(i),f),dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
               mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y); }
  vec2 curl(vec2 p){ float e=0.12;
    float a=noise(p+vec2(0.0,e)), b=noise(p-vec2(0.0,e));
    float c=noise(p+vec2(e,0.0)), d=noise(p-vec2(e,0.0));
    return normalize(vec2(a-b, d-c) + 1e-4); }`;

export function makeProgram(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(t);
    gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('shader:', gl.getShaderInfoLog(sh)); return null;
    }
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}
