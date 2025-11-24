
import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { FloatingObject, VoxelPoint } from '../types';

interface ThreeObjectProps {
  objectData: FloatingObject;
  className?: string;
  style?: React.CSSProperties;
}

export const ThreeObject: React.FC<ThreeObjectProps> = ({ objectData, className, style }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Memoize voxel data parsing
  const parsedVoxels: VoxelPoint[] = useMemo(() => {
    if (objectData.type === 'custom-voxel' && objectData.voxelData) {
      try {
        return JSON.parse(objectData.voxelData);
      } catch (e) {
        console.error("Failed to parse voxel data", e);
        return [];
      }
    }
    return [];
  }, [objectData.voxelData, objectData.type]);

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
    
    // Adjust camera distance based on scale to keep object visible
    camera.position.z = 6 / (objectData.scale || 1); 
    camera.position.y = 1;
    camera.position.x = 1;
    camera.lookAt(0, 0, 0);

    // --- HD RENDERER SETUP ---
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(300, 300); // Fixed size for the container
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    
    // Enable realistic lighting features
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Accurate colors
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic lighting
    renderer.toneMappingExposure = 1.2;

    mountRef.current.innerHTML = ''; // Clear previous canvas
    mountRef.current.appendChild(renderer.domElement);

    // --- STUDIO LIGHTING SETUP (HD LOOK) ---
    
    // 1. Ambient Light (Base fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 2. Key Light (Main bright light sources with shadows)
    const keyLight = new THREE.DirectionalLight(0xffffee, 2.5);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // 3. Fill Light (Softer, cooler light from opposite side)
    const fillLight = new THREE.DirectionalLight(0xddeeff, 1.0);
    fillLight.position.set(-5, 2, 5);
    scene.add(fillLight);
    
    // 4. Rim Light (Backlight for edge definition/pop)
    const rimLight = new THREE.SpotLight(0xffffff, 4.0);
    rimLight.position.set(0, 5, -5);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    // --- OBJECT GENERATION ---
    const mainGroup = new THREE.Group();

    if (objectData.type === 'built-in-camera') {
        // --- BUILT-IN CAMERA MODEL ---
        // Enhanced Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.4, 
            metalness: 0.3 
        });
        const silverMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xeeeeee, 
            roughness: 0.2, 
            metalness: 0.7 
        });
        const blackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.3, 
            metalness: 0.1 
        });
        const lensGlassMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0x111133, 
            metalness: 0.9, 
            roughness: 0.0, 
            transmission: 0.5, 
            transparent: true,
            thickness: 1.0
        });
        const redButtonMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xdd0000,
            roughness: 0.1,
            metalness: 0.2
        });

        const castAndReceive = (mesh: THREE.Mesh) => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        };

        const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 0.8), bodyMaterial);
        castAndReceive(body);
        mainGroup.add(body);

        const topPlate = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.8), silverMaterial);
        topPlate.position.y = 1.0; 
        castAndReceive(topPlate);
        mainGroup.add(topPlate);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.9), blackMaterial);
        grip.position.set(0.9, 0, 0.1);
        castAndReceive(grip);
        mainGroup.add(grip);

        const lensBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 32), silverMaterial);
        lensBase.rotation.x = Math.PI / 2;
        lensBase.position.z = 0.55;
        castAndReceive(lensBase);
        mainGroup.add(lensBase);

        const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 32), blackMaterial);
        lensBarrel.rotation.x = Math.PI / 2;
        lensBarrel.position.z = 0.8;
        castAndReceive(lensBarrel);
        mainGroup.add(lensBarrel);
        
        const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), lensGlassMaterial);
        lensGlass.rotation.x = Math.PI / 2;
        lensGlass.position.z = 1.06;
        mainGroup.add(lensGlass); // Glass doesn't usually cast standard shadows well in simple setups

        const button = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), redButtonMaterial);
        button.position.set(1.0, 1.3, 0);
        castAndReceive(button);
        mainGroup.add(button);

        const flash = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 }));
        flash.position.set(0.2, 1.4, 0);
        castAndReceive(flash);
        mainGroup.add(flash);
        
        const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.85), blackMaterial);
        viewfinder.position.set(-0.5, 1.4, 0);
        castAndReceive(viewfinder);
        mainGroup.add(viewfinder);
        
    } else if (objectData.type === 'custom-voxel' && parsedVoxels.length > 0) {
        // --- CUSTOM VOXEL RENDERER ---
        
        // Geometry optimization: Beveled box for better specular highlights on edges
        // Note: BoxGeometry(w, h, d) -> RoundedBoxGeometry is not standard in core three.js, 
        // so we stick to BoxGeometry but rely on lighting for edge definition.
        const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // HD Material: High gloss plastic/ceramic look
        const voxelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.2,  // Low roughness = Shiny
            metalness: 0.1,  // Slight metalness for reflection, mostly dielectric (plastic)
        }); 
        
        const count = parsedVoxels.length;
        const mesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, count);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Calculate center to center the object
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        parsedVoxels.forEach(v => {
            minX = Math.min(minX, v.x); minY = Math.min(minY, v.y); minZ = Math.min(minZ, v.z);
            maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        // Scale factor to normalize size relative to the camera field (approx fitting in a 4x4x4 area)
        const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
        const normalizeScale = 3 / maxDim;

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        parsedVoxels.forEach((voxel, i) => {
            dummy.position.set(
                (voxel.x - centerX) * normalizeScale, 
                (voxel.y - centerY) * normalizeScale, 
                (voxel.z - centerZ) * normalizeScale
            );
            dummy.scale.set(normalizeScale, normalizeScale, normalizeScale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            
            color.set(voxel.color);
            mesh.setColorAt(i, color);
        });

        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor!.needsUpdate = true;
        
        mainGroup.add(mesh);
    }

    scene.add(mainGroup);
    
    // Apply Static Rotation
    mainGroup.rotation.x = objectData.rotationX;
    mainGroup.rotation.y = objectData.rotationY;
    mainGroup.rotation.z = objectData.rotationZ;

    // --- ANIMATION LOOP ---
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      if (objectData.isSpinning) {
          const speed = objectData.spinSpeed || 0.005;
          mainGroup.rotation.y += speed;
          // Floating animation (Sine wave on Y axis)
          mainGroup.position.y = Math.sin(Date.now() * 0.0015) * 0.15;
          // Slight wobble on Z for realism
          mainGroup.rotation.z = objectData.rotationZ + Math.sin(Date.now() * 0.001) * 0.05;
      }

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
      scene.clear();
    };
  }, [objectData, parsedVoxels]); 

  return (
    <div 
      ref={mountRef} 
      className={className} 
      style={{ 
        width: `${300 * (objectData.scale || 1)}px`, 
        height: `${300 * (objectData.scale || 1)}px`, 
        ...style 
      }} 
    />
  );
};
