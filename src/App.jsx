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

        <Stage adjustCamera intensity={1.0} shadows="contact">
          <Center top>
            <Card3D />
          </Center>
        </Stage>
        {/* Make it easy to inspect while developing; you can remove later */}
        <OrbitControls enablePan={false} />
{/* 
        <EffectComposer disableNormalPass>
          <Bloom disableNormalPass luminanceThreshold={1} mipmapBlur luminanceSmoothing={0} intensity={1} />

        </EffectComposer> */}
      </Canvas>

      <div className="ui-overlay">
        <small>Made with Love by Phteve💓</small>
      </div>
    </div>
  )
}
