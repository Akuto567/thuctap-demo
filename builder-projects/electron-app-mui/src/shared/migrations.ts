import type { ProjectFile } from './types'

// Ensure the types module is imported exactly like this in tests/elsewhere
export const CURRENT_PROJECT_VERSION = '1.2.0'

export interface MigrationStep {
  fromVersion: string
  toVersion: string
  changelog: string
  // Upgrade from 'fromVersion' to 'toVersion'
  upgrade: (file: Record<string, unknown>) => Record<string, unknown>
  // Downgrade from 'toVersion' to 'fromVersion'
  downgrade: (file: Record<string, unknown>) => Record<string, unknown>
}

// Common function used in migrations to scrape assets
function resolveAssetRelativePath(key: string, value: unknown): string | null {
  if (typeof value !== 'string') return null
  const lowerKey = key.toLowerCase()
  if (!/(img|image|src|path|url|background)/.test(lowerKey)) return null

  const cleanPath = value.startsWith('./') ? value.slice(2) : value
  if (!/^(images|data|assets)/.test(cleanPath)) return null
  return cleanPath
}

export function collectUsedAssets(obj: unknown, out = new Set<string>()): Set<string> {
  if (!obj || typeof obj !== 'object') return out
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectUsedAssets(v, out))
    return out
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const rel = resolveAssetRelativePath(k, v)
    if (rel) {
      out.add(rel)
    } else {
      collectUsedAssets(v, out)
    }
  }
  return out
}

export const MIGRATIONS: MigrationStep[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    changelog: 'Added explicit asset tracking mechanism.',
    upgrade: (file: Record<string, unknown>) => {
      const cloned = JSON.parse(JSON.stringify(file))
      cloned.version = '1.1.0'
      // Extrapolate previously implicit assets into the explicit array
      if (!cloned.assets) {
        cloned.assets = Array.from(collectUsedAssets(cloned.appData))
      }
      return cloned
    },
    downgrade: (file: Record<string, unknown>) => {
      const cloned = JSON.parse(JSON.stringify(file))
      cloned.version = '1.0.0'
      delete cloned.assets
      return cloned
    }
  },
  {
    fromVersion: '1.1.0',
    toVersion: '1.2.0',
    changelog: 'Added incremental undo/redo history using diffs.',
    upgrade: (file: Record<string, unknown>) => {
      const cloned = JSON.parse(JSON.stringify(file))
      cloned.version = '1.2.0'
      if (!cloned.history) {
        cloned.history = { past: [], future: [] }
      }
      return cloned
    },
    downgrade: (file: Record<string, unknown>) => {
      const cloned = JSON.parse(JSON.stringify(file))
      cloned.version = '1.1.0'
      delete cloned.history
      return cloned
    }
  }
]

interface Edge {
  to: string
  action: 'upgrade' | 'downgrade'
  step: MigrationStep
}

function buildGraph(): Map<string, Edge[]> {
  const graph = new Map<string, Edge[]>()
  for (const m of MIGRATIONS) {
    if (!graph.has(m.fromVersion)) graph.set(m.fromVersion, [])
    if (!graph.has(m.toVersion)) graph.set(m.toVersion, [])

    // Forward edge
    graph.get(m.fromVersion)!.push({
      to: m.toVersion,
      action: 'upgrade',
      step: m
    })
    // Backward edge
    graph.get(m.toVersion)!.push({
      to: m.fromVersion,
      action: 'downgrade',
      step: m
    })
  }
  return graph
}

/**
 * Finds the shortest sequence of migration steps from startVersion to targetVersion
 * using Breadth-First Search (BFS).
 */
export function findMigrationPath(startVersion: string, targetVersion: string): Edge[] | null {
  if (startVersion === targetVersion) return []

  const graph = buildGraph()
  if (!graph.has(startVersion) || !graph.has(targetVersion)) {
    return null
  }

  const queue: { version: string; path: Edge[] }[] = [{ version: startVersion, path: [] }]
  const visited = new Set<string>([startVersion])

  while (queue.length > 0) {
    const { version, path } = queue.shift()!

    if (version === targetVersion) {
      return path
    }

    const neighbors = graph.get(version)!
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to)
        queue.push({ version: edge.to, path: [...path, edge] })
      }
    }
  }

  return null
}

/**
 * Upgrades or downgrades a project file to the target version.
 * If targetVersion is not provided, targets CURRENT_PROJECT_VERSION.
 */
export function migrateProjectFile(
  file: Record<string, unknown>,
  targetVersion: string = CURRENT_PROJECT_VERSION
): { file: ProjectFile; changelogs: string[] } {
  const startVersion = (file.version as string) || '1.0.0'
  const path = findMigrationPath(startVersion, targetVersion)

  if (!path) {
    throw new Error(
      `Cannot migrate project from ${startVersion} to ${targetVersion}: No known path`
    )
  }

  let current = file
  const changelogs: string[] = []

  for (const edge of path) {
    if (edge.action === 'upgrade') {
      current = edge.step.upgrade(current)
    } else {
      current = edge.step.downgrade(current)
    }
    changelogs.push(edge.step.changelog)
  }

  return { file: current as unknown as ProjectFile, changelogs }
}
