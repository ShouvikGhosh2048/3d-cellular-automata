import './style.css';

// Math
type Vector3 = [number, number, number];
type Vector4 = [number, number, number, number];

function dot(a: Vector3, b: Vector3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function scale(v: Vector3, c: number): Vector3 {
  return [c * v[0], c * v[1], c * v[2]];
}

function add(a: Vector3, b: Vector3): Vector3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function diff(a: Vector3, b: Vector3): Vector3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function magnitude(v: Vector3) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function normalize(v: Vector3): Vector3 {
  const res: Vector3 = [...v];
  const m = magnitude(res);
  res[0] /= m;
  res[1] /= m;
  res[2] /= m;
  return res;
}

function matrix4Multiply(a: number[], b: number[]) {
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

function clamp(x: number, min: number, max: number) {
  if (x < min) {
    return min;
  } else if (max < x) {
    return max;
  } else {
    return x;
  }
}

// Parsing
function parseValues(valuesString: string, min: number, max: number) {
  const values = new Set<number>();

  let currNumber = null;
  for (const ch of valuesString) {
    if ('0123456789'.includes(ch)) {
      if (currNumber === null) {
        currNumber = Number(ch);
      } else {
        if (currNumber === 0) { return null; } // We don't allow leading zeroes.
        currNumber = 10 * currNumber + Number(ch);
      }
    } else if (ch === ',') {
      if (currNumber === null) { return null; } // Should have a number before a comma.
      if (currNumber < min || currNumber > max) { return null; }
      values.add(currNumber);
      currNumber = null;
    } else {
      return null;
    }
  }
  // We allow empty lists, but if its non empty, it needs to end with a number.
  if (currNumber === null && values.size > 0) { return null; }
  if (currNumber !== null) {
    if (currNumber < min || currNumber > max) { return null; }
    values.add(currNumber);
  }

  return values;
}

function parseNumber(numberString: string, min: number, max: number) {
  let currNumber = null;
  for (const ch of numberString) {
    if ('0123456789'.includes(ch)) {
      if (currNumber === null) {
        currNumber = Number(ch);
      } else {
        if (currNumber === 0) { return null; } // We don't allow leading zeroes.
        currNumber = 10 * currNumber + Number(ch);
      }
    } else {
      return null;
    }
  }

  if (currNumber === null || currNumber < min || currNumber > max) { return null; }
  return currNumber;
}

type Rule = {
  survival: Set<number>,
  birth: Set<number>,
  numberOfStates: number,
};

function parseRule(ruleString: string) {
  const parts = ruleString.split('/');
  if (parts.length === 3) {
    const survival = parseValues(parts[0], 0, 26);
    const birth = parseValues(parts[1], 1, 26);
    const numberOfStates = parseNumber(parts[2], 1, 10);
    if (survival !== null && birth !== null && numberOfStates !== null) {
      return { survival, birth, numberOfStates } as Rule;
    }
  }

  return null;
}

// WebGL
const GRID_SIZE = 50; // Needs to be even (and >= 6 for the initial example).

function plane(center: Vector3, normal: Vector3, size: number, color: Vector4) {
  // Gram Schmidt Orthogonalization
  const axes = [normal];
  if (Math.abs(normal[0]) > 1e-6) {
    axes.push([0, 1, 0]);
    axes.push([0, 0, 1]);
  } else if (Math.abs(normal[2]) > 1e-6) {
    axes.push([0, 1, 0]);
    axes.push([1, 0, 0]);
  } else {
    axes.push([1, 0, 0]);
    axes.push([0, 0, 1]);
  }

  for (let i = 0; i < 3; i++) {
    let axis = axes[i];
    for (let j = 0; j < i; j++) {
      axis = diff(axis, scale(axes[j], dot(axes[j], axes[i])));
    }
    axes[i] = normalize(axis);
  }

  return [
    ...diff(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...add(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,

    ...diff(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...diff(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...add(add(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
    ...add(diff(center, scale(axes[1], size / 2)), scale(axes[2], size / 2)), ...color,
  ];
}

type WebGLState = {
  gl: WebGL2RenderingContext,
  cubesVao: WebGLVertexArrayObject,
  cubesDataBuffer: WebGLBuffer,
  cubesProgram: WebGLProgram,
  cubesWorldToClipLocation: WebGLUniformLocation,
  numberOfStatesLocation: WebGLUniformLocation,
  numberOfCubes: number,
  singleCubeVertexCount: number,
  planesVao: WebGLVertexArrayObject,
  planesBuffer: WebGLBuffer,
  planesProgram: WebGLProgram,
  planesWorldToClipLocation: WebGLUniformLocation,
  planesVertexCount: number,
};

function getWebGLState(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
  });
  if (!gl) { return null; }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  // https://stackoverflow.com/a/74804393
  // https://www.reddit.com/r/opengl/comments/8vu2t0/issues_with_alpha_channel_in_webgl/
  // https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html
  // https://www.opengl.org/archives/resources/faq/technical/transparency.htm
  // https://stackoverflow.com/a/12286297
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const cubesVertexShaderSource = `#version 300 es
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer#integer_attributes
    in vec3 globalPosition;
    in float state;
    in vec3 localPosition;
    in vec3 normal;
    out vec4 outColor;
    uniform mat4 worldToClip;
    uniform float numberOfStates;

    void main() {
      // I work with right handed, and convert it in the shader.
      vec4 clipPosition = worldToClip * vec4(globalPosition + localPosition, 1);
      clipPosition.z = -clipPosition.z;
      gl_Position = clipPosition;
      vec4 inColor = vec4(0.0, 0.0, 0.0, 1.0);
      inColor.r = 1.0 - (1.0 - state / (numberOfStates - 1.0)) * (1.0 - state / (numberOfStates - 1.0));
      outColor = vec4(inColor.rgb * (2.0 + dot(vec3(0.3, 0.5, 1), normal)) / 3.0, inColor.a);
    }
  `;
  const cubesVertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!cubesVertexShader) { return null; }
  gl.shaderSource(cubesVertexShader, cubesVertexShaderSource);
  gl.compileShader(cubesVertexShader);
  if (!gl.getShaderParameter(cubesVertexShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(cubesVertexShader));
    return null;
  }

  const cubesFragmentShaderSource = `#version 300 es
    precision highp float;

    out vec4 color;
    in vec4 outColor;

    void main() {
      color = outColor;
    }
  `;
  const cubesFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!cubesFragmentShader) { return null; }
  gl.shaderSource(cubesFragmentShader, cubesFragmentShaderSource);
  gl.compileShader(cubesFragmentShader);
  if (!gl.getShaderParameter(cubesFragmentShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(cubesFragmentShader));
    return null;
  }

  const cubesProgram = gl.createProgram();
  if (!cubesProgram) { return null; }
  gl.attachShader(cubesProgram, cubesVertexShader);
  gl.attachShader(cubesProgram, cubesFragmentShader);
  gl.linkProgram(cubesProgram);
  if (!gl.getProgramParameter(cubesProgram, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(cubesProgram));
    return null;
  }

  const cubesVao = gl.createVertexArray();
  if (!cubesVao) { return null; }
  gl.bindVertexArray(cubesVao);

  const singleCubeBuffer = gl.createBuffer();
  if (!singleCubeBuffer) { return null; }
  gl.bindBuffer(gl.ARRAY_BUFFER, singleCubeBuffer);

  const EDGE_WIDTH = 0.05;
  const singleCubeData = [];
  // Faces
  for (let i = 0; i < 3; i++) {
    for (let j = -1; j <= 1; j += 2) {
      const normal = [0, 0, 0];
      normal[i] = j;
      const v1 = [0, 0, 0];
      const v2 = [0, 0, 0];
      const v3 = [0, 0, 0];
      const v4 = [0, 0, 0];
      v1[i] = v2[i] = v3[i] = v4[i] = (1 + j) / 2;
      let a1 = -1;
      let a2 = -1;
      if (i === 0) {
        a1 = 1;
        a2 = 2;
      } else if (i === 1) {
        a1 = 2;
        a2 = 0;
      } else {
        a1 = 0;
        a2 = 1;
      }
      v1[a1] = v2[a1] = 1 - EDGE_WIDTH;
      v3[a1] = v4[a1] = EDGE_WIDTH;
      v2[a2] = v3[a2] = 1 - EDGE_WIDTH;
      v1[a2] = v4[a2] = EDGE_WIDTH;
      if (j > 0) {
        singleCubeData.push(
          ...v1, ...normal,
          ...v2, ...normal,
          ...v3, ...normal,
          ...v1, ...normal,
          ...v3, ...normal,
          ...v4, ...normal,
        );
      } else {
        singleCubeData.push(
          ...v1, ...normal,
          ...v3, ...normal,
          ...v2, ...normal,
          ...v1, ...normal,
          ...v4, ...normal,
          ...v3, ...normal,
        );
      }
    }
  }

  // Edges
  for (let i = 0; i < 3; i++) {
    for (let j = -1; j <= 1; j += 2) {
      for (let k = -1; k <= 1; k += 2) {
        let a1 = -1;
        let a2 = -1;
        if (i === 0) {
          a1 = 1;
          a2 = 2;
        } else if (i === 1) {
          a1 = 2;
          a2 = 0;
        } else {
          a1 = 0;
          a2 = 1;
        }

        let normal: Vector3 = [0, 0, 0];
        normal[a1] = j;
        normal[a2] = k;
        normal = normalize(normal);

        const v1 = [0, 0, 0];
        const v2 = [0, 0, 0];
        const v3 = [0, 0, 0];
        const v4 = [0, 0, 0];

        v1[i] = v2[i] = 1 - EDGE_WIDTH;
        v3[i] = v4[i] = EDGE_WIDTH;

        v1[a1] = v4[a1] = (1 + j) / 2 - j * EDGE_WIDTH;
        v2[a1] = v3[a1] = (1 + j) / 2;

        v1[a2] = v4[a2] = (1 + k) / 2;
        v2[a2] = v3[a2] = (1 + k) / 2 - k * EDGE_WIDTH;

        console.log(j, k, j * k);
        if (j * k > 0) {
          singleCubeData.push(
            ...v1, ...normal,
            ...v2, ...normal,
            ...v3, ...normal,
            ...v1, ...normal,
            ...v3, ...normal,
            ...v4, ...normal,
          );
        } else {
          singleCubeData.push(
            ...v1, ...normal,
            ...v3, ...normal,
            ...v2, ...normal,
            ...v1, ...normal,
            ...v4, ...normal,
            ...v3, ...normal,
          );
        }
      }
    }
  }

  // Corners
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      for (let k = -1; k <= 1; k += 2) {
        let normal: Vector3 = [i, j, k];
        normal = normalize(normal);

        const v1 = [(1 + i) / 2, (1 + j) / 2 - j * EDGE_WIDTH, (1 + k) / 2 - k * EDGE_WIDTH];
        const v2 = [(1 + i) / 2 - i * EDGE_WIDTH, (1 + j) / 2, (1 + k) / 2 - k * EDGE_WIDTH];
        const v3 = [(1 + i) / 2 - i * EDGE_WIDTH, (1 + j) / 2 - j * EDGE_WIDTH, (1 + k) / 2];


        if (i * j * k > 0) {
          singleCubeData.push(
            ...v1, ...normal,
            ...v2, ...normal,
            ...v3, ...normal,
          );
        } else {
          singleCubeData.push(
            ...v1, ...normal,
            ...v3, ...normal,
            ...v2, ...normal,
          );
        }
      }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(singleCubeData), gl.STATIC_DRAW);

  const localPositionLocation = gl.getAttribLocation(cubesProgram, 'localPosition');
  gl.enableVertexAttribArray(localPositionLocation);
  gl.vertexAttribPointer(localPositionLocation, 3, gl.FLOAT, false, 6 * 4, 0);
  const normalLocation = gl.getAttribLocation(cubesProgram, "normal");
  gl.enableVertexAttribArray(normalLocation);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

  const cubesDataBuffer = gl.createBuffer();
  if (!cubesDataBuffer) { return null; }
  gl.bindBuffer(gl.ARRAY_BUFFER, cubesDataBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 4 * GRID_SIZE * GRID_SIZE * GRID_SIZE, gl.DYNAMIC_DRAW);

  const globalPositionLocation = gl.getAttribLocation(cubesProgram, 'globalPosition');
  gl.enableVertexAttribArray(globalPositionLocation);
  // https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)#Vectors
  // https://stackoverflow.com/questions/42741233/unsigned-byte-in-glsl
  gl.vertexAttribPointer(globalPositionLocation, 3, gl.BYTE, false, 4, 0);
  // https://webgl2fundamentals.org/webgl/lessons/webgl-instanced-drawing.html
  gl.vertexAttribDivisor(globalPositionLocation, 1);
  const stateLocation = gl.getAttribLocation(cubesProgram, 'state');
  gl.enableVertexAttribArray(stateLocation);
  gl.vertexAttribPointer(stateLocation, 1, gl.BYTE, false, 4, 3);
  gl.vertexAttribDivisor(stateLocation, 1);

  const cubesWorldToClipLocation = gl.getUniformLocation(cubesProgram, "worldToClip");
  if (!cubesWorldToClipLocation) { return; }
  const numberOfStatesLocation = gl.getUniformLocation(cubesProgram, "numberOfStates");
  if (!numberOfStatesLocation) { return; }

  const planesVertexShaderSource = `#version 300 es
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer#integer_attributes
    in vec3 position;
    in vec4 color;
    out vec4 outColor;
    uniform mat4 worldToClip;

    void main() {
      // I work with right handed, and convert it in the shader.
      vec4 clipPosition = worldToClip * vec4(position, 1);
      clipPosition.z = -clipPosition.z;
      gl_Position = clipPosition;
      outColor = color;
    }
  `;
  const planesVertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!planesVertexShader) { return null; }
  gl.shaderSource(planesVertexShader, planesVertexShaderSource);
  gl.compileShader(planesVertexShader);
  if (!gl.getShaderParameter(planesVertexShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(planesVertexShader));
    return null;
  }

  const planesFragmentShaderSource = `#version 300 es
    precision highp float;

    out vec4 color;
    in vec4 outColor;

    void main() {
      color = outColor;
    }
  `;
  const planesFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!planesFragmentShader) { return null; }
  gl.shaderSource(planesFragmentShader, planesFragmentShaderSource);
  gl.compileShader(planesFragmentShader);
  if (!gl.getShaderParameter(planesFragmentShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(planesFragmentShader));
    return null;
  }

  const planesProgram = gl.createProgram();
  if (!planesProgram) { return null; }
  gl.attachShader(planesProgram, planesVertexShader);
  gl.attachShader(planesProgram, planesFragmentShader);
  gl.linkProgram(planesProgram);
  if (!gl.getProgramParameter(planesProgram, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(planesProgram));
    return null;
  }

  const planesVao = gl.createVertexArray();
  if (!planesVao) { return null; }
  gl.bindVertexArray(planesVao);

  const planesBuffer = gl.createBuffer();
  if (!planesBuffer) { return null; }
  gl.bindBuffer(gl.ARRAY_BUFFER, planesBuffer);

  const planes = [];
  planes.push(...plane([0.0, 0.0, 0.0], [1.0, 0.0, 0.0], 10.0, [0.0, 0.0, 0.0, 1.0])); // Empty space for crosshair
  for (let i = -GRID_SIZE / 2; i < GRID_SIZE / 2; i++) {
    const color = [1.0, 1.0, 1.0, 0.5];
    const LINE_WIDTH = 0.05;

    planes.push(
      ...[i + LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i, 0, -GRID_SIZE / 2], ...color,
      ...[i, 0, GRID_SIZE / 2], ...color,
      ...[i + LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i, 0, GRID_SIZE / 2], ...color,
      ...[i + LINE_WIDTH, 0, GRID_SIZE / 2], ...color,

      ...[i + LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i, 0, GRID_SIZE / 2], ...color,
      ...[i, 0, -GRID_SIZE / 2], ...color,
      ...[i + LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i + LINE_WIDTH, 0, GRID_SIZE / 2], ...color,
      ...[i, 0, GRID_SIZE / 2], ...color,
    );

    planes.push(
      ...[i + 1 - LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i + 1, 0, -GRID_SIZE / 2], ...color,
      ...[i + 1, 0, GRID_SIZE / 2], ...color,
      ...[i + 1 - LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i + 1, 0, GRID_SIZE / 2], ...color,
      ...[i + 1 - LINE_WIDTH, 0, GRID_SIZE / 2], ...color,

      ...[i + 1 - LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i + 1, 0, GRID_SIZE / 2], ...color,
      ...[i + 1, 0, -GRID_SIZE / 2], ...color,
      ...[i + 1 - LINE_WIDTH, 0, -GRID_SIZE / 2], ...color,
      ...[i + 1 - LINE_WIDTH, 0, GRID_SIZE / 2], ...color,
      ...[i + 1, 0, GRID_SIZE / 2], ...color,
    );

    planes.push(
      ...[-GRID_SIZE / 2, 0, i + LINE_WIDTH], ...color,
      ...[-GRID_SIZE / 2, 0, i], ...color,
      ...[GRID_SIZE / 2, 0, i], ...color,
      ...[-GRID_SIZE / 2, 0, i + LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i], ...color,
      ...[GRID_SIZE / 2, 0, i + LINE_WIDTH], ...color,

      ...[-GRID_SIZE / 2, 0, i + LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i], ...color,
      ...[-GRID_SIZE / 2, 0, i], ...color,
      ...[-GRID_SIZE / 2, 0, i + LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i + LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i], ...color,
    );

    planes.push(
      ...[-GRID_SIZE / 2, 0, i + 1 - LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i + 1], ...color,
      ...[-GRID_SIZE / 2, 0, i + 1], ...color,
      ...[-GRID_SIZE / 2, 0, i + 1 - LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i + 1 - LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i + 1], ...color,
      

      ...[-GRID_SIZE / 2, 0, i + 1 - LINE_WIDTH], ...color,
      ...[-GRID_SIZE / 2, 0, i + 1], ...color,
      ...[GRID_SIZE / 2, 0, i + 1], ...color,
      ...[-GRID_SIZE / 2, 0, i + 1 - LINE_WIDTH], ...color,
      ...[GRID_SIZE / 2, 0, i + 1], ...color,
      ...[GRID_SIZE / 2, 0, i + 1 - LINE_WIDTH], ...color,
    );
  }
  planes.push(...plane([0.0, 0.0, 0.0], [0.0, 1.0, 0.0], GRID_SIZE, [1.0, 1.0, 1.0, 0.2]));
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planes), gl.DYNAMIC_DRAW);

  const positionLocation = gl.getAttribLocation(planesProgram, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 7 * 4, 0);
  const colorLocation = gl.getAttribLocation(planesProgram, "color");
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 7 * 4, 3 * 4);

  const planesWorldToClipLocation = gl.getUniformLocation(planesProgram, "worldToClip");
  if (!planesWorldToClipLocation) { return null; }

  return {
    gl,
    cubesVao,
    cubesDataBuffer,
    cubesProgram,
    cubesWorldToClipLocation,
    numberOfStatesLocation,
    numberOfCubes: 0,
    singleCubeVertexCount: singleCubeData.length / 6,
    planesVao,
    planesBuffer,
    planesProgram,
    planesWorldToClipLocation,
    planesVertexCount: planes.length / 7,
  };
}

