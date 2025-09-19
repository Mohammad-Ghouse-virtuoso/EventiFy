import { memo, useMemo } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import EventCard from './EventCard'

// Virtualized grid using react-window
function VirtualizedEventsGrid({ events, userRSVPs, onRSVP, columnWidth = 360, rowHeight = 360, overscanCount = 2 }) {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200
  const columns = Math.max(1, Math.floor((width - 48) / (columnWidth + 24))) // 24 gap
  const rowCount = Math.ceil(events.length / columns)

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columns + columnIndex
    if (index >= events.length) return null
    const event = events[index]
    return (
      <div style={{ ...style, padding: 12 }}>
        <EventCard
          event={event}
          onRSVP={onRSVP}
          userRSVP={userRSVPs[event.id]}
        />
      </div>
    )
  }

  // Height: fill viewport minus some header/filters space
  const height = typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 280) : 600

  return (
    <Grid
      columnCount={columns}
      columnWidth={columnWidth + 24}
      height={height}
      rowCount={rowCount}
      rowHeight={rowHeight + 24}
      width={width - 32}
      overscanRowCount={overscanCount}
    >
      {Cell}
    </Grid>
  )
}

export default memo(VirtualizedEventsGrid)
