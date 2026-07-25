export function isPortrait(width, height) {
  return width < height
}

export function computePortraitCameraAdjustment(basePosition, width, height) {
  if (!isPortrait(width, height)) return basePosition
  return { x: basePosition.x, y: basePosition.y + 1.2, z: basePosition.z + 2.5 }
}
