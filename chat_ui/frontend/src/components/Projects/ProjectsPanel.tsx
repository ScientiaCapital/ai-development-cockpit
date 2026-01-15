'use client';

/**
 * ProjectsPanel
 *
 * Displays projects from Coperniq /projects endpoint.
 * Features: stage filtering, progress indicators, value display.
 */

import { useState, useEffect, useCallback } from 'react';
import { FolderKanban, RefreshCw, ChevronDown, ChevronUp, MapPin, Calendar, DollarSign, User } from 'lucide-react';
import { getProjects, Project, ProjectStageCounts } from '@/lib/api';
import styles from './ProjectsPanel.module.css';

// Format currency
function formatCurrency(amount?: number): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Stage display config
const stageConfig: Record<Project['stage'], { label: string; color: string }> = {
  lead: { label: 'Lead', color: '#6b7280' },
  proposal: { label: 'Proposal', color: '#f59e0b' },
  sold: { label: 'Sold', color: '#22c55e' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  complete: { label: 'Complete', color: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

type StageFilter = 'all' | Project['stage'];

export function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stageCounts, setStageCounts] = useState<ProjectStageCounts>({
    all: 0,
    lead: 0,
    proposal: 0,
    sold: 0,
    in_progress: 0,
    complete: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProjects();
      setProjects(response.projects || []);
      setStageCounts(response.stageCounts || {
        all: 0,
        lead: 0,
        proposal: 0,
        sold: 0,
        in_progress: 0,
        complete: 0,
      });
    } catch (err) {
      setError('Failed to load projects');
      console.error('Projects fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter projects by stage
  const filteredProjects = projects.filter((project) => {
    return stageFilter === 'all' || project.stage === stageFilter;
  });

  // Calculate total pipeline value
  const totalPipelineValue = filteredProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <FolderKanban size={18} />
          <h2>Projects</h2>
          <span className={styles.count}>{filteredProjects.length}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.pipelineValue}>{formatCurrency(totalPipelineValue)}</span>
          <button
            className={styles.refreshBtn}
            onClick={fetchProjects}
            disabled={loading}
            title="Refresh projects"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {/* Stage Filter Tabs */}
      <div className={styles.stageTabs}>
        <button
          className={`${styles.stageTab} ${stageFilter === 'all' ? styles.active : ''}`}
          onClick={() => setStageFilter('all')}
        >
          All <span className={styles.tabCount}>{stageCounts.all}</span>
        </button>
        <button
          className={`${styles.stageTab} ${stageFilter === 'lead' ? styles.active : ''}`}
          onClick={() => setStageFilter('lead')}
          style={{ '--stage-color': stageConfig.lead.color } as React.CSSProperties}
        >
          Lead <span className={styles.tabCount}>{stageCounts.lead}</span>
        </button>
        <button
          className={`${styles.stageTab} ${stageFilter === 'proposal' ? styles.active : ''}`}
          onClick={() => setStageFilter('proposal')}
          style={{ '--stage-color': stageConfig.proposal.color } as React.CSSProperties}
        >
          Proposal <span className={styles.tabCount}>{stageCounts.proposal}</span>
        </button>
        <button
          className={`${styles.stageTab} ${stageFilter === 'sold' ? styles.active : ''}`}
          onClick={() => setStageFilter('sold')}
          style={{ '--stage-color': stageConfig.sold.color } as React.CSSProperties}
        >
          Sold <span className={styles.tabCount}>{stageCounts.sold}</span>
        </button>
        <button
          className={`${styles.stageTab} ${stageFilter === 'in_progress' ? styles.active : ''}`}
          onClick={() => setStageFilter('in_progress')}
          style={{ '--stage-color': stageConfig.in_progress.color } as React.CSSProperties}
        >
          Active <span className={styles.tabCount}>{stageCounts.in_progress}</span>
        </button>
        <button
          className={`${styles.stageTab} ${stageFilter === 'complete' ? styles.active : ''}`}
          onClick={() => setStageFilter('complete')}
          style={{ '--stage-color': stageConfig.complete.color } as React.CSSProperties}
        >
          Done <span className={styles.tabCount}>{stageCounts.complete}</span>
        </button>
      </div>

      {/* Project List */}
      <div className={styles.projectList}>
        {loading ? (
          <div className={styles.loadingState}>Loading projects...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : filteredProjects.length === 0 ? (
          <div className={styles.emptyState}>No projects found</div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <div
                className={styles.projectHeader}
                onClick={() => toggleExpanded(project.id)}
              >
                <div className={styles.projectMain}>
                  <div className={styles.projectTitle}>
                    <span>{project.title}</span>
                    {project.trade && (
                      <span className={styles.tradeBadge}>{project.trade}</span>
                    )}
                  </div>
                  <div className={styles.projectMeta}>
                    <span
                      className={styles.stageBadge}
                      style={{ backgroundColor: stageConfig[project.stage].color }}
                    >
                      {stageConfig[project.stage].label}
                    </span>
                    <span className={styles.customerName}>
                      <User size={12} />
                      {project.customer}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {project.progress !== undefined && project.stage !== 'cancelled' && (
                    <div className={styles.progressContainer}>
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: stageConfig[project.stage].color,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.projectRight}>
                  {project.estimatedValue && (
                    <span className={styles.projectValue}>
                      {formatCurrency(project.estimatedValue)}
                    </span>
                  )}
                  <button className={styles.expandBtn}>
                    {expandedId === project.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === project.id && (
                <div className={styles.projectDetails}>
                  {project.address && (
                    <div className={styles.detailRow}>
                      <MapPin size={14} />
                      <span>{project.address}</span>
                    </div>
                  )}
                  {project.startDate && (
                    <div className={styles.detailRow}>
                      <Calendar size={14} />
                      <span>Start: {formatDate(project.startDate)}</span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className={styles.detailRow}>
                      <Calendar size={14} />
                      <span>End: {formatDate(project.endDate)}</span>
                    </div>
                  )}

                  {/* Financial Details */}
                  <div className={styles.financialRow}>
                    <div className={styles.financialItem}>
                      <DollarSign size={14} />
                      <span className={styles.financialLabel}>Estimated:</span>
                      <span className={styles.financialValue}>
                        {formatCurrency(project.estimatedValue)}
                      </span>
                    </div>
                    {project.actualValue && (
                      <div className={styles.financialItem}>
                        <DollarSign size={14} />
                        <span className={styles.financialLabel}>Actual:</span>
                        <span className={styles.financialValue}>
                          {formatCurrency(project.actualValue)}
                        </span>
                      </div>
                    )}
                  </div>

                  {project.description && (
                    <div className={styles.description}>
                      {project.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectsPanel;
