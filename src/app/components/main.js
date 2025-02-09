// PlanetScene.jsx
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";
import Planet from "./Planet";

const PlanetScene = () => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up clock and stats.
    const clock = new THREE.Clock(true);
    const stats = new Stats();
    containerRef.current.appendChild(stats.dom);

    // Create renderer and attach it.
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create scene and set the skybox background.
    const scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader().load([
      "/xpos.png",
      "/xneg.png",
      "/ypos.png",
      "/yneg.png",
      "/zpos.png",
      "/zneg.png",
    ]);
    // Set Z as the up direction.
    scene.up.set(0, 0, 1);

    // Set up camera.
    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    camera.up.set(0, 0, 1);
    camera.position.set(0, -150, 50);

    // OrbitControls.
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.2;
    controls.enableDamping = true;
    controls.dampingFactor = 0.5;

    // Set up postprocessing composer.
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass();
    bloomPass.threshold = 0;
    bloomPass.strength = 0.3;
    bloomPass.radius = 0.5;
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // Add a central giant sun.
    const sunGeometry = new THREE.SphereGeometry(100, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd55,
      emissive: 0xffaa00,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    scene.add(sun);
    const sunLight = new THREE.PointLight(0xffaa00, 1.5, 5000);
    sunLight.position.copy(sun.position);
    scene.add(sunLight);

    // Global variables.
    let selectedPlanet = null; // For normal mode selection.
    let focusedRing = null;
    const connectionLines = [];
    let pathLine = null; // For displaying computed path
    const distanceLabels = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // --- Trade Route Mode Variables ---
    let tradeRouteMode = false; // If true, clicking adds to a trade route.
    let tradeRouteStops = []; // Array of planet objects (stops) for the current trade route.
    let routeLine = null; // The drawn polyline for the route.
    const activeTradeShips = [];

    // Helper: update the GUI display of trade route stops.
    function updateRouteStopsDisplay() {
      guiParams.tradeRouteStopDisplay = tradeRouteStops
        .map((p) => p.userData.name)
        .join(", ");
    }

    // Modified createTextSprite to store canvas info for updates.
    function createTextSprite(message, parameters) {
      parameters = parameters || {};
      const fontface = parameters.fontface || "Arial";
      const fontsize = parameters.fontsize || 24;
      const borderThickness = parameters.borderThickness || 4;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = fontsize + "px " + fontface;
      const metrics = context.measureText(message);
      const textWidth = metrics.width;
      canvas.width = textWidth + borderThickness * 2;
      canvas.height = fontsize * 1.4 + borderThickness * 2;
      context.font = fontsize + "px " + fontface;
      context.fillStyle = "rgba(255, 255, 255, 0.0)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(255, 255, 255, 1.0)";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(message, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(100, 50, 1);
      // Store canvas data for future updates.
      sprite.userData = {
        canvas,
        context,
        fontface,
        fontsize,
        borderThickness,
      };
      return sprite;
    }

    // New: update an existing text sprite.
    function updateTextSprite(sprite, message) {
      const { canvas, context, fontface, fontsize, borderThickness } =
        sprite.userData;
      context.font = fontsize + "px " + fontface;
      const metrics = context.measureText(message);
      const textWidth = metrics.width;
      canvas.width = textWidth + borderThickness * 2;
      canvas.height = fontsize * 1.4 + borderThickness * 2;
      context.font = fontsize + "px " + fontface;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(255, 255, 255, 0.0)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(255, 255, 255, 1.0)";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(message, canvas.width / 2, canvas.height / 2);
      sprite.material.map.needsUpdate = true;
    }

    // Helper: add a glowing ring to a planet.
    function focusOnPlanet(planet) {
      if (focusedRing) {
        if (focusedRing.parent) {
          focusedRing.parent.remove(focusedRing);
        }
        focusedRing.geometry.dispose();
        focusedRing.material.dispose();
        focusedRing = null;
      }
      const planetData = planets.find((p) => p.planet === planet);
      const planetRadius = planetData ? planetData.params.radius.value : 20;
      const innerRadius = planetRadius * 1.1;
      const outerRadius = planetRadius * 1.3;
      const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x99ccff),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      focusedRing = new THREE.Mesh(ringGeometry, ringMaterial);
      focusedRing.rotation.x = Math.PI / 2;
      planet.add(focusedRing);
    }

    // Helper function to check if a line between two points intersects the sun.
    function intersectsSun(p1, p2) {
      const center = new THREE.Vector3(0, 0, 0);
      const radius = 100; // Sun's radius
      const d = new THREE.Vector3().subVectors(p2, p1);
      const f = new THREE.Vector3().subVectors(p1, center);
      const a = d.dot(d);
      const b = 2 * f.dot(d);
      const c = f.dot(f) - radius * radius;
      let discriminant = b * b - 4 * a * c;
      if (discriminant < 0) return false;
      discriminant = Math.sqrt(discriminant);
      const t1 = (-b - discriminant) / (2 * a);
      const t2 = (-b + discriminant) / (2 * a);
      return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }

    // Modified showConnections using the weighted adjacency list.
    function showConnections(planet) {
      const baseColor = new THREE.Color(0x00ff88);
      const planetId = planet.userData.id;
      const neighbors = adjacencyList[planetId] || [];
      neighbors.forEach(({ planet: neighbor, weight }) => {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          planet.position,
          neighbor.position,
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.5,
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        connectionLines.push(line);
      });
    }

    // Click handler: in normal mode, select a planet; in trade route mode, add it as a stop.
    function onClick(event) {
      if (!tradeRouteMode) {
        connectionLines.forEach((line) => {
          scene.remove(line);
          line.geometry.dispose();
          line.material.dispose();
        });
        connectionLines.length = 0;
        distanceLabels.forEach((label) => document.body.removeChild(label));
        distanceLabels.length = 0;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const ray = new THREE.Ray();
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction
        .set(mouse.x, mouse.y, 0.5)
        .unproject(camera)
        .sub(ray.origin)
        .normalize();
      let closestPlanet = null;
      let closestDistance = Infinity;
      const targetVector = new THREE.Vector3();
      planets.forEach((planetObj) => {
        const planet = planetObj.planet;
        const params = planetObj.params;
        const radius = params.radius.value;
        const amplitude = params.amplitude.value;
        const visualRadius = radius + amplitude;
        const sphere = new THREE.Sphere(planet.position, visualRadius);
        const intersection = ray.intersectSphere(sphere, targetVector);
        if (intersection) {
          const distance = intersection.distanceTo(camera.position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPlanet = planet;
          }
        }
      });
      if (closestPlanet) {
        if (tradeRouteMode) {
          if (
            tradeRouteStops.length > 0 &&
            tradeRouteStops[tradeRouteStops.length - 1] === closestPlanet
          ) {
            console.log("Hmph, you cannot add the same planet consecutively!");
            return;
          }
          if (tradeRouteStops.length > 0) {
            const lastStop = tradeRouteStops[tradeRouteStops.length - 1];
            if (intersectsSun(lastStop.position, closestPlanet.position)) {
              console.log(
                "Hmph, trade route segment cannot cross through the sun!"
              );
              return;
            }
          }
          tradeRouteStops.push(closestPlanet);
          console.log(
            "Added planet to trade route:",
            closestPlanet.userData.name
          );
          updateRouteStopsDisplay();
          if (routeLine) {
            scene.remove(routeLine);
            routeLine.geometry.dispose();
            routeLine.material.dispose();
            routeLine = null;
          }
          if (tradeRouteStops.length > 1) {
            const points = tradeRouteStops.map((p) => p.position.clone());
            const routeGeometry = new THREE.BufferGeometry().setFromPoints(
              points
            );
            const routeMaterial = new THREE.LineBasicMaterial({
              color: 0x00ff00,
            });
            routeLine = new THREE.Line(routeGeometry, routeMaterial);
            scene.add(routeLine);
          }
        } else {
          selectedPlanet = closestPlanet;
          showConnections(selectedPlanet);
          focusOnPlanet(selectedPlanet);
        }
      }
    }
    renderer.domElement.addEventListener("click", onClick);

    // Keybinds: T for top-down view, F to refocus.
    const onKeyDown = (event) => {
      if (event.key === "t" || event.key === "T") {
        let targetLookAt, targetPosition;
        if (selectedPlanet) {
          targetLookAt = selectedPlanet.position.clone();
          targetPosition = selectedPlanet.position
            .clone()
            .add(new THREE.Vector3(0, 0, 150));
        } else {
          targetLookAt = new THREE.Vector3(0, 0, 0);
          targetPosition = new THREE.Vector3(0, 0, 150);
        }
        let progress = 0;
        const duration = 1.5;
        const startTime = clock.getElapsedTime();
        const startPosition = camera.position.clone();
        const startLookAt = controls.target.clone();
        const animateTopDown = () => {
          const elapsed = clock.getElapsedTime() - startTime;
          progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          camera.position.lerpVectors(
            startPosition,
            targetPosition,
            easedProgress
          );
          controls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
          controls.update();
          if (progress < 1) {
            requestAnimationFrame(animateTopDown);
          }
        };
        animateTopDown();
      } else if (event.key === "f" || event.key === "F") {
        if (selectedPlanet) {
          focusOnPlanet(selectedPlanet);
        } else {
          console.log("Hmph, no planet selected to focus on!");
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // --- Generate planet positions ensuring a minimum distance ---
    const numPlanets = 50;
    const minOrbitRadius = 300;
    const maxOrbitRadius = 1500;
    const minDistanceBetweenPlanets = 50; // Adjust as needed
    const planetPositions = [];
    for (let i = 0; i < numPlanets; i++) {
      let candidate;
      let valid = false;
      while (!valid) {
        const angle = Math.random() * Math.PI * 2;
        const radius =
          minOrbitRadius + Math.random() * (maxOrbitRadius - minOrbitRadius);
        candidate = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        );
        valid = planetPositions.every(
          (pos) => candidate.distanceTo(pos) >= minDistanceBetweenPlanets
        );
      }
      planetPositions.push(candidate);
    }

    // Helper: generate a random planet name like "ABC-123".
    function generatePlanetName() {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numbers = "0123456789";
      let nameLetters = "";
      let nameNumbers = "";
      for (let i = 0; i < 3; i++) {
        nameLetters += letters.charAt(
          Math.floor(Math.random() * letters.length)
        );
      }
      for (let i = 0; i < 3; i++) {
        nameNumbers += numbers.charAt(
          Math.floor(Math.random() * numbers.length)
        );
      }
      return `${nameLetters}-${nameNumbers}`;
    }

    // Helper: create a text sprite for planet names.
    function createTextSprite(message, parameters) {
      parameters = parameters || {};
      const fontface = parameters.fontface || "Arial";
      const fontsize = parameters.fontsize || 24;
      const borderThickness = parameters.borderThickness || 4;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = fontsize + "px " + fontface;
      const metrics = context.measureText(message);
      const textWidth = metrics.width;
      canvas.width = textWidth + borderThickness * 2;
      canvas.height = fontsize * 1.4 + borderThickness * 2;
      context.font = fontsize + "px " + fontface;
      context.fillStyle = "rgba(255, 255, 255, 0.0)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(255, 255, 255, 1.0)";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(message, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(100, 50, 1);
      sprite.userData = {
        canvas,
        context,
        fontface,
        fontsize,
        borderThickness,
      };
      return sprite;
    }

    // Create parameter sets for different planet types.
    const baselinePlanetParams = {
      type: { value: 2 },
      radius: { value: 20.0 },
      amplitude: { value: 1.19 },
      sharpness: { value: 2.6 },
      offset: { value: -0.016 },
      period: { value: 0.6 },
      persistence: { value: 0.484 },
      lacunarity: { value: 1.8 },
      octaves: { value: 10 },
      undulation: { value: 0.0 },
      ambientIntensity: { value: 0.02 },
      diffuseIntensity: { value: 1 },
      specularIntensity: { value: 2 },
      shininess: { value: 10 },
      lightDirection: { value: new THREE.Vector3(1, 1, 1) },
      lightColor: { value: new THREE.Color(0xffffff) },
      bumpStrength: { value: 1.0 },
      bumpOffset: { value: 0.001 },
      transition2: { value: 0.071 },
      transition3: { value: 0.215 },
      transition4: { value: 0.372 },
      transition5: { value: 1.2 },
      blend12: { value: 0.152 },
      blend23: { value: 0.152 },
      blend34: { value: 0.104 },
      blend45: { value: 0.168 },
    };

    const earthLikePlanetParams = {
      ...baselinePlanetParams,
      color1: { value: new THREE.Color(0.014, 0.117, 0.279) },
      color2: { value: new THREE.Color(0.08, 0.527, 0.351) },
      color3: { value: new THREE.Color(0.62, 0.516, 0.372) },
      color4: { value: new THREE.Color(0.149, 0.254, 0.084) },
      color5: { value: new THREE.Color(0.15, 0.15, 0.15) },
    };

    const desertLikePlanetParams = {
      ...baselinePlanetParams,
      color1: { value: new THREE.Color(0.8, 0.5, 0.2) },
      color2: { value: new THREE.Color(0.9, 0.7, 0.3) },
      color3: { value: new THREE.Color(1.0, 0.8, 0.4) },
      color4: { value: new THREE.Color(1.0, 0.9, 0.5) },
      color5: { value: new THREE.Color(1.0, 1.0, 0.6) },
    };

    const alienLikePlanetParams = {
      ...baselinePlanetParams,
      color1: { value: new THREE.Color(0.5, 0.3, 0.8) },
      color2: { value: new THREE.Color(0.08, 0.4, 0.8) },
      color3: { value: new THREE.Color(0.6, 0.5, 0.3) },
      color4: { value: new THREE.Color(0.1, 0.1, 0.45) },
      color5: { value: new THREE.Color(0.3, 0.2, 0.5) },
    };

    const planetTypes = [
      earthLikePlanetParams,
      desertLikePlanetParams,
      alienLikePlanetParams,
    ];

    // Helper: clone planet parameters.
    function clonePlanetParams(params) {
      const cloned = {};
      for (const key in params) {
        if (!params[key]) {
          console.warn(`Missing parameter: ${key}`);
          continue;
        }
        const val = params[key].value;
        if (typeof val === "undefined") {
          console.warn(`Undefined value for parameter: ${key}`);
          cloned[key] = { value: null };
          continue;
        }
        if (val instanceof THREE.Color) {
          cloned[key] = { value: val.clone() };
        } else if (val instanceof THREE.Vector3) {
          cloned[key] = { value: val.clone() };
        } else if (typeof val === "object") {
          cloned[key] = { value: { ...val } };
        } else {
          cloned[key] = { value: val };
        }
      }
      return cloned;
    }

    const planets = [];
    for (let i = 0; i < numPlanets; i++) {
      const randomType =
        planetTypes[Math.floor(Math.random() * planetTypes.length)];
      const planetParams = clonePlanetParams(randomType);
      planetParams.type.value = Math.random() < 0.5 ? 2 : 3;
      const planetObj = Planet({
        scene,
        planetParams,
        noiseFunctions:
          document.getElementById("noise-functions")?.innerHTML || "",
        vertexShader:
          document.getElementById("planet-vert-shader")?.innerHTML ||
          "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader:
          document.getElementById("planet-frag-shader")?.innerHTML ||
          "void main() { gl_FragColor = vec4(1.0); }",
      });
      const pos = planetPositions[i];
      planetObj.planet.position.set(pos.x, pos.y, 0);
      const planetId = i;
      const planetName = generatePlanetName();
      planetObj.planet.userData.id = planetId;
      planetObj.planet.userData.name = planetName;
      const nameLabel = createTextSprite(planetName, {
        fontsize: 12,
        fontface: "Arial",
        borderThickness: 1,
      });
      nameLabel.position.set(0, 0, planetParams.radius.value + 15);
      planetObj.planet.add(nameLabel);
      planets.push({ ...planetObj, params: planetParams });
    }

    // Build the weighted adjacency list.
    const adjacencyList = {};
    planets.forEach((planetObj) => {
      const planet = planetObj.planet;
      adjacencyList[planet.userData.id] = [];
    });
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const planetA = planets[i].planet;
        const planetB = planets[j].planet;
        if (!intersectsSun(planetA.position, planetB.position)) {
          const distance = planetA.position.distanceTo(planetB.position);
          adjacencyList[planetA.userData.id].push({
            planet: planetB,
            weight: distance,
          });
          adjacencyList[planetB.userData.id].push({
            planet: planetA,
            weight: distance,
          });
        }
      }
    }

    // Build a plain graph for pathfinding.
    const graph = {};
    Object.keys(adjacencyList).forEach((node) => {
      graph[node] = {};
      adjacencyList[node].forEach((item) => {
        const neighborId = item.planet.userData.id;
        graph[node][neighborId] = item.weight;
      });
    });

    const planetPositionsMap = {};
    planets.forEach((p) => {
      planetPositionsMap[p.planet.userData.id.toString()] = p.planet.position;
    });

    // Set up a fuels map (each planet offers 100 units).
    const fuels = {};
    planets.forEach((planetObj) => {
      const id = planetObj.planet.userData.id;
      fuels[id] = 200;
    });

    function fuelAwareAStar(
      graph,
      fuels,
      planetPositions,
      start,
      end,
      fuelCapacity,
      fuelEfficiency
    ) {
      // Penalize refueling stops more (or less)
      const stopPenalty = 500;

      // The heuristic: straight-line distance (scaled to fuel consumption)
      function heuristic(node) {
        const pos1 = planetPositions[node];
        const pos2 = planetPositions[end];
        return pos1.distanceTo(pos2) * fuelEfficiency;
      }

      // Each state has: node, fuelLeft, stops, distance (so far), path (array), and total cost.
      // The total cost f = g + heuristic + (stops * stopPenalty)
      const heap = new MinHeap((a, b) => a.cost - b.cost);
      heap.push({
        node: start,
        fuelLeft: fuelCapacity,
        stops: 0,
        distance: 0,
        path: [start],
        cost: heuristic(start),
      });

      // visited[stateKey] keeps track of the best (maximum) fuelLeft we’ve seen for a given (node, stops) state.
      const visited = {};

      while (!heap.isEmpty()) {
        const current = heap.pop();
        const { node, fuelLeft, stops, distance, path } = current;
        if (node === end) {
          return { distance, path, stops, fuelLeft };
        }
        // Create a state key for the current node and stops.
        const stateKey = `${node}_${stops}`;
        if (visited[stateKey] !== undefined && visited[stateKey] >= fuelLeft) {
          continue;
        }
        visited[stateKey] = fuelLeft;

        // Explore all neighbors
        for (const neighbor in graph[node]) {
          const edgeDistance = graph[node][neighbor];
          const fuelNeeded = edgeDistance * fuelEfficiency;

          // Option 1: Do not refuel at current node.
          if (fuelLeft >= fuelNeeded) {
            const newFuel = fuelLeft - fuelNeeded;
            const newDistance = distance + edgeDistance;
            const newCost =
              newDistance + heuristic(neighbor) + stops * stopPenalty;
            heap.push({
              node: neighbor,
              fuelLeft: newFuel,
              stops: stops,
              distance: newDistance,
              path: path.concat([neighbor]),
              cost: newCost,
            });
          }

          // Option 2: Refuel at the current node (if available) then try the edge.
          const availableFuel = fuels[node] || 0;
          if (availableFuel > 0) {
            const refueled = Math.min(fuelCapacity, fuelLeft + availableFuel);
            if (refueled >= fuelNeeded) {
              const newFuel = refueled - fuelNeeded;
              const newDistance = distance + edgeDistance;
              const newCost =
                newDistance + heuristic(neighbor) + (stops + 1) * stopPenalty;
              heap.push({
                node: neighbor,
                fuelLeft: newFuel,
                stops: stops + 1,
                distance: newDistance,
                path: path.concat([neighbor]),
                cost: newCost,
              });
            }
          }
        }
      }

      // If no valid path is found
      return { distance: Infinity, path: [], stops: -1, fuelLeft: -1 };
    }

    class MinHeap {
      constructor(compare) {
        this.data = [];
        this.compare = compare;
      }
      push(item) {
        this.data.push(item);
        this._bubbleUp(this.data.length - 1);
      }
      pop() {
        if (this.data.length === 0) return null;
        const top = this.data[0];
        const bottom = this.data.pop();
        if (this.data.length > 0) {
          this.data[0] = bottom;
          this._bubbleDown(0);
        }
        return top;
      }
      isEmpty() {
        return this.data.length === 0;
      }
      _bubbleUp(index) {
        while (index > 0) {
          const parent = Math.floor((index - 1) / 2);
          if (this.compare(this.data[index], this.data[parent]) < 0) {
            [this.data[index], this.data[parent]] = [
              this.data[parent],
              this.data[index],
            ];
            index = parent;
          } else {
            break;
          }
        }
      }
      _bubbleDown(index) {
        const length = this.data.length;
        while (true) {
          let left = 2 * index + 1;
          let right = 2 * index + 2;
          let smallest = index;
          if (
            left < length &&
            this.compare(this.data[left], this.data[smallest]) < 0
          ) {
            smallest = left;
          }
          if (
            right < length &&
            this.compare(this.data[right], this.data[smallest]) < 0
          ) {
            smallest = right;
          }
          if (smallest !== index) {
            [this.data[index], this.data[smallest]] = [
              this.data[smallest],
              this.data[index],
            ];
            index = smallest;
          } else {
            break;
          }
        }
      }
    }

    // UPDATED: Standard Dijkstra’s algorithm with fuel simulation.
    function dijkstraShortestPath(
      graph,
      start,
      end,
      fuelCapacity,
      fuelEfficiency
    ) {
      const distances = {};
      const predecessors = {};
      for (let node in graph) {
        distances[node] = Infinity;
        predecessors[node] = null;
      }
      distances[start] = 0;
      let pq = [];
      pq.push({ distance: 0, node: start });
      while (pq.length > 0) {
        pq.sort((a, b) => a.distance - b.distance);
        const { distance: currentDistance, node: currentNode } = pq.shift();
        if (currentDistance > distances[currentNode]) continue;
        for (let neighbor in graph[currentNode]) {
          const weight = graph[currentNode][neighbor];
          if (weight * fuelEfficiency > fuelCapacity) continue;
          const newDist = currentDistance + weight;
          if (newDist < distances[neighbor]) {
            distances[neighbor] = newDist;
            predecessors[neighbor] = currentNode;
            pq.push({ distance: newDist, node: neighbor });
          }
        }
      }
      let path = [];
      let cur = end;
      if (distances[end] === Infinity) {
        return { distance: Infinity, path: [], fuelLeft: -1 };
      }
      while (cur !== null) {
        path.push(cur);
        cur = predecessors[cur];
      }
      path.reverse();
      // Simulate fuel consumption along the path.
      let fuelLeft = fuelCapacity;
      for (let i = 0; i < path.length - 1; i++) {
        const edgeDistance = graph[path[i]][path[i + 1]];
        fuelLeft -= edgeDistance * fuelEfficiency;
      }
      return { distance: distances[end], path, fuelLeft };
    }

    // Fuel-aware Dijkstra (“Djistras with Fuel”) that prefers high fuel levels.
    function dijkstraWithFuel(
      graph,
      fuels,
      start,
      end,
      fuelCapacity,
      fuelEfficiency
    ) {
      // Priority queue state: { stops, fuelLeft, distance, node, path }
      let pq = [];
      pq.push({
        stops: 0,
        fuelLeft: fuelCapacity,
        distance: 0,
        node: start,
        path: [start],
      });
      let visited = {}; // key: node, value: { stops, fuelLeft }
      while (pq.length > 0) {
        pq.sort((a, b) => {
          const aDeficit = fuelCapacity - a.fuelLeft;
          const bDeficit = fuelCapacity - b.fuelLeft;
          if (a.stops !== b.stops) return a.stops - b.stops;
          if (aDeficit !== bDeficit) return aDeficit - bDeficit;
          return a.distance - b.distance;
        });
        const current = pq.shift();
        const { stops, fuelLeft, distance, node, path } = current;
        // Always return the state, even if fuelLeft <= 0.
        if (node === end) {
          return { distance, path, stops, fuelLeft };
        }
        if (
          visited[node] &&
          (visited[node].stops < stops ||
            (visited[node].stops === stops &&
              visited[node].fuelLeft >= fuelLeft))
        ) {
          continue;
        }
        visited[node] = { stops, fuelLeft };
        for (let neighbor in graph[node]) {
          const d = graph[node][neighbor];
          const requiredFuel = d * fuelEfficiency;
          // Skip if the edge's required fuel exceeds full capacity.
          if (requiredFuel > fuelCapacity) continue;
          // Always push a state even if (fuelLeft - requiredFuel) becomes negative.
          pq.push({
            stops: stops,
            fuelLeft: fuelLeft - requiredFuel,
            distance: distance + d,
            node: neighbor,
            path: path.concat([neighbor]),
          });
          // Also, consider refueling at the current node.
          const availableFuel = fuels[node] || 0;
          const newFuel = Math.min(fuelCapacity, fuelLeft + availableFuel);
          pq.push({
            stops: stops + 1,
            fuelLeft: newFuel - requiredFuel,
            distance: distance + d,
            node: neighbor,
            path: path.concat([neighbor]),
          });
        }
      }
      return { distance: Infinity, path: [], stops: -1, fuelLeft: -1 };
    }

    // GUI Integration for Trade Route Creation.
    const guiParams = {
      tradeRouteMode: false,
      tradeRouteStopDisplay: "",
      loopTradeRoute: false,
      sendTradeShip: function () {
        if (tradeRouteStops.length < 2) {
          console.log(
            "Hmph, you need at least two stops to form a trade route!"
          );
          return;
        }
        let stops = tradeRouteStops.map((p) => p.position.clone());
        if (!stops[stops.length - 1].equals(stops[0])) {
          let retrace = [];
          for (let i = stops.length - 1; i >= 0; i--) {
            retrace.push(stops[i]);
            if (stops[i].equals(stops[0])) break;
          }
          stops = stops.concat(retrace);
        }
        const tradeShipGeometry = new THREE.SphereGeometry(50, 32, 32);
        const tradeShipMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
        });
        const tradeShipMesh = new THREE.Mesh(
          tradeShipGeometry,
          tradeShipMaterial
        );
        tradeShipMesh.position.copy(stops[0]);
        scene.add(tradeShipMesh);
        const fuelSprite = createTextSprite(`Fuel: 300`, {
          fontsize: 20,
          fontface: "Arial",
          borderThickness: 2,
        });
        fuelSprite.position.set(0, 0, 80);
        // tradeShipMesh.add(fuelSprite);
        const tradeShip = {
          mesh: tradeShipMesh,
          stops: stops,
          currentSegment: 0,
          progress: 0,
          speed: 50,
          fuel: 1000,
          maxFuel: 1000,
        };
        tradeShip.fuelIndicator = fuelSprite;
        activeTradeShips.push(tradeShip);
      },
      clearTradeRoute: function () {
        tradeRouteStops = [];
        if (routeLine) {
          scene.remove(routeLine);
          routeLine.geometry.dispose();
          routeLine.material.dispose();
          routeLine = null;
        }
        updateRouteStopsDisplay();
        console.log("Trade route cleared.");
      },
    };

    const gui = new GUI();
    gui
      .add(guiParams, "tradeRouteMode")
      .name("Trade Route Mode")
      .onChange((val) => {
        tradeRouteMode = val;
        console.log("Trade Route Mode is now " + (val ? "ON" : "OFF"));
      });
    gui.add(guiParams, "sendTradeShip").name("Send Trade Ship");
    gui.add(guiParams, "clearTradeRoute").name("Clear Trade Route");
    gui.add(guiParams, "loopTradeRoute").name("Loop Trade Route");
    gui.add(guiParams, "tradeRouteStopDisplay").name("Route Stops").listen();

    // GUI for Pathfinding.
    const pathfindingParams = {
      sourcePlanet: "",
      destinationPlanet: "",
      algorithm: "Shortest Path", // Options: "Shortest Path", "Fuel-Aware"
      fuelCapacity: 1000,
      fuelEfficiency: 1, // Fuel consumption per unit distance
      findPath: function () {
        if (
          pathfindingParams.sourcePlanet === "" ||
          pathfindingParams.destinationPlanet === ""
        ) {
          console.log("Hmph, you must select both a source and a destination!");
          return;
        }
        const sourceId = planetNameToId[pathfindingParams.sourcePlanet];
        const destinationId =
          planetNameToId[pathfindingParams.destinationPlanet];
        let result;
        if (pathfindingParams.algorithm === "Shortest Path") {
          result = dijkstraShortestPath(
            graph,
            sourceId,
            destinationId,
            pathfindingParams.fuelCapacity,
            pathfindingParams.fuelEfficiency
          );
        } else {
          result = fuelAwareAStar(
            graph,
            fuels,
            planetPositionsMap,
            sourceId,
            destinationId,
            pathfindingParams.fuelCapacity,
            pathfindingParams.fuelEfficiency
          );
        }
        console.log("Path result:", result);
        if (pathLine) {
          scene.remove(pathLine);
          pathLine.geometry.dispose();
          pathLine.material.dispose();
          pathLine = null;
        }
        // If a valid path was found, display it.
        if (result.path.length > 0 && result.distance !== Infinity) {
          const points = [];
          result.path.forEach((id) => {
            const planetObj = planets.find(
              (p) => p.planet.userData.id.toString() === id
            );
            if (planetObj) {
              points.push(planetObj.planet.position.clone());
            }
          });
          const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
          // Mark the path in red if the final fuel is <= 0, else in purple.
          const pathColor = result.fuelLeft <= 0 ? 0xff0000 : 0x800080;
          const pathMaterial = new THREE.LineBasicMaterial({
            color: pathColor,
            linewidth: 4,
          });
          pathLine = new THREE.Line(pathGeometry, pathMaterial);
          scene.add(pathLine);
        } else {
          console.log(
            "No valid path exists (fuel constraints prevent safe traversal)."
          );
        }
      },
    };

    // Build options for the drop-down menus based on planet names.
    const planetOptions = planets.map((p) => p.planet.userData.name).sort();
    const planetNameToId = {};
    planets.forEach((p) => {
      planetNameToId[p.planet.userData.name] = p.planet.userData.id.toString();
    });
    if (planetOptions.length > 0) {
      pathfindingParams.sourcePlanet = planetOptions[0];
      pathfindingParams.destinationPlanet =
        planetOptions[planetOptions.length - 1];
    }

    const pathfindingFolder = gui.addFolder("Pathfinding");
    pathfindingFolder
      .add(pathfindingParams, "sourcePlanet", planetOptions)
      .name("Source Planet");
    pathfindingFolder
      .add(pathfindingParams, "destinationPlanet", planetOptions)
      .name("Destination Planet");
    pathfindingFolder
      .add(pathfindingParams, "algorithm", ["Shortest Path", "Fuel-Aware"])
      .name("Algorithm");
    pathfindingFolder
      .add(pathfindingParams, "fuelCapacity", 100, 1000, 50)
      .name("Fuel Capacity");
    pathfindingFolder
      .add(pathfindingParams, "fuelEfficiency", 0.1, 5, 0.1)
      .name("Fuel Efficiency");
    pathfindingFolder.add(pathfindingParams, "findPath").name("Find Path");

    // Mark one random planet as the starter (for normal mode) and animate a camera transition.
    if (planets.length > 0) {
      const randomIndex = Math.floor(Math.random() * planets.length);
      selectedPlanet = planets[randomIndex].planet;
      const planetData = planets[randomIndex];
      const planetRadius = planetData ? planetData.params.radius.value : 20;
      const innerRadius = planetRadius * 1.1;
      const outerRadius = planetRadius * 1.3;
      const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x99ccff),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      focusedRing = new THREE.Mesh(ringGeometry, ringMaterial);
      focusedRing.rotation.x = Math.PI / 2;
      selectedPlanet.add(focusedRing);
      const sideOffset = new THREE.Vector3(200, 0, 50);
      camera.position.copy(selectedPlanet.position.clone().add(sideOffset));
      controls.target.copy(selectedPlanet.position);
      controls.update();
      const targetPosition = selectedPlanet.position
        .clone()
        .add(new THREE.Vector3(0, 0, 150));
      const targetLookAt = selectedPlanet.position.clone();
      let progress = 0;
      const duration = 1.5;
      const startTime = clock.getElapsedTime();
      const startPosition = camera.position.clone();
      const startLookAt = controls.target.clone();
      const animateTopDown = () => {
        const elapsed = clock.getElapsedTime() - startTime;
        progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(
          startPosition,
          targetPosition,
          easedProgress
        );
        controls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
        controls.update();
        if (progress < 1) {
          requestAnimationFrame(animateTopDown);
        } else {
          setLoading(false);
        }
      };
      animateTopDown();
    } else {
      setLoading(false);
    }

    // Animation loop.
    const animateLoop = () => {
      requestAnimationFrame(animateLoop);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      for (let i = activeTradeShips.length - 1; i >= 0; i--) {
        const ship = activeTradeShips[i];
        const currentIndex = ship.currentSegment;
        const startPos = ship.stops[currentIndex];
        const endPos = ship.stops[currentIndex + 1];
        const segmentDistance = startPos.distanceTo(endPos);
        const progressIncrement = (ship.speed * delta) / segmentDistance;
        if (ship.progress + progressIncrement >= 1) {
          const remainingProgress = 1 - ship.progress;
          const distanceNeeded = segmentDistance * remainingProgress;
          if (ship.fuel < distanceNeeded) {
            console.log("Ship ran out of fuel mid-segment!");
            scene.remove(ship.mesh);
            activeTradeShips.splice(i, 1);
            continue;
          }
          ship.fuel -= distanceNeeded;
          ship.mesh.position.copy(endPos);
          ship.fuel = Math.min(ship.fuel + 200, ship.maxFuel);
          ship.currentSegment++;
          ship.progress = 0;
          if (ship.currentSegment >= ship.stops.length - 1) {
            if (guiParams.loopTradeRoute) {
              ship.currentSegment = 0;
            } else {
              scene.remove(ship.mesh);
              activeTradeShips.splice(i, 1);
              continue;
            }
          }
        } else {
          const prevPos = ship.mesh.position.clone();
          ship.progress += progressIncrement;
          ship.mesh.position.lerpVectors(startPos, endPos, ship.progress);
          const distanceTraveled = ship.mesh.position.distanceTo(prevPos);
          if (ship.fuel < distanceTraveled) {
            console.log("Ship ran out of fuel! Trade route aborted.");
            scene.remove(ship.mesh);
            activeTradeShips.splice(i, 1);
            continue;
          }
          ship.fuel -= distanceTraveled;
        }
        if (ship.fuelIndicator) {
          const fuelDisplay = Math.round(ship.fuel).toString();
          console.log("Fuel: ", fuelDisplay);
          updateTextSprite(ship.fuelIndicator, `Fuel: ${fuelDisplay}`);
        }
      }
      planets.forEach(({ atmosphere }) => {
        if (
          atmosphere.material &&
          atmosphere.material.uniforms &&
          atmosphere.material.uniforms.time
        ) {
          atmosphere.material.uniforms.time.value = elapsedTime;
        }
        atmosphere.rotation.y += 0.0009;
      });
      controls.update();
      composer.render();
      stats.update();
    };
    animateLoop();

    // Handle window resizing.
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup.
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        containerRef.current.removeChild(stats.dom);
      }
      gui.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} id="app" style={{ position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "2em",
            zIndex: 10,
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
};

export default PlanetScene;
