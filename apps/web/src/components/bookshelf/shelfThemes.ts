import type { ShelfTheme } from './types'

export interface ThemeConfig {
  shelfColor: string
  shelfRoughness: number
  ambientIntensity: number
  background: string
  directionalIntensity: number
  directionalColor: string
}

export const SHELF_THEMES: Record<ShelfTheme, ThemeConfig> = {
  DARK_WOOD: {
    shelfColor: '#3d1f0e',
    shelfRoughness: 0.85,
    ambientIntensity: 0.4,
    background: '#1a0e08',
    directionalIntensity: 0.8,
    directionalColor: '#ffd4a0',
  },
  LIGHT_OAK: {
    shelfColor: '#c8975a',
    shelfRoughness: 0.7,
    ambientIntensity: 0.6,
    background: '#f5e6c8',
    directionalIntensity: 1.0,
    directionalColor: '#ffffff',
  },
  WHITE_MINIMALIST: {
    shelfColor: '#f5f5f5',
    shelfRoughness: 0.9,
    ambientIntensity: 0.8,
    background: '#ffffff',
    directionalIntensity: 0.9,
    directionalColor: '#f0f4ff',
  },
  VINTAGE: {
    shelfColor: '#8B5E3C',
    shelfRoughness: 0.95,
    ambientIntensity: 0.35,
    background: '#2d1810',
    directionalIntensity: 0.6,
    directionalColor: '#e8c98a',
  },
}
