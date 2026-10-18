import { useState } from 'react'
import { ArrowLeft, BookOpen, Check, FileText, GraduationCap, Search, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { AppIcon } from '../ui/AppIcon'
import type { CatalogItem } from '../../types'

export interface AppSimulatorProps {
  item: CatalogItem | null
  temporarilyAllowed: boolean
  onClose: () => void
}

/**
 * A small simulated application window. It proves the point of the prototype:
 * an allowed app really does open (the calculator even works), while a
 * restricted one is intercepted by RestrictionOverlay.
 */
export function AppSimulator({ item, temporarilyAllowed, onClose }: AppSimulatorProps) {
  if (!item) return null

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      size="lg"
      title={item.name}
      description={item.domain ? `https://${item.domain}` : 'Simulated application window'}
      icon={<AppIcon item={item} size="sm" />}
      footer={
        <Button variant="primary" onClick={onClose} icon={<ArrowLeft size={15} />}>
          Return to session
        </Button>
      }
    >
      {temporarilyAllowed ? (
        <div className="callout callout-accent" style={{ marginBottom: 16 }}>
          <Check size={15} />
          <span>
            Temporarily allowed for legitimate academic use. The block will return when the
            allowance expires.
          </span>
        </div>
      ) : null}

      {item.id === 'calculator' ? <Calculator /> : null}
      {item.id === 'notes' ? <NotesPanel /> : null}
      {item.id === 'pdf-reader' ? <PdfReader /> : null}
      {item.id === 'dictionary' ? <Dictionary /> : null}
      {item.id === 'google-classroom' ? <Classroom /> : null}
      {!['calculator', 'notes', 'pdf-reader', 'dictionary', 'google-classroom'].includes(item.id) ? (
        <GenericApp item={item} />
      ) : null}
    </Modal>
  )
}

function GenericApp({ item }: { item: CatalogItem }) {
  return (
    <div
      className="card card-pad center"
      style={{ background: 'var(--surface-2)', borderStyle: 'dashed' }}
    >
      <div className="stack stack-3" style={{ alignItems: 'center' }}>
        <AppIcon item={item} size="lg" />
        <div>
          <div style={{ fontWeight: 600 }}>{item.name}</div>
          <div className="small muted">{item.description}</div>
        </div>
        <p className="tiny subtle" style={{ maxWidth: '40ch' }}>
          This is a placeholder window that stands in for the real application. LockIn simulates
          whether the app could be opened — it does not launch or control real software.
        </p>
      </div>
    </div>
  )
}

/* ── Calculator ───────────────────────────────────────────────────────────── */