function setCubesData(cubes: number[], state: WebGLState) {
  let cubesData = [];
  state.numberOfCubes = 0;
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (cubes[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z]) {
          cubesData.push(x - GRID_SIZE / 2, y - GRID_SIZE / 2, z - GRID_SIZE / 2, cubes[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z]);
          state.numberOfCubes += 1;
        }
      }
    }
  }
  state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.cubesDataBuffer);
  state.gl.bufferSubData(state.gl.ARRAY_BUFFER, 0, new Int8Array(cubesData));
}

function drawWebGLState(state: WebGLState, cameraPosition: Vector3, cameraDirectionAngles: [number, number], rule: Rule) {
  // Prevent this: https://www.reddit.com/r/Unity3D/comments/s66qvs/whats_causing_this_strange_texture_flickering_in
  // Near and far bounds based on Raylib
  let near = 0.01;
  let far = 1000;
  let fov = 120;

  let cameraDirectionOppositeNormalized: Vector3 = [
    -Math.cos(cameraDirectionAngles[1]) * Math.sin(cameraDirectionAngles[0]),
    -Math.sin(cameraDirectionAngles[1]),
    -Math.cos(cameraDirectionAngles[1]) * Math.cos(cameraDirectionAngles[0])
  ];
  let upNormalized = normalize(diff([0.0, 1.0, 0.0], scale(cameraDirectionOppositeNormalized, dot(cameraDirectionOppositeNormalized, [0.0, 1.0, 0.0]))));
  // Normal since other two vectors are unit and orthogonal.
  let rightNormalized = cross(upNormalized, cameraDirectionOppositeNormalized);

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
  perspectiveMatrix[5] = state.gl.canvas.width / (Math.tan(fov / 2) * state.gl.canvas.height);
  perspectiveMatrix[11] = 2.0 / (1 / near - 1 / far);
  perspectiveMatrix[10] = perspectiveMatrix[11] / far + 1;
  perspectiveMatrix[14] = -1.0;

  const worldToClip = matrix4Multiply(perspectiveMatrix, matrix4Multiply(rotation, cameraPositionShift));

  state.gl.viewport(0, 0, state.gl.canvas.width, state.gl.canvas.height);
  state.gl.clearColor(0, 0, 0, 0);
  state.gl.clearDepth(1);
  state.gl.clear(state.gl.COLOR_BUFFER_BIT | state.gl.DEPTH_BUFFER_BIT);

  state.gl.bindVertexArray(state.cubesVao);
  state.gl.useProgram(state.cubesProgram);
  state.gl.uniformMatrix4fv(state.cubesWorldToClipLocation, false, [
    worldToClip[0], worldToClip[4], worldToClip[8], worldToClip[12],
    worldToClip[1], worldToClip[5], worldToClip[9], worldToClip[13],
    worldToClip[2], worldToClip[6], worldToClip[10], worldToClip[14],
    worldToClip[3], worldToClip[7], worldToClip[11], worldToClip[15],
  ]);
  state.gl.uniform1f(state.numberOfStatesLocation, rule.numberOfStates);
  state.gl.drawArraysInstanced(state.gl.TRIANGLES, 0, state.singleCubeVertexCount, state.numberOfCubes);

  state.gl.bindVertexArray(state.planesVao);
  state.gl.useProgram(state.planesProgram);
  state.gl.uniformMatrix4fv(state.planesWorldToClipLocation, false, [
    worldToClip[0], worldToClip[4], worldToClip[8], worldToClip[12],
    worldToClip[1], worldToClip[5], worldToClip[9], worldToClip[13],
    worldToClip[2], worldToClip[6], worldToClip[10], worldToClip[14],
    worldToClip[3], worldToClip[7], worldToClip[11], worldToClip[15],
  ]);
  state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.planesBuffer);
  const cameraDirection: Vector3 = [
    Math.cos(cameraDirectionAngles[1]) * Math.sin(cameraDirectionAngles[0]),
    Math.sin(cameraDirectionAngles[1]),
    Math.cos(cameraDirectionAngles[1]) * Math.cos(cameraDirectionAngles[0])
  ];
  state.gl.bufferSubData(state.gl.ARRAY_BUFFER, 0, new Float32Array([...plane(add(cameraPosition, scale(cameraDirection, 2 * near)), cameraDirection, 2 * near * Math.tan(fov / 2) * 2 * 10 / state.gl.canvas.width, [0.0, 0.0, 0.0, 1.0])]));
  state.gl.drawArrays(state.gl.TRIANGLES, 0, state.planesVertexCount);
}

