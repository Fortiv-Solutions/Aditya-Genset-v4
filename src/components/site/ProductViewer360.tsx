import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";

const GLB_PATH = "/models/generator.glb";

interface ProductSpec {
  label: string;
  value: string;
  group: string;
}

interface Props {
  frames?: string[];
  specs: ProductSpec[];
  modelName?: string;
}

/* ── 3D Model ── */
function GeneratorModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={2.8} position={[0, 0.2, 0]} />;
}

const ProductViewer360 = ({ modelName }: Props) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* 3D Canvas — centered, medium size */}
      <div className="w-full h-full">
        <Canvas
          shadows
          camera={{ position: [0, 1.2, 4.2], fov: 50 }}
          style={{ width: "100%", height: "100%" }}
          onCreated={(state) => {
            state.gl.setClearColor("#f8f8f8", 0);
          }}
        >
          <Suspense fallback={null}>
            <GeneratorModel url={GLB_PATH} />

            {/* Lighting */}
            <ambientLight intensity={0.55} />
            <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.35} />
            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.4} />

            {/* Ground shadow */}
            <ContactShadows
              position={[0, -0.7, 0]}
              opacity={0.25}
              scale={10}
              blur={2.5}
              far={1}
            />
          </Suspense>

          {/* Orbit controls — infinite rotation, auto-spin, no pan */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            autoRotate={true}
            autoRotateSpeed={1.2}
            minDistance={2.5}
            maxDistance={6}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Canvas>
      </div>

    </div>
  );
};

export default ProductViewer360;