function Calculator() {
  const [display, setDisplay] = useState('0')
  const [stored, setStored] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [replace, setReplace] = useState(true)

  const input = (value: string) => {
    if (value === 'C') {
      setDisplay('0')
      setStored(null)
      setOperator(null)
      setReplace(true)
      return
    }
    if (value === '⌫') {
      setDisplay((current) => (current.length > 1 ? current.slice(0, -1) : '0'))
      return
    }
    if (['+', '-', '×', '÷'].includes(value)) {
      const current = Number(display)
      if (operator && stored !== null && !replace) {
        const result = apply(stored, current, operator)
        setStored(result)
        setDisplay(String(round(result)))
      } else {
        setStored(current)
      }
      setOperator(value)
      setReplace(true)
      return
    }
    if (value === '=') {
      if (operator && stored !== null) {
        const result = apply(stored, Number(display), operator)
        setDisplay(String(round(result)))
        setStored(null)
        setOperator(null)
        setReplace(true)
      }
      return
    }
    if (value === '±') {
      setDisplay((current) => String(round(-Number(current))))
      return
    }
    if (value === '.') {
      if (replace) {
        setDisplay('0.')
        setReplace(false)
        return
      }
      if (!display.includes('.')) setDisplay(`${display}.`)
      return
    }
    setDisplay((current) => {
      if (replace || current === '0') {
        setReplace(false)
        return value
      }
      if (current.replace(/[^0-9]/g, '').length >= 10) return current
      return current + value
    })
  }

  const keys = [
    'C',
    '±',
    '⌫',
    '÷',
    '7',
    '8',
    '9',
    '×',
    '4',
    '5',
    '6',
    '-',
    '1',
    '2',
    '3',
    '+',
    '0',
    '.',
    '=',
  ]

  return (
    <div className="stack stack-3">
      <div
        className="mono card card-pad center"
        style={{
          background: 'var(--surface-inset)',
          fontSize: 32,
          minHeight: 74,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {display}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {keys.map((key) => {
          const isOperator = ['+', '-', '×', '÷', '='].includes(key)
          const isFn = ['C', '±', '⌫'].includes(key)
          return (
            <button
              key={key}
              type="button"
              className="btn"
              onClick={() => input(key)}
              style={{
                height: 46,
                fontSize: 16,
                fontWeight: 600,
                background: isOperator
                  ? 'var(--accent-soft)'
                  : isFn
                    ? 'var(--surface-3)'
                    : 'var(--surface-2)',
                color: isOperator ? 'var(--accent-text)' : 'var(--text)',
                borderColor: isOperator ? 'var(--border-accent)' : 'var(--border)',
              }}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function apply(a: number, b: number, op: string): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '×':
      return a * b
    case '÷':
      return b === 0 ? 0 : a / b
    default:
      return b
  }
}

function round(value: number): number {
  return Math.round(value * 1e10) / 1e10
}

/* ── Notes ────────────────────────────────────────────────────────────────── */

function NotesPanel() {
  const [notes, setNotes] = useState(
    'Lecture 4 — eigenvalues\n\n• Spectral theorem: A is diagonalisable if it has n linearly independent eigenvectors\n• Check: discriminant, trace, determinant',
  )
  return (
    <div className="stack stack-3">
      <div className="row" style={{ gap: 8 }}>
        <FileText size={15} style={{ color: 'var(--text-subtle)' }} />
        <span className="small muted">Linear Algebra · NoteVault</span>
      </div>
      <textarea
        className="textarea"
        style={{ minHeight: 180 }}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        aria-label="Session notes"
      />
      <span className="tiny subtle">
        Notes stay in this browser tab. LockIn never uploads what you write.
      </span>
    </div>
  )
}

/* ── PDF reader ───────────────────────────────────────────────────────────── */

const DOCUMENTS = [
  { name: 'Linear Algebra — Chapter 4.pdf', pages: 42 },
  { name: 'Syllabus MATH-201.pdf', pages: 6 },
  { name: 'Research paper — Focus & Cognition.pdf', pages: 18 },
]

function PdfReader() {
  const [open, setOpen] = useState<string | null>(null)
  if (open) {
    const doc = DOCUMENTS.find((d) => d.name === open)
    return (
      <div className="stack stack-3">
        <div className="row-between">
          <span className="small" style={{ fontWeight: 550 }}>
            {doc?.name}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>
            Back to library
          </Button>
        </div>
        <div
          className="card card-pad"
          style={{ background: 'var(--surface-2)', minHeight: 220, color: 'var(--text-muted)' }}
        >
          <p className="small">
            This is a simulated document view. In a native build LockIn would keep the reader
            available while blocking the apps you restricted.
          </p>
          <div className="divider" />
          <p className="small" style={{ lineHeight: 1.8 }}>
            4.1 Characteristic polynomials — Let A be an n × n matrix over a field F. The
            characteristic polynomial χA(t) = det(A − tI) encodes the eigenvalues of A...
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="stack stack-2">
      {DOCUMENTS.map((doc) => (
        <button
          key={doc.name}
          type="button"
          className="list-row"
          style={{
            width: '100%',
            textAlign: 'left',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}
          onClick={() => setOpen(doc.name)}
        >
          <div className="icon-tile" style={{ width: 34, height: 34 }}>
            <FileText size={16} />
          </div>
          <div className="grow">
            <div className="small" style={{ fontWeight: 550 }}>
              {doc.name}
            </div>
            <div className="tiny subtle">{doc.pages} pages</div>
          </div>
        </button>
      ))}
    </div>
  )
}

/* ── Dictionary ───────────────────────────────────────────────────────────── */

const DICTIONARY: Record<string, string> = {
  focus:
    'The quality of concentrating on a single subject or activity. In study contexts, attention held on one task for a sustained period.',
  distraction:
    'Something that diverts attention away from the task in progress.',
  focusmode: 'A preset configuration of allowed and blocked applications used during a study block.',
  procrastination:
    'The act of delaying a task in favour of easier, often unrelated, activities.',
  attention: 'The cognitive capacity to remain directed at a chosen stimulus or activity.',
  retention: 'The ability to keep information in memory over time.',
  cognition: 'The mental processes involved in acquiring and processing knowledge.',
  focusindex:
    'A LockIn estimate derived from the number of blocked distraction attempts in a session. It is not a clinical measurement of attention.',
}

function Dictionary() {
  const [query, setQuery] = useState('focus')
  const [searched, setSearched] = useState('focus')
  const entry = DICTIONARY[searched.toLowerCase()]

  return (
    <div className="stack stack-3">
      <div className="input-icon">
        <Search size={15} />
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') setSearched(query)
          }}
          placeholder="Search a word…"
          aria-label="Search the dictionary"
        />
      </div>
      {entry ? (
        <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <BookOpen size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{searched}</span>
          </div>
          <p className="small muted">{entry}</p>
        </div>
      ) : (
        <p className="small subtle">
          No entry for “{searched}” — try focus, distraction, retention or cognition.
        </p>
      )}
    </div>
  )
}

/* ── Classroom ────────────────────────────────────────────────────────────── */

const ASSIGNMENTS = [
  { title: 'Problem set 4 — eigenvalues', due: 'Due Friday', status: 'In progress' },
  { title: 'Reading response — Chapter 4', due: 'Due in 2 days', status: 'Not started' },
  { title: 'Quiz 2 (revision)', due: 'Due Monday', status: 'Not started' },
]

function Classroom() {
  return (
    <div className="stack stack-3">
      <div className="row" style={{ gap: 8 }}>
        <GraduationCap size={15} style={{ color: 'var(--accent-text)' }} />
        <span className="small muted">MATH-201 — Linear Algebra</span>
      </div>
      {ASSIGNMENTS.map((assignment) => (
        <div
          key={assignment.title}
          className="card card-pad-sm"
          style={{ background: 'var(--surface-2)' }}
        >
          <div className="row-between">
            <span className="small" style={{ fontWeight: 550 }}>
              {assignment.title}
            </span>
            <span
              className="chip"
              style={{
                height: 20,
                fontSize: 10.5,
                color: assignment.status === 'In progress' ? 'var(--info)' : 'var(--text-subtle)',
              }}
            >
              {assignment.status}
            </span>
          </div>
          <div className="tiny subtle" style={{ marginTop: 4 }}>
            {assignment.due}
          </div>
        </div>
      ))}
      <span className="tiny subtle">
        Essential academic tools stay reachable in Strict Focus for exactly this reason.
      </span>
    </div>
  )
}

export { X }
