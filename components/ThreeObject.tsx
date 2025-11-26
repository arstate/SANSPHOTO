
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

    // --- STANDARD RENDERER SETUP (No PBR overhead) ---
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
    });
    renderer.setSize(300, 300); // Fixed size for the container
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    
    // Standard shadow map
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    mountRef.current.innerHTML = ''; // Clear previous canvas
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING (Standard) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // --- OBJECT GENERATION ---
    const mainGroup = new THREE.Group();

    if (objectData.type === 'built-in-camera') {
        // Keep built-in camera slightly nice looking but simplified
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.2 });
        const silverMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.6 });
        const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.1 });
        const lensGlassMaterial = new THREE.MeshStandardMaterial({ color: 0x111133, roughness: 0.2, metalness: 0.8 });
        const redButtonMaterial = new THREE.MeshStandardMaterial({ color: 0xdd0000 });

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
        mainGroup.add(lensGlass); 

        const button = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), redButtonMaterial);
        button.position.set(1.0, 1.3, 0);
        castAndReceive(button);
        mainGroup.add(button);

        const flash = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x555555 }));
        flash.position.set(0.2, 1.4, 0);
        castAndReceive(flash);
        mainGroup.add(flash);
        
        const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.85), blackMaterial);
        viewfinder.position.set(-0.5, 1.4, 0);
        castAndReceive(viewfinder);
        mainGroup.add(viewfinder);
        
    } else if (objectData.type === 'custom-voxel' && parsedVoxels.length > 0) {
        // --- CUSTOM VOXEL RENDERER (SIMPLIFIED / FLAT) ---
        
        const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Use MeshStandardMaterial with high roughness for a matte, blocky look (No PBR reflections)
        const voxelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 1.0,   // Totally matte
            metalness: 0.0,   // No metallic shine
        }); 
        
        const count = parsedVoxels.length;
        const mesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, count);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Center calculation
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        parsedVoxels.forEach(v => {
            minX = Math.min(minX, v.x); minY = Math.min(minY, v.y); minZ = Math.min(minZ, v.z);
            maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

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
            // Set scale to 1.0 (no gap) to make voxels contiguous
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
          mainGroup.position.y = Math.sin(Date.now() * 0.0015) * 0.15;
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
