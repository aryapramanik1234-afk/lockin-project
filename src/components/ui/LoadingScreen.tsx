export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page" aria-busy="true" aria-live="polite">
      <div className="card card-pad-lg stack stack-5">
        <div className="skeleton" style={{ height: 22, width: '38%' }} />
        <div className="skeleton" style={{ height: 14, width: '62%' }} />
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 180, width: 180, borderRadius: '50%' }} />
          <div className="stack stack-3 grow">
            <div className="skeleton" style={{ height: 16, width: '80%' }} />
            <div className="skeleton" style={{ height: 16, width: '60%' }} />
            <div className="skeleton" style={{ height: 40, width: '45%' }} />
          </div>
        </div>
        <span className="tiny subtle">{label}</span>
      </div>
    </div>
  )
}
