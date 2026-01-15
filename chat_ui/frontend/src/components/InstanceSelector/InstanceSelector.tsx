'use client';

import { useCoperniqInstance } from '@/hooks/useCoperniqInstance';
import { Building2, ChevronDown } from 'lucide-react';
import styles from './InstanceSelector.module.css';

interface InstanceSelectorProps {
  className?: string;
}

export function InstanceSelector({ className }: InstanceSelectorProps) {
  const { instance, setInstance, instances, currentInstance, loading } = useCoperniqInstance();

  if (loading) {
    return (
      <div className={`${styles.selector} ${className || ''}`}>
        <Building2 size={16} />
        <span className={styles.loading}>Loading...</span>
      </div>
    );
  }

  if (instances.length <= 1) {
    // Only one instance available, show as label
    return (
      <div className={`${styles.selector} ${styles.single} ${className || ''}`}>
        <Building2 size={16} />
        <span className={styles.name}>{currentInstance.name}</span>
        <span className={styles.badge}>{currentInstance.type}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.selector} ${className || ''}`}>
      <Building2 size={16} />
      <select
        value={instance}
        onChange={(e) => setInstance(parseInt(e.target.value, 10))}
        className={styles.select}
        aria-label="Select Coperniq instance"
      >
        {instances.map((inst) => (
          <option key={inst.id} value={inst.id}>
            {inst.name} ({inst.type})
          </option>
        ))}
      </select>
      <ChevronDown size={14} className={styles.chevron} />
    </div>
  );
}

export default InstanceSelector;
