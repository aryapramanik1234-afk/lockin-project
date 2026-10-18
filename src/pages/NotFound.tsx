import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="page page-narrow">
      <div className="card">
        <EmptyState
          icon={<Compass size={22} />}
          title="Page not found"
          description="That link does not lead anywhere in LockIn. Head back to your dashboard and keep studying."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to dashboard
            </Button>
          }
        />
      </div>
    </div>
  )
}
