import {
  Blocks,
  BookOpen,
  Bookmark,
  Brain,
  Briefcase,
  Calendar,
  CheckSquare,
  Clapperboard,
  Crosshair,
  Crown,
  File,
  FileText,
  Flame,
  Gamepad2,
  Ghost,
  Globe,
  GraduationCap,
  HardDrive,
  Hash,
  Instagram,
  Layers,
  Library,
  Lock,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Music,
  Notebook,
  NotebookPen,
  Pin,
  Play,
  PlaySquare,
  Puzzle,
  Radio,
  School,
  Search,
  Send,
  ShieldCheck,
  Sigma,
  SquareCheck,
  Tv,
  Twitter,
  Users,
  Video,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

/**
 * Icon registry — the sample catalog stores a stable string key so that the
 * data stays serialisable, and the UI resolves it to a Lucide component.
 */
const ICONS: Record<string, LucideIcon> = {
  calculator: CheckSquare,
  notebook: Notebook,
  filetext: FileText,
  bookopen: BookOpen,
  layers: Layers,
  school: School,
  graduation: GraduationCap,
  library: Library,
  sigma: Sigma,
  brain: Brain,
  'play-square': PlaySquare,
  search: Search,
  file: File,
  harddrive: HardDrive,
  mail: Mail,
  'notebook-pen': NotebookPen,
  calendar: Calendar,
  'check-square': SquareCheck,
  video: Video,
  users: Users,
  bookmark: Bookmark,
  'message-circle': MessageCircle,
  send: Send,
  'gamepad-2': Gamepad2,
  hash: Hash,
  'message-square': MessageSquare,
  globe: Globe,
  instagram: Instagram,
  facebook: MessageCircle,
  twitter: Twitter,
  'message-square-text': MessageSquareText,
  music: Music,
  ghost: Ghost,
  briefcase: Briefcase,
  pin: Pin,
  flame: Flame,
  blocks: Blocks,
  crown: Crown,
  crosshair: Crosshair,
  puzzle: Puzzle,
  youtube: Youtube,
  clapperboard: Clapperboard,
  radio: Radio,
  tv: Tv,
  play: Play,
  shield: ShieldCheck,
  lock: Lock,
}

export interface IconProps {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 18, strokeWidth = 1.75, className }: IconProps) {
  const Component = ICONS[name] ?? ShieldCheck
  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  )
}
