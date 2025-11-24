

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
    camera.position.z = 5 / (objectData.scale || 1); // Adjust zoom based on scale to keep visual size roughly consistent initially
    camera.position.y = 0.5;
    camera.position.x = 0;
    camera.lookAt(0, 0, 0);

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(300, 300); // Fixed size for the container
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.innerHTML = ''; // Clear previous canvas
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

    // --- OBJECT GENERATION ---
    const mainGroup = new THREE.Group();

    if (objectData.type === 'built-in-camera') {
        // --- BUILT-IN CAMERA MODEL ---
        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.2 });
        const silverMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 });
        const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.1 });
        const lensGlassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x111133, metalness: 0.9, roughness: 0.1, transmission: 0.2, transparent: true });
        const redButtonMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });

        // Geometry & Mesh creation (Same as previous implementation)
        const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 0.8), bodyMaterial);
        mainGroup.add(body);

        const topPlate = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.8), silverMaterial);
        topPlate.position.y = 1.0; 
        mainGroup.add(topPlate);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.9), blackMaterial);
        grip.position.set(0.9, 0, 0.1);
        mainGroup.add(grip);

        const lensBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 32), silverMaterial);
        lensBase.rotation.x = Math.PI / 2;
        lensBase.position.z = 0.55;
        mainGroup.add(lensBase);

        const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 32), blackMaterial);
        lensBarrel.rotation.x = Math.PI / 2;
        lensBarrel.position.z = 0.8;
        mainGroup.add(lensBarrel);
        
        const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), lensGlassMaterial);
        lensGlass.rotation.x = Math.PI / 2;
        lensGlass.position.z = 1.06;
        mainGroup.add(lensGlass);

        const button = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), redButtonMaterial);
        button.position.set(1.0, 1.3, 0);
        mainGroup.add(button);

        const flash = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 }));
        flash.position.set(0.2, 1.4, 0);
        mainGroup.add(flash);
        
        const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.85), blackMaterial);
        viewfinder.position.set(-0.5, 1.4, 0);
        mainGroup.add(viewfinder);
        
    } else if (objectData.type === 'custom-voxel' && parsedVoxels.length > 0) {
        // --- CUSTOM VOXEL RENDERER ---
        const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
        const voxelMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Color will be set per instance
        
        const count = parsedVoxels.length;
        const mesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, count);
        
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
        mesh.instanceColor!.needsUpdate = true; // Non-null assertion since we know it exists for MeshStandardMaterial
        
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
          // Add a tiny bit of float
          mainGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;
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
      // Dispose logic simplified for brevity, in prod should iterate scene children
    };
  }, [objectData, parsedVoxels]); // Re-run when objectData changes (except animation speed changes handled by re-render/ref check usually, but here strict effect)

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
