// src/Card3D.jsx
import * as THREE from 'three'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {useFrame} from '@react-three/fiber'
import {Html, Float, Sparkles, useTexture, useVideoTexture, Text} from '@react-three/drei'
import {a, useSpring, easings} from '@react-spring/three'

const CARD_W = 2.2
const CARD_H = 3.0
const HINGE_Z = 0.001   // tiny thickness illusion
const BORDER = 0.96

export default function Card3D() {
  const coverTex = useTexture('/img.jpg')
  coverTex.colorSpace = THREE.SRGBColorSpace
  coverTex.anisotropy = 8

  const vidTex = useVideoTexture('/floral.mp4', {
    start: true, loop: true, muted: true, crossOrigin: 'anonymous'
  })


  const light1 = useRef()
  const light2 = useRef()
  const light3 = useRef()
  const textRef = useRef()

  useFrame(({clock}) => {
    const t = clock.getElapsedTime()

    // Light related
    light1.current.position.set(Math.sin(- t) * 3, 0, Math.cos(t) * 3)
    light2.current.position.set(Math.sin(t * 0.3) * 3, 1.0, Math.cos(t * 0.7) * 3)
    light3.current.position.set(Math.cos(t * 0.3) * 2, -1.0, Math.sin(t * 0.7) * 2)

    // Text related
    const hue = (t * 0.12) % 1 // slow hue cycle
    const hue2 = (hue + 0.08) % 1

    if (!textRef.current) return
    textRef.current.color = `hsl(${hue * 360} 80% 60%)`
    textRef.current.outlineColor = `hsl(${hue2 * 360} 90% 65%)`
    textRef.current.outlineWidth = 0.025 + 0.01 * Math.sin(t * 2) // subtle pulse
  })

  const [hovered, setHovered] = useState(false)
  const {open, spark} = useSpring({
    open: hovered ? 1 : 0.1,
    spark: hovered ? 1 : 0,
    config: (key) => key === 'spark'
      ? {duration: 450, easing: easings.easeOutQuad} // fade sparkles
      : {tension: 180, friction: 16, precision: 0.001},
  })

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'default'
    return () => (document.body.style.cursor = 'default')
  }, [hovered])

  const [burstId, setBurstId] = useState(0)
  const triggerBurst = () => setBurstId((v) => v + 1)

  // Front cover rotation (hinge on left edge)
  const coverRotation = open.to((o) => -o * Math.PI * 0.85)

  const openSfx = React.useRef(null)
  const closeSfx = React.useRef(null)
  const partyHornSfx = React.useRef(null)
  const shimmeringSfx = React.useRef(null)

  React.useEffect(() => {
    openSfx.current = new Audio('/sfx/greeting-card-open.mp3')
    closeSfx.current = new Audio('/sfx/greeting-card-close.mp3')
    partyHornSfx.current = new Audio('/sfx/party-horn.mp3')
    shimmeringSfx.current = new Audio('/sfx/shimmering.mp3')
    openSfx.current.preload = 'auto'
    closeSfx.current.preload = 'auto'
    partyHornSfx.current.preload = 'auto'
    shimmeringSfx.current.preload = 'auto'
    openSfx.current.volume = 0.6
    closeSfx.current.volume = 0.6
    partyHornSfx.current.volume = 0.6
    shimmeringSfx.current.volume = 0.2
  }, [])

  const active = React.useRef(new Set()) // holds playing clones

  function play(ref, opts = {}) {
    const base = ref?.current
    if (!base) return
    const node = base.cloneNode()
    if (opts.volume != null) node.volume = opts.volume
    if (opts.start != null) node.currentTime = opts.start
    node.loop = !!opts.loop
    node.play()
    active.current.add(node)
    node.onended = () => active.current.delete(node)
    return node
  }

  function stop(ref, {reset = true} = {}) {
    const base = ref?.current
    if (!base) return
    // stop the template (in case you used it directly)
    base.pause()
    if (reset) base.currentTime = 0

    // stop any clones with the same src
    for (const node of [...active.current]) {
      if (node.src === base.src) {
        fadeStop(node)
        // if (reset) node.currentTime = 0
        active.current.delete(node)
      }
    }
  }

  function fadeStop(node, ms = 150) {
    const steps = 8
    const dec = node.volume / steps
    let i = 0
    const id = setInterval(() => {
      i++
      node.volume = Math.max(0, node.volume - dec)
      if (i >= steps) {
        clearInterval(id)
        node.pause()
        node.currentTime = 0
      }
    }, ms / steps)
  }

  const handleCardOpen = () => {
    setHovered(true)
    triggerBurst()
    play(openSfx)
    play(partyHornSfx)
    play(shimmeringSfx)
  }

  const handleCardClose = () => {
    setHovered(false)
    play(closeSfx)
    stop(shimmeringSfx)
  }

  const handleMobileTouch = () => {
    setHovered(h => {
      const next = !h
      if (next) {
        play(openSfx)
        play(partyHornSfx)
        triggerBurst()
      } else {
        play(closeSfx)
        stop(shimmeringSfx)

      }
      return next
    })
  }

  const fontProps = {font: '/fonts/DancingScript-Regular.woff', fontSize: 0.15, letterSpacing: -0.0025, lineHeight: 1.5, 'material-toneMapped': false}



  return (
    <Float floatIntensity={2.0} rotationIntensity={0.5} speed={5} position={[0, 0.5, 0]}>
      {/* Stationary hover target prevents pointerleave while cover swings */}
      <mesh
        position={[0, 0, HINGE_Z + 0.02]}
        onPointerEnter={handleCardOpen}
        onPointerLeave={handleCardClose}
        onPointerDown={handleMobileTouch} // mobile toggle
      >
        <planeGeometry args={[CARD_W * 1.15, CARD_H * 1.15]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group>


        {/* Inside content group — only show when slightly open */}
        {/* <a.group visible={open.to((o) => o > 0.2)}> */}
        <a.group >
          {/* Right interior paper plane */}
          <mesh>
            <planeGeometry args={[CARD_W, CARD_H]} />
            <meshStandardMaterial color="#fffdf7" side={THREE.DoubleSide} />
          </mesh>


          <Text
            ref={textRef}
            position={[0, 0, 0.001]}
            anchorX="center" anchorY="middle"
            fontSize={0.25}
            font='/fonts/' {...fontProps}
            outlineWidth={0.005}
            outlineBlur={0.025}
            outlineOpacity={0.25}
            maxWidth={CARD_W * 0.8}
          >
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ff66aa"            // glow color
              emissiveIntensity={1.2}
              toneMapped={false}            // keep it punchy for bloom
            />
            {'Of all the flowers \n I could ever pick, \n my favourite will always be you \n  \n - now give me a call ya’ bitch.'}
          </Text>
        </a.group>


        {/* Front cover (image) — hinge on left edge */}
        <a.group position={[-CARD_W / 2, 0, HINGE_Z]} rotation-y={coverRotation} zIndexRange={[1, 0]}>
          <group position={[CARD_W / 2, 0, 0]}>
            <mesh>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshBasicMaterial map={coverTex} toneMapped={false} side={THREE.FrontSide} />
            </mesh>
            <mesh position={[0, 0, 0.0005]}>
              <meshStandardMaterial color="#ffdbe8" side={THREE.BackSide} />
              <planeGeometry args={[CARD_W, CARD_H]} />
              <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[CARD_W * 0.8, CARD_H * 0.75]} />
                <meshStandardMaterial map={vidTex} toneMapped={false} side={THREE.FrontSide} />
              </mesh>
            </mesh>
          </group>
        </a.group>

        {/* Soft studio lighting */}
        <ambientLight intensity={0.15} position={[1.0, 0.0, 1.0]} />
        <pointLight ref={light1} intensity={10} distance={5} color="indigo" />
        <pointLight ref={light2} intensity={10} distance={5} color="hotpink" />
        <pointLight ref={light3} intensity={5} distance={5} color="mediumspringgreen" />
        {/* {light1.current && (
          <pointLightHelper args={[light1.current, 1, 'indigo']} />
        )}
        {light2.current && (
          <pointLightHelper args={[light2.current, 1, 'hotpink']} />
        )}
        {light3.current && (
          <pointLightHelper args={[light3.current, 1, 'hotpink']} />
        )} */}

      </group>

      {/* Sparkles with fade-in (scale + opacity feel) */}
      <a.group scale={spark.to((s) => [1, 1, 1].map(() => 1.4 + 1.0 * s))} visible={spark.to((s) => s > 0.02)}>
        <Sparkles
          count={256}
          scale={[2.4, 1.6, 1]}
          size={4}
          speed={0.45}
          position={[0, 0.1, 0]}
        />
      </a.group>

      <ConfettiBurst key={burstId} origin={[0, 1.1, 0]} />
    </Float>
  )
}




