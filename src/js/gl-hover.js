/* SHAFWAN® — liquid distortion + scroll film-bend (raw WebGL, no libraries).
   Applies to [data-distort] images. Fine pointers get hover warp;
   every device gets the scroll-velocity bend. Falls back to the <img>. */

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
/* storage can throw when site data is blocked; treat that as motion on */
const storedMotionOff = () => { try { return localStorage.getItem('shafwan-motion') === 'off'; } catch { return false; } };
const motionOff = () =>
  rmq.matches || navigator.connection?.saveData ||
  storedMotionOff();

let killed = false;
if (!motionOff()) init();

function init() {
  const targets = document.querySelectorAll('[data-distort]');
  if (!targets.length) return;

  const instances = [];
  let velY = 0, lastY = scrollY, lastT = performance.now(), decayRaf = null, decayLast = 0;

  const teardown = () => {
    killed = true;
    instances.forEach((i) => i.kill());
  };
  rmq.addEventListener?.('change', (e) => { if (e.matches) teardown(); });
  addEventListener('shafwan:motion-off', teardown);

  addEventListener('scroll', () => {
    if (killed) return;
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    const raw = (scrollY - lastY) / dt; /* px per ms */
    velY += (raw - velY) * 0.4;
    lastY = scrollY; lastT = now;
    instances.forEach((i) => i.inView && i.wake());
    if (!decayRaf) { decayLast = now; decayRaf = requestAnimationFrame(decay); }
  }, { passive: true });

  function decay(now) {
    const dt = Math.min((now - decayLast) / 1000, 0.05);
    decayLast = now;
    velY *= Math.pow(0.9, dt * 60);
    if (Math.abs(velY) > 0.005) decayRaf = requestAnimationFrame(decay);
    else { velY = 0; decayRaf = null; }
  }

  const VERT = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uRes;
    uniform vec2 uTexRes;
    uniform vec2 uMouse;
    uniform float uTime;
    uniform float uAmt;
    uniform float uVel;   /* scroll velocity, signed */

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash(i), f),
                     dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                 mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                     dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    }
    vec2 coverUv(vec2 uv, float zoom) {
      float ca = uRes.x / uRes.y;
      float ia = uTexRes.x / uTexRes.y;
      vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
      return (uv - 0.5) * s / zoom + 0.5;
    }
    void main() {
      vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

      float n = noise(uv * 3.2 + uTime * 0.22);
      float n2 = noise(uv * 6.5 - uTime * 0.14);
      vec2 warp = vec2(n, n2) * 0.020 * uAmt;

      float d = distance(uv, uMouse);
      vec2 bulge = normalize(uv - uMouse + 0.0001) * exp(-d * 5.5) * 0.030 * uAmt;

      /* film bend: center of the frame lags behind the edges under scroll */
      float x = uv.x - 0.5;
      float bend = (0.25 - x * x) * uVel * 0.55;
      float zoom = 1.0 + abs(uVel) * 0.18 + uAmt * 0.02;

      vec2 fuv = coverUv(uv + warp + bulge + vec2(0.0, bend), zoom);
      /* a whisper of chromatic split — luxury, not broken signal */
      float shift = 0.0020 * uAmt + abs(uVel) * 0.0035;
      float r = texture2D(uTex, fuv + vec2(shift, 0.0)).r;
      float g = texture2D(uTex, fuv).g;
      float b = texture2D(uTex, fuv - vec2(shift, 0.0)).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }`;

  const lazy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { lazy.unobserve(e.target); setup(e.target); }
    }
  }, { rootMargin: '240px' });

  targets.forEach((img) => lazy.observe(img));

  function setup(img) {
    const mount = () => { build(img); };
    if (img.complete && img.naturalWidth) mount();
    else img.addEventListener('load', mount, { once: true });
  }

  function build(img) {
    if (killed) return false;
    const host = img.parentElement;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return false;
    /* a failed build must not strand a live context toward the browser cap */
    const bail = () => { gl.getExtension('WEBGL_lose_context')?.loseContext(); return false; };

    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]]) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return bail();
      gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return bail();
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U('uRes'), uMouse = U('uMouse'), uTime = U('uTime'),
          uAmt = U('uAmt'), uVel = U('uVel');
    gl.uniform1i(U('uTex'), 0);
    gl.uniform2f(U('uTexRes'), img.naturalWidth, img.naturalHeight);

    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    let amt = 0, amtT = 0, mx = 0.5, my = 0.5, t = 0, raf = null, last = 0, vel = 0;

    const size = () => {
      const r = host.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(2, Math.round(r.width * dpr));
      canvas.height = Math.max(2, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    size();
    new ResizeObserver(size).observe(host);

    const inst = {
      inView: false,
      wake() {
        if (killed) return;
        canvas.style.opacity = '1';
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      },
      kill() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        canvas.remove();
      },
    };
    new IntersectionObserver((entries) => {
      inst.inView = entries[entries.length - 1].isIntersecting;
    }).observe(host);
    instances.push(inst);

    function frame(now) {
      if (killed) { raf = null; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      amt += (amtT - amt) * 0.08;
      vel += (Math.max(-1, Math.min(1, velY * 0.4)) - vel) * 0.12;
      gl.uniform1f(uTime, t);
      gl.uniform1f(uAmt, amt);
      gl.uniform1f(uVel, vel);
      gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (amt > 0.004 || amtT > 0 || Math.abs(vel) > 0.004) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;
        canvas.style.opacity = '0';
      }
    }

    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 0.35s ease';

    if (fine) {
      const zone = host.closest('.panel, .case-hero-media, [data-distort-zone]') || host;
      zone.addEventListener('pointerenter', () => { amtT = 1; inst.wake(); });
      zone.addEventListener('pointerleave', () => { amtT = 0; inst.wake(); });
      zone.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width;
        my = (e.clientY - r.top) / r.height;
      }, { passive: true });
    }

    canvas.addEventListener('webglcontextlost', () => canvas.remove());
    return true;
  }
}
