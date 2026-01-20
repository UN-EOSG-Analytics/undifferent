'use client'

import React from 'react'
import { Comparison } from './Comparison'
import type { DiffResult } from '../core'

export interface DiffViewerProps {
  data: DiffResult
  leftTitle?: string
  rightTitle?: string
  showScore?: boolean
  className?: string
}

/**
 * Full diff viewer component with side-by-side comparison
 */
export function DiffViewer({
  data,
  leftTitle,
  rightTitle,
  showScore = false,
  className = '',
}: DiffViewerProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      {showScore && (
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
          <span style={{ fontWeight: 500, color: 'var(--diff-score-color, #009edb)' }}>
            {(data.score * 100).toFixed(1)}%
          </span>{' '}
          similarity
        </div>
      )}

      {/* Titles */}
      {(leftTitle || rightTitle) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            {leftTitle && (
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{leftTitle}</h3>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            {rightTitle && (
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{rightTitle}</h3>
            )}
          </div>
        </div>
      )}

      {/* Diff items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.items.map((item, index) => (
          <Comparison key={index} item={item} />
        ))}
      </div>
    </div>
  )
}
