import React from 'react'
import type { ThemeConfig } from './shelfThemes'

interface ShelfPlankMeshProps {
  width: number
  positionY: number
  theme: ThemeConfig
}

/**
 * A single wooden shelf plank.
 * Dimensions: width x 0.02m (height) x 0.15m (depth).
 */
const ShelfPlankMesh = React.memo(function ShelfPlankMesh({
  width,
  positionY,
  theme,
}: ShelfPlankMeshProps) {
  const PLANK_HEIGHT = 0.022
  const PLANK_DEPTH = 0.16

  return (
    <group position={[0, positionY, 0]}>
      {/* Main plank surface */}
      <mesh receiveShadow castShadow position={[0, -PLANK_HEIGHT / 2, 0]}>
        <boxGeometry args={[width, PLANK_HEIGHT, PLANK_DEPTH]} />
        <meshStandardMaterial
          color={theme.shelfColor}
          roughness={theme.shelfRoughness}
          metalness={0.02}
        />
      </mesh>

      {/* Front edge lip — adds visual depth */}
      <mesh position={[0, -PLANK_HEIGHT / 2, PLANK_DEPTH / 2 + 0.004]}>
        <boxGeometry args={[width, PLANK_HEIGHT + 0.006, 0.008]} />
        <meshStandardMaterial
          color={theme.shelfColor}
          roughness={Math.min(theme.shelfRoughness + 0.05, 1)}
          metalness={0.01}
        />
      </mesh>
    </group>
  )
})

export default ShelfPlankMesh
