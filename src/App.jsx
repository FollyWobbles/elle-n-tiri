// src/App.jsx
import {Canvas, useFrame} from '@react-three/fiber'
import {OrbitControls, Environment, Lightformer, Stage, Center} from '@react-three/drei'
import Card3D from './Card3D.jsx'
import {EffectComposer, Bloom} from '@react-three/postprocessing'

export default function App() {


  return (
    <div className="canvas-wrap">
      <Canvas
        dpr={[1, 2]}
        camera={{position: [0, 1.2, 4], fov: 45}}
      >

        <Stage adjustCamera intensity={1.0} shadows="contact" environment="forest">
          <Center top>
            <Card3D />
          </Center>
        </Stage>
        {/* Make it easy to inspect while developing; you can remove later */}
        <OrbitControls enablePan={false} />

        {/* <EffectComposer>
          <Bloom
            intensity={0.025}
            luminanceThreshold={5}
            luminanceSmoothing={5}
            mipmapBlur
          />
        </EffectComposer> */}
      </Canvas>

      <div className="ui-overlay">
        <small>Tip: hover/tap the card ✨</small>
      </div>
    </div>
  )
}
