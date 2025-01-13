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
  color: [number, number, number, number],
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

function plane(
  center: [number, number, number],
  normal: [number, number, number],
  size: number,
  color: [number, number, number, number],
) {
  // Gram Schmidt Orthogonalization
  const axes = [normal];
  if (normal[0] !== 0) {
    axes.push([0, 1, 0]);
    axes.push([0, 0, 1]);
  } else if (normal[1] !== 0) {
    axes.push([1, 0, 0]);
    axes.push([0, 0, 1]);
  } else {
    axes.push([1, 0, 0]);
    axes.push([0, 1, 0]);
  }

  for (let i = 0; i < 3; i++) {
    let axis = axes[i];
    for (let j = 0; j < i; j++) {
      axis = diff(axis, scale(axes[j], dot(axes[j], axes[i])));
    }
    axes[i] = normalize(axis);
  }  

  return [
    ...diff(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...add(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,

    ...diff(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...add(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color, 0, 1, 0,
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

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
  });
  if (!gl) { return; }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  // https://stackoverflow.com/a/74804393
  // https://www.reddit.com/r/opengl/comments/8vu2t0/issues_with_alpha_channel_in_webgl/
  // https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html
  // https://www.opengl.org/archives/resources/faq/technical/transparency.htm
  // https://stackoverflow.com/a/12286297
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const vertexShaderSource = `#version 300 es
    in vec3 position;
    in vec4 inColor;
    in vec3 normal;
    out vec4 outColor;
    uniform mat4 worldToClip;
  
    void main() {
      // I work with right handed, and convert it in the shader.
      vec4 clipPosition = worldToClip * vec4(position, 1);
      clipPosition.z = -clipPosition.z;
      gl_Position = clipPosition;
      outColor = vec4(inColor.rgb * (2.0 + dot(vec3(0.3, 0.5, 1), normal)) / 3.0, inColor.a);
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
    in vec4 outColor;

    void main() {
      color = outColor;
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

  const cubes: [number, number, number][] = [[0, 0.01, 0]];
  const VERTEX_LIMIT = 10000 * 3;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, 4 * 10 * VERTEX_LIMIT, gl.DYNAMIC_DRAW);

  const triangles = plane([0.0, 0.0, 0.0], [0.0, 1.0, 0.0], 200.0, [1.0, 1.0, 1.0, 0.2]);
  for (const cube of cubes) {
    triangles.push(...axisAlignedBox(cube, [1.0, 1.0, 1.0], [1.0, 0.0, 0.0, 1.0]));
  }
  let triangleCount = triangles.length / 10;
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(triangles));

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 10 * 4, 0);
  const inColorLocation = gl.getAttribLocation(program, 'inColor');
  gl.enableVertexAttribArray(inColorLocation);
  gl.vertexAttribPointer(inColorLocation, 4, gl.FLOAT, false, 10 * 4, 3 * 4);
  const normalLocation = gl.getAttribLocation(program, "normal");
  gl.enableVertexAttribArray(normalLocation);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 10 * 4, 7 * 4);
  const worldToClipLocation = gl.getUniformLocation(program, "worldToClip");

  let lastTime = Date.now();
  let frameCount = 0;
  const FRAME_COUNT_FOR_FPS = 60;

  let cameraPosition: [number, number, number] = [0, 10, 10];
  let cameraDirectionAngles = [Math.PI, -Math.PI / 4]; // [angle-in-xz-from-z, angle-from-xz]
  let cameraUp: [number, number, number] = [0, 1, 0];
  // Prevent this: https://www.reddit.com/r/Unity3D/comments/s66qvs/whats_causing_this_strange_texture_flickering_in
  // Near and far bounds based on Raylib
  let near = 0.01;
  let far = 1000;
  let fov = 120;

  let mousePosition = [window.innerWidth / 2, window.innerHeight / 2];

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
  window.addEventListener("mousemove", e => {
    mousePosition = [e.clientX, e.clientY];
  });
  canvas.addEventListener("mousedown", () => {
    if (!document.pointerLockElement) {
      return;
    }

    // Ray from camera center to mouse, in world coordinates.
    const cameraDirection: [number, number, number] = [
      Math.cos(cameraDirectionAngles[1]) * Math.sin(cameraDirectionAngles[0]),
      Math.sin(cameraDirectionAngles[1]),
      Math.cos(cameraDirectionAngles[1]) * Math.cos(cameraDirectionAngles[0])
    ];

    // TODO: Handle edge cases for parallel?
    const tXZPlane = -cameraPosition[1] / cameraDirection[1];
    let tmin = Infinity;
    if (tXZPlane > 0) {
      tmin = tXZPlane;
    }
    let center: null | [number, number, number] = null;
    let normal: null | [number, number, number] = null;
    
    for (const cube of cubes) {
      for (let i = 0; i < 3; i++) {
        for (let j = -1; j <= 1; j += 2) {
          let t = (cube[i] + 0.5 + 0.5 * j - cameraPosition[i]) / cameraDirection[i];
          let mousePoint = add(cameraPosition, scale(cameraDirection, t));
          let onCube = true;
          for (let k = 0; k < 3; k++) {
            if (i !== k && !(cube[k] <= mousePoint[k] && mousePoint[k] <= cube[k] + 1)) {
              onCube = false;
            }
          }

          if (t > 0 && t < tmin && onCube) {
            tmin = t;
            center = [cube[0] + 0.5, cube[1] + 0.5, cube[2] + 0.5];
            center[i] += j * 0.51;
            normal = [0, 0, 0];
            normal[i] = j;
          }
        }
      }
    }

    if (center && normal) {
      const position = add(diff(center, [0.5, 0.5, 0.5]), scale(normal, 0.49));
      const x = Math.round(position[0]);
      const y = Math.round(position[1]);
      const z = Math.round(position[2]);

      let exists = false;
      for (const cube of cubes) {
        if (cube[0] === x && cube[1] === y && cube[2] === z) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        cubes.push([x, y + 0.01, z]);
      }
    } else if (tXZPlane > 0) {
      const mouseXZPlanePoint = add(cameraPosition, scale(cameraDirection, tXZPlane));
      const x = Math.floor(mouseXZPlanePoint[0]);
      const z = Math.floor(mouseXZPlanePoint[2]);
      let exists = false;
      for (const cube of cubes) {
        if (cube[0] === x && cube[2] === z) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        cubes.push([x, 0.01, z]);
      }
    }
  });
  window.addEventListener("mousemove", e => {
    if (!document.pointerLockElement) {
      return;
    }

    // Update
    // TODO: Games like GTAV and Doom use slower mouse?
    // https://www.reddit.com/r/pcgaming/comments/12atizm/comment/jeusa9b/
    // Create menu to try different values.
    cameraDirectionAngles[0] -= 0.0003 * e.movementX;
    cameraDirectionAngles[1] -= 0.0003 * e.movementY;
    cameraDirectionAngles[1] = clamp(cameraDirectionAngles[1], - Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
  });

  let lastFrame = Date.now();
  function updateAndDraw() {
    let cameraDirectionOppositeNormalized: [number, number, number] = [
      -Math.cos(cameraDirectionAngles[1]) * Math.sin(cameraDirectionAngles[0]),
      -Math.sin(cameraDirectionAngles[1]),
      -Math.cos(cameraDirectionAngles[1]) * Math.cos(cameraDirectionAngles[0])
    ];
    let upNormalized = normalize(diff(cameraUp, scale(cameraDirectionOppositeNormalized, dot(cameraDirectionOppositeNormalized, cameraUp))));
    // Normal since other two vectors are unit and orthogonal.
    let rightNormalized = cross(upNormalized, cameraDirectionOppositeNormalized);

    // Update
    let direction: [number, number, number] = [0, 0, 0];

    // TODO: Add option to switch between these?
    // Earlier version
    // if (keysDown.has('KeyW')) {
    //   direction = diff(direction, cameraDirectionOppositeNormalized);
    // }
    // if (keysDown.has('KeyA')) {
    //   direction = diff(direction, rightNormalized);
    // }
    // if (keysDown.has('KeyS')) {
    //   direction = add(direction, cameraDirectionOppositeNormalized);
    // }
    // if (keysDown.has('KeyD')) {
    //   direction = add(direction, rightNormalized);
    // }

    if (keysDown.has('KeyW')) {
      direction = add(direction, [
        Math.sin(cameraDirectionAngles[0]),
        0.0,
        Math.cos(cameraDirectionAngles[0])
      ]);
    }
    if (keysDown.has('KeyA')) {
      direction = diff(direction, rightNormalized);
    }
    if (keysDown.has('KeyS')) {
      direction = add(direction, [
        -Math.sin(cameraDirectionAngles[0]),
        -0.0,
        -Math.cos(cameraDirectionAngles[0])
      ]);
    }
    if (keysDown.has('KeyD')) {
      direction = add(direction, rightNormalized);
    }
    if (keysDown.has('KeyQ')) {
      direction = add(direction, [0, -1, 0]);
    }
    if (keysDown.has('KeyE')) {
      direction = add(direction, [0, 1, 0]);
    }

    if (magnitude(direction) > 1e-6) {
      direction = normalize(direction);
      cameraPosition = add(cameraPosition, scale(direction, 0.1 * (Date.now() - lastFrame) / 16.66));
    }
    lastFrame = Date.now();

    // Draw
    let triangles = plane([0.0, 0.0, 0.0], [0.0, 1.0, 0.0], 200.0, [1.0, 1.0, 1.0, 0.2]);

    // Ray from camera center to mouse, in world coordinates.
    const cameraDirection: [number, number, number] = [
      Math.cos(cameraDirectionAngles[1]) * Math.sin(cameraDirectionAngles[0]),
      Math.sin(cameraDirectionAngles[1]),
      Math.cos(cameraDirectionAngles[1]) * Math.cos(cameraDirectionAngles[0])
    ];;

    triangles.push(...plane(
      add(cameraPosition, scale(cameraDirection, 2 * near)),
      cameraDirection,
      10 * 2 * (2 * near * Math.tan(fov / 2)) / gl!.canvas.width,
      [0.0, 0.0, 0.0, 1.0]
    ));

    for (const cube of cubes) {
      triangles.push(...axisAlignedBox(cube, [1.0, 1.0, 1.0], [1.0, 0.0, 0.0, 1.0]));
    }
    if (triangles.length > 10 * VERTEX_LIMIT) {
      triangles = triangles.slice(0, 10 * VERTEX_LIMIT);
    }
    triangleCount = triangles.length / 10;
    gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, new Float32Array(triangles));
  
    const cameraPositionShift = new Array(16).fill(0);
    cameraPositionShift[0] = cameraPositionShift[5] = cameraPositionShift[10] = cameraPositionShift[15] = 1;
    cameraPositionShift[3] = -cameraPosition[0];
    cameraPositionShift[7] = -cameraPosition[1];
    cameraPositionShift[11] = -cameraPosition[2];
  
    let rotation = new Array(16).fill(0);
    rotation[15] = 1;
    
    for (let i = 0; i < 3; i++) {
      rotation[0 * 4 + i] = rightNormalized[i];
      rotation[1 * 4 + i] = upNormalized[i];
      rotation[2 * 4 + i] = cameraDirectionOppositeNormalized[i];
    }

    let perspectiveMatrix = new Array(16).fill(0);
    perspectiveMatrix[0] = 1 / Math.tan(fov / 2);
    perspectiveMatrix[5] = gl!.canvas.width / (Math.tan(fov / 2) * gl!.canvas.height);
    perspectiveMatrix[11] = 2.0 / (1 / near - 1 / far);
    perspectiveMatrix[10] = perspectiveMatrix[11] / far + 1;
    perspectiveMatrix[14] = -1.0;
  
    const worldToClip = matrixMultiply(perspectiveMatrix, matrixMultiply(rotation, cameraPositionShift));

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
    gl!.drawArrays(gl!.TRIANGLES, 0, triangleCount);

    frameCount += 1;
    if (frameCount === FRAME_COUNT_FOR_FPS) {
      frameCount = 0;
      const currTime = Date.now();
      // TODO: Move the view into a different span?
      fpsSpan.innerText = `FPS: ${Math.round(FRAME_COUNT_FOR_FPS * 1000 / (currTime - lastTime))}`;
      lastTime = currTime;
    }
    requestAnimationFrame(updateAndDraw);
  }

  updateAndDraw();
}

main();