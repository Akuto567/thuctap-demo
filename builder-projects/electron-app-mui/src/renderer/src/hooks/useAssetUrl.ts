import { useEffect, useState } from 'react'

const cache = new Map<string, string>()

/**
 * Resolves a project-relative asset path (e.g. "assets/cat.png") to a
 * displayable file:// URL so <img> tags work in the Electron renderer.
 */
export function useAssetUrl(
  projectDir: string,
  relativePath: string | null | undefined
): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!relativePath) {
      setUrl(null)
      return
    }
    const key = `${projectDir}::${relativePath}`
    if (cache.has(key)) {
      setUrl(cache.get(key)!)
      return
    }
    window.electronAPI.resolveAssetUrl(projectDir, relativePath).then((resolved) => {
      cache.set(key, resolved)
      setUrl(resolved)
    })
  }, [projectDir, relativePath])

  return url
}
