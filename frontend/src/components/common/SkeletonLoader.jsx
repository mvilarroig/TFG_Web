function Skel({ w = '100%', h = '20px', r = '6px', style = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />
}

function SkelCard({ children, style = {} }) {
  return (
    <div className="skeleton-card" style={style}>
      {children}
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="dashboard" style={{ pointerEvents: 'none' }}>

      {/* Header */}
      <div className="dash-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <Skel w="210px" h="32px" r="8px" />
          <Skel w="150px" h="14px" />
        </div>
        <Skel w="140px" h="38px" r="8px" />
      </div>

      {/* Hero */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Skel w="100%" h="110px" r="16px" />
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '1.25rem' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="kpi-card">
            <Skel w="52px" h="52px" r="10px" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <Skel w="70%" h="11px" />
              <Skel w="55%" h="26px" />
            </div>
          </div>
        ))}
      </div>

      {/* Row 3 */}
      <div className="dash-row-3" style={{ marginBottom: '1.25rem' }}>
        {[...Array(3)].map((_, i) => (
          <SkelCard key={i} style={{ minHeight: '240px' }}>
            <Skel w="45%" h="12px" style={{ marginBottom: '1.25rem' }} />
            <Skel w="100%" h="170px" r="10px" />
          </SkelCard>
        ))}
      </div>

      {/* Row 2 */}
      <div className="dash-row-2" style={{ marginBottom: '1.25rem' }}>
        {[...Array(2)].map((_, i) => (
          <SkelCard key={i} style={{ minHeight: '200px' }}>
            <Skel w="50%" h="12px" style={{ marginBottom: '1.25rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {[...Array(4)].map((_, j) => <Skel key={j} w={`${90 - j * 12}%`} h="14px" />)}
            </div>
          </SkelCard>
        ))}
      </div>

      {/* Full chart */}
      <SkelCard style={{ marginBottom: '1.25rem', minHeight: '180px' }}>
        <Skel w="35%" h="12px" style={{ marginBottom: '1.25rem' }} />
        <Skel w="100%" h="140px" r="10px" />
      </SkelCard>

    </div>
  )
}
