import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import './App.css'

interface PersonalInfo {
  name: string
  email: string
  phone: string
  address: string
  linkedin: string
  website: string
  summary: string
}

interface Experience {
  id: string
  jobTitle: string
  company: string
  duration: string
  description: string
}

interface Education {
  id: string
  degree: string
  school: string
  year: string
}

interface Project {
  id: string
  name: string
  description: string
  link: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  year: string
}

interface Language {
  id: string
  name: string
  proficiency: string
}

interface JobBoard {
  id: string
  name: string
  logoSrc: string
  logoType: 'wordmark' | 'mark'
  logoClassName?: string
}

interface CommunityReview {
  id: string
  name: string
  role: string
  board: string
  rating: number
  scoreBefore: number
  scoreAfter: number
  outcome: string
  quote: string
}

interface SubmittedReview extends CommunityReview {
  status: 'pending' | 'approved'
  submittedAt: string
}

interface ReviewDraft {
  name: string
  role: string
  board: string
  rating: number
  outcome: string
  quote: string
}

interface ReviewApiResponse {
  reviews: CommunityReview[]
  backendConfigured: boolean
}

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead'
type SummaryTone = 'balanced' | 'strategic' | 'technical' | 'concise'
type RoleFamily = 'operations' | 'support' | 'sales' | 'marketing' | 'design' | 'engineering' | 'leadership' | 'general'

interface AnalysisResult {
  trackedKeywords: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  beforeScore: number
  afterScore: number
  optimizedSummary: string
  optimizedExperience: string[][]
}

interface ResumeBulletPreview {
  text: string
  isOptimized: boolean
}

type GuidedFieldTarget = { type: 'skill' } | { type: 'experience'; index: number }
type CompletionTarget = 'jobDescription' | 'identity' | 'contact' | 'summary' | 'experience' | 'skills'

const STORAGE_KEY = 'resumeMayOptimizerData'
const REVIEW_STORAGE_KEY = 'resumeMaySubmittedReviews'

const defaultPersonalInfo: PersonalInfo = {
  name: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  website: '',
  summary: ''
}

const createEntryId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const createExperience = (entry: Partial<Experience> = {}): Experience => ({
  id: entry.id ?? createEntryId('exp'),
  jobTitle: '',
  company: '',
  duration: '',
  description: '',
  ...entry
})

const createEducation = (entry: Partial<Education> = {}): Education => ({
  id: entry.id ?? createEntryId('edu'),
  degree: '',
  school: '',
  year: '',
  ...entry
})

const createProject = (entry: Partial<Project> = {}): Project => ({
  id: entry.id ?? createEntryId('proj'),
  name: '',
  description: '',
  link: '',
  ...entry
})

const createCertification = (entry: Partial<Certification> = {}): Certification => ({
  id: entry.id ?? createEntryId('cert'),
  name: '',
  issuer: '',
  year: '',
  ...entry
})

const createLanguage = (entry: Partial<Language> = {}): Language => ({
  id: entry.id ?? createEntryId('lang'),
  name: '',
  proficiency: '',
  ...entry
})

const stopWords = new Set([
  'about',
  'across',
  'after',
  'also',
  'and',
  'are',
  'build',
  'building',
  'candidate',
  'company',
  'customers',
  'data',
  'deliver',
  'design',
  'experience',
  'from',
  'have',
  'help',
  'helping',
  'highly',
  'into',
  'looking',
  'must',
  'need',
  'our',
  'role',
  'team',
  'that',
  'their',
  'them',
  'they',
  'this',
  'those',
  'through',
  'using',
  'want',
  'well',
  'will',
  'with',
  'work',
  'your'
])

const trackedPhrases = [
  'a/b testing',
  'accessibility',
  'agile delivery',
  'analytics',
  'api integration',
  'automation',
  'change management',
  'component libraries',
  'cross-functional collaboration',
  'customer research',
  'customer success',
  'data analysis',
  'design systems',
  'documentation',
  'frontend architecture',
  'go-to-market',
  'lead generation',
  'performance optimization',
  'process improvement',
  'project management',
  'quality assurance',
  'responsive design',
  'roadmap planning',
  'sales enablement',
  'search engine optimization',
  'stakeholder management',
  'strategic planning',
  'typescript',
  'user research'
]

const actionVerbs = [
  'Built',
  'Led',
  'Launched',
  'Improved',
  'Delivered',
  'Streamlined',
  'Partnered',
  'Optimized'
]

const experienceLabels: Record<ExperienceLevel, string> = {
  entry: 'early-career',
  mid: 'mid-level',
  senior: 'senior-level',
  lead: 'lead-level'
}

const toneLabels: Record<SummaryTone, string> = {
  balanced: 'clear and credible',
  strategic: 'strategic and leadership-oriented',
  technical: 'technical and detail-aware',
  concise: 'short and recruiter-friendly'
}

const roleFamilySignals: Record<RoleFamily, string[]> = {
  operations: ['operations', 'coordinator', 'admin', 'administrative', 'scheduler', 'documentation', 'reporting', 'process', 'workflow', 'executive assistant', 'virtual assistant'],
  support: ['support', 'customer', 'service', 'success', 'helpdesk', 'client care', 'ticket', 'resolution'],
  sales: ['sales', 'account executive', 'business development', 'pipeline', 'lead generation', 'closing', 'prospecting'],
  marketing: ['marketing', 'brand', 'campaign', 'content', 'seo', 'sem', 'social media', 'growth'],
  design: ['design', 'designer', 'ux', 'ui', 'product design', 'visual', 'creative', 'figma'],
  engineering: ['engineer', 'developer', 'software', 'frontend', 'backend', 'full stack', 'typescript', 'api', 'architecture', 'qa'],
  leadership: ['manager', 'lead', 'director', 'head', 'strategy', 'roadmap', 'stakeholder'],
  general: []
}

const roleFamilyFocus: Record<RoleFamily, string> = {
  operations: 'coordination, documentation, reporting, and process reliability',
  support: 'customer communication, issue resolution, and dependable follow-through',
  sales: 'pipeline momentum, client communication, and commercial follow-through',
  marketing: 'campaign execution, content clarity, and performance visibility',
  design: 'visual clarity, collaboration, and user-facing delivery quality',
  engineering: 'implementation quality, problem solving, and maintainable delivery',
  leadership: 'cross-functional leadership, prioritization, and business execution',
  general: 'execution, communication, and delivery'
}

const roleFamilyActionVerbs: Record<RoleFamily, string[]> = {
  operations: ['Coordinated', 'Streamlined', 'Organized', 'Improved'],
  support: ['Resolved', 'Supported', 'Handled', 'Strengthened'],
  sales: ['Generated', 'Advanced', 'Converted', 'Expanded'],
  marketing: ['Launched', 'Optimized', 'Produced', 'Improved'],
  design: ['Designed', 'Refined', 'Shaped', 'Improved'],
  engineering: ['Built', 'Implemented', 'Improved', 'Delivered'],
  leadership: ['Led', 'Directed', 'Aligned', 'Drove'],
  general: actionVerbs
}

const sampleData = {
  targetRole: 'Operations Coordinator',
  jobDescription:
    'We are hiring an Operations Coordinator to support daily workflow across client delivery, scheduling, reporting, documentation, and stakeholder communication. You will work closely with leadership and cross-functional teams to keep priorities moving, improve internal processes, maintain accurate records, and coordinate follow-ups. Experience with documentation, spreadsheet reporting, customer communication, process improvement, project coordination, and administrative support is strongly preferred.',
  experienceLevel: 'mid' as ExperienceLevel,
  summaryTone: 'balanced' as SummaryTone,
  applyOptimization: true,
  personalInfo: {
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    phone: '+63 917 123 4567',
    address: 'Manila, NCR',
    linkedin: 'linkedin.com/in/mariasantos',
    website: 'mariasantos.dev',
    summary:
      'Operations coordinator with experience keeping fast-moving teams organized through clear documentation, reporting, scheduling, and stakeholder communication. Strong in process improvement and turning scattered workflows into reliable execution.'
  },
  experience: [
    {
      jobTitle: 'Operations Coordinator',
      company: 'Northbridge Support Services',
      duration: '2022 - Present',
      description:
        'Coordinated daily workflows across onboarding, scheduling, and internal reporting. Maintained documentation and status updates for cross-functional teams. Improved follow-up consistency for recurring operational tasks.'
    },
    {
      jobTitle: 'Administrative Assistant',
      company: 'HarborWorks PH',
      duration: '2019 - 2022',
      description:
        'Supported calendars, records, and customer-facing requests for a busy operations team. Prepared spreadsheet reports and tracked deadlines across multiple stakeholders. Helped standardize forms and handoff processes.'
    }
  ],
  education: [{ degree: 'B.S. Business Administration', school: 'Polytechnic University of the Philippines', year: '2019' }],
  skills: ['Operations Coordination', 'Documentation', 'Process Improvement', 'Spreadsheet Reporting', 'Scheduling', 'Stakeholder Management', 'Customer Support'],
  projects: [
    {
      name: 'Onboarding Tracker Revamp',
      description:
        'Reworked a manual onboarding workflow into a clearer tracker with ownership, deadlines, and weekly status visibility.',
      link: 'https://github.com/example/onboarding-tracker'
    }
  ],
  certifications: [{ name: 'Lean Six Sigma Yellow Belt', issuer: 'Six Sigma PH', year: '2023' }],
  languages: [{ name: 'Tagalog', proficiency: 'Native' }, { name: 'English', proficiency: 'Fluent' }]
}

const supportedJobBoards: JobBoard[] = [
  {
    id: 'onlinejobs',
    name: 'OnlineJobs.ph',
    logoSrc: assetPath('/job-boards/onlinejobs-wordmark.png'),
    logoType: 'wordmark'
  },
  {
    id: 'bossjob',
    name: 'Bossjob',
    logoSrc: assetPath('/job-boards/bossjob-wordmark.svg'),
    logoType: 'wordmark'
  },
  {
    id: 'hiringcafe',
    name: 'HiringCafe',
    logoSrc: assetPath('/job-boards/hiringcafe-mark.png'),
    logoType: 'mark'
  },
  {
    id: 'kalibrr',
    name: 'Kalibrr',
    logoSrc: assetPath('/job-boards/kalibrr-wordmark.png'),
    logoType: 'wordmark'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    logoSrc: assetPath('/job-boards/linkedin-wordmark.svg'),
    logoType: 'wordmark'
  },
  {
    id: 'jobstreet',
    name: 'JobStreet by SEEK',
    logoSrc: assetPath('/job-boards/jobstreet-wordmark.svg'),
    logoType: 'wordmark',
    logoClassName: 'job-board-logo-jobstreet'
  },
  {
    id: 'upwork',
    name: 'Upwork',
    logoSrc: assetPath('/job-boards/upwork-wordmark.svg'),
    logoType: 'wordmark'
  },
  {
    id: 'indeed',
    name: 'Indeed',
    logoSrc: assetPath('/job-boards/indeed-mark.png'),
    logoType: 'mark'
  }
]

const landingTeaserBeforeSignals = ['Generic summary', 'Weak keyword spread', 'Missing ops signals', 'Low ATS fit']
const landingTeaserAfterSignals = ['Documentation', 'Process Improvement', 'Stakeholder Management', 'Reporting']

