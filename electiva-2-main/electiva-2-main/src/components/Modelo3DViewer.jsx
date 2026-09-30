// src/components/Modelo3DViewer.jsx
import React, { Suspense, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useBounds } from '@react-three/drei';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useLoader } from '@react-three/fiber';
import './Modelo3DViewer.css';

function ModeloFBX({ ruta }) {
  const fbx = useLoader(FBXLoader, ruta);
  const escena = useMemo(() => fbx.clone(), [fbx]);
  const bounds = useBounds();

  // El modelo carga en forma asíncrona (Suspense), así que el encuadre inicial
  // de <Stage> se calcula con el placeholder vacío; hay que re-encuadrar a mano
  // una vez que el FBX real ya está en la escena.
  useEffect(() => {
    bounds.refresh().clip().fit();
  }, [escena, bounds]);

  return <primitive object={escena} />;
}

function PlaceholderCargando() {
  return (
    <mesh rotation={[0.4, 0.4, 0]}>
      <boxGeometry args={[40, 90, 8]} />
      <meshStandardMaterial color="#334155" wireframe />
    </mesh>
  );
}

function Modelo3DViewer({ ruta, alt, alto = '520px' }) {
  return (
    <div className="modelo3d-contenedor" role="img" aria-label={alt} style={{ height: alto }}>
      <Canvas camera={{ position: [0, 0, 220], fov: 35 }} dpr={[1, 2]} gl={{ toneMappingExposure: 3.2 }}>
        <ambientLight intensity={3.5} />
        <hemisphereLight args={['#ffffff', '#8090a0', 2.2]} />
        <directionalLight position={[150, 200, 250]} intensity={3} />
        <directionalLight position={[-150, -50, -200]} intensity={2} />
        <directionalLight position={[0, -200, 100]} intensity={1.4} />
        <pointLight position={[0, 0, 220]} intensity={1.5} />
        <Suspense fallback={<PlaceholderCargando />}>
          <Stage environment="city" intensity={3.5} adjustCamera={1.8}>
            <ModeloFBX ruta={ruta} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} minDistance={0.1} maxDistance={10000} autoRotate autoRotateSpeed={1.2} />
      </Canvas>
      <span className="modelo3d-hint">Arrastra para girar el modelo</span>
    </div>
  );
}

export default Modelo3DViewer;
