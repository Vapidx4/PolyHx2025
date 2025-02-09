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
    let selectedPlanet = null; // This will be set when a planet is clicked.
    let focusedRing = null;
    const connectionLines = [];
    const distanceLabels = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

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

    // Click handler: select a planet (this becomes Planet A for the trade route).
    function onClick(event) {
      // Clear previous connections.
      connectionLines.forEach((line) => {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      });
      connectionLines.length = 0;
      distanceLabels.forEach((label) => document.body.removeChild(label));
      distanceLabels.length = 0;

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
        selectedPlanet = closestPlanet; // Set this as Planet A.
        showConnections(selectedPlanet);
        focusOnPlanet(selectedPlanet);
      }
    }

    renderer.domElement.addEventListener("click", onClick);

    // Draw connection lines (simple).
    function showConnections(planet) {
      const baseColor = new THREE.Color(0x00ff88);
      planets.forEach((otherPlanet) => {
        if (otherPlanet.planet !== planet) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            planet.position,
            otherPlanet.planet.position,
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.5,
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          scene.add(line);
          connectionLines.push(line);
        }
      });
    }

    // Easing function.
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

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
          const easedProgress = easeOutCubic(progress);
          camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
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

    // Generate planet positions in orbits around the sun.
    const numPlanets = 50;
    const minOrbitRadius = 300;
    const maxOrbitRadius = 1500;
    const planetPositions = [];
    for (let i = 0; i < numPlanets; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = minOrbitRadius + Math.random() * (maxOrbitRadius - minOrbitRadius);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      planetPositions.push(new THREE.Vector3(x, y, 0));
    }

    // Helper function to generate a random planet name in the form "ABC-123".
    function generatePlanetName() {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numbers = "0123456789";
      let nameLetters = "";
      let nameNumbers = "";
      for (let i = 0; i < 3; i++) {
        nameLetters += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      for (let i = 0; i < 3; i++) {
        nameNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      return `${nameLetters}-${nameNumbers}`;
    }

    // Helper function to create a text sprite for planet names.
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
      // Set canvas size.
      canvas.width = textWidth + borderThickness * 2;
      canvas.height = fontsize * 1.4 + borderThickness * 2;
      // Reset font after resizing.
      context.font = fontsize + "px " + fontface;
      // Optional: draw a transparent background.
      context.fillStyle = "rgba(255, 255, 255, 0.0)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      // Draw the text.
      context.fillStyle = "rgba(255, 255, 255, 1.0)";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(message, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      // Adjust scale as needed.
      sprite.scale.set(100, 50, 1);
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

    // Put all types into an array.
    const planetTypes = [earthLikePlanetParams, desertLikePlanetParams, alienLikePlanetParams];

    // Helper function to clone planet parameters.
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

    // Create an array to store our planet objects.
    const planets = [];
    for (let i = 0; i < numPlanets; i++) {
      // Randomly pick a type for this planet.
      const randomType = planetTypes[Math.floor(Math.random() * planetTypes.length)];
      const planetParams = clonePlanetParams(randomType);
      // Optionally, you can still randomly assign a type value if needed.
      planetParams.type.value = Math.random() < 0.5 ? 2 : 3;
      const planetObj = Planet({
        scene,
        planetParams,
        noiseFunctions: document.getElementById("noise-functions")?.innerHTML || "",
        vertexShader:
          document.getElementById("planet-vert-shader")?.innerHTML ||
          "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader:
          document.getElementById("planet-frag-shader")?.innerHTML ||
          "void main() { gl_FragColor = vec4(1.0); }",
      });
      const pos = planetPositions[i];
      planetObj.planet.position.set(pos.x, pos.y, 0);

      // Generate a unique id and a random name (e.g. "ABC-123") for the planet.
      const planetId = i; // Using loop index as the id.
      const planetName = generatePlanetName();
      planetObj.planet.userData.id = planetId;
      planetObj.planet.userData.name = planetName;

      // Create a text sprite for the planet's name and position it above the planet.
      const nameLabel = createTextSprite(planetName, {
        fontsize: 24,
        fontface: "Arial",
        borderThickness: 1,
      });
      // Adjust the label's position to be above the planet.
      nameLabel.position.set(0, 0, planetParams.radius.value + 15);
      planetObj.planet.add(nameLabel);

      planets.push({
        ...planetObj,
        params: planetParams,
      });
    }

    // ----- DAT.GUI Integration for Giant Ball Launch -----
    // Planet A is the selected planet from the click handler.
    // We'll only allow selection of Planet B via the GUI.
    let activeGiantBall = null; // Holds our giant ball data if one is active.
    const guiParams = {
      planetB: planets.length > 1 ? planets[1].planet.userData.name : "",
      sendGiantBall: function () {
        // Planet A is the selected planet from the click.
        if (!selectedPlanet) {
          console.log("Hmph, no source planet selected! Click on a planet first.");
          return;
        }
        // Find the planet object for Planet B based on the selected name.
        const planetBObj = planets.find(
          (p) => p.planet.userData.name === guiParams.planetB
        );
        if (!planetBObj) {
          console.log("Hmph, invalid target planet selection!");
          return;
        }
        // Create a giant ball (adjust size and material as desired).
        const giantBallGeometry = new THREE.SphereGeometry(50, 32, 32);
        const giantBallMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const giantBallMesh = new THREE.Mesh(giantBallGeometry, giantBallMaterial);
        // Start the giant ball at Planet A's position.
        giantBallMesh.position.copy(selectedPlanet.position);
        scene.add(giantBallMesh);
        // Set up animation data.
        activeGiantBall = {
          mesh: giantBallMesh,
          start: selectedPlanet.position.clone(),
          end: planetBObj.planet.position.clone(),
          progress: 0,
          speed: 0.5, // Adjust speed if needed.
        };
      },
    };

    // Create the dat.GUI interface.
    const gui = new GUI();
    // Only add the dropdown for Planet B.
    const planetNames = planets.map((p) => p.planet.userData.name);
    gui.add(guiParams, "planetB", planetNames).name("Planet B");
    gui.add(guiParams, "sendGiantBall").name("Send Giant Ball");
    // --------------------------------------------------------

    // Mark one random planet as the starter planet and animate a rotation transition.
    if (planets.length > 0) {
      const randomIndex = Math.floor(Math.random() * planets.length);
      selectedPlanet = planets[randomIndex].planet;
      // Add the glowing ring.
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

      // Set the camera's starting position to be to the side of the starter planet.
      const sideOffset = new THREE.Vector3(200, 0, 50); // Adjust this offset as needed.
      camera.position.copy(selectedPlanet.position.clone().add(sideOffset));
      controls.target.copy(selectedPlanet.position);
      controls.update();

      // Animate the camera to rotate into a top-down view of the starter planet.
      const targetPosition = selectedPlanet.position.clone().add(new THREE.Vector3(0, 0, 150));
      const targetLookAt = selectedPlanet.position.clone();
      let progress = 0;
      const duration = 1.5;
      const startTime = clock.getElapsedTime();
      const startPosition = camera.position.clone();
      const startLookAt = controls.target.clone();

      const animateTopDown = () => {
        const elapsed = clock.getElapsedTime() - startTime;
        progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
        controls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
        controls.update();
        if (progress < 1) {
          requestAnimationFrame(animateTopDown);
        } else {
          // End of animation: remove loading screen.
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

      // Update giant ball animation if one is active.
      if (activeGiantBall) {
        activeGiantBall.progress += delta * activeGiantBall.speed;
        activeGiantBall.mesh.position.lerpVectors(
          activeGiantBall.start,
          activeGiantBall.end,
          activeGiantBall.progress
        );
        if (activeGiantBall.progress >= 1) {
          scene.remove(activeGiantBall.mesh);
          activeGiantBall = null;
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
        // Slowly rotate each atmosphere.
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
      // Destroy the GUI (not that I care if you forget it).
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
