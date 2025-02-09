// planet.vert.js
import { noiseFunctions } from './noise.glsl.js';

// eslint-disable-next-line import/no-anonymous-default-export
export default `
in vec3 tangent;
${noiseFunctions}

// Terrain generation parameters
uniform int type;
uniform float radius;
uniform float amplitude;
uniform float sharpness;
uniform float offset;
uniform float period;
uniform float persistence;
uniform float lacunarity;
uniform int octaves;

// Bump mapping
uniform float bumpStrength;
uniform float bumpOffset;

out vec3 fragPosition;
out vec3 fragNormal;
out vec3 fragTangent;
out vec3 fragBitangent;

void main() {
  // Calculate terrain height
  float h = terrainHeight(
    type,
    position,
    amplitude,
    sharpness,
    offset,
    period,
    persistence,
    lacunarity,
    octaves
  );

  // Adjust vertex position based on terrain height
  vec3 pos = position * (radius + h);

  // Transform vertex position to clip space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // Pass data to fragment shader
  fragPosition = position;
  fragNormal = normal;
  fragTangent = tangent;
  fragBitangent = cross(normal, tangent);
}
`;