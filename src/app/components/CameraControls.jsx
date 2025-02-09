import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CameraControls = ({ renderer, camera }) => {
  useEffect(() => {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };
    

    return () => {
      controls.dispose();
    };
  }, [camera, renderer]);

  return null;
};

export default CameraControls;
