import React, { useEffect } from "react";
import * as THREE from "three";
import createAtmosphere from "./atmosphere";

const Planet = ({ scene, planetParams, noiseFunctions, vertexShader, fragmentShader }) => {

    // shader config 
    const modifiedVertexShader = vertexShader.replace(
    "void main() {",
    `${noiseFunctions}\nvoid main() {`
  );
  const modifiedFragmentShader = fragmentShader.replace(
    "void main() {",
    `${noiseFunctions}\nvoid main() {`
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...planetParams,
      time: { value: 0 },
    },
    vertexShader: modifiedVertexShader,
    fragmentShader: modifiedFragmentShader,
  });

  // create planet mesh
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), material);
  if (planet.geometry.computeTangents) {
    planet.geometry.computeTangents();
  }
  scene.add(planet);

  // add atmosphere as a child of the planet
  const atmosphere = createAtmosphere({
    particles: 250,
    minParticleSize: 50,
    maxParticleSize: 60,
    radius: planetParams.radius.value + 1,
    thickness: 0.5,
    density: -0.2,
    opacity: 0.8,
    scale: 4,
    color: "#ffffff",
    speed: 0.03,
    lightDirection: planetParams.lightDirection.value,
  });
//   planet.add(atmosphere);


  return { planet, material, atmosphere };
};

export default Planet;
