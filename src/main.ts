import './style.css';

function printMatrix(m: number[]) {
  for (let i = 0; i < 4; i++) {
    console.log(m.slice(4 * i, 4 * i + 4));
  }
  console.log('');
}

function dot(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function scale(v: [number, number, number], c: number): [number, number, number] {
  return [c * v[0], c * v[1], c * v[2]];
}

function add(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function diff(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function magnitude(v: [number, number, number]) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function normalize(v: [number, number, number]): [number, number, number] {
  const res: [number, number, number] = [...v];
  const m = magnitude(res);
  res[0] /= m;
  res[1] /= m;
  res[2] /= m;
  return res;
}

function matrixMultiply(a: number[], b: number[]) {
  const res = [];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let val = 0;
      for (let k = 0; k < 4; k++) {
        val += a[4 * i + k] * b[4 * k + j];
      }
      res.push(val);
    }
  }

  return res;
}

function matrixInverse(a: number[]) {
  const aCopy = [...a];
  const res = new Array(16).fill(0);
  res[0] = res[5] = res[10] = res[15] = 1;

  for (let i = 0; i < 4; i++) {
    if (Math.abs(aCopy[4 * i + i]) < 1e-6) {
      let found = null;
      for (let j = i + 1; j < 4; j++) {
        if (Math.abs(aCopy[4 * j + i]) > 1e-6) {
          found = j;
          break;
        }
      }
      if (found === null) {
        return new Array(16).fill(0);
      }

      for (let j = 0; j < 4; j++) {
        let temp = aCopy[4 * i + j];
        aCopy[4 * i + j] = aCopy[4 * found + j];
        aCopy[4 * found + j] = temp;

        temp = res[4 * i + j];
        res[4 * i + j] = res[4 * found + j];
        res[4 * found + j] = temp;
      }
    }

    const val = aCopy[4 * i + i];
    for (let j = 0; j < 4; j++) {
      aCopy[4 * i + j] /= val;
      res[4 * i + j] /= val;
    }

    for (let j = i + 1; j < 4; j++) {
      const val = aCopy[4 * j + i];
      for (let k = 0; k < 4; k++) {
        aCopy[4 * j + k] -= val * aCopy[4 * i + k];
        res[4 * j + k] -= val * res[4 * i + k];
      }
    }
  }

  for (let i = 3; i >= 0; i--) {
    for (let j = i-1; j >= 0; j--) {
      const val = aCopy[4 * j + i];
      for (let k = 0; k < 4; k++) {
        aCopy[4 * j + k] -= val * aCopy[4 * i + k];
        res[4 * j + k] -= val * res[4 * i + k];
      }
    }
  }

  return res;
}

function clamp(x: number, min: number, max: number) {
  if (x < min) {
    return min;
  } else if (max < x) {
    return max;
  } else {
    return x;
  }
}

function axisAlignedBox(
  position: [number, number, number],
  dimensions: [number, number, number],
  color: [number, number, number],
) {
  return [
    // Back
    position[0], position[1], position[2], ...color, 0, 0, -1,
    position[0], position[1] + dimensions[1], position[2], ...color, 0, 0, -1,
    position[0] + dimensions[0], position[1], position[2], ...color, 0, 0, -1,
    position[0] + dimensions[0], position[1], position[2], ...color, 0, 0, -1,
    position[0], position[1] + dimensions[1], position[2], ...color, 0, 0, -1,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2], ...color, 0, 0, -1,

    // Front
    position[0], position[1], position[2] + dimensions[2], ...color, 0, 0, 1,
    position[0] + dimensions[0], position[1], position[2] + dimensions[2], ...color, 0, 0, 1,
    position[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, 0, 0, 1,
    position[0] + dimensions[0], position[1], position[2] + dimensions[2], ...color, 0, 0, 1,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, 0, 0, 1,
    position[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, 0, 0, 1,

    // Left
    position[0], position[1], position[2], ...color, -1, 0, 0,
    position[0], position[1], position[2] + dimensions[2], ...color, -1, 0, 0,
    position[0], position[1] + dimensions[1], position[2], ...color, -1, 0, 0,
    position[0], position[1] + dimensions[1], position[2], ...color, -1, 0, 0,
    position[0], position[1], position[2] + dimensions[2], ...color, -1, 0, 0,
    position[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, -1, 0, 0,

    // Right
    position[0] + dimensions[0], position[1], position[2], ...color, 1, 0, 0,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2], ...color, 1, 0, 0,
    position[0] + dimensions[0], position[1], position[2] + dimensions[2], ...color, 1, 0, 0,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2], ...color, 1, 0, 0,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, 1, 0, 0,
    position[0] + dimensions[0], position[1], position[2] + dimensions[2], ...color, 1, 0, 0,

    // Bottom
    position[0], position[1], position[2], ...color, 0, 1, 0,
    position[0] + dimensions[0], position[1], position[2], ...color, 0, 1, 0,
    position[0], position[1], position[2] + dimensions[2], ...color, 0, 1, 0,
    position[0], position[1], position[2] + dimensions[2], ...color, 0, 1, 0,
    position[0] + dimensions[0], position[1], position[2], ...color, 0, 1, 0,
    position[0] + dimensions[0], position[1], position[2] + dimensions[2], ...color, 0, 1, 0,

    // Top
    position[0], position[1] + dimensions[1], position[2], ...color, 0, 1, 0,
    position[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, 0, 1, 0,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2], ...color, 0, 1, 0,
    position[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, 0, 1, 0,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2] + dimensions[2], ...color, 0, 1, 0,
    position[0] + dimensions[0], position[1] + dimensions[1], position[2], ...color, 0, 1, 0,
  ];
}

function main() {
  const canvas = document.querySelector('canvas');
  if (!canvas) { return; }

  canvas.width = Math.floor(window.innerWidth);
  canvas.height = Math.floor(window.innerHeight);

  const fpsSpan = document.querySelector<HTMLSpanElement>('#fps')!;
  if (!fpsSpan) { return; }

  window.addEventListener('resize', () => {
    canvas.width = Math.floor(window.innerWidth);
    canvas.height = Math.floor(window.innerHeight);
  });

  const gl = canvas.getContext("webgl2");
  if (!gl) { return; }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const vertexShaderSource = `#version 300 es
    in vec3 position;
    in vec3 inColor;
    in vec3 normal;
    out vec3 outColor;
    uniform mat4 worldToClip;
  
    void main() {
      // I work with right handed, and convert it in the shader.
      vec4 clipPosition = worldToClip * vec4(position, 1);
      clipPosition.z = -clipPosition.z;
      gl_Position = clipPosition;
      outColor = inColor * (2.0 + dot(vec3(0.3, 0.5, 1), normal)) / 3.0;
    }
  `;
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) { return; }
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    return;
  }

  const fragmentShaderSource = `#version 300 es
    precision highp float;

    out vec4 color;
    in vec3 outColor;

    void main() {
      color = vec4(outColor, 1);
    }
  `;
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) { return; }
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(fragmentShader));
    return;
  }

  const program = gl.createProgram();
  if (!program) { return; }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(program));
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const triangles = new Float32Array([
    ...axisAlignedBox([-225, -25, -25], [50.0, 50.0, 50.0], [1.0, 0, 0]),
    ...axisAlignedBox([-225, 50, -100], [50.0, 50.0, 50.0], [1.0, 0, 0]),
    ...axisAlignedBox([-225, 125, -175], [50.0, 50.0, 50.0], [1.0, 0, 0]),
    ...axisAlignedBox([175, -25, -25], [50.0, 50.0, 50.0], [0, 0, 1.0]),
    ...axisAlignedBox([175, 50, -100], [50.0, 50.0, 50.0], [0, 0, 1.0]),
    ...axisAlignedBox([175, 125, -175], [50.0, 50.0, 50.0], [0, 0, 1.0]),
    ...axisAlignedBox([-200, -75, -200], [400.0, 50.0, 400.0], [0.5, 0.5, 0.5]),
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 9 * 4, 0);
  const inColorLocation = gl.getAttribLocation(program, 'inColor');
  gl.enableVertexAttribArray(inColorLocation);
  gl.vertexAttribPointer(inColorLocation, 3, gl.FLOAT, false, 9 * 4, 3 * 4);
  const normalLocation = gl.getAttribLocation(program, "normal");
  gl.enableVertexAttribArray(normalLocation);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 9 * 4, 6 * 4);
  const worldToClipLocation = gl.getUniformLocation(program, "worldToClip");

  let lastTime = Date.now();
  let frameCount = 0;
  const FRAME_COUNT_FOR_FPS = 60;

  let cameraPosition: [number, number, number] = [0, 0, 1000];
  let cameraTargetDistance = 1000;
  let cameraTargetAngles = [Math.PI, 0]; // [angle-in-xz-from-z, angle-from-xz]
  let cameraUp: [number, number, number] = [0, 1, 0];
  let near = 0.01;
  let far = 10000;
  let fov = 120;

  const keysDown = new Set<string>();
  window.addEventListener('keydown', (e) => {
    keysDown.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
  });
  canvas.addEventListener("click", async () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
    if (!document.pointerLockElement) {
      await canvas.requestPointerLock({
        unadjustedMovement: true,
      });
    }
  });
  canvas.addEventListener("mousemove", e => {
    if (!document.pointerLockElement) {
      return;
    }

    // Update
    cameraTargetAngles[0] -= 0.001 * e.movementX;
    cameraTargetAngles[1] -= 0.001 * e.movementY;
    cameraTargetAngles[1] = clamp(cameraTargetAngles[1], - Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
  });

  function updateAndDraw() {
    // Update
    let cameraTarget: [number, number, number] = [
      cameraPosition[0] + cameraTargetDistance * Math.cos(cameraTargetAngles[1]) * Math.sin(cameraTargetAngles[0]),
      cameraPosition[1] + cameraTargetDistance * Math.sin(cameraTargetAngles[1]),
      cameraPosition[2] + cameraTargetDistance * Math.cos(cameraTargetAngles[1]) * Math.cos(cameraTargetAngles[0])
    ];
    let targetToPositionNormalized = normalize(diff(cameraPosition, cameraTarget));
    let upNormalized = normalize(diff(cameraUp, scale(targetToPositionNormalized, dot(targetToPositionNormalized, cameraUp))));
    // Normal since other two vectors are unit and orthogonal.
    let rightNormalized = cross(upNormalized, targetToPositionNormalized);

    if (keysDown.has('KeyW')) {
      cameraPosition = diff(cameraPosition, scale(targetToPositionNormalized, 20));
    }
    if (keysDown.has('KeyA')) {
      cameraPosition = diff(cameraPosition, scale(rightNormalized, 20));
    }
    if (keysDown.has('KeyS')) {
      cameraPosition = add(cameraPosition, scale(targetToPositionNormalized, 20));
    }
    if (keysDown.has('KeyD')) {
      cameraPosition = add(cameraPosition, scale(rightNormalized, 20));
    }

    // Draw
    cameraTarget = [
      cameraPosition[0] + cameraTargetDistance * Math.cos(cameraTargetAngles[1]) * Math.sin(cameraTargetAngles[0]),
      cameraPosition[1] + cameraTargetDistance * Math.sin(cameraTargetAngles[1]),
      cameraPosition[2] + cameraTargetDistance * Math.cos(cameraTargetAngles[1]) * Math.cos(cameraTargetAngles[0])
    ];
    targetToPositionNormalized = normalize(diff(cameraPosition, cameraTarget));
    upNormalized = normalize(diff(cameraUp, scale(targetToPositionNormalized, dot(targetToPositionNormalized, cameraUp))));
    rightNormalized = cross(upNormalized, targetToPositionNormalized);
  
    const targetShift = new Array(16).fill(0);
    targetShift[0] = targetShift[5] = targetShift[10] = targetShift[15] = 1;
    targetShift[3] = -cameraTarget[0];
    targetShift[7] = -cameraTarget[1];
    targetShift[11] = -cameraTarget[2];
  
    let rotation = new Array(16).fill(0);
    rotation[15] = 1;
    
    for (let i = 0; i < 3; i++) {
      rotation[0 * 4 + i] = rightNormalized[i];
      rotation[1 * 4 + i] = upNormalized[i];
      rotation[2 * 4 + i] = targetToPositionNormalized[i];
    }

    let perspectiveMatrix = new Array(16).fill(0);
    perspectiveMatrix[0] = 1 / Math.tan(fov / 2);
    perspectiveMatrix[5] = gl!.canvas.width / (Math.tan(fov / 2) * gl!.canvas.height);
    perspectiveMatrix[10] = 1;
    perspectiveMatrix[11] = -magnitude(diff(cameraPosition, cameraTarget)) + 2 * near;
    perspectiveMatrix[15] = magnitude(diff(cameraPosition, cameraTarget));
    perspectiveMatrix[14] = -1;
  
    const worldToClip = matrixMultiply(perspectiveMatrix, matrixMultiply(rotation, targetShift));

    gl!.viewport(0, 0, gl!.canvas.width, gl!.canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clearDepth(1);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

    gl!.useProgram(program);
    gl!.uniformMatrix4fv(worldToClipLocation, false, [
      worldToClip[0], worldToClip[4], worldToClip[8], worldToClip[12],
      worldToClip[1], worldToClip[5], worldToClip[9], worldToClip[13],
      worldToClip[2], worldToClip[6], worldToClip[10], worldToClip[14],
      worldToClip[3], worldToClip[7], worldToClip[11], worldToClip[15],
    ]);
    gl!.drawArrays(gl!.TRIANGLES, 0, triangles.length / 3);

    frameCount += 1;
    if (frameCount === FRAME_COUNT_FOR_FPS) {
      frameCount = 0;
      const currTime = Date.now();
      fpsSpan.innerText = `FPS: ${Math.round(FRAME_COUNT_FOR_FPS * 1000 / (currTime - lastTime))}`;
      lastTime = currTime;
    }
    requestAnimationFrame(updateAndDraw);
  }

  updateAndDraw();
}

main();