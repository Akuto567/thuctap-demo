/**
 * Project File Utilities
 *
 * Pure functions for project file operations and data transformation.
 */

import { AnyAppData, ProjectFile, ProjectMeta } from '../types'

/**
 * Builds a complete project file from meta and app data.
 *
 * @param meta - Project metadata (name, location, etc.)
 * @param appData - Application-specific data (game content)
 * @returns Complete ProjectFile ready for saving
 */
export function buildProjectFile(meta: ProjectMeta, appData: AnyAppData): ProjectFile {
  return {
    version: '1.0.0',
    templateId: meta.templateId,
    name: meta.name,
    createdAt: meta.createdAt,
    updatedAt: new Date().toISOString(),
    settings: meta.settings,
    appData
  }
}

/**
 * Builds a display title for a project.
 *
 * @param templateId - Template identifier or name
 * @param projectName - User-defined project name
 * @param filePath - Project file path
 * @returns Formatted title string
 */
export function buildProjectTitle(templateId: string, projectName: string, filePath: string): string {
  return `[${templateId}] ${projectName} — ${filePath}`
}
