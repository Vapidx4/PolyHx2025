"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function createAtmosphere({
    particles,
    minParticleSize,
    maxParticleSize,
    radius,
    thickness,
    density,
    opacity,
    scale,
    color,
    speed,
    lightDirection,
  }) {
    // Load your texture and shaders as before...
    const texLoader = new THREE.TextureLoader();
    const cloudTex = texLoader.load("/cloud.png");
    const noiseFunctions = document.getElementById("noise-functions")?.innerHTML || "";
    const vertexShader = document.getElementById("atmosphere-vert-shader")?.innerHTML || "";
    const fragmentShader = document.getElementById("atmosphere-frag-shader")?.innerHTML || "";
  
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: cloudTex },
        particles: { value: particles },
        minParticleSize: { value: minParticleSize },
        maxParticleSize: { value: maxParticleSize },
        radius: { value: radius },
        thickness: { value: thickness },
        density: { value: density },
        opacity: { value: opacity },
        scale: { value: scale },
        color: { value: new THREE.Color(color) },
        speed: { value: speed },
        lightDirection: { value: lightDirection },
      },
      vertexShader,
      fragmentShader: fragmentShader.replace("void main() {", `${noiseFunctions} void main() {`),
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true,
    });
  
    const geometry = new THREE.BufferGeometry();
    const verts = [];
    const sizes = [];
    for (let i = 0; i < particles; i++) {
      const r = Math.random() * thickness + radius;
      const p = new THREE.Vector3(
        2 * Math.random() - 1,
        2 * Math.random() - 1,
        2 * Math.random() - 1
      );
      p.normalize();
      p.multiplyScalar(r);
      const size = Math.random() * (maxParticleSize - minParticleSize) + minParticleSize;
      verts.push(p.x, p.y, p.z);
      sizes.push(size);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
  
    const atmospherePoints = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(atmospherePoints);
    return group;
  }
export default createAtmosphere;
