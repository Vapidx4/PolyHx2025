import React, { useEffect, useState } from "react";
import * as THREE from "three";
import createAtmosphere from "./atmosphere";

const UPDATE_SPEED = 10000; // 10 seconds
const WATER_PRODUCTION = 2.5;
const FOOD_PRODUCTION = 2.5;
const POPULATION_GROWTH = 1.1;
const SHIP_COST = 100;
const ATMOSPHERE_VISIBILITY_THRESHOLD = 100;

const Planet = ({ scene, planetParams, noiseFunctions, vertexShader, fragmentShader }) => {
  // Initialize state to hold the planet's resources and properties
//   const [planetState, setPlanetState] = useState({
//     ID: Math.floor(Math.random() * 10000), // Unique planet ID
//     name: planetParams.name || "Unknown Planet",
//     atmosphere: planetParams.atmosphere !== undefined ? planetParams.atmosphere : true,
//     oxygen: planetParams.oxygen !== undefined ? planetParams.oxygen : 21,
//     pollution: planetParams.pollution !== undefined ? planetParams.pollution : 0,
//     population: planetParams.population !== undefined ? planetParams.population : 1000, // so that we can make ships
//     water: planetParams.water !== undefined ? planetParams.water : 100,
//     food: planetParams.food !== undefined ? planetParams.food : 100,
//     industrial: planetParams.industrial !== undefined ? planetParams.industrial : 100,
//     fuel: planetParams.fuel !== undefined ? planetParams.fuel : 0,
//     ships: [],
//     waterProduction: planetParams.population ? Math.floor(planetParams.population / 2) : 0,
//     foodProduction: planetParams.population ? Math.floor(planetParams.population / 2) : 0,
//     industrialProduction: planetParams.industrialProduction !== undefined ? planetParams.industrialProduction : 0,
//   });

  // Shader configuration
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

  // Create planet mesh
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), material);
  if (planet.geometry.computeTangents) {
    planet.geometry.computeTangents();
  }
  scene.add(planet);

    // Determine the atmosphere color based on atmosphereCondition
    let atmosphereColor = "#ffffff"; // default to white (healthy)
    if (planetParams.atmosphereCondition) {
      // Support both an object with a 'value' property or a simple string.
      const condition =
        planetParams.atmosphereCondition.value || planetParams.atmosphereCondition;
      if (condition === "healthy") {
        atmosphereColor = "#ffffff"; // white
      } else if (condition === "polluted") {
        atmosphereColor = "#ffff00"; // yellow
      } else if (condition === "dangerous") {
        atmosphereColor = "#ffa500"; // orange
      }
    }

  // Add atmosphere as a child of the planet
  const atmosphere = createAtmosphere({
    particles: 250,
    minParticleSize: 50,
    maxParticleSize: 60,
    // Handle planetParams.radius flexibly: it can be an object with a 'value' property or a number directly.
    radius: planetParams.radius
      ? (planetParams.radius.value || planetParams.radius) + 1
      : 2,
    thickness: 0.5,
    density: -0.2,
    opacity: 0.8,
    scale: 4,
    color: atmosphereColor,
    speed: 0.03,
    // Handle planetParams.lightDirection similarly; defaulting to a simple vector if not provided.
    lightDirection: planetParams.lightDirection
      ? planetParams.lightDirection.value || planetParams.lightDirection
      : new THREE.Vector3(1, 1, 1),
  });
  planet.add(atmosphere);

    // Make the atmosphere invisible when the camera is too far away.
  // The onBeforeRender callback receives the current camera.
  atmosphere.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
    const distance = camera.position.distanceTo(planet.position);
    // Toggle visibility based on the threshold
    atmosphere.visible = distance <= ATMOSPHERE_VISIBILITY_THRESHOLD;
  };


  // Resource update simulation
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setPlanetState((prevState) => {
//         const newState = { ...prevState };

//         // Simulate resource consumption and growth based on production rates
//         newState.water += newState.waterProduction * WATER_PRODUCTION - newState.population;
//         newState.food += newState.foodProduction * FOOD_PRODUCTION - newState.population;
//         newState.industrial += newState.industrialProduction;
//         newState.fuel += newState.industrialProduction;

//         // If water is in shortage, decrease population by the shortage amount
//         if (newState.water < 0) {
//           newState.population += newState.water; // water is negative, so this subtracts
//           newState.water = 0;
//         }

//         // If food is in shortage, decrease population by the shortage amount
//         if (newState.food < 0) {
//           newState.population += newState.food; // food is negative, so this subtracts
//           newState.food = 0;
//         }

//         // Population growth
//         newState.population = Math.floor(newState.population * POPULATION_GROWTH);

//         return newState;
//       });
//     }, UPDATE_SPEED); // Update every 10 seconds

//     return () => clearInterval(interval);
//   }, []);

  // Create a ship (only if industrial resources are sufficient)
//   const createShip = (shipName) => {
//     if (planetState.industrial >= SHIP_COST) {
//       setPlanetState((prevState) => ({
//         ...prevState,
//         industrial: prevState.industrial - SHIP_COST,
//         ships: [...prevState.ships, { name: shipName, planetID: prevState.ID }],
//       }));
//     } else {
//       console.log("Not enough industrial resources to create a ship.");
//     }
//   };

  // Update the planet values dynamically using props (modifying planetParams)
//   useEffect(() => {
//     setPlanetState((prevState) => ({
//       ...prevState,
//       name: planetParams.name !== undefined ? planetParams.name : prevState.name,
//       atmosphere:
//         planetParams.atmosphere !== undefined
//           ? planetParams.atmosphere
//           : prevState.atmosphere,
//       oxygen: planetParams.oxygen !== undefined ? planetParams.oxygen : prevState.oxygen,
//       pollution:
//         planetParams.pollution !== undefined ? planetParams.pollution : prevState.pollution,
//       population:
//         planetParams.population !== undefined ? planetParams.population : prevState.population,
//       water: planetParams.water !== undefined ? planetParams.water : prevState.water,
//       food: planetParams.food !== undefined ? planetParams.food : prevState.food,
//       industrial:
//         planetParams.industrial !== undefined ? planetParams.industrial : prevState.industrial,
//       fuel: planetParams.fuel !== undefined ? planetParams.fuel : prevState.fuel,
//       waterProduction: planetParams.population
//         ? Math.floor(planetParams.population / 2)
//         : prevState.waterProduction,
//       foodProduction: planetParams.population
//         ? Math.floor(planetParams.population / 2)
//         : prevState.foodProduction,
//       industrialProduction:
//         planetParams.industrialProduction !== undefined
//           ? planetParams.industrialProduction
//           : prevState.industrialProduction,
//     }));
//   }, [planetParams]);

//   return { planet, material, atmosphere, createShip };
return { planet, material, atmosphere };

};

export default Planet;
