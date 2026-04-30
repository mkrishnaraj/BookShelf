import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BookData } from './types'
import { createSpineTexture } from './BookSpineTexture'

interface BookMeshProps {
  book: BookData
  position: [number, number, number]
  onClick: () => void
  isSelected: boolean
}

/** Returns a slightly darkened version of a hex color. */
function darkenHex(hex: string, factor = 0.75): string {
  const clean = hex.replace('#', '')
  const r = Math.round(parseInt(clean.substring(0, 2), 16) * factor)
  const g = Math.round(parseInt(clean.substring(2, 4), 16) * factor)
  const b = Math.round(parseInt(clean.substring(4, 6), 16) * factor)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/** Returns a progress strip color string: red / yellow / green. */
function progressColor(pct: number): string {
  if (pct >= 75) return '#22c55e'
  if (pct >= 25) return '#eab308'
  return '#ef4444'
}

/**
 * Single book rendered as a 3D spine-facing box in the bookshelf.
 *
 * Animation strategy: we drive scale and rotation imperatively via useFrame
 * to avoid @react-spring/three JSX type-inference issues in strict mode.
 * The animation uses a simple exponential-easing toward a target value.
 */
const BookMesh = React.memo(function BookMesh({
  book,
  position,
  onClick,
  isSelected,
}: BookMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  // Animated value refs — mutated each frame, never trigger re-renders
  const scaleRef = useRef(1.0)
  const swayRef = useRef(0.0)

  // Convert mm → meters (world units)
  const W = book.spineWidthMm / 1000
  const H = book.heightMm / 1000
  const D = book.depthMm / 1000

  // Progress strip constants
  const STRIP_H = 0.006
  const STRIP_Y = -H / 2 + STRIP_H / 2
  const STRIP_Z = D / 2 + 0.0005

  // Build spine canvas texture — rebuilt only when relevant book data changes
  const spineTexture = useMemo(() => {
    const texW = Math.max(32, Math.round(book.spineWidthMm * 2.5))
    const texH = Math.max(128, Math.round(book.heightMm * 2))
    return createSpineTexture(book.title, book.author, book.spineColor, texW, texH)
  }, [book.title, book.author, book.spineColor, book.spineWidthMm, book.heightMm])

  // Dispose texture when it changes or on unmount
  useEffect(() => {
    return () => {
      spineTexture.dispose()
    }
  }, [spineTexture])

  const sideColor = darkenHex(book.spineColor, 0.7)
  const backColor = darkenHex(book.spineColor, 0.85)
  const stripColor = progressColor(book.percentRead)
  const emissiveColor = useMemo(() => new THREE.Color(book.spineColor), [book.spineColor])

  // Per-frame animation: spring-lerp scale toward target, sway when selected
  useFrame(({ clock }, delta) => {
    const g = groupRef.current
    if (!g) return

    const scaleTarget = hovered || isSelected ? 1.06 : 1.0
    const SPRING = Math.min(1, 12 * delta)   // ~12 Hz spring
    scaleRef.current += (scaleTarget - scaleRef.current) * SPRING
    g.scale.setScalar(scaleRef.current)

    if (isSelected) {
      swayRef.current = Math.sin(clock.getElapsedTime() * 1.5) * 0.04
    } else {
      swayRef.current *= 1 - Math.min(1, 8 * delta)
    }
    g.rotation.y = swayRef.current
  })

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Main book body — BoxGeometry with 6 separate materials */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        {/*
          Three.js BoxGeometry face ordering:
            0: +X right      1: -X left
            2: +Y top        3: -Y bottom
            4: +Z front (spine, faces user)
            5: -Z back
        */}
        <meshStandardMaterial attach="material-0" color={sideColor} roughness={0.85} />
        <meshStandardMaterial attach="material-1" color={sideColor} roughness={0.85} />
        <meshStandardMaterial attach="material-2" color={sideColor} roughness={0.85} />
        <meshStandardMaterial attach="material-3" color={sideColor} roughness={0.85} />
        <meshStandardMaterial
          attach="material-4"
          map={spineTexture}
          roughness={0.75}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 0.25 : 0}
        />
        <meshStandardMaterial attach="material-5" color={backColor} roughness={0.9} />
      </mesh>

      {/* Reading progress indicator strip at the bottom of the spine */}
      {book.percentRead > 0 && (
        <mesh position={[0, STRIP_Y, STRIP_Z]}>
          <planeGeometry args={[W * 0.85, STRIP_H]} />
          <meshBasicMaterial color={stripColor} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  )
})

export default BookMesh
