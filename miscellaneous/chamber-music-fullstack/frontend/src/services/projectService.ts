/**
 * Project Persistence Service
 * Handles saving, loading, and version management of harmony projects
 */

export interface ProjectVersion {
  id: string;
  timestamp: string;
  seed?: number;
  tension?: number;
  genre?: string;
  layers: Array<{
    id: string;
    name: string;
    instrument: string;
    visible: boolean;
    locked: boolean;
  }>;
  projectId: string;
  harmonyOnly?: { content: string; filename: string };
  combined?: { content: string; filename: string };
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  instruments: string[];
  versions: ProjectVersion[];
  currentVersionId?: string;
}

const STORAGE_KEY = 'harmonyforge_projects';
const VERSION_HISTORY_KEY = 'harmonyforge_versions';

export class ProjectService {
  /**
   * Save a new project or update existing
   */
  static saveProject(project: Project): void {
    try {
      const projects = this.getAllProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('[ProjectService] Error saving project:', error);
      throw new Error('Failed to save project');
    }
  }

  /**
   * Get all projects
   */
  static getAllProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[ProjectService] Error loading projects:', error);
      return [];
    }
  }

  /**
   * Get a specific project by ID
   */
  static getProject(projectId: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  /**
   * Delete a project
   */
  static deleteProject(projectId: string): void {
    try {
      const projects = this.getAllProjects();
      const filtered = projects.filter(p => p.id !== projectId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[ProjectService] Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Save a version snapshot
   */
  static saveVersion(version: ProjectVersion): void {
    try {
      const versions = this.getVersions(version.projectId);
      versions.push(version);
      
      // Keep only last 20 versions per project
      const recentVersions = versions.slice(-20);
      
      const allVersions = this.getAllVersions();
      const projectVersions = allVersions.filter(v => v.projectId !== version.projectId);
      projectVersions.push(...recentVersions);
      
      localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(projectVersions));
    } catch (error) {
      console.error('[ProjectService] Error saving version:', error);
      throw new Error('Failed to save version');
    }
  }

  /**
   * Get versions for a project
   */
  static getVersions(projectId: string): ProjectVersion[] {
    try {
      const allVersions = this.getAllVersions();
      return allVersions.filter(v => v.projectId === projectId);
    } catch (error) {
      console.error('[ProjectService] Error loading versions:', error);
      return [];
    }
  }

  /**
   * Get all versions (across all projects)
   */
  static getAllVersions(): ProjectVersion[] {
    try {
      const data = localStorage.getItem(VERSION_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[ProjectService] Error loading all versions:', error);
      return [];
    }
  }

  /**
   * Get a specific version by ID
   */
  static getVersion(versionId: string): ProjectVersion | null {
    const allVersions = this.getAllVersions();
    return allVersions.find(v => v.id === versionId) || null;
  }

  /**
   * Create a new project from harmonization data
   */
  static createProject(
    name: string,
    harmonizationData: any,
    seed?: number
  ): Project {
    const project: Project = {
      id: `project-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instruments: harmonizationData.instruments || [],
      versions: [],
    };

    // Create initial version
    const initialVersion: ProjectVersion = {
      id: `version-${Date.now()}`,
      timestamp: new Date().toISOString(),
      seed,
      projectId: project.id,
      layers: (harmonizationData.instruments || []).map((instrument: string, idx: number) => ({
        id: `layer-${idx}`,
        name: instrument,
        instrument,
        visible: true,
        locked: false,
      })),
      harmonyOnly: harmonizationData.harmonyOnly,
      combined: harmonizationData.combined,
    };

    project.versions.push(initialVersion);
    project.currentVersionId = initialVersion.id;

    this.saveProject(project);
    this.saveVersion(initialVersion);

    return project;
  }

  /**
   * Export project data as JSON
   */
  static exportProject(projectId: string): string {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    return JSON.stringify(project, null, 2);
  }

  /**
   * Import project from JSON
   */
  static importProject(jsonData: string): Project {
    try {
      const project = JSON.parse(jsonData) as Project;
      project.id = `project-${Date.now()}`; // Generate new ID
      project.createdAt = new Date().toISOString();
      project.updatedAt = new Date().toISOString();
      
      this.saveProject(project);
      return project;
    } catch (error) {
      console.error('[ProjectService] Error importing project:', error);
      throw new Error('Invalid project data');
    }
  }
}