const createReviewDraft = (draft: Partial<ReviewDraft> = {}): ReviewDraft => ({
  name: '',
  role: '',
  board: '',
  rating: 5,
  outcome: '',
  quote: '',
  ...draft
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampReviewRating(value: number) {
  return clamp(Math.round(value), 1, 5)
}

function getStarIcon(rating: number, index: number) {
  if (rating >= index + 1) {
    return 'bi-star-fill'
  }

  if (rating >= index + 0.5) {
    return 'bi-star-half'
  }

  return 'bi-star'
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s+/#.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toDisplayKeyword(keyword: string) {
  const acronyms = new Set(['api', 'aws', 'css', 'html', 'qa', 'seo', 'sql', 'ui', 'ux'])

  return keyword
    .split(' ')
    .map((part) => {
      const clean = part.toLowerCase()
      if (acronyms.has(clean)) {
        return clean.toUpperCase()
      }
      if (clean.includes('/')) {
        return clean
          .split('/')
          .map((segment) => (acronyms.has(segment) ? segment.toUpperCase() : segment.charAt(0).toUpperCase() + segment.slice(1)))
          .join('/')
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1)
    })
    .join(' ')
}

function splitIntoStatements(text: string) {
  return text
    .split(/\n|\u2022|;|\.(?!\d)/)
    .map((line) => line.replace(/^[-*\u2022]\s*/, '').trim())
    .filter(Boolean)
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

function buildResumeFileName(name: string) {
  const normalizedName = name
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')

  return `${normalizedName || 'ResuMay'}_Resume.pdf`
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function keywordExists(text: string, keyword: string) {
  const normalizedText = ` ${normalizeText(text)} `
  const normalizedKeyword = normalizeText(keyword)

  if (!normalizedKeyword) {
    return false
  }

  if (normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword)
  }

  return normalizedText.includes(` ${normalizedKeyword} `)
}

function cleanTextArray(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

function cleanObjectArray<T>(values: T[], selector: (value: T) => string) {
  const seen = new Set<string>()

  return values.filter((value) => {
    const key = selector(value).trim()

    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  const cutoff = normalized.slice(0, maxLength + 1)
  const safeCutoff = cutoff.slice(0, Math.max(cutoff.lastIndexOf(' '), maxLength - 18)).trim()

  return `${safeCutoff}...`
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function lowercaseFirstCharacter(value: string) {
  if (!value) {
    return value
  }

  return value.charAt(0).toLowerCase() + value.slice(1)
}

function condenseResumeSummary(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? []
  const summary = sentences.length ? sentences.slice(0, 2).join(' ') : normalized

  return truncateText(summary, 240)
}

function condenseResumeBullet(value: string) {
  const normalized = value
    .replace(/\s+/g, ' ')
    .replace(/\.+$/, '')
    .trim()

  if (!normalized) {
    return ''
  }

  return truncateText(normalized, 118)
}

function extractKeywords(jobDescription: string) {
  const normalized = normalizeText(jobDescription)

  if (!normalized) {
    return []
  }

  const phraseMatches = trackedPhrases.filter((phrase) => normalized.includes(phrase))
  const tokenCounts = new Map<string, number>()

  for (const token of normalized.split(' ')) {
    if (token.length < 3 || stopWords.has(token)) {
      continue
    }

    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1)
  }

  const rankedTokens = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token)

  return Array.from(new Set([...phraseMatches, ...rankedTokens])).slice(0, 12)
}

function inferRoleFamily(targetRole: string, keywords: string[], skills: string[]) {
  const normalizedContext = normalizeText([targetRole, ...keywords, ...skills].join(' '))

  for (const family of Object.keys(roleFamilySignals) as RoleFamily[]) {
    if (family === 'general') {
      continue
    }

    if (roleFamilySignals[family].some((signal) => normalizedContext.includes(normalizeText(signal)))) {
      return family
    }
  }

  return 'general' as const
}

function buildRoleAwareBridge(roleFamily: RoleFamily, keyword: string, index: number) {
  const keywordText = lowercaseFirstCharacter(toDisplayKeyword(keyword))
  const bridgeMap: Record<RoleFamily, string[]> = {
    operations: [
      `to keep ${keywordText} clearer across daily workflows`,
      `while improving ${keywordText} follow-through`,
      `to make ${keywordText} easier for teams to track`,
      `with tighter ${keywordText} coordination`
    ],
    support: [
      `to strengthen ${keywordText} during customer-facing work`,
      `while improving ${keywordText} consistency`,
      `with clearer ${keywordText} support coverage`,
      `to keep ${keywordText} visible in follow-up work`
    ],
    sales: [
      `to reinforce ${keywordText} across revenue work`,
      `while improving ${keywordText} visibility in the pipeline`,
      `with stronger ${keywordText} support during outreach`,
      `to keep ${keywordText} clearer for decision-makers`
    ],
    marketing: [
      `to strengthen ${keywordText} across campaign execution`,
      `while improving ${keywordText} visibility in delivery work`,
      `with clearer ${keywordText} support in content and reporting`,
      `to keep ${keywordText} easier to spot in the work`
    ],
    design: [
      `to reinforce ${keywordText} in user-facing delivery`,
      `while improving ${keywordText} visibility in collaboration`,
      `with clearer ${keywordText} support across design work`,
      `to keep ${keywordText} easier for teams to read`
    ],
    engineering: [
      `to reinforce ${keywordText} in implementation work`,
      `while improving ${keywordText} coverage in delivery`,
      `with clearer ${keywordText} support across build work`,
      `to make ${keywordText} easier to spot in the project story`
    ],
    leadership: [
      `to keep ${keywordText} clearer across team delivery`,
      `while improving ${keywordText} visibility for stakeholders`,
      `with stronger ${keywordText} alignment across priorities`,
      `to reinforce ${keywordText} in execution planning`
    ],
    general: [
      `to strengthen ${keywordText}`,
      `while improving ${keywordText}`,
      `with clearer ${keywordText} support`,
      `to keep ${keywordText} visible`
    ]
  }

  return bridgeMap[roleFamily][index % bridgeMap[roleFamily].length]
}

function createSummary(
  targetRole: string,
  summaryTone: SummaryTone,
  experienceLevel: ExperienceLevel,
  skills: string[],
  matchedKeywords: string[],
  missingKeywords: string[],
  roleFamily: RoleFamily
) {
  const spotlightTerms = cleanTextArray([
    ...matchedKeywords.slice(0, 2).map(toDisplayKeyword),
    ...skills.slice(0, 2),
    ...missingKeywords.slice(0, 1).map(toDisplayKeyword)
  ]).slice(0, 4)

  const spotlightText = spotlightTerms.length ? spotlightTerms.join(', ') : roleFamilyFocus[roleFamily]
  const roleText = targetRole ? toDisplayKeyword(targetRole) : 'Candidate'
  const experienceLabel = toDisplayKeyword(experienceLabels[experienceLevel])
  const toneText = toneLabels[summaryTone]
  const familyFocus = roleFamilyFocus[roleFamily]

  return `${experienceLabel} ${roleText} with strengths in ${spotlightText}. Brings a ${toneText} voice and frames experience around ${familyFocus} so hiring teams can quickly map the draft to the role.`
}

function createOptimizedBullet(statement: string, keyword: string, index: number, targetRole: string, roleFamily: RoleFamily) {
  const cleaned = statement
    .replace(/^(responsible for|worked on|tasked with|helped with)\s+/i, '')
    .replace(/\.$/, '')
    .trim()

  const hasActionVerb = actionVerbs.some((verb) => cleaned.toLowerCase().startsWith(verb.toLowerCase()))
  const verbPool = roleFamilyActionVerbs[roleFamily]
  const starter = verbPool[index % verbPool.length]
  const body = cleaned
    ? hasActionVerb
      ? cleaned
      : `${starter} ${lowercaseFirstCharacter(cleaned)}`
    : `${starter} work aligned to ${lowercaseFirstCharacter(toDisplayKeyword(targetRole || 'the target role'))}`

  if (keyword && keywordExists(body, keyword)) {
    return `${body}.`
  }

  return `${body} ${buildRoleAwareBridge(roleFamily, keyword || targetRole || 'the target role', index)}.`
}

function collectResumeText(
  personalInfo: PersonalInfo,
  targetRole: string,
  experience: Experience[],
  education: Education[],
  skills: string[],
  projects: Project[],
  certifications: Certification[],
  languages: Language[]
) {
  return [
    personalInfo.name,
    personalInfo.summary,
    targetRole,
    ...experience.map((item) => `${item.jobTitle} ${item.company} ${item.duration} ${item.description}`),
    ...education.map((item) => `${item.degree} ${item.school} ${item.year}`),
    ...skills,
    ...projects.map((item) => `${item.name} ${item.description}`),
    ...certifications.map((item) => `${item.name} ${item.issuer}`),
    ...languages.map((item) => `${item.name} ${item.proficiency}`)
  ].join(' ')
}

function buildAnalysis(
  personalInfo: PersonalInfo,
  targetRole: string,
  jobDescription: string,
  experienceLevel: ExperienceLevel,
  summaryTone: SummaryTone,
  experience: Experience[],
  education: Education[],
  skills: string[],
  projects: Project[],
  certifications: Certification[],
  languages: Language[]
): AnalysisResult {
  const trackedKeywords = extractKeywords(jobDescription)
  const currentResumeText = collectResumeText(personalInfo, targetRole, experience, education, skills, projects, certifications, languages)
  const matchedKeywords = trackedKeywords.filter((keyword) => keywordExists(currentResumeText, keyword))
  const missingKeywords = trackedKeywords.filter((keyword) => !matchedKeywords.includes(keyword))
  const roleFamily = inferRoleFamily(targetRole, [...matchedKeywords, ...missingKeywords], skills)
  const completenessChecks = [
    Boolean(personalInfo.name.trim()),
    Boolean(personalInfo.email.trim()),
    Boolean(targetRole.trim()),
    Boolean(personalInfo.summary.trim()),
    experience.some((item) => item.jobTitle.trim() || item.company.trim()),
    education.some((item) => item.degree.trim() || item.school.trim()),
    cleanTextArray(skills).length >= 4,
    Boolean(jobDescription.trim())
  ]
  const completenessRatio = completenessChecks.filter(Boolean).length / completenessChecks.length
  const coverageRatio = trackedKeywords.length ? matchedKeywords.length / trackedKeywords.length : 0
  const baseScore = trackedKeywords.length
    ? Math.round(coverageRatio * 68 + completenessRatio * 24 + Math.min(cleanTextArray(skills).length, 10))
    : Math.round(completenessRatio * 62 + Math.min(cleanTextArray(skills).length, 8) * 2.5)
  const beforeScore = clamp(baseScore, 18, 88)
  const optimizedSummary = createSummary(targetRole, summaryTone, experienceLevel, skills, matchedKeywords, missingKeywords, roleFamily)
  const optimizedExperience = experience.map((item, index) => {
    const statements = splitIntoStatements(item.description)
    const keywordPool = [...missingKeywords, ...matchedKeywords]

    if (!statements.length) {
      return keywordPool.slice(index, index + 2).map((keyword, keywordIndex) =>
        createOptimizedBullet('', keyword, index + keywordIndex, targetRole, roleFamily)
      )
    }

    return statements.slice(0, 3).map((statement, statementIndex) => {
      const keyword = keywordPool[(index + statementIndex) % Math.max(keywordPool.length, 1)] ?? targetRole ?? 'core skills'
      return createOptimizedBullet(statement, keyword, index + statementIndex, targetRole, roleFamily)
    })
  })

  const optimizedResumeText = [currentResumeText, optimizedSummary, optimizedExperience.flat().join(' ')].join(' ')
  const optimizedMatchedKeywords = trackedKeywords.filter((keyword) => keywordExists(optimizedResumeText, keyword))
  const optimizedCoverageRatio = trackedKeywords.length ? optimizedMatchedKeywords.length / trackedKeywords.length : coverageRatio
  const afterScore = clamp(
    Math.round(optimizedCoverageRatio * 74 + completenessRatio * 20 + 8),
    trackedKeywords.length ? beforeScore + 6 : beforeScore,
    98
  )

  return {
    trackedKeywords,
    matchedKeywords: optimizedMatchedKeywords,
    missingKeywords: trackedKeywords.filter((keyword) => !optimizedMatchedKeywords.includes(keyword)),
    beforeScore,
    afterScore,
    optimizedSummary,
    optimizedExperience
  }
}

function App() {
  const studioRef = useRef<HTMLElement | null>(null)
  const resumePanelRef = useRef<HTMLElement | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const scoreMotionTimeoutRef = useRef<number | null>(null)
  const scrollTimeoutRef = useRef<number | null>(null)
  const jobBoardSequenceRef = useRef<HTMLDivElement | null>(null)
  const pendingSkillInputRef = useRef<HTMLInputElement | null>(null)
  const experienceDescriptionRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const guidedFieldTimeoutRef = useRef<number | null>(null)
  const previousAfterScoreRef = useRef<number | null>(null)
  const highestScoreMilestoneRef = useRef(0)

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(defaultPersonalInfo)
  const [targetRole, setTargetRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid')
  const [summaryTone, setSummaryTone] = useState<SummaryTone>('balanced')
  const [experience, setExperience] = useState<Experience[]>([createExperience()])
  const [education, setEducation] = useState<Education[]>([createEducation()])
  const [skills, setSkills] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([createProject()])
  const [certifications, setCertifications] = useState<Certification[]>([createCertification()])
  const [languages, setLanguages] = useState<Language[]>([createLanguage()])
  const [pendingSkill, setPendingSkill] = useState('')
  const [applyOptimization, setApplyOptimization] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [scoreMotionState, setScoreMotionState] = useState<'idle' | 'pulse' | 'celebrate'>('idle')
  const [recentScoreDelta, setRecentScoreDelta] = useState<number | null>(null)
  const [jobBoardLoopWidth, setJobBoardLoopWidth] = useState(0)
  const [hasExportedResume, setHasExportedResume] = useState(false)
  const [guidedFieldTarget, setGuidedFieldTarget] = useState<GuidedFieldTarget | null>(null)
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(createReviewDraft())
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([])
  const [remoteApprovedReviews, setRemoteApprovedReviews] = useState<CommunityReview[]>([])
  const [isReviewBackendConfigured, setIsReviewBackendConfigured] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) {
        const data = JSON.parse(saved)

        setPersonalInfo({ ...defaultPersonalInfo, ...(data.personalInfo ?? {}) })
        setTargetRole(data.targetRole ?? '')
        setJobDescription(data.jobDescription ?? '')
        setExperienceLevel(data.experienceLevel ?? 'mid')
        setSummaryTone(data.summaryTone ?? 'balanced')
        setExperience(
          Array.isArray(data.experience) && data.experience.length
            ? data.experience.map((item: Experience) => createExperience(item))
            : [createExperience()]
        )
        setEducation(
          Array.isArray(data.education) && data.education.length
            ? data.education.map((item: Education) => createEducation(item))
            : [createEducation()]
        )
        setSkills(Array.isArray(data.skills) ? cleanTextArray(data.skills) : [])
        setProjects(
          Array.isArray(data.projects) && data.projects.length
            ? data.projects.map((item: Project) => createProject(item))
            : [createProject()]
        )
        setCertifications(
          Array.isArray(data.certifications) && data.certifications.length
            ? data.certifications.map((item: Certification) => createCertification(item))
            : [createCertification()]
        )
        setLanguages(
          Array.isArray(data.languages) && data.languages.length
            ? data.languages.map((item: Language) => createLanguage(item))
            : [createLanguage()]
        )
        setApplyOptimization(data.applyOptimization ?? false)
      }
    } catch {
      setFeedback('Saved data could not be restored. Starting with a fresh workspace.')
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current)
      }
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setFeedback('')
        feedbackTimeoutRef.current = null
      }, 3000)
    }

    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current)
      }

      if (scoreMotionTimeoutRef.current !== null) {
        window.clearTimeout(scoreMotionTimeoutRef.current)
      }

      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current)
      }

      if (guidedFieldTimeoutRef.current !== null) {
        window.clearTimeout(guidedFieldTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const sequence = jobBoardSequenceRef.current

    if (!sequence) {
      return
    }

    const measure = () => {
      setJobBoardLoopWidth(sequence.getBoundingClientRect().width)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const resizeObserver = new ResizeObserver(() => {
      measure()
    })

    resizeObserver.observe(sequence)
    window.addEventListener('resize', measure)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    try {
      const savedReviews = localStorage.getItem(REVIEW_STORAGE_KEY)

      if (!savedReviews) {
        return
      }

      const parsedReviews = JSON.parse(savedReviews)

      if (!Array.isArray(parsedReviews)) {
        return
      }

      setSubmittedReviews(
        parsedReviews
          .filter((review): review is SubmittedReview => {
            return (
              review &&
              typeof review.id === 'string' &&
              typeof review.name === 'string' &&
              typeof review.role === 'string' &&
              typeof review.board === 'string' &&
              (typeof review.rating === 'number' || typeof review.rating === 'undefined') &&
              typeof review.outcome === 'string' &&
              typeof review.quote === 'string' &&
              typeof review.scoreBefore === 'number' &&
              typeof review.scoreAfter === 'number' &&
              (review.status === 'pending' || review.status === 'approved') &&
              typeof review.submittedAt === 'string'
            )
          })
          .map((review) => ({
            ...review,
            rating: clampReviewRating(typeof review.rating === 'number' ? review.rating : 5),
            status: 'approved' as const
          }))
      )
    } catch {
      setSubmittedReviews([])
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadApprovedReviews = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/reviews`, {
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as ReviewApiResponse

        if (!isMounted) {
          return
        }

        setRemoteApprovedReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setIsReviewBackendConfigured(Boolean(data.backendConfigured))
      } catch {
        if (isMounted) {
          setIsReviewBackendConfigured(false)
        }
      }
    }

    void loadApprovedReviews()

    return () => {
      isMounted = false
    }
  }, [])

  const analysis = buildAnalysis(
    personalInfo,
    targetRole,
    jobDescription,
    experienceLevel,
    summaryTone,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages
  )

  const isOptimizationUnlocked = Boolean(jobDescription.trim())
  const stepUnlockMessage = 'Paste a job description first to unlock optimization.'
  const scoreGuidance = !isOptimizationUnlocked
    ? 'Paste a job description to start matching.'
    : analysis.afterScore < 50
      ? 'Keep adding keywords from the job description.'
      : analysis.afterScore > 80
        ? 'Looking strong! Ready to export.'
        : 'You are close. Tighten the wording and keyword coverage.'
  const resumeHeadlineParts = cleanTextArray([targetRole, ...skills.slice(0, 3)]).slice(0, 4)
  const resumeContactItems = [personalInfo.address, personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.website]
    .map((value) => value.trim())
    .filter(Boolean)
  const rawResumeSummary = condenseResumeSummary(personalInfo.summary.trim())
  const optimizedResumeSummary = analysis.optimizedSummary ? condenseResumeSummary(analysis.optimizedSummary) : ''
  const resumeSummary = applyOptimization && optimizedResumeSummary ? optimizedResumeSummary : rawResumeSummary
  const isResumeSummaryOptimized = Boolean(
    applyOptimization && optimizedResumeSummary && optimizedResumeSummary !== rawResumeSummary
  )
  const resumeSkills = cleanTextArray(skills).slice(0, 10)
  const exportFileName = buildResumeFileName(personalInfo.name)
  const resumeExperienceEntries = experience
    .map((item, index) => {
      const rawBullets = splitIntoStatements(item.description)
        .map(condenseResumeBullet)
        .filter(Boolean)
        .slice(0, 3)
      const optimizedBullets = (analysis.optimizedExperience[index] ?? []).map(condenseResumeBullet).filter(Boolean).slice(0, 3)
      const useOptimizedBullets = applyOptimization && optimizedBullets.length > 0
      const optimizedBulletsChanged = useOptimizedBullets && optimizedBullets.join('|') !== rawBullets.join('|')
      const bullets: ResumeBulletPreview[] = (useOptimizedBullets ? optimizedBullets : rawBullets).map((text) => ({
        text,
        isOptimized: optimizedBulletsChanged
      }))

      return {
        ...item,
        bullets
      }
    })
    .filter((item) => item.jobTitle.trim() || item.company.trim())
    .slice(0, 3)
  const resumeEducationEntries = education.filter((item) => item.degree.trim() || item.school.trim()).slice(0, 2)
  const resumeSkillGroups = [resumeSkills.slice(0, 5), resumeSkills.slice(5)].filter((group) => group.length)
  const resumeCertifications = certifications.filter((item) => item.name.trim()).slice(0, 4)
  const resumeProjects = projects.filter((item) => item.name.trim()).slice(0, 2)
  const resumeLanguages = languages.filter((item) => item.name.trim()).slice(0, 3)
  const showProjectsInResume = resumeProjects.length > 0 && resumeExperienceEntries.length <= 1
  const hasResumeCore = Boolean(personalInfo.name.trim() && (personalInfo.summary.trim() || experience.some((item) => item.jobTitle.trim())))
  const hasTargetingInputs = Boolean(targetRole.trim() || jobDescription.trim())
  const hasResumeBasics = Boolean(personalInfo.name.trim() && (personalInfo.email.trim() || personalInfo.summary.trim()))
  const hasExperienceDetails = experience.some((item) => item.jobTitle.trim() || item.company.trim() || item.description.trim())
  const hasSkillSignals = skills.length > 0
  const hasValidEmail = Boolean(personalInfo.email.trim() && validateEmail(personalInfo.email))
  const hasContactMethod = Boolean(hasValidEmail || personalInfo.phone.trim())
  const summaryWordCount = countWords(personalInfo.summary)
  const populatedExperienceCount = experience.filter((item) => item.jobTitle.trim() || item.company.trim() || item.description.trim()).length
  const hasOptimizationPreviewContent = Boolean(personalInfo.summary.trim() || populatedExperienceCount > 0)
  const exportBlockers: Array<{ id: CompletionTarget; message: string }> = [
    !isOptimizationUnlocked ? { id: 'jobDescription', message: 'Paste the job description to unlock ATS matching before export.' } : null,
    !personalInfo.name.trim() ? { id: 'identity', message: 'Add the candidate name before exporting.' } : null,
    !hasContactMethod
      ? { id: 'contact', message: 'Add a valid email or phone number for recruiter contact.' }
      : personalInfo.email.trim() && !hasValidEmail
        ? { id: 'contact', message: 'Fix the email format or add a phone number so recruiters can reach you.' }
        : null,
    summaryWordCount < 6 ? { id: 'summary', message: 'Add a short professional summary before exporting.' } : null,
    populatedExperienceCount === 0 ? { id: 'experience', message: 'Add at least one role with a clear description of what you did.' } : null,
    skills.length === 0 ? { id: 'skills', message: 'Add skills so the ATS and recruiter can see your core signals.' } : null
  ].filter((item): item is { id: CompletionTarget; message: string } => item !== null)
  const canSubmitReview = Boolean(isOptimizationUnlocked && hasResumeCore && hasExportedResume)
  const reviewSubmissionHint = !isOptimizationUnlocked
    ? 'Paste a job description first to unlock review submission.'
    : !hasExportedResume
      ? 'Create and export your resume first, then you can share your result.'
      : isReviewBackendConfigured
        ? 'Your review will publish to the shared review wall as soon as you submit it.'
        : 'Shared review publishing is not configured yet on this build.'
  const publishedReviews = remoteApprovedReviews.filter(
    (review, index, collection) => collection.findIndex((item) => item.id === review.id) === index
  )
  const reviewCount = publishedReviews.length
  const featuredResults = publishedReviews.slice(0, 4)
  const averageReviewRating = reviewCount
    ? publishedReviews.reduce((total, review) => total + clampReviewRating(review.rating), 0) / reviewCount
    : 0
  const hasPublishedReviews = reviewCount > 0
  const scoreDelta = Math.max(analysis.afterScore - analysis.beforeScore, 0)
  const matchedSignalLabel = analysis.trackedKeywords.length
    ? `${analysis.matchedKeywords.length} of ${analysis.trackedKeywords.length} signals matched`
    : 'Paste a job description to start matching.'
  const heroBeforeScore = hasResumeCore ? analysis.beforeScore : 48
  const heroAfterScore = hasResumeCore ? analysis.afterScore : 84
  const heroScoreDelta = Math.max(heroAfterScore - heroBeforeScore, 0)
  const heroRecoveredSignals = (analysis.matchedKeywords.length ? analysis.matchedKeywords : landingTeaserAfterSignals)
    .slice(0, 4)
    .map(toDisplayKeyword)
  const heroMissingSignals = (analysis.missingKeywords.length ? analysis.missingKeywords : landingTeaserBeforeSignals)
    .slice(0, 4)
    .map(toDisplayKeyword)
  const studioStepCards = [
    {
      label: 'Step 1',
      title: 'Targeting brief',
      hint: isOptimizationUnlocked ? 'Job brief loaded and matching is live.' : 'Paste the role and job description to start.',
      state: isOptimizationUnlocked ? 'ready' : hasTargetingInputs ? 'active' : 'active'
    },
    {
      label: 'Step 2',
      title: 'Resume basics',
      hint: !isOptimizationUnlocked ? 'Locked until the job description is pasted.' : hasResumeBasics ? 'Header and summary content are in place.' : 'Add your name, contact details, and opener.',
      state: !isOptimizationUnlocked ? 'locked' : hasResumeBasics ? 'ready' : 'active'
    },
    {
      label: 'Step 3',
      title: 'Experience',
      hint: !isOptimizationUnlocked ? 'Locked until the job description is pasted.' : hasExperienceDetails ? 'Experience content is ready to optimize.' : 'Add your strongest role and impact notes.',
      state: !isOptimizationUnlocked ? 'locked' : hasExperienceDetails ? 'ready' : 'active'
    },
    {
      label: 'Step 4',
      title: 'Skills',
      hint: !isOptimizationUnlocked ? 'Locked until the job description is pasted.' : hasSkillSignals ? `${skills.length} skills and signals added.` : 'Add the keywords you want the ATS to see.',
      state: !isOptimizationUnlocked ? 'locked' : hasSkillSignals ? 'ready' : 'active'
    }
  ] as const

  useEffect(() => {
    if (!hasOptimizationPreviewContent && applyOptimization) {
      setApplyOptimization(false)
    }
  }, [applyOptimization, hasOptimizationPreviewContent])

  const showToast = (message: string) => {
    setFeedback(message)

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current)
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback('')
      feedbackTimeoutRef.current = null
    }, 3000)
  }

  const triggerScoreMotion = (state: 'pulse' | 'celebrate', delta: number) => {
    setScoreMotionState(state)
    setRecentScoreDelta(delta)

    if (scoreMotionTimeoutRef.current !== null) {
      window.clearTimeout(scoreMotionTimeoutRef.current)
    }

    scoreMotionTimeoutRef.current = window.setTimeout(() => {
      setScoreMotionState('idle')
      setRecentScoreDelta(null)
      scoreMotionTimeoutRef.current = null
    }, 1800)
  }

  useEffect(() => {
    if (!isOptimizationUnlocked) {
      previousAfterScoreRef.current = null
      highestScoreMilestoneRef.current = 0
      setScoreMotionState('idle')
      setRecentScoreDelta(null)

      if (scoreMotionTimeoutRef.current !== null) {
        window.clearTimeout(scoreMotionTimeoutRef.current)
        scoreMotionTimeoutRef.current = null
      }

      return
    }

    const previousScore = previousAfterScoreRef.current
    previousAfterScoreRef.current = analysis.afterScore

    if (previousScore === null || analysis.afterScore <= previousScore) {
      return
    }

    const delta = analysis.afterScore - previousScore
    const highestMilestone =
      analysis.afterScore >= 80
        ? 80
        : analysis.afterScore >= 65
          ? 65
          : analysis.afterScore >= 50
            ? 50
            : 0

    if (highestMilestone > highestScoreMilestoneRef.current) {
      highestScoreMilestoneRef.current = highestMilestone

      if (highestMilestone >= 80) {
        showToast('Looking strong. Your ATS score just cleared 80.')
        triggerScoreMotion('celebrate', delta)
        return
      }

      if (highestMilestone >= 65) {
        showToast('ATS score is climbing. Keep tightening the strongest signals.')
      } else if (highestMilestone >= 50) {
        showToast('The draft is moving in the right direction. Keep matching the job language.')
      }
    }

    triggerScoreMotion('pulse', delta)
  }, [analysis.afterScore, isOptimizationUnlocked])

  const persistSubmittedReviews = (nextReviews: SubmittedReview[]) => {
    setSubmittedReviews(nextReviews)

    try {
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(nextReviews))
      return true
    } catch {
      return false
    }
  }

  const refreshApprovedReviews = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/reviews`, {
        headers: {
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        return false
      }

      const data = (await response.json()) as ReviewApiResponse
      setRemoteApprovedReviews(Array.isArray(data.reviews) ? data.reviews : [])
      setIsReviewBackendConfigured(Boolean(data.backendConfigured))
      return true
    } catch {
      setIsReviewBackendConfigured(false)
      return false
    }
  }

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToPreview = () => {
    resumePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const focusCompletionTarget = (signalId: CompletionTarget) => {
    if (signalId === 'experience') {
      const targetIndex = experience.findIndex((item) => !item.description.trim())
      const fallbackIndex = targetIndex >= 0 ? targetIndex : 0
      const targetField = experienceDescriptionRefs.current[fallbackIndex]

      if (targetField) {
        highlightGuidedField({ type: 'experience', index: fallbackIndex })
        targetField.scrollIntoView({ behavior: 'smooth', block: 'center' })

        window.setTimeout(() => {
          targetField.focus()
        }, 240)
      }

      return
    }

    if (signalId === 'skills') {
      highlightGuidedField({ type: 'skill' })
      pendingSkillInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

      window.setTimeout(() => {
        pendingSkillInputRef.current?.focus()
      }, 240)

      return
    }

    const targetMap: Record<Exclude<CompletionTarget, 'experience' | 'skills'>, string> = {
      jobDescription: 'jobDescription',
      identity: 'personalName',
      contact: personalInfo.email.trim() && !hasValidEmail ? 'personalEmail' : 'personalPhone',
      summary: 'personalSummary'
    }

    const targetId = targetMap[signalId]
    const target = document.getElementById(targetId)

    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })

      window.setTimeout(() => {
        target.focus()
      }, 240)
    }
  }

  const saveWorkspace = () => {
    const cleanedSkills = cleanTextArray(skills)
    const cleanedProjects = cleanObjectArray(projects, (item) => `${item.name}|${item.description}|${item.link}`)
    const cleanedCertifications = cleanObjectArray(certifications, (item) => `${item.name}|${item.issuer}|${item.year}`)
    const cleanedLanguages = cleanObjectArray(languages, (item) => `${item.name}|${item.proficiency}`)
    const workspaceSnapshot = JSON.stringify({
      personalInfo,
      targetRole,
      jobDescription,
      experienceLevel,
      summaryTone,
      experience,
      education,
      skills: cleanedSkills,
      projects: cleanedProjects,
      certifications: cleanedCertifications,
      languages: cleanedLanguages,
      applyOptimization
    })

    setSkills(cleanedSkills)
    setProjects(cleanedProjects.length ? cleanedProjects : [createProject()])
    setCertifications(cleanedCertifications.length ? cleanedCertifications : [createCertification()])
    setLanguages(cleanedLanguages.length ? cleanedLanguages : [createLanguage()])

    try {
      localStorage.setItem(STORAGE_KEY, workspaceSnapshot)
      showToast('Workspace saved on this device.')
    } catch {
      showToast('Workspace could not be saved on this device.')
    }
  }

  const loadSample = () => {
    setHasExportedResume(false)
    setTargetRole(sampleData.targetRole)
    setJobDescription(sampleData.jobDescription)
    setExperienceLevel(sampleData.experienceLevel)
    setSummaryTone(sampleData.summaryTone)
    setApplyOptimization(sampleData.applyOptimization)
    setPersonalInfo(sampleData.personalInfo)
    setExperience(sampleData.experience.map((item) => createExperience(item)))
    setEducation(sampleData.education.map((item) => createEducation(item)))
    setSkills(sampleData.skills)
    setProjects(sampleData.projects.map((item) => createProject(item)))
    setCertifications(sampleData.certifications.map((item) => createCertification(item)))
    setLanguages(sampleData.languages.map((item) => createLanguage(item)))
    setPendingSkill('')
    showToast('Sample ATS workspace loaded.')

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      scrollToStudio()
      scrollTimeoutRef.current = null
    }, 100)
  }

  const resetWorkspace = () => {
    setHasExportedResume(false)
    setPersonalInfo(defaultPersonalInfo)
    setTargetRole('')
    setJobDescription('')
    setExperienceLevel('mid')
    setSummaryTone('balanced')
    setExperience([createExperience()])
    setEducation([createEducation()])
    setSkills([])
    setProjects([createProject()])
    setCertifications([createCertification()])
    setLanguages([createLanguage()])
    setPendingSkill('')
    setApplyOptimization(false)

    try {
      localStorage.removeItem(STORAGE_KEY)
      showToast('Workspace cleared.')
    } catch {
      showToast('Workspace cleared, but local storage could not be updated.')
    }
  }

  const generatePDF = async () => {
    const input = document.getElementById('resume-preview')

    if (!(input instanceof HTMLElement)) {
      showToast('Resume preview is not ready for export yet.')
      return
    }

    if (exportBlockers.length > 0) {
      const firstBlocker = exportBlockers[0]
      showToast(firstBlocker.message)
      focusCompletionTarget(firstBlocker.id)
      return
    }

    try {
      input.classList.add('resume-sheet-export')
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve())
        })
      })

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 5
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2
      const widthScale = usableWidth / canvas.width
      const heightScale = usableHeight / canvas.height
      const fitScale = Math.min(widthScale, heightScale)
      const renderedWidth = canvas.width * fitScale
      const renderedHeight = canvas.height * fitScale
      const horizontalOffset = (pageWidth - renderedWidth) / 2

      pdf.addImage(imgData, 'PNG', horizontalOffset, margin, renderedWidth, renderedHeight)

      pdf.save(exportFileName)
      setHasExportedResume(true)
      showToast('ATS resume exported as a single-page PDF.')
    } catch {
      showToast('PDF export failed. Please try again.')
    } finally {
      input.classList.remove('resume-sheet-export')
    }
  }

  const addSkill = () => {
    const value = pendingSkill.trim()

    if (!value) {
      return
    }

    const exists = skills.some((item) => item.toLowerCase() === value.toLowerCase())

    if (!exists) {
      setSkills((current) => [...current, value])
    }

    setPendingSkill('')
  }

  const highlightGuidedField = (target: GuidedFieldTarget) => {
    setGuidedFieldTarget(target)

    if (guidedFieldTimeoutRef.current !== null) {
      window.clearTimeout(guidedFieldTimeoutRef.current)
    }

    guidedFieldTimeoutRef.current = window.setTimeout(() => {
      setGuidedFieldTarget(null)
      guidedFieldTimeoutRef.current = null
    }, 2200)
  }

  const guideKeywordToFix = (keyword: string) => {
    const displayKeyword = toDisplayKeyword(keyword)
    const firstFilledExperienceIndex = experience.findIndex((item) => item.description.trim())
    const targetExperienceIndex = firstFilledExperienceIndex >= 0 ? firstFilledExperienceIndex : -1

    if (targetExperienceIndex >= 0) {
      const targetField = experienceDescriptionRefs.current[targetExperienceIndex]

      if (targetField) {
        highlightGuidedField({ type: 'experience', index: targetExperienceIndex })
        targetField.scrollIntoView({ behavior: 'smooth', block: 'center' })

        window.setTimeout(() => {
          targetField.focus()
        }, 260)

        showToast(`Work "${displayKeyword}" into Role ${targetExperienceIndex + 1}, or add it as a skill below.`)
        return
      }
    }

    setPendingSkill(displayKeyword)
    highlightGuidedField({ type: 'skill' })
    pendingSkillInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    window.setTimeout(() => {
      pendingSkillInputRef.current?.focus()
      pendingSkillInputRef.current?.select()
    }, 260)

    showToast(`Add "${displayKeyword}" to your skills, then weave it into your experience bullets if it fits.`)
  }

  const updateArrayItem = <T, K extends keyof T>(setter: Dispatch<SetStateAction<T[]>>, index: number, field: K, value: T[K]) => {
    setter((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)))
  }

  const updateReviewDraft = <K extends keyof ReviewDraft>(field: K, value: ReviewDraft[K]) => {
    setReviewDraft((current) => ({ ...current, [field]: value }))
  }

  const submitReview = () => {
    const submitReviewAsync = async () => {
      if (!canSubmitReview) {
        showToast(reviewSubmissionHint)
        return
      }

      const name = reviewDraft.name.trim() || personalInfo.name.trim()
      const role = reviewDraft.role.trim() || targetRole.trim()
      const board = reviewDraft.board.trim()
      const rating = clampReviewRating(reviewDraft.rating)
      const outcome = reviewDraft.outcome.trim()
      const quote = reviewDraft.quote.trim()

      if (!name || !role || !board || !outcome || !quote) {
        showToast('Complete the review details before submitting.')
        return
      }

      const nextReview: SubmittedReview = {
        id: createEntryId('review'),
        name,
        role,
        board,
        rating,
        scoreBefore: analysis.beforeScore,
        scoreAfter: analysis.afterScore,
        outcome,
        quote,
        status: 'approved',
        submittedAt: new Date().toISOString()
      }

      if (isReviewBackendConfigured) {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}api/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              name: nextReview.name,
              role: nextReview.role,
              board: nextReview.board,
              rating: nextReview.rating,
              scoreBefore: nextReview.scoreBefore,
              scoreAfter: nextReview.scoreAfter,
              outcome: nextReview.outcome,
              quote: nextReview.quote
            })
          })

          if (response.ok) {
            const data = (await response.json()) as { review?: SubmittedReview }

            if (data.review?.id) {
              nextReview.id = data.review.id
            }
            if (data.review?.submittedAt) {
              nextReview.submittedAt = data.review.submittedAt
            }
            nextReview.status = 'approved'
            await refreshApprovedReviews()
          } else {
            setIsReviewBackendConfigured(false)
          }
        } catch {
          setIsReviewBackendConfigured(false)
        }
      }

      const nextReviews: SubmittedReview[] = [nextReview, ...submittedReviews]

      const savedLocally = persistSubmittedReviews(nextReviews)

      setReviewDraft(
        createReviewDraft({
          name,
          role,
          board,
          rating
        })
      )

      if (savedLocally) {
        showToast(
          isReviewBackendConfigured
            ? 'Your review is now live on the shared review wall.'
            : 'Your review was saved on this device. Connect shared storage to publish it across users.'
        )
      } else {
        showToast('Your review could not be saved on this device.')
      }
    }

    void submitReviewAsync()
  }

  const addArrayItem = <T,>(setter: Dispatch<SetStateAction<T[]>>, item: T) => {
    setter((current) => [...current, item])
  }

  const removeArrayItem = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number) => {
    setter((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current))
  }

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="topbar">
        <div className="shell">
          <div className="brand-lockup">
            <img src={assetPath('/resumay-logo.png')} alt="ResuMay!" className="brand-logo" />
          </div>

          <nav className="topbar-links" aria-label="Primary">
            <a href="#how-it-works">How it works</a>
            <a href="#studio">Studio</a>
            <a href="#faq">FAQ</a>
          </nav>

          <button type="button" className="ghost-button topbar-button" onClick={scrollToStudio}>
            Open studio
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="shell">
            <div className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">Built for job seekers who want scoring, not guesswork.</span>
                <h1>You are qualified. ResuMay! helps your resume prove it.</h1>
                <p className="hero-lead">
                  ResuMay! uses real-time ATS signaling to show what hiring systems see, surface the missing signals, and
                  turn your draft into a higher-conversion application before you apply.
                </p>

                <div className="hero-actions">
                  <button type="button" className="primary-button" onClick={scrollToStudio}>
                    <i className="bi bi-arrow-up-right" />
                    Open ATS studio
                  </button>
                  <button type="button" className="secondary-button" onClick={loadSample}>
                    <i className="bi bi-file-earmark-text" />
                    Load sample workspace
                  </button>
                </div>

                <p className="hero-action-note">
                  Start with a live sample or go straight into the Studio. ResuMay! shows the score movement, the role fit,
                  and the export-ready result in the same workflow.
                </p>

                <div className="hero-journey" aria-label="What happens next">
                  <div className="hero-journey-step">
                    <span>01</span>
                    <strong>Paste the job description</strong>
                  </div>
                  <div className="hero-journey-step">
                    <span>02</span>
                    <strong>Watch the ATS score move</strong>
                  </div>
                  <div className="hero-journey-step">
                    <span>03</span>
                    <strong>Export the one-page PDF</strong>
                  </div>
                </div>

                <div className="hero-stats">
                  <div className="stat-card">
                    <strong>Signal coverage</strong>
                    <span>See missing ATS signals before you send the same draft into another hiring pipeline.</span>
                  </div>
                  <div className="stat-card">
                    <strong>+{heroScoreDelta || 36} points</strong>
                    <span>Use live score movement as proof that the edits are improving match quality, not just wording.</span>
                  </div>
                  <div className="stat-card">
                    <strong>Board-ready PDF</strong>
                    <span>Export a one-page resume designed to travel better across recruiters, ATS tools, and job boards.</span>
                  </div>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-card hero-card-score hero-score-hud">
                  <div className="hero-card-header">
                    <span>Live ATS signal gauge</span>
                    <strong className="hero-score-delta">+{heroScoreDelta || 36}</strong>
                  </div>

                  <div className="hero-score-row">
                    <div>
                      <small>Before</small>
                      <strong>{heroBeforeScore}</strong>
                    </div>
                    <div className="score-arrow">
                      <i className="bi bi-arrow-right" />
                    </div>
                    <div>
                      <small>After</small>
                      <strong>{heroAfterScore}</strong>
                    </div>
                  </div>

                  <div className="hero-score-meter" aria-hidden="true">
                    <span className="hero-score-meter-before" style={{ width: `${heroBeforeScore}%` }} />
                    <span className="hero-score-meter-after" style={{ width: `${heroAfterScore}%` }} />
                  </div>

                  <div className="hero-score-copy">
                    <span>{heroRecoveredSignals.length} recruiter-facing signals visible</span>
                    <span>Animated preview of the score movement inside the Studio</span>
                  </div>
                </div>

                <div className="hero-card hero-card-compare">
                  <div className="hero-card-header">
                    <span>Split-view teaser</span>
                    <span className="hero-compare-caption">Before vs. after ATS visibility</span>
                  </div>

                  <div className="hero-compare-grid">
                    <article className="hero-compare-panel hero-compare-panel-before">
                      <div className="hero-compare-head">
                        <span>Before</span>
                        <strong>{heroBeforeScore}%</strong>
                      </div>
                      <p>Generic draft. Strong qualifications, weak signaling.</p>
                      <div className="hero-compare-chip-cloud">
                        {heroMissingSignals.map((signal) => (
                          <span key={`before-${signal}`} className="hero-compare-chip hero-compare-chip-muted">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </article>

                    <article className="hero-compare-panel hero-compare-panel-after">
                      <div className="hero-compare-head">
                        <span>After</span>
                        <strong>{heroAfterScore}%</strong>
                      </div>
                      <p>Sharper opener, clearer bullets, stronger ATS coverage.</p>
                      <div className="hero-compare-chip-cloud">
                        {heroRecoveredSignals.map((signal) => (
                          <span key={`after-${signal}`} className="hero-compare-chip hero-compare-chip-success">
                            <i className="bi bi-check-circle-fill" />
                            {signal}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>

            <div className="job-board-band" aria-labelledby="job-board-title">
              <div className="job-board-band-head">
                <span id="job-board-title" className="job-board-label">
                  Built for online job boards like
                </span>
              </div>

              <div className="job-board-marquee" aria-label="Supported job boards">
                <div
                  className={`job-board-track${jobBoardLoopWidth > 0 ? ' is-ready' : ''}`}
                  style={
                    jobBoardLoopWidth > 0
                      ? ({ '--job-board-loop-width': `${jobBoardLoopWidth}px` } as CSSProperties)
                      : undefined
                  }
                >
                  {[0, 1].map((copyIndex) => {
                    const isRepeat = copyIndex === 1

                    return (
                      <div
                        key={copyIndex}
                        className="job-board-sequence"
                        aria-hidden={isRepeat ? 'true' : undefined}
                        ref={isRepeat ? undefined : jobBoardSequenceRef}
                        role={isRepeat ? undefined : 'list'}
                      >
                        {supportedJobBoards.map((board) => (
                          <article
                            key={`${copyIndex}-${board.id}`}
                            className={`job-board-node job-board-node-${board.logoType}`}
                            aria-label={isRepeat ? undefined : board.name}
                            role={isRepeat ? undefined : 'listitem'}
                          >
                            <div className="job-board-node-logo">
                              <img
                                src={board.logoSrc}
                                alt={isRepeat ? '' : `${board.name} logo`}
                                className={`job-board-logo job-board-logo-${board.logoType}${board.logoClassName ? ` ${board.logoClassName}` : ''}`}
                              />
                            </div>
                          </article>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-section">
          <div className="shell proof-shell">
            <div className="section-heading proof-heading">
              <span className="eyebrow">Why the workflow feels different</span>
              <h2>ResuMay behaves more like live application intelligence than a basic resume editor.</h2>
              <p>
                The landing page now mirrors the Studio itself: visible score movement, clearer signal gaps, and a one-page
                export path that stays tied to the role you are targeting.
              </p>
            </div>

            <div className="proof-row">
              <article className="proof-card">
                <div className="proof-card-icon" aria-hidden="true">
                  <i className="bi bi-bullseye" />
                </div>
                <div className="proof-card-copy">
                  <span className="proof-card-kicker">Signal audit</span>
                  <strong>See the gap before you apply</strong>
                  <p>Find the missing role signals early so you can stop sending blind applications into the same hiring loop.</p>
                </div>
              </article>

              <article className="proof-card">
                <div className="proof-card-icon" aria-hidden="true">
                  <i className="bi bi-activity" />
                </div>
                <div className="proof-card-copy">
                  <span className="proof-card-kicker">Score movement</span>
                  <strong>Watch the application get stronger</strong>
                  <p>Use the ATS lift as live proof that your edits are improving relevance, not just making the wording longer.</p>
                </div>
              </article>

              <article className="proof-card">
                <div className="proof-card-icon" aria-hidden="true">
                  <i className="bi bi-file-earmark-check" />
                </div>
                <div className="proof-card-copy">
                  <span className="proof-card-kicker">One-page output</span>
                  <strong>Export the version recruiters should see</strong>
                  <p>Finish with a clean PDF built for job boards, recruiter review, and ATS parsing instead of a generic draft.</p>
                </div>
              </article>
            </div>

            <div className="proof-inline-note" role="note" aria-label="ResuMay workflow summary">
              <span>No template switching</span>
              <span>Visible ATS movement</span>
              <span>One role-focused workflow</span>
            </div>
          </div>
        </section>

        <section className="principles-section" aria-labelledby="principles-title">
          <div className="shell">
            <div className="section-heading principles-heading">
              <span className="eyebrow">Don Norman in practice</span>
              <h2 id="principles-title">Senior-level UI/UX structure that explains itself.</h2>
              <p>
                ResuMay! is organized so users can immediately understand the system, see the result of each action, and move
                through the workflow with less friction and less guesswork.
              </p>
            </div>

            <div className="principles-grid">
              <article className="principle-card">
                <span className="principle-index">01</span>
                <h3>Signifiers</h3>
                <p>Clear step labels, explicit actions, and obvious section titles guide every major resume task.</p>
              </article>

              <article className="principle-card">
                <span className="principle-index">02</span>
                <h3>Visibility</h3>
                <p>ATS score, keyword coverage, and the paper preview stay visible while the user edits.</p>
              </article>

              <article className="principle-card">
                <span className="principle-index">03</span>
                <h3>Feedback</h3>
                <p>Score deltas, suggestions, and save or export confirmations respond immediately to user actions.</p>
              </article>

              <article className="principle-card">
                <span className="principle-index">04</span>
                <h3>Constraints and mapping</h3>
                <p>The form flows left to right into the live resume sheet, with structured inputs that keep users on track.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="story-section">
          <div className="shell story-grid">
            <div className="section-heading">
              <span className="eyebrow">Process</span>
              <h2>Three steps to a higher-conversion application.</h2>
              <p>
                Start with the role, shape the draft around the job description, and export a cleaner one-page PDF that is
                easier to send with confidence.
              </p>
            </div>

            <div className="story-cards">
              <article className="story-card">
                <span className="story-step">01</span>
                <h3>Paste the role and job description</h3>
                <p>Drop in the position you are targeting so ResuMay! can read the hiring signal before you edit.</p>
              </article>
              <article className="story-card">
                <span className="story-step">02</span>
                <h3>Tailor the resume to the job</h3>
                <p>Use the match score, keyword visibility, and content suggestions to strengthen the story recruiters will see.</p>
              </article>
              <article className="story-card">
                <span className="story-step">03</span>
                <h3>Export and apply</h3>
                <p>Review the live paper preview, export the improved PDF, and submit a resume that feels more role-ready.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="studio" className="studio-section" ref={studioRef}>
          <div className="shell">
            <div className="studio-heading">
              <div>
                <span className="eyebrow">Optimizer studio</span>
                <h2>Build the resume. Tune the match. Export the ATS-ready version.</h2>
              </div>

              <div className="studio-actions">
                <button type="button" className="secondary-button" onClick={loadSample}>
                  Load sample
                </button>
                <button type="button" className="ghost-button" onClick={resetWorkspace}>
                  Reset
                </button>
              </div>
            </div>

            {feedback && <div className="toast-banner">{feedback}</div>}

            <div className="studio-overview" aria-label="Studio summary">
              <article className={`overview-card overview-card-score${scoreMotionState !== 'idle' ? ` is-${scoreMotionState}` : ''}`}>
                <span className="panel-kicker">Projected match</span>
                <strong>{analysis.afterScore}/100</strong>
                <p>{scoreGuidance}</p>
              </article>
              <article className="overview-card">
                <span className="panel-kicker">Download name</span>
                <strong>{exportFileName}</strong>
                <p>Your PDF now exports with the actual candidate name instead of a generic filename.</p>
              </article>
              <article className="overview-card">
                <span className="panel-kicker">Resume format</span>
                <strong>Concise one-page ATS PDF</strong>
                <p>The live preview and exported PDF stay synchronized to the same clean layout.</p>
              </article>
            </div>

            <div className="studio-progress-strip" aria-label="Studio step progress">
              {studioStepCards.map((step) => (
                <article key={step.label} className={`studio-progress-card studio-progress-card-${step.state}`}>
                  <span className="studio-progress-kicker">{step.label}</span>
                  <strong>{step.title}</strong>
                  <p>{step.hint}</p>
                </article>
              ))}
            </div>

            <div className="studio-grid">
              <div className="studio-form-column">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 1</span>
                      <h3>Targeting brief</h3>
                    </div>
                  </div>

                  <p className="panel-intro">
                    Define the role, tone, and hiring brief first. This is the signal source that unlocks the rest of the Studio.
                  </p>

                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Target role</span>
                      <input
                        type="text"
                        id="targetRole"
                        name="targetRole"
                        value={targetRole}
                        onChange={(event) => setTargetRole(event.target.value)}
                        placeholder="e.g. Virtual Assistant, Admin Officer, Sales Executive, Frontend Engineer"
                      />
                    </label>

                    <label className="field">
                      <span>Experience level</span>
                      <select id="experienceLevel" name="experienceLevel" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}>
                        <option value="entry">Entry</option>
                        <option value="mid">Mid-level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                      </select>
                    </label>
                  </div>

                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Summary tone</span>
                      <select id="summaryTone" name="summaryTone" value={summaryTone} onChange={(event) => setSummaryTone(event.target.value as SummaryTone)}>
                        <option value="balanced">Balanced</option>
                        <option value="strategic">Strategic</option>
                        <option value="technical">Technical</option>
                        <option value="concise">Concise</option>
                      </select>
                    </label>

                    <label
                      className={`switch-card${hasOptimizationPreviewContent ? '' : ' switch-card-disabled'}`}
                      title={!hasOptimizationPreviewContent ? 'Add experience details first to see AI optimizations.' : undefined}
                    >
                      <div>
                        <strong>Apply optimized content</strong>
                        <p id="applyOptimizationHint">
                          {hasOptimizationPreviewContent
                            ? 'Preview the ATS-refined summary and bullets instead of the raw draft.'
                            : 'Add experience details first to see AI optimizations.'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id="applyOptimization"
                        name="applyOptimization"
                        checked={applyOptimization}
                        onChange={(event) => setApplyOptimization(event.target.checked)}
                        disabled={!hasOptimizationPreviewContent}
                        aria-label="Apply optimized content"
                        aria-describedby="applyOptimizationHint"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Job description</span>
                    <textarea
                      className="guided-textarea"
                      id="jobDescription"
                      name="jobDescription"
                      rows={7}
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      placeholder={`Example:\nWe are hiring an Operations Coordinator to support scheduling, reporting, documentation, stakeholder communication, and process improvement across daily client delivery.`}
                    />
                  </label>
                </section>

                <section className={`panel gated-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 2</span>
                      <h3>Resume basics</h3>
                    </div>
                  </div>

                  <p className="panel-intro">
                    These details become the resume header and opening summary in the live preview, so keep them direct and role-aligned.
                  </p>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Full name</span>
                      <input
                        type="text"
                        id="personalName"
                        name="personalName"
                        value={personalInfo.name}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, name: event.target.value })}
                        placeholder="Your full name"
                      />
                    </label>

                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        id="personalEmail"
                        name="personalEmail"
                        className={personalInfo.email && !validateEmail(personalInfo.email) ? 'invalid-field' : ''}
                        value={personalInfo.email}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, email: event.target.value })}
                        placeholder="name@example.com"
                      />
                    </label>
                  </div>

                  <div className="field-grid field-grid-3">
                    <label className="field">
                      <span>Phone</span>
                      <input
                        type="tel"
                        id="personalPhone"
                        name="personalPhone"
                        value={personalInfo.phone}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, phone: event.target.value })}
                        placeholder="+63 917 XXX XXXX"
                      />
                    </label>

                    <label className="field">
                      <span>Location</span>
                      <input
                        type="text"
                        id="personalLocation"
                        name="personalLocation"
                        value={personalInfo.address}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, address: event.target.value })}
                        placeholder="City, Province"
                      />
                    </label>

                    <label className="field">
                      <span>LinkedIn or website</span>
                      <input
                        type="text"
                        id="personalLinkedin"
                        name="personalLinkedin"
                        value={personalInfo.linkedin}
                        onChange={(event) => setPersonalInfo({ ...personalInfo, linkedin: event.target.value })}
                        placeholder="linkedin.com/in/yourname"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Portfolio or website</span>
                    <input
                      type="text"
                      id="personalWebsite"
                      name="personalWebsite"
                      value={personalInfo.website}
                      onChange={(event) => setPersonalInfo({ ...personalInfo, website: event.target.value })}
                      placeholder="yourportfolio.com"
                    />
                  </label>

                  <label className="field">
                    <span>Current summary</span>
                    <textarea
                      className="guided-textarea"
                      id="personalSummary"
                      name="personalSummary"
                      rows={5}
                      value={personalInfo.summary}
                      onChange={(event) => setPersonalInfo({ ...personalInfo, summary: event.target.value })}
                      placeholder={`Example:\nResults-driven operations coordinator with experience in scheduling, documentation, reporting, and stakeholder communication across fast-moving teams.`}
                    />
                  </label>
                  </fieldset>
                </section>

                <section className={`panel gated-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 3</span>
                      <h3>Experience</h3>
                    </div>
                  </div>

                  <p className="panel-intro">
                    Focus on real impact, ownership, and delivery. These bullets usually drive the biggest ATS score movement.
                  </p>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  {experience.map((item, index) => (
                    <div key={item.id} className="repeat-card">
                      <div className="repeat-card-header">
                        <strong>Role {index + 1}</strong>
                        {experience.length > 1 && (
                          <button type="button" className="icon-button" onClick={() => removeArrayItem(setExperience, index)} aria-label={`Remove role ${index + 1}`}>
                            <i className="bi bi-trash3" />
                          </button>
                        )}
                      </div>

                      <div className="field-grid field-grid-2">
                        <label className="field">
                          <span>Job title</span>
                          <input
                            type="text"
                            id={`experience_jobTitle_${index}`}
                            name={`experience_jobTitle_${index}`}
                            value={item.jobTitle}
                            onChange={(event) => updateArrayItem(setExperience, index, 'jobTitle', event.target.value)}
                            placeholder="Senior Software Engineer"
                          />
                        </label>

                        <label className="field">
                          <span>Company</span>
                          <input
                            type="text"
                            id={`experience_company_${index}`}
                            name={`experience_company_${index}`}
                            value={item.company}
                            onChange={(event) => updateArrayItem(setExperience, index, 'company', event.target.value)}
                            placeholder="Tech Company PH"
                          />
                        </label>
                      </div>

                      <label className="field">
                        <span>Duration</span>
                        <input
                          type="text"
                          id={`experience_duration_${index}`}
                          name={`experience_duration_${index}`}
                          value={item.duration}
                          onChange={(event) => updateArrayItem(setExperience, index, 'duration', event.target.value)}
                          placeholder="2022 - Present"
                        />
                      </label>

                      <label className="field">
                        <span>What did you do?</span>
                        <textarea
                          id={`experience_description_${index}`}
                          name={`experience_description_${index}`}
                          rows={4}
                          ref={(node) => {
                            experienceDescriptionRefs.current[index] = node
                          }}
                          className={guidedFieldTarget?.type === 'experience' && guidedFieldTarget.index === index ? 'field-target' : ''}
                          value={item.description}
                          onChange={(event) => updateArrayItem(setExperience, index, 'description', event.target.value)}
                          placeholder="Add 2-4 sentences or bullet-style notes. ResuMay! will tighten them for ATS readability."
                        />
                      </label>
                    </div>
                  ))}

                  <div className="repeat-add-row">
                    <button
                      type="button"
                      className="secondary-button compact-button add-button add-button-bottom"
                      onClick={() => addArrayItem(setExperience, createExperience())}
                      disabled={!isOptimizationUnlocked}
                    >
                      <i className="bi bi-plus-circle" /> Add role
                    </button>
                  </div>
                  </fieldset>
                </section>

                <section className={`panel gated-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="step-badge">Step 4</span>
                      <h3>Skills and keyword coverage</h3>
                    </div>
                  </div>

                  <p className="panel-intro">
                    Add the skills recruiters expect to see, then use the suggested keyword chips to close the remaining signal gaps.
                  </p>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="skill-entry">
                    <input
                      type="text"
                      id="pendingSkill"
                      name="pendingSkill"
                      ref={pendingSkillInputRef}
                      className={guidedFieldTarget?.type === 'skill' ? 'field-target' : ''}
                      value={pendingSkill}
                      onChange={(event) => setPendingSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addSkill()
                        }
                      }}
                      placeholder="Add a skill or keyword and press Enter"
                    />
                    <button type="button" className="secondary-button compact-button add-button" onClick={addSkill}>
                      <i className="bi bi-plus-circle" /> Add skill
                    </button>
                  </div>

                  <div className="keyword-cluster">
                    {skills.length ? (
                      skills.map((skill) => (
                        <button key={skill} type="button" className="tag-chip removable-chip" onClick={() => setSkills((current) => current.filter((item) => item !== skill))}>
                          {skill}
                          <i className="bi bi-x-lg" />
                        </button>
                      ))
                    ) : (
                      <p className="empty-note">Your skills and ATS keywords will appear here.</p>
                    )}
                  </div>

                  {analysis.missingKeywords.length > 0 && (
                    <div className="keyword-helper">
                      <strong>Suggested keywords from the target job</strong>
                      <div className="keyword-cluster">
                        {analysis.missingKeywords.slice(0, 8).map((keyword) => (
                          <button key={keyword} type="button" className="tag-chip suggestion-chip" onClick={() => guideKeywordToFix(keyword)}>
                            + {toDisplayKeyword(keyword)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  </fieldset>
                </section>

                <section className={`panel gated-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Supporting sections</span>
                      <h3>Education and projects</h3>
                    </div>
                  </div>

                  <p className="panel-intro">
                    Use supporting sections only when they make the one-page story stronger, sharper, or more credible.
                  </p>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Education</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setEducation, createEducation())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {education.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Education {index + 1}</strong>
                          {education.length > 1 && (
                            <button type="button" className="icon-button" onClick={() => removeArrayItem(setEducation, index)} aria-label={`Remove education ${index + 1}`}>
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <div className="field-grid field-grid-2">
                          <label className="field">
                            <span>Degree</span>
                            <input
                              type="text"
                              id={`education_degree_${index}`}
                              name={`education_degree_${index}`}
                              value={item.degree}
                              onChange={(event) => updateArrayItem(setEducation, index, 'degree', event.target.value)}
                              placeholder="BS Computer Science / BS Information Technology"
                            />
                          </label>

                          <label className="field">
                            <span>Year</span>
                            <input
                              type="text"
                              id={`education_year_${index}`}
                              name={`education_year_${index}`}
                              value={item.year}
                              onChange={(event) => updateArrayItem(setEducation, index, 'year', event.target.value)}
                              placeholder="2023"
                            />
                          </label>
                        </div>

                        <label className="field">
                          <span>School</span>
                          <input
                            type="text"
                            id={`education_school_${index}`}
                            name={`education_school_${index}`}
                            value={item.school}
                            onChange={(event) => updateArrayItem(setEducation, index, 'school', event.target.value)}
                            placeholder="UP / DLSU / Ateneo / UST"
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Projects</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setProjects, createProject())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {projects.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Project {index + 1}</strong>
                          {projects.length > 1 && (
                            <button type="button" className="icon-button" onClick={() => removeArrayItem(setProjects, index)} aria-label={`Remove project ${index + 1}`}>
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <label className="field">
                          <span>Project name</span>
                          <input
                            type="text"
                            id={`project_name_${index}`}
                            name={`project_name_${index}`}
                            value={item.name}
                            onChange={(event) => updateArrayItem(setProjects, index, 'name', event.target.value)}
                            placeholder="Analytics workspace"
                          />
                        </label>

                        <label className="field">
                          <span>Description</span>
                          <textarea
                            id={`project_description_${index}`}
                            name={`project_description_${index}`}
                            rows={3}
                            value={item.description}
                            onChange={(event) => updateArrayItem(setProjects, index, 'description', event.target.value)}
                            placeholder="What impact did the project have?"
                          />
                        </label>

                        <label className="field">
                          <span>Link</span>
                          <input
                            type="url"
                            id={`project_link_${index}`}
                            name={`project_link_${index}`}
                            value={item.link}
                            onChange={(event) => updateArrayItem(setProjects, index, 'link', event.target.value)}
                            placeholder="https://github.com/..."
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                  </fieldset>
                </section>

                <section className={`panel gated-panel${isOptimizationUnlocked ? '' : ' is-locked'}`} aria-disabled={!isOptimizationUnlocked}>
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Optional credibility boosts</span>
                      <h3>Certifications and languages</h3>
                    </div>
                  </div>

                  <p className="panel-intro">
                    Add optional proof only if it strengthens trust without crowding the page or distracting from the core story.
                  </p>

                  {!isOptimizationUnlocked && (
                    <p className="panel-lock-copy" role="note">
                      <i className="bi bi-lock-fill" /> {stepUnlockMessage}
                    </p>
                  )}

                  <fieldset className="panel-fieldset" disabled={!isOptimizationUnlocked}>
                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Certifications</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setCertifications, createCertification())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {certifications.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Certification {index + 1}</strong>
                          {certifications.length > 1 && (
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => removeArrayItem(setCertifications, index)}
                              aria-label={`Remove certification ${index + 1}`}
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <div className="field-grid field-grid-2">
                          <label className="field">
                            <span>Name</span>
                            <input
                              type="text"
                              id={`certification_name_${index}`}
                              name={`certification_name_${index}`}
                              value={item.name}
                              onChange={(event) => updateArrayItem(setCertifications, index, 'name', event.target.value)}
                              placeholder="AWS Cloud Practitioner"
                            />
                          </label>

                          <label className="field">
                            <span>Year</span>
                            <input
                              type="text"
                              id={`certification_year_${index}`}
                              name={`certification_year_${index}`}
                              value={item.year}
                              onChange={(event) => updateArrayItem(setCertifications, index, 'year', event.target.value)}
                              placeholder="2024"
                            />
                          </label>
                        </div>

                        <label className="field">
                          <span>Issuer</span>
                          <input
                            type="text"
                            id={`certification_issuer_${index}`}
                            name={`certification_issuer_${index}`}
                            value={item.issuer}
                            onChange={(event) => updateArrayItem(setCertifications, index, 'issuer', event.target.value)}
                            placeholder="Issuer"
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Languages</strong>
                      <button type="button" className="secondary-button compact-button add-button" onClick={() => addArrayItem(setLanguages, createLanguage())}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {languages.map((item, index) => (
                      <div key={item.id} className="repeat-card compact-repeat-card">
                        <div className="repeat-card-header">
                          <strong>Language {index + 1}</strong>
                          {languages.length > 1 && (
                            <button type="button" className="icon-button" onClick={() => removeArrayItem(setLanguages, index)} aria-label={`Remove language ${index + 1}`}>
                              <i className="bi bi-trash3" />
                            </button>
                          )}
                        </div>

                        <div className="field-grid field-grid-2">
                          <label className="field">
                            <span>Name</span>
                            <input
                              type="text"
                              id={`language_name_${index}`}
                              name={`language_name_${index}`}
                              value={item.name}
                              onChange={(event) => updateArrayItem(setLanguages, index, 'name', event.target.value)}
                              placeholder="Tagalog / Bisaya / Ilokano"
                            />
                          </label>

                          <label className="field">
                            <span>Proficiency</span>
                            <select
                              id={`language_proficiency_${index}`}
                              name={`language_proficiency_${index}`}
                              value={item.proficiency}
                              onChange={(event) => updateArrayItem(setLanguages, index, 'proficiency', event.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Basic">Basic</option>
                              <option value="Professional">Professional</option>
                              <option value="Fluent">Fluent</option>
                              <option value="Native">Native</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  </fieldset>
                </section>
              </div>

              <aside className="studio-side-column">
                <div className="sticky-stack">
                  <section className={`panel panel-contrast score-hud-card${scoreMotionState !== 'idle' ? ` is-${scoreMotionState}` : ''}`}>
                    <div className="score-hud-topbar">
                      <div>
                        <span className="panel-kicker">Live ATS score</span>
                        <div className="score-hud-inline">
                          <strong>{analysis.afterScore}%</strong>
                          <span>{analysis.beforeScore}% draft</span>
                          {scoreDelta > 0 && <span className="score-hud-delta">+{scoreDelta}</span>}
                        </div>
                      </div>
                      <button type="button" className="ghost-button compact-button score-hud-button" onClick={scrollToPreview}>
                        View preview
                      </button>
                    </div>

                    <div className="score-hud-bar" aria-hidden="true">
                      <span className="score-hud-bar-before" style={{ width: `${analysis.beforeScore}%` }} />
                      <span className="score-hud-bar-after" style={{ width: `${analysis.afterScore}%` }} />
                    </div>

                    <div className="score-hud-meta">
                      <span>{matchedSignalLabel}</span>
                      <span>{scoreGuidance}</span>
                    </div>

                    {recentScoreDelta !== null && scoreMotionState !== 'idle' && (
                      <div className={`score-feedback-note score-feedback-note-${scoreMotionState}`} role="status" aria-live="polite">
                        <i className={`bi ${scoreMotionState === 'celebrate' ? 'bi-stars' : 'bi-graph-up-arrow'}`} />
                        <span>
                          {scoreMotionState === 'celebrate'
                            ? `Score moved +${recentScoreDelta}. This draft is looking export-ready.`
                            : `Score moved +${recentScoreDelta}. Keep tightening the strongest signals.`}
                        </span>
                      </div>
                    )}
                  </section>

                  <section className="panel resume-panel sticky-preview-panel" ref={resumePanelRef}>
                    <div className="resume-panel-topbar">
                      <div>
                        <span className="panel-kicker">Output preview</span>
                        <h3>Optimized resume sheet</h3>
                        <div className="resume-panel-meta">
                          <span>1-page ATS format</span>
                          <span>{exportFileName}</span>
                        </div>
                      </div>

                      <div className="resume-actions">
                        <button type="button" className="ghost-button compact-button save-button" onClick={saveWorkspace}>
                          Save locally
                        </button>
                        <button type="button" className="primary-button compact-button export-button" onClick={generatePDF} disabled={!hasResumeCore}>
                          Export PDF
                        </button>
                      </div>
                    </div>

                    <div className="resume-workspace">
                      <div id="resume-preview" className="resume-sheet">
                        <header className="resume-header">
                          <h2>{personalInfo.name || 'Your Name'}</h2>
                          <p className="resume-role">
                            {(resumeHeadlineParts.length ? resumeHeadlineParts : [targetRole || 'Target Role']).map((part, index) => (
                              <span key={`${part}-${index}`}>{part}</span>
                            ))}
                          </p>
                          {resumeContactItems.length > 0 && (
                            <div className="resume-contact-line">
                              {resumeContactItems.map((item, index) => (
                                <span key={`${item}-${index}`}>{item}</span>
                              ))}
                            </div>
                          )}
                        </header>

                        {resumeSummary && (
                          <section className="resume-section">
                            <h3>Professional Summary</h3>
                            <p className="resume-section-copy">
                              {isResumeSummaryOptimized ? <span className="is-optimized">{resumeSummary}</span> : resumeSummary}
                            </p>
                          </section>
                        )}

                        {resumeExperienceEntries.length > 0 && (
                          <section className="resume-section">
                            <h3>Work Experience</h3>
                            {resumeExperienceEntries.map((item) => (
                              <article key={item.id} className="resume-role-block">
                                <div className="resume-role-row">
                                  <div>
                                    <strong>{item.jobTitle}</strong>
                                    <span>{item.company}</span>
                                  </div>
                                  {item.duration && <em>{item.duration}</em>}
                                </div>

                                {item.bullets.length > 0 && (
                                  <ul className="resume-bullets">
                                    {item.bullets.map((bullet, bulletIndex) => (
                                      <li key={`${item.id}-bullet-${bulletIndex}`}>
                                        {bullet.isOptimized ? <span className="is-optimized">{bullet.text}</span> : bullet.text}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </article>
                            ))}
                          </section>
                        )}

                        {resumeEducationEntries.length > 0 && (
                          <section className="resume-section">
                            <h3>Education</h3>
                            {resumeEducationEntries.map((item) => (
                              <article key={item.id} className="resume-inline-block">
                                <strong>{item.degree}</strong>
                                <p>
                                  {item.school}
                                  {item.year ? ` | ${item.year}` : ''}
                                </p>
                              </article>
                            ))}
                          </section>
                        )}

                        {resumeSkillGroups.length > 0 && (
                          <section className="resume-section">
                            <h3>Skills</h3>
                            <ul className="resume-bullets resume-bullets-compact">
                              {resumeSkillGroups.map((group, index) => (
                                <li key={index}>{group.join(', ')}</li>
                              ))}
                            </ul>
                            {resumeLanguages.length > 0 && (
                              <p className="resume-section-note">
                                <strong>Languages:</strong>{' '}
                                {resumeLanguages
                                  .map((item) => (item.proficiency ? `${item.name} (${item.proficiency})` : item.name))
                                  .join(', ')}
                              </p>
                            )}
                          </section>
                        )}

                        {resumeCertifications.length > 0 && (
                          <section className="resume-section">
                            <h3>Certifications</h3>
                            <ul className="resume-bullets resume-bullets-compact">
                              {resumeCertifications.map((item) => (
                                <li key={item.id}>
                                  {item.name}
                                  {[item.issuer, item.year].filter(Boolean).length
                                    ? ` | ${[item.issuer, item.year].filter(Boolean).join(' | ')}`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {showProjectsInResume && (
                          <section className="resume-section">
                            <h3>Projects</h3>
                            {resumeProjects.map((item) => (
                              <article key={item.id} className="resume-inline-block">
                                <strong>{item.name}</strong>
                                <p>{truncateText(item.description, 120)}</p>
                                {item.link && <span className="resume-link-line">{normalizeExternalUrl(item.link)}</span>}
                              </article>
                            ))}
                          </section>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </aside>
            </div>

          </div>
        </section>

        <section className="reviews-section" aria-labelledby="reviews-title">
          <div className="shell reviews-results-shell">
            <div className="reviews-results-header">
              <span className="reviews-results-kicker">Results</span>
              <h2 id="reviews-title">{hasPublishedReviews ? 'From quiet applications to interview offers' : 'ResuMay review results will appear here'}</h2>
              <p>
                {hasPublishedReviews
                  ? 'Job seekers who tailored their resume with keywords and got a clear job match score.'
                  : 'ResuMay! is new, so this section stays empty until real users export a resume and publish their review.'}
              </p>

              <div
                className="reviews-scoreline"
                aria-label={
                  hasPublishedReviews
                    ? `Average review rating ${averageReviewRating.toFixed(1)} from ${reviewCount} reviews`
                    : 'No published user reviews yet'
                }
              >
                {hasPublishedReviews && (
                  <div className="review-rating review-rating-summary" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <i key={`summary-star-${index}`} className={`bi ${getStarIcon(averageReviewRating, index)}`} />
                    ))}
                  </div>
                )}
                <strong>{hasPublishedReviews ? averageReviewRating.toFixed(1) : '0.0'}</strong>
                <span className="reviews-scoreline-divider">&middot;</span>
                <span>{hasPublishedReviews ? `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</span>
              </div>
            </div>
          </div>

          <div className="shell reviews-wall">
            {featuredResults.length ? (
              featuredResults.map((review) => (
                <article key={review.id} className="review-card review-result-card">
                  <div className="review-rating" aria-label={`${clampReviewRating(review.rating)} star review`}>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <i key={`${review.id}-star-${index}`} className={`bi ${getStarIcon(clampReviewRating(review.rating), index)}`} />
                    ))}
                  </div>

                  <p className="review-quote">"{review.quote}"</p>

                  <div className="review-result-card-footer">
                    <div className="review-identity">
                      <span className="review-avatar" aria-hidden="true">
                        {review.name.charAt(0)}
                      </span>
                      <div>
                        <strong>{review.name}</strong>
                        <p>{review.outcome}</p>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <article className="review-card review-empty-card">
                <span className="reviews-empty-kicker">No published reviews yet</span>
                <h3>Be the first ResuMay success story on this wall.</h3>
                <p>
                  Once a user finishes and exports a resume, they can submit a review and it will appear here immediately.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className="review-share-section" aria-labelledby="review-share-title">
          <div className="shell">
            <div className="section-heading review-share-heading">
              <span className="eyebrow">Publish your result</span>
              <h2 id="review-share-title">Share what changed after you used ResuMay!.</h2>
              <p>After export, publish a short review so other job seekers can see the role, the outcome, and the score lift.</p>
            </div>

            <div className="review-submission-grid">
              <section className="panel review-form-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">Publish your result</span>
                    <h3>Submit your ResuMay review</h3>
                  </div>
                  <span className={`panel-badge ${canSubmitReview ? 'panel-badge-success' : 'panel-badge-neutral'}`}>
                    {canSubmitReview ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <p className="review-form-copy">{reviewSubmissionHint}</p>

                <fieldset className="panel-fieldset" disabled={!canSubmitReview}>
                  <div className="field-grid field-grid-2">
                    <label className="field">
                      <span>Name</span>
                      <input
                        type="text"
                        id="reviewName"
                        name="reviewName"
                        value={reviewDraft.name}
                        onChange={(event) => updateReviewDraft('name', event.target.value)}
                        placeholder={personalInfo.name || 'Your name'}
                      />
                    </label>

                    <label className="field">
                      <span>Target role</span>
                      <input
                        type="text"
                        id="reviewRole"
                        name="reviewRole"
                        value={reviewDraft.role}
                        onChange={(event) => updateReviewDraft('role', event.target.value)}
                        placeholder={targetRole || 'Operations Coordinator'}
                      />
                    </label>
                  </div>

                  <div className="field-grid field-grid-3">
                    <label className="field">
                      <span>Job board</span>
                      <input
                        type="text"
                        id="reviewBoard"
                        name="reviewBoard"
                        value={reviewDraft.board}
                        onChange={(event) => updateReviewDraft('board', event.target.value)}
                        placeholder="LinkedIn, OnlineJobs.ph, JobStreet by SEEK"
                      />
                    </label>

                    <label className="field">
                      <span>Rating</span>
                      <select
                        id="reviewRating"
                        name="reviewRating"
                        value={reviewDraft.rating}
                        onChange={(event) => updateReviewDraft('rating', Number(event.target.value))}
                      >
                        <option value={5}>5 stars</option>
                        <option value={4}>4 stars</option>
                        <option value={3}>3 stars</option>
                        <option value={2}>2 stars</option>
                        <option value={1}>1 star</option>
                      </select>
                    </label>

                    <label className="field">
                      <span>Outcome</span>
                      <input
                        type="text"
                        id="reviewOutcome"
                        name="reviewOutcome"
                        value={reviewDraft.outcome}
                        onChange={(event) => updateReviewDraft('outcome', event.target.value)}
                        placeholder="e.g. 2 callbacks in one week"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Your review</span>
                    <textarea
                      className="guided-textarea"
                      id="reviewQuote"
                      name="reviewQuote"
                      rows={5}
                      value={reviewDraft.quote}
                      onChange={(event) => updateReviewDraft('quote', event.target.value)}
                      placeholder="Example:
ResuMay made it easier to see which keywords were missing, so I tightened my summary, cleaned up my bullets, and my resume started feeling more ATS-ready."
                    />
                  </label>

                  <div className="review-form-footer">
                    <div className="review-submission-note">
                      <strong>{analysis.beforeScore}% to {analysis.afterScore}%</strong>
                      <span>Your current ATS score delta will be attached to this review.</span>
                    </div>

                    <button type="button" className="primary-button" onClick={submitReview} disabled={!canSubmitReview}>
                      Publish my result
                    </button>
                  </div>
                </fieldset>
              </section>
            </div>
          </div>
        </section>

        <section id="faq" className="faq-section">
          <div className="shell">
            <div className="section-heading">
              <span className="eyebrow">Why ResuMay!</span>
              <h2>Built for real job applications, not generic resume polishing.</h2>
            </div>

            <div className="faq-grid">
              <article className="faq-card">
                <h3>Does this only work for tech resumes?</h3>
                <p>
                  No. ResuMay! works across admin, VA, support, sales, marketing, operations, creative, and technical roles
                  because the workflow starts from the job description, not a single template niche.
                </p>
              </article>
              <article className="faq-card">
                <h3>Which job boards is it built for?</h3>
                <p>
                  It is designed for applications sent through OnlineJobs.ph, Bossjob, HiringCafe, Kalibrr, LinkedIn,
                  JobStreet by SEEK, Upwork, Indeed, and similar online hiring platforms.
                </p>
              </article>
              <article className="faq-card">
                <h3>What does the match score help me see?</h3>
                <p>
                  The match score gives you a fast read on how much of the job description your current draft is covering, so
                  you can improve weak areas before sending the application.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="closing-cta">
          <div className="shell closing-card">
            <div>
              <span className="eyebrow">Ready to strengthen your next application?</span>
              <h2>Give every application a resume that feels targeted, credible, and easier to shortlist.</h2>
              <p>Paste the role, refine the content, and export the version you want recruiters to see.</p>
            </div>
            <button type="button" className="primary-button" onClick={scrollToStudio}>
              Start in the studio
            </button>
          </div>
        </section>

        <footer className="app-footer">
          <div className="shell">
            <p>Developed by FUMARDev - ResuMay! 2024</p>
          </div>
        </footer>

        <button type="button" className="mobile-score-dock" onClick={scrollToPreview} aria-label={`ATS score ${analysis.afterScore} percent. View output preview.`}>
          <span className="mobile-score-dock-label">ATS score</span>
          <strong>{analysis.afterScore}%</strong>
          <span className="mobile-score-dock-action">View preview</span>
        </button>
      </main>
    </div>
  )
}

export default App

