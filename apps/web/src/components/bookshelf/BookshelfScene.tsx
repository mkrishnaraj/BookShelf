import React, { useMemo, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { BookData, ShelfTheme } from './types'
import { SHELF_THEMES, type ThemeConfig } from './shelfThemes'
import BookMesh from './BookMesh'
import ShelfPlankMesh from './ShelfPlankMesh'
import BookTooltip from './BookTooltip'

// ─── Layout constants ────────────────────────────────────────────────────────
const SHELF_WIDTH = 2.0          // world units (~2 metres)
const SHELF_ROW_HEIGHT = 0.28    // vertical distance between plank tops (row pitch)
const BOOK_GAP = 0.002           // horizontal gap between books (metres)
const BOOK_BOTTOM_OFFSET = 0.01  // books sit this far above the plank surface
const SHELF_START_Y = -0.3       // Y of the first (bottom) plank

interface LayoutItem {
  book: BookData
  position: [number, number, number]
  row: number
}

interface RowInfo {
  positionY: number
  plankY: number
}

/**
 * Lays out books left-to-right on rows, wrapping when the cumulative width
 * would exceed SHELF_WIDTH - 0.1.  Returns per-book positions and per-row
 * plank Y values.
 */
function computeLayout(books: BookData[]): {
  items: LayoutItem[]
  rows: RowInfo[]
} {
  const items: LayoutItem[] = []
  const rows: RowInfo[] = []
  const MAX_FILL = SHELF_WIDTH - 0.1

  let currentRow = 0
  let cursorX = -SHELF_WIDTH / 2   // left edge
  let rowWidth = 0

  books.forEach((book) => {
    const w = book.spineWidthMm / 1000
    const h = book.heightMm / 1000

    // Wrap to next row
    if (rowWidth + w + BOOK_GAP > MAX_FILL && rowWidth > 0) {
      currentRow++
      cursorX = -SHELF_WIDTH / 2
      rowWidth = 0
    }

    // Register this row if new
    if (rows.length <= currentRow) {
      const plankY = SHELF_START_Y + currentRow * SHELF_ROW_HEIGHT
      rows.push({
        plankY,
        positionY: plankY + BOOK_BOTTOM_OFFSET + h / 2,
      })
    }

    // noUncheckedIndexedAccess: rows[currentRow] is guaranteed above but TS
    // doesn't know that, so we assert non-null via a local binding.
    const currentRowInfo = rows[currentRow]
    if (!currentRowInfo) return   // should never happen, guards the type

    const posX = cursorX + w / 2
    // Books rest on plank surface: center Y = plankTop + gap + halfHeight
    const bookCenterY = currentRowInfo.plankY + BOOK_BOTTOM_OFFSET + h / 2

    items.push({
      book,
      position: [posX, bookCenterY, 0],
      row: currentRow,
    })

    cursorX += w + BOOK_GAP
    rowWidth += w + BOOK_GAP
  })

  return { items, rows }
}

// ─── Scene interior (inside Canvas context) ──────────────────────────────────
interface SceneInteriorProps {
  books: BookData[]
  theme: ThemeConfig
  onBookClick: (bookId: string) => void
  selectedBookId?: string | undefined
}

function SceneInterior({
  books,
  theme,
  onBookClick,
  selectedBookId,
}: SceneInteriorProps) {
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null)
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const { items, rows } = useMemo(() => computeLayout(books), [books])

  const handleBookHover = useCallback((id: string | null) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setHoveredBookId(id)
    if (id !== null) {
      hoverTimerRef.current = setTimeout(() => setHoveredBookId(null), 3000)
    }
  }, [])

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null
  const bgColor = new THREE.Color(theme.background)

  // Side panel dimensions derived from total shelf height
  const totalHeight = (rows.length + 1) * SHELF_ROW_HEIGHT + 0.1
  const centerY = SHELF_START_Y + totalHeight / 2

  return (
    <>
      {/* Scene background */}
      <color attach="background" args={[bgColor.r, bgColor.g, bgColor.b]} />

      {/* Lighting */}
      <ambientLight intensity={theme.ambientIntensity} />
      <directionalLight
        position={[2, 3, 2]}
        intensity={theme.directionalIntensity}
        color={theme.directionalColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-1, 1, 1]} intensity={theme.ambientIntensity * 0.4} />

      {/* Orbit controls — pan disabled, tilt clamped */}
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-0.5}
        maxAzimuthAngle={0.5}
        minDistance={1.0}
        maxDistance={4.5}
        target={[0, 0.3, 0]}
      />

      {/* Shelf planks — one per row */}
      {rows.map((row, i) => (
        <ShelfPlankMesh
          key={`plank-${i}`}
          width={SHELF_WIDTH + 0.06}
          positionY={row.plankY}
          theme={theme}
        />
      ))}

      {/* Top plank above the last row of books */}
      {lastRow !== null && lastRow !== undefined && (
        <ShelfPlankMesh
          key="plank-top"
          width={SHELF_WIDTH + 0.06}
          positionY={lastRow.plankY + SHELF_ROW_HEIGHT}
          theme={theme}
        />
      )}

      {/* Side panels */}
      {([-SHELF_WIDTH / 2 - 0.03, SHELF_WIDTH / 2 + 0.03] as const).map((x, i) => (
        <mesh key={`side-${i}`} position={[x, centerY, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, totalHeight, 0.16]} />
          <meshStandardMaterial
            color={theme.shelfColor}
            roughness={theme.shelfRoughness}
          />
        </mesh>
      ))}

      {/* Books */}
      {items.map(({ book, position }) => {
        const isHovered = hoveredBookId === book.id
        return (
          <group
            key={book.id}
            onPointerOver={(e) => {
              e.stopPropagation()
              handleBookHover(book.id)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              handleBookHover(null)
            }}
          >
            <BookMesh
              book={book}
              position={position}
              onClick={() => onBookClick(book.id)}
              isSelected={selectedBookId === book.id}
            />
            {isHovered && (
              <group position={position}>
                <BookTooltip
                  book={book}
                  offsetY={book.heightMm / 1000 / 2 + 0.06}
                />
              </group>
            )}
          </group>
        )
      })}

      {/* Empty state — invisible mesh; real empty state is in BookshelfCanvas DOM overlay */}
      {books.length === 0 && (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.001, 0.001]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────
export interface BookshelfSceneProps {
  books: BookData[]
  theme: ShelfTheme
  onBookClick: (bookId: string) => void
  selectedBookId?: string | undefined
}

/**
 * Main Three.js scene wrapped in an R3F Canvas.
 * Camera is positioned at [0, 0.5, 2.5] looking at [0, 0.3, 0].
 */
export default function BookshelfScene({
  books,
  theme,
  onBookClick,
  selectedBookId,
}: BookshelfSceneProps) {
  const themeConfig = SHELF_THEMES[theme]

  return (
    <Canvas
      camera={{ position: [0, 0.5, 2.5], fov: 45, near: 0.01, far: 100 }}
      shadows
      gl={{ antialias: true, alpha: false }}
      aria-label="3D bookshelf view"
    >
      <SceneInterior
        books={books}
        theme={themeConfig}
        onBookClick={onBookClick}
        {...(selectedBookId !== undefined ? { selectedBookId } : {})}
      />
    </Canvas>
  )
}