// Main
function main() {
  const controlsButton = document.querySelector<HTMLButtonElement>('#controlsButton');
  if (!controlsButton) { return; }

  const controls = document.querySelector<HTMLDivElement>('#controls');
  if (!controls) { return; }
  controls.style.display = 'none';

  controlsButton.addEventListener('click', () => {
    if (controls.style.display === 'none') {
      controls.style.display = 'block';
    } else {
      controls.style.display = 'none';
    }
  });

  let normalSpeed = 0.1;
  let fastSpeed = 0.3;
  let mouseSpeed = 0.0003;

  const normalSpeedInput = document.querySelector<HTMLInputElement>('#normalSpeed');
  if (!normalSpeedInput) { return; }
  normalSpeedInput.addEventListener('input', (e) => {
    let speed = Number((e.target! as HTMLInputElement).value);
    if (speed >= 0) {
      normalSpeed = speed;
      normalSpeedInput.style.backgroundColor = "";
    } else {
      normalSpeedInput.style.backgroundColor = "rgb(255, 230, 230)";
    }
  });

  const fastSpeedInput = document.querySelector<HTMLInputElement>('#fastSpeed');
  if (!fastSpeedInput) { return; }
  fastSpeedInput.addEventListener('input', (e) => {
    let speed = Number((e.target! as HTMLInputElement).value);
    if (speed >= 0) {
      fastSpeed = speed;
      fastSpeedInput.style.backgroundColor = "";
    } else {
      fastSpeedInput.style.backgroundColor = "rgb(255, 230, 230)";
    }
  });

  const mouseSpeedInput = document.querySelector<HTMLInputElement>('#mouseSpeed');
  if (!mouseSpeedInput) { return; }
  mouseSpeedInput.addEventListener('input', (e) => {
    let speed = Number((e.target! as HTMLInputElement).value);
    if (speed >= 0) {
      mouseSpeed = speed;
      mouseSpeedInput.style.backgroundColor = "";
    } else {
      mouseSpeedInput.style.backgroundColor = "rgb(255, 230, 230)";
    }
  });

  const canvas = document.querySelector('canvas');
  if (!canvas) { return; }
  canvas.width = Math.floor(window.innerWidth);
  canvas.height = Math.floor(window.innerHeight);

  const webglState = getWebGLState(canvas);
  if (!webglState) { return; }

  const fpsSpan = document.querySelector<HTMLSpanElement>('#fps')!;
  if (!fpsSpan) { return; }

  const ruleInput = document.querySelector<HTMLInputElement>('#rule');
  if (!ruleInput) { return; }
  let rule = {
    survival: new Set([4]),
    birth: new Set([4]),
    numberOfStates: 5,
  };
  ruleInput.addEventListener('input', e => {
    let ruleString = (e.target! as HTMLInputElement).value;
    const parsedRule = parseRule(ruleString);
    if (parsedRule !== null) {
      rule = parsedRule;

      for (let i = 0; i < cubes.length; i++) {
        if (cubes[i] > 0) {
          cubes[i] = rule.numberOfStates - 1;
        }
      }
      setCubesData(cubes, webglState);
    }

    if (parsedRule !== null) {
      ruleInput.style.backgroundColor = "rgb(230, 230, 230)";
    } else {
      ruleInput.style.backgroundColor = "rgb(255, 230, 230)";
    }
  });

  const randomButton = document.querySelector<HTMLButtonElement>('#randomButton');
  if (!randomButton) { return; }
  randomButton.addEventListener('click', () => {
    for (let i = 0; i < cubes.length; i++) {
      cubes[i] = 0;
    }
    for (let x = GRID_SIZE / 2 - 3; x < GRID_SIZE / 2 + 3; x++) {
      for (let y = GRID_SIZE / 2 - 3; y < GRID_SIZE / 2 + 3; y++) {
        for (let z = GRID_SIZE / 2 - 3; z < GRID_SIZE / 2 + 3; z++) {
          if (Math.random() < 0.2) {
            cubes[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] = rule.numberOfStates - 1;
          }
        }
      }
    }

    setCubesData(cubes, webglState);
  });

  const clearButton = document.querySelector<HTMLButtonElement>('#clearButton');
  if (!clearButton) { return; }
  clearButton.addEventListener('click', () => {
    for (let i = 0; i < cubes.length; i++) {
      cubes[i] = 0;
    }
    setCubesData(cubes, webglState);
  });

  window.addEventListener('resize', () => {
    canvas.width = Math.floor(window.innerWidth);
    canvas.height = Math.floor(window.innerHeight);
  });

  let cubes: number[] = new Array(GRID_SIZE * GRID_SIZE * GRID_SIZE).fill(0);
  let cubesCopy: number[] = new Array(GRID_SIZE * GRID_SIZE * GRID_SIZE).fill(0);
  cubes[GRID_SIZE / 2 * GRID_SIZE * GRID_SIZE + GRID_SIZE / 2 * GRID_SIZE + GRID_SIZE / 2 - 3] = rule.numberOfStates - 1;
  cubes[(GRID_SIZE / 2 - 1) * GRID_SIZE * GRID_SIZE + GRID_SIZE / 2 * GRID_SIZE + GRID_SIZE / 2 - 3] = rule.numberOfStates - 1;
  cubes[GRID_SIZE / 2 * GRID_SIZE * GRID_SIZE + (GRID_SIZE / 2 + 1) * GRID_SIZE + GRID_SIZE / 2 - 3] = rule.numberOfStates - 1;
  cubes[(GRID_SIZE / 2 - 1) * GRID_SIZE * GRID_SIZE + (GRID_SIZE / 2 + 1) * GRID_SIZE + GRID_SIZE / 2 - 3] = rule.numberOfStates - 1;
  cubes[GRID_SIZE / 2 * GRID_SIZE * GRID_SIZE + GRID_SIZE / 2 * GRID_SIZE + GRID_SIZE / 2 + 2] = rule.numberOfStates - 1;
  cubes[(GRID_SIZE / 2 - 1) * GRID_SIZE * GRID_SIZE + GRID_SIZE / 2 * GRID_SIZE + GRID_SIZE / 2 + 2] = rule.numberOfStates - 1;
  cubes[GRID_SIZE / 2 * GRID_SIZE * GRID_SIZE + (GRID_SIZE / 2 + 1) * GRID_SIZE + GRID_SIZE / 2 + 2] = rule.numberOfStates - 1;
  cubes[(GRID_SIZE / 2 - 1) * GRID_SIZE * GRID_SIZE + (GRID_SIZE / 2 + 1) * GRID_SIZE + GRID_SIZE / 2 + 2] = rule.numberOfStates - 1;
  setCubesData(cubes, webglState);

  let lastTime = Date.now();
  let frameCount = 0;
  const FRAME_COUNT_FOR_FPS = 60;

  let cameraPosition: Vector3 = [-50, 50, 50];
  let cameraDirectionAngles: [number, number] = [3 * Math.PI / 4, - Math.atan(1 / Math.sqrt(2))]; // [angle-in-xz-from-z, angle-from-xz]
  const cameraUp: Vector3 = [0, 1, 0];

  const keysDown = new Set<string>();
  window.addEventListener('keydown', (e) => {
    keysDown.add(e.code);

    if (document.pointerLockElement) {
      if (e.code === 'KeyN') {
        for (let i = 0; i < cubesCopy.length; i++) {
          cubesCopy[i] = 0;
        }

        for (let x = 0; x < GRID_SIZE; x++) {
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let z = 0; z < GRID_SIZE; z++) {
              let neighbours = 0;
              for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                  for (let k = -1; k <= 1; k++) {
                    if (i === 0 && j === 0 && k === 0) { continue; }

                    let neighbourX = x + i;
                    if (neighbourX < 0) {
                      neighbourX += GRID_SIZE;
                    } else if (neighbourX >= GRID_SIZE) {
                      neighbourX -= GRID_SIZE;
                    }
                    let neighbourY = y + j;
                    if (neighbourY < 0) {
                      neighbourY += GRID_SIZE;
                    } else if (neighbourY >= GRID_SIZE) {
                      neighbourY -= GRID_SIZE;
                    }
                    let neighbourZ = z + k;
                    if (neighbourZ < 0) {
                      neighbourZ += GRID_SIZE;
                    } else if (neighbourZ >= GRID_SIZE) {
                      neighbourZ -= GRID_SIZE;
                    }

                    if (cubes[GRID_SIZE * GRID_SIZE * neighbourX + GRID_SIZE * neighbourY + neighbourZ] === rule.numberOfStates - 1) {
                      neighbours += 1;
                    }
                  }
                }
              }

              if (cubes[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] === rule.numberOfStates - 1) {
                if (rule.survival.has(neighbours)) {
                  cubesCopy[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] = rule.numberOfStates - 1;
                } else {
                  cubesCopy[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] = rule.numberOfStates - 2;
                }
              } else if (cubes[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] > 0) {
                cubesCopy[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] = cubes[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] - 1;
              } else {
                if (rule.birth.has(neighbours)) {
                  cubesCopy[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z] = rule.numberOfStates - 1;
                }
              }
            }
          }
        }

        for (let i = 0; i < cubes.length; i++) {
          cubes[i] = cubesCopy[i];
        }

        setCubesData(cubes, webglState);
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
  });
  canvas.addEventListener("click", async () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
    if (!document.pointerLockElement) {
      await canvas.requestPointerLock();
    }
  });
  canvas.addEventListener("mousedown", e => {
    if (!document.pointerLockElement) {
      return;
    }

    // Ray from camera center to mouse, in world coordinates.
    const cameraDirection: Vector3 = [
      Math.cos(cameraDirectionAngles[1]) * Math.sin(cameraDirectionAngles[0]),
      Math.sin(cameraDirectionAngles[1]),
      Math.cos(cameraDirectionAngles[1]) * Math.cos(cameraDirectionAngles[0])
    ];

    // TODO: Handle edge cases for parallel?
    let tmin = Infinity;
    let center: null | Vector3 = null;
    let normal: null | Vector3 = null;
    let cubeIndex: null | Vector3 = null;
    
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          if (cubes[GRID_SIZE * GRID_SIZE * x + GRID_SIZE * y + z]) {
            const cube = [x - GRID_SIZE / 2, y - GRID_SIZE / 2, z - GRID_SIZE / 2];

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
                  cubeIndex = [x, y, z];
                }
              }
            }
          }
        }
      }
    }

    let tXZPlane = Infinity;
    if (-cameraPosition[1] / cameraDirection[1] > 0) {
      const planePoint = add(cameraPosition, scale(cameraDirection, -cameraPosition[1] / cameraDirection[1]));
      if (
        -GRID_SIZE / 2 <= planePoint[0] && planePoint[0] <= GRID_SIZE / 2
        && -GRID_SIZE / 2 <= planePoint[2] && planePoint[2] <= GRID_SIZE / 2
      ) {
        tXZPlane = -cameraPosition[1] / cameraDirection[1];
      }
    }

    if (e.button === 0) {
      if (center && normal && tmin < tXZPlane) {
        const position = add(diff(center, [0.5, 0.5, 0.5]), scale(normal, 0.49));
        const x = Math.round(position[0]);
        const y = Math.round(position[1]);
        const z = Math.round(position[2]);
  
        if (-GRID_SIZE / 2 <= x && x < GRID_SIZE / 2
          && -GRID_SIZE / 2 <= y && y < GRID_SIZE / 2
          && -GRID_SIZE / 2 <= z && z < GRID_SIZE / 2
          && cubes[GRID_SIZE * GRID_SIZE * (x + GRID_SIZE / 2) + GRID_SIZE * (y + GRID_SIZE / 2) + z + GRID_SIZE / 2] === 0
        ) {
          cubes[GRID_SIZE * GRID_SIZE * (x + GRID_SIZE / 2) + GRID_SIZE * (y + GRID_SIZE / 2) + z + GRID_SIZE / 2] = rule.numberOfStates - 1;
        }
      } else if (isFinite(tXZPlane)) {
        const mouseXZPlanePoint = add(cameraPosition, scale(cameraDirection, tXZPlane));
        const x = Math.floor(mouseXZPlanePoint[0]);
        const y = cameraPosition[1] > 0 ? 0 : -1;
        const z = Math.floor(mouseXZPlanePoint[2]);
        if (-GRID_SIZE / 2 <= x && x < GRID_SIZE / 2
          && -GRID_SIZE / 2 <= z && z < GRID_SIZE / 2
          && cubes[GRID_SIZE * GRID_SIZE * (x + GRID_SIZE / 2) + GRID_SIZE * (y + GRID_SIZE / 2) + z + GRID_SIZE / 2] === 0
        ) {
          cubes[GRID_SIZE * GRID_SIZE * (x + GRID_SIZE / 2) + GRID_SIZE * (y + GRID_SIZE / 2) + z + GRID_SIZE / 2] = rule.numberOfStates - 1;
        }
      }
    } else if (e.button === 2) {
      if (cubeIndex !== null && tmin < tXZPlane) {
        cubes[GRID_SIZE * GRID_SIZE * cubeIndex[0] + GRID_SIZE * cubeIndex[1] + cubeIndex[2]] = 0;
      }
    }

    setCubesData(cubes, webglState);
  });
  window.addEventListener("mousemove", e => {
    if (!document.pointerLockElement) {
      return;
    }

    // Update
    // TODO: Games like GTAV and Doom use slower mouse?
    // https://www.reddit.com/r/pcgaming/comments/12atizm/comment/jeusa9b/
    // https://github.com/mrdoob/three.js/blob/master/examples/games_fps.html and ThreeJS FPS controls
    // ThreeJS seems to use a faster mouse?
    // Create menu to try different values.
    cameraDirectionAngles[0] -= mouseSpeed * e.movementX;
    cameraDirectionAngles[1] -= mouseSpeed * e.movementY;
    cameraDirectionAngles[1] = clamp(cameraDirectionAngles[1], - Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
  });

  let lastFrame = Date.now();
  function updateAndDraw() {
    let cameraDirectionOppositeNormalized: Vector3 = [
      -Math.cos(cameraDirectionAngles[1]) * Math.sin(cameraDirectionAngles[0]),
      -Math.sin(cameraDirectionAngles[1]),
      -Math.cos(cameraDirectionAngles[1]) * Math.cos(cameraDirectionAngles[0])
    ];
    let upNormalized = normalize(diff(cameraUp, scale(cameraDirectionOppositeNormalized, dot(cameraDirectionOppositeNormalized, cameraUp))));
    // Normal since other two vectors are unit and orthogonal.
    let rightNormalized = cross(upNormalized, cameraDirectionOppositeNormalized);

    // Update
    if (document.pointerLockElement) {
      let direction: Vector3 = [0, 0, 0];

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
        const speed = (keysDown.has('Shift') || keysDown.has('ShiftLeft') || keysDown.has('ShiftRight')) ? fastSpeed : normalSpeed;
        cameraPosition = add(cameraPosition, scale(direction, speed * (Date.now() - lastFrame) / 16.66));
      }
    }
    lastFrame = Date.now();

    drawWebGLState(webglState!, cameraPosition, cameraDirectionAngles, rule);
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
