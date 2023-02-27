import * as THREE from 'three'
import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, createPortal, extend } from '@react-three/fiber'
import { useFBO, PerspectiveCamera, OrbitControls, shaderMaterial } from '@react-three/drei'
import glsl from 'babel-plugin-glsl/macro'
import { Perf } from 'r3f-perf'

function TextureScene() {
  const mesh = useRef()
  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += 0.01
  })
  return (
    <mesh ref={mesh}>
      <boxBufferGeometry />
      <meshNormalMaterial />
    </mesh>
  )
}

const WaveShaderMaterial = shaderMaterial(
  { uTime: 0, uTexture: new THREE.Texture() },
  glsl`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  glsl`
    precision mediump float;
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform vec3 uColor;

    varying vec2 vUv;

    void main() {
      vec3 texture = texture2D(uTexture, vUv).rgb;
      gl_FragColor = vec4(texture, 1.0);
    }
  `
)

extend({ WaveShaderMaterial })

const FBOScene = ({ props }) => {
  const target = useFBO(props)
  const cam = useRef()
  const scene = useMemo(() => {
    const scene = new THREE.Scene()
    return scene
  }, [])

  useFrame((state) => {
    cam.current.position.z = 5 + Math.sin(state.clock.getElapsedTime() * 1.5) * 2
    state.gl.setRenderTarget(target)
    state.gl.render(scene, cam.current)
    state.gl.setRenderTarget(null)
  })

  const shader = useRef()
  useFrame(({ clock }) => (shader.current.uTime = clock.getElapsedTime()))
  return (
    <>
      <PerspectiveCamera ref={cam} position={[0, 0, 3]} />
      {createPortal(<TextureScene />, scene)}
      <mesh>
        <planeBufferGeometry args={[2, 2]} />
        <waveShaderMaterial ref={shader} uTexture={target.texture} />
      </mesh>
    </>
  )
}

export default function App() {
  return (
    <Canvas>
      <OrbitControls />
      <Perf deepAnalyze={true} />
      <Suspense fallback={null}>
        <FBOScene multisample samples={8} stencilBuffer={false} format={THREE.RGBFormat} />
      </Suspense>
    </Canvas>
  )
}