/** ConfettiBurst
 * Instanced planes that shoot outward once and fade.
 * Lightweight, restart-by-key approach.
 */
function ConfettiBurst({origin = [0, 1, 0], count = 1000, life = 1.2}) {
  const mesh = useRef()
  const colors = useMemo(
    () => ['#ff5c8a', '#f6c02d', '#7dd87d', '#6ecbff', '#c79bff', '#ff9ec4'].map(c => new THREE.Color(c)),
    []
  )
  const {positions, velocities, rotations, angVels, colorArr, scales} = useMemo(() => {
    const pos = []
    const vel = []
    const rot = []
    const av = []
    const cols = []
    const scl = []
    const dir = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      // Random cone-ish direction
      dir.set((Math.random() - 0.5), Math.random(), (Math.random() - 0.5)).normalize().multiplyScalar(2.2 + Math.random() * 1.2)
      vel.push(dir.x, dir.y + 2.0, dir.z)
      pos.push(origin[0], origin[1], origin[2])
      rot.push(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      av.push((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)
      const c = colsPick(colors)
      cols.push(c.r, c.g, c.b)
      scl.push(0.08 + Math.random() * 0.08)
    }
    return {
      positions: new Float32Array(pos),
      velocities: new Float32Array(vel),
      rotations: new Float32Array(rot),
      angVels: new Float32Array(av),
      colorArr: new Float32Array(cols),
      scales: new Float32Array(scl),
    }
  }, [origin, colors, count])

  const start = useRef(performance.now() / 1000)

  useFrame((_, dt) => {
    const t = performance.now() / 1000
    const age = t - start.current
    const imesh = mesh.current
    if (!imesh) return

    for (let i = 0; i < count; i++) {
      // read
      const idx3 = i * 3

      // integrate simple ballistic motion
      velocities[idx3 + 1] -= 4.8 * dt // gravity
      positions[idx3 + 0] += velocities[idx3 + 0] * dt
      positions[idx3 + 1] += velocities[idx3 + 1] * dt
      positions[idx3 + 2] += velocities[idx3 + 2] * dt

      rotations[idx3 + 0] += angVels[idx3 + 0] * dt
      rotations[idx3 + 1] += angVels[idx3 + 1] * dt
      rotations[idx3 + 2] += angVels[idx3 + 2] * dt

      // write transforms
      tempMatrix.compose(
        tempVec.set(positions[idx3], positions[idx3 + 1], positions[idx3 + 2]),
        tempQuat.setFromEuler(tempEuler.set(rotations[idx3], rotations[idx3 + 1], rotations[idx3 + 2])),
        tempVec2.set(scales[i], scales[i] * 0.6, 1) // tiny rectangles
      )
      imesh.setMatrixAt(i, tempMatrix)

      // fade out via color intensity
      const fade = Math.max(0, 1 - age / life)
      tempColor.setRGB(colorArr[idx3], colorArr[idx3 + 1], colorArr[idx3 + 2]).multiplyScalar(0.6 + 0.4 * fade)
      imesh.setColorAt(i, tempColor)
    }
    imesh.instanceMatrix.needsUpdate = true
    if (imesh.instanceColor) imesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

// — tiny temp objects for perf
const tempMatrix = new THREE.Matrix4()
const tempVec = new THREE.Vector3()
const tempVec2 = new THREE.Vector3()
const tempEuler = new THREE.Euler()
const tempQuat = new THREE.Quaternion()
const tempColor = new THREE.Color()
function colsPick(arr) {return arr[(Math.random() * arr.length) | 0]}
