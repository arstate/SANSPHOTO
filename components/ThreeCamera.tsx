
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeCameraProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ThreeCamera: React.FC<ThreeCameraProps> = ({ className, style }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    
    // Set up camera
    const fov = 45;
    const aspect = 1; // Square aspect for the component
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5;
    camera.position.y = 0.5;
    camera.position.x = 0;
    camera.lookAt(0, 0, 0);

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(300, 300); // Fixed size for the container, CSS scales it
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // --- CAMERA MODEL GROUP ---
    const cameraGroup = new THREE.Group();

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.6,
        metalness: 0.2
    });
    const silverMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        roughness: 0.3, 
        metalness: 0.8 
    });
    const blackMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.8,
        metalness: 0.1
    });
    const lensGlassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x111133,
        metalness: 0.9,
        roughness: 0.1,
        transmission: 0.2, // Glass-like
        transparent: true
    });
    const redButtonMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });

    // 1. Main Body
    const bodyGeom = new THREE.BoxGeometry(3, 1.8, 0.8);
    const body = new THREE.Mesh(bodyGeom, bodyMaterial);
    cameraGroup.add(body);

    // 2. Silver Top Plate
    const topPlateGeom = new THREE.BoxGeometry(3, 0.4, 0.8);
    const topPlate = new THREE.Mesh(topPlateGeom, silverMaterial);
    topPlate.position.y = 0.9 + 0.2; // Half body height + half plate height - overlap
    topPlate.position.y = 1.0; 
    cameraGroup.add(topPlate);

    // 3. Grip (Right side)
    const gripGeom = new THREE.BoxGeometry(0.8, 1.7, 0.9); // Slightly thicker than body
    const grip = new THREE.Mesh(gripGeom, blackMaterial);
    grip.position.x = 0.9;
    grip.position.z = 0.1; 
    cameraGroup.add(grip);

    // 4. Lens Base
    const lensBaseGeom = new THREE.CylinderGeometry(0.7, 0.8, 0.3, 32);
    const lensBase = new THREE.Mesh(lensBaseGeom, silverMaterial);
    lensBase.rotation.x = Math.PI / 2;
    lensBase.position.z = 0.4 + 0.15; // Body half depth + lens half height
    cameraGroup.add(lensBase);

    // 5. Lens Barrel
    const lensBarrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 32);
    const lensBarrel = new THREE.Mesh(lensBarrelGeom, blackMaterial);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.z = 0.4 + 0.3 + 0.1;
    cameraGroup.add(lensBarrel);
    
    // 6. Lens Glass
    const lensGlassGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const lensGlass = new THREE.Mesh(lensGlassGeom, lensGlassMaterial);
    lensGlass.rotation.x = Math.PI / 2;
    lensGlass.position.z = 0.4 + 0.3 + 0.2 + 0.06;
    cameraGroup.add(lensGlass);

    // 7. Shutter Button
    const buttonGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
    const button = new THREE.Mesh(buttonGeom, redButtonMaterial);
    button.position.y = 1.2 + 0.1;
    button.position.x = 1.0;
    cameraGroup.add(button);

    // 8. Flash
    const flashGeom = new THREE.BoxGeometry(0.6, 0.4, 0.2);
    const flash = new THREE.Mesh(flashGeom, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 }));
    flash.position.y = 1.2 + 0.2;
    flash.position.x = 0.2;
    cameraGroup.add(flash);
    
    // 9. Viewfinder
    const viewfinderGeom = new THREE.BoxGeometry(0.5, 0.4, 0.85);
    const viewfinder = new THREE.Mesh(viewfinderGeom, blackMaterial);
    viewfinder.position.y = 1.2 + 0.2;
    viewfinder.position.x = -0.5;
    cameraGroup.add(viewfinder);

    // Center the group
    scene.add(cameraGroup);
    
    // Initial Tilt
    cameraGroup.rotation.x = 0.2;
    cameraGroup.rotation.z = -0.1;

    // --- ANIMATION LOOP ---
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Gentle rotation
      cameraGroup.rotation.y += 0.005;
      
      // Subtle wobbling
      cameraGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.05 - 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(frameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bodyGeom.dispose();
      bodyMaterial.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={className} 
      style={{ 
        width: '300px', 
        height: '300px', 
        ...style 
      }} 
    />
  );
};
