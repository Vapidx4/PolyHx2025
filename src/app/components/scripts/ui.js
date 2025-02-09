import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default function createUI(planetParams, atmosphereParams, material, atmosphere, bloomPass) {
  const gui = new GUI();

  const terrainFolder = gui.addFolder("Terrain");
  terrainFolder.add(planetParams.type, "value", { simplex: 1, fractal: 2, ridgedFractal: 3 }).name("Type").onChange(() => {
    material.needsUpdate = true;
  });
  terrainFolder.add(planetParams.amplitude, "value", 0.1, 1.5).name("Amplitude").onChange(() => {
    material.uniforms.amplitude.value = planetParams.amplitude.value;
  });
  terrainFolder.add(planetParams.sharpness, "value", 0, 5).name("Sharpness").onChange(() => {
    material.uniforms.sharpness.value = planetParams.sharpness.value;
  });

  terrainFolder.add(planetParams.offset, "value", -2, 2).name("Offset").onChange(() => {
    material.uniforms.offset.value = planetParams.offset.value;
  });

  terrainFolder.add(planetParams.period, "value", 0.1, 2).name("Period").onChange(() => {
    material.uniforms.period.value = planetParams.period.value;
  });

  terrainFolder.add(planetParams.lacunarity, "value", 1, 3).name("Lacunarity").onChange(() => {
    material.uniforms.lacunarity.value = planetParams.lacunarity.value;
  });

  terrainFolder.add(planetParams.octaves, "value", 1, 8, 1).name("Octaves").onChange(() => {
    material.uniforms.octaves.value = planetParams.octaves.value;
  });

  // Atmosphere settings
  const atmosphereFolder = gui.addFolder("Atmosphere");
  atmosphereFolder.add(atmosphereParams.thickness, "value", 0.1, 5).name("Thickness").onChange(() => {
    atmosphere.scale.setScalar(atmosphereParams.thickness.value);
  });

  atmosphereFolder.add(atmosphereParams.particles, "value", 1, 50000, 1).name("Particles").onChange(() => {
    atmosphere.updateParticles(atmosphereParams.particles.value);
  });

  atmosphereFolder.add(atmosphereParams.opacity, "value", 0, 1).name("Opacity").onChange(() => {
    atmosphere.material.opacity = atmosphereParams.opacity.value;
  });

  atmosphereFolder.add(atmosphereParams.scale, "value", 1, 30).name("Scale").onChange(() => {
    atmosphere.scale.setScalar(atmosphereParams.scale.value);
  });

  atmosphereFolder.add(atmosphereParams.speed, "value", 0, 0.1).name("Speed").onChange(() => {
    atmosphere.updateSpeed(atmosphereParams.speed.value);
  });

  // Lighting Controls
  const lightingFolder = gui.addFolder("Lighting");
  lightingFolder.add(planetParams.ambientIntensity, "value", 0, 5).name("Ambient").onChange(() => {
    material.uniforms.ambientIntensity.value = planetParams.ambientIntensity.value;
  });

  return gui;
}
