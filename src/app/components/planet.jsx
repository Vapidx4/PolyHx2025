import React, { useEffect } from "react";
import * as THREE from "three";
import createAtmosphere from "./atmosphere";

UPDATE_SPEED = 10000; // 10 second
WATER_PRODUCTION = 2.5;
FOOD_PRODUCTION = 2.5;
POPULATION_GROWTH = 1.1;
SHIP_COST = 100;

const Planet = ({ scene, planetParams, noiseFunctions, vertexShader, fragmentShader }) => {
     // State to hold the planet's resources and properties
  const [planetState, setPlanetState] = useState({
    ID: Math.floor(Math.random() * 10000), // Unique planet ID
    name: planetParams.name || "Unknown Planet",
    atmosphere: planetParams.atmosphere || true,
    oxygen: planetParams.oxygen || 21,
    pollution: planetParams.pollution || 0,
    population: planetParams.population || 1000, // so that we can make ships
    water: planetParams.water || 100,
    food: planetParams.food || 100,
    industrial: planetParams.industrial || 100,
    fuel: planetParams.fuel || 0,
    ships: [],
    waterProduction: Math.floor(planetParams.population / 2) || 0,
    foodProduction: Math.floor(planetParams.population / 2) || 0,
    industrialProduction: planetParams.industrialProduction || 0,
  });

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

// Resource update simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlanetState((prevState) => {
        const newState = { ...prevState };

        // Simulate resource consumption and growth based on production rates
        newState.water += newState.waterProduction * WATER_PRODUCTION - newState.population;
        newState.food += newState.foodProduction * FOOD_PRODUCTION - newState.population;
        newState.industrial += newState.industrialProduction;
        newState.fuel += newState.industrialProduction;

        if (newState.water < 0) {
          newState.population -= newState.water;
          newState.water = 0;
        }

        if (newState.food < 0) {
          newState.population -= newState.food;
          newState.food = 0;
        }

        newState.population = Math.floor(newState.population * POPULATION_GROWTH); // Population growth

        return newState;
      });
    }, UPDATE_SPEED); // Update every 1 second

    return () => clearInterval(interval);
  }, []);

  // Create a ship (only if industrial resources are sufficient)
  const createShip = (shipName) => {
    if (planetState.industrial > 100) {
      setPlanetState((prevState) => ({
        ...prevState,
        industrial: prevState.industrial - 100,
        ships: [...prevState.ships, { name: shipName, planetID: prevState.ID }],
      }));
    } else {
      console.log("Not enough industrial resources to create a ship.");
    }
  };    

// Update the planet values dynamically using props (modifying planetParams)
  useEffect(() => {
    setPlanetState((prevState) => ({
      ...prevState,
      name: planetParams.name || prevState.name,
      atmosphere: planetParams.atmosphere || prevState.atmosphere,
      oxygen: planetParams.oxygen || prevState.oxygen,
      pollution: planetParams.pollution || prevState.pollution,
      population: planetParams.population || prevState.population,
      water: planetParams.water || prevState.water,
      food: planetParams.food || prevState.food,
      industrial: planetParams.industrial || prevState.industrial,
      fuel: planetParams.fuel || prevState.fuel,
      waterProduction: Math.floor(planetParams.population / 2) || prevState.waterProduction,
      foodProduction: Math.floor(planetParams.population / 2) || prevState.foodProduction,
      industrialProduction: planetParams.industrialProduction || prevState.industrialProduction,
    }));
  }, [planetParams]);

  return { planet, material, atmosphere };
};

export default Planet;
