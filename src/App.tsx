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
  jobTitle: string
  company: string
  duration: string
  description: string
}

interface Education {
  degree: string
  school: string
  year: string
}

interface Project {
  name: string
  description: string
  link: string
}

interface Certification {
  name: string
  issuer: string
  year: string
}

interface Language {
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

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead'
type SummaryTone = 'balanced' | 'strategic' | 'technical' | 'concise'

interface AnalysisResult {
  trackedKeywords: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  beforeScore: number
  afterScore: number
  optimizedSummary: string
  optimizedExperience: string[][]
  fitNote: string
  checklist: { label: string; passed: boolean }[]
}

const STORAGE_KEY = 'resumeMayOptimizerData'

const defaultPersonalInfo: PersonalInfo = {
  name: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  website: '',
  summary: ''
}

const emptyExperience: Experience = { jobTitle: '', company: '', duration: '', description: '' }
const emptyEducation: Education = { degree: '', school: '', year: '' }
const emptyProject: Project = { name: '', description: '', link: '' }
const emptyCertification: Certification = { name: '', issuer: '', year: '' }
const emptyLanguage: Language = { name: '', proficiency: '' }

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
    logoSrc: '/job-boards/onlinejobs-wordmark.png',
    logoType: 'wordmark'
  },
  {
    id: 'bossjob',
    name: 'Bossjob',
    logoSrc: '/job-boards/bossjob-wordmark.svg',
    logoType: 'wordmark'
  },
  {
    id: 'hiringcafe',
    name: 'HiringCafe',
    logoSrc: '/job-boards/hiringcafe-mark.png',
    logoType: 'mark'
  },
  {
    id: 'kalibrr',
    name: 'Kalibrr',
    logoSrc: '/job-boards/kalibrr-wordmark.png',
    logoType: 'wordmark'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    logoSrc: '/job-boards/linkedin-wordmark.svg',
    logoType: 'wordmark'
  },
  {
    id: 'jobstreet',
    name: 'JobStreet by SEEK',
    logoSrc: '/job-boards/jobstreet-wordmark.svg',
    logoType: 'wordmark',
    logoClassName: 'job-board-logo-jobstreet'
  },
  {
    id: 'upwork',
    name: 'Upwork',
    logoSrc: '/job-boards/upwork-wordmark.svg',
    logoType: 'wordmark'
  },
  {
    id: 'indeed',
    name: 'Indeed',
    logoSrc: '/job-boards/indeed-mark.png',
    logoType: 'mark'
  }
]

const roleCoverage = ['Virtual Assistant', 'Admin & Ops', 'Customer Support', 'Sales', 'Marketing', 'Design', 'Engineering']

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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
    .replace(/,\s*(with explicit emphasis on|to reinforce|while signaling stronger|and made)\b.*$/i, '')
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

function createSummary(
  targetRole: string,
  summaryTone: SummaryTone,
  experienceLevel: ExperienceLevel,
  skills: string[],
  matchedKeywords: string[],
  missingKeywords: string[]
) {
  const spotlightTerms = cleanTextArray([
    ...skills.slice(0, 3),
    ...matchedKeywords.slice(0, 2).map(toDisplayKeyword),
    ...missingKeywords.slice(0, 2).map(toDisplayKeyword)
  ]).slice(0, 4)

  const spotlightText = spotlightTerms.length ? spotlightTerms.join(', ') : 'clear business impact'
  const roleText = targetRole || 'target role'

  return `${toDisplayKeyword(roleText)} candidate with ${experienceLabels[experienceLevel]} judgment and a ${toneLabels[summaryTone]} voice. Shapes resume content around ${spotlightText} so hiring teams quickly see aligned strengths, delivery range, and ATS-ready language.`
}

function createOptimizedBullet(statement: string, keyword: string, index: number, targetRole: string) {
  const cleaned = statement
    .replace(/^(responsible for|worked on|tasked with|helped with)\s+/i, '')
    .replace(/\.$/, '')
    .trim()

  const hasActionVerb = actionVerbs.some((verb) => cleaned.toLowerCase().startsWith(verb.toLowerCase()))
  const starter = actionVerbs[index % actionVerbs.length]
  const body = cleaned
    ? hasActionVerb
      ? cleaned
      : `${starter} ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`
    : `${starter} work aligned to ${targetRole || 'the target role'} priorities`

  const suffixes = [
    `with explicit emphasis on ${toDisplayKeyword(keyword)}.`,
    `to reinforce ${toDisplayKeyword(keyword)} in ATS screening.`,
    `while signaling stronger ${toDisplayKeyword(keyword)} coverage.`,
    `and made ${toDisplayKeyword(keyword)} easier for recruiters to spot.`
  ]

  return `${body}, ${suffixes[index % suffixes.length]}`
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
  const optimizedSummary = createSummary(targetRole, summaryTone, experienceLevel, skills, matchedKeywords, missingKeywords)
  const optimizedExperience = experience.map((item, index) => {
    const statements = splitIntoStatements(item.description)
    const keywordPool = [...missingKeywords, ...matchedKeywords]

    if (!statements.length) {
      return keywordPool.slice(index, index + 2).map((keyword, keywordIndex) =>
        createOptimizedBullet('', keyword, index + keywordIndex, targetRole)
      )
    }

    return statements.slice(0, 3).map((statement, statementIndex) => {
      const keyword = keywordPool[(index + statementIndex) % Math.max(keywordPool.length, 1)] ?? targetRole ?? 'core skills'
      return createOptimizedBullet(statement, keyword, index + statementIndex, targetRole)
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

  const checklist = [
    { label: 'Target role is defined', passed: Boolean(targetRole.trim()) },
    { label: 'Job description added', passed: Boolean(jobDescription.trim()) },
    { label: 'Keyword coverage is strong', passed: optimizedCoverageRatio >= 0.55 || trackedKeywords.length === 0 },
    { label: 'Summary is ATS-focused', passed: optimizedSummary.length >= 120 }
  ]

  const fitNote = trackedKeywords.length
    ? `ResuMay! found ${matchedKeywords.length} of ${trackedKeywords.length} target signals already present. Bring in ${missingKeywords.slice(0, 3).map(toDisplayKeyword).join(', ') || 'missing priorities'} to make the story tighter.`
    : 'Paste a job description to unlock keyword tracking, fit scoring, and stronger ATS guidance.'

  return {
    trackedKeywords,
    matchedKeywords: optimizedMatchedKeywords,
    missingKeywords: trackedKeywords.filter((keyword) => !optimizedMatchedKeywords.includes(keyword)),
    beforeScore,
    afterScore,
    optimizedSummary,
    optimizedExperience,
    fitNote,
    checklist
  }
}

function App() {
  const studioRef = useRef<HTMLElement | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const scrollTimeoutRef = useRef<number | null>(null)
  const jobBoardSequenceRef = useRef<HTMLDivElement | null>(null)

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(defaultPersonalInfo)
  const [targetRole, setTargetRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid')
  const [summaryTone, setSummaryTone] = useState<SummaryTone>('balanced')
  const [experience, setExperience] = useState<Experience[]>([{ ...emptyExperience }])
  const [education, setEducation] = useState<Education[]>([{ ...emptyEducation }])
  const [skills, setSkills] = useState<string[]>([])
  const [projects, setProjects] = useState<Project[]>([{ ...emptyProject }])
  const [certifications, setCertifications] = useState<Certification[]>([{ ...emptyCertification }])
  const [languages, setLanguages] = useState<Language[]>([{ ...emptyLanguage }])
  const [pendingSkill, setPendingSkill] = useState('')
  const [applyOptimization, setApplyOptimization] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [jobBoardLoopWidth, setJobBoardLoopWidth] = useState(0)

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
            ? data.experience.map((item: Experience) => ({ ...emptyExperience, ...item }))
            : [{ ...emptyExperience }]
        )
        setEducation(
          Array.isArray(data.education) && data.education.length
            ? data.education.map((item: Education) => ({ ...emptyEducation, ...item }))
            : [{ ...emptyEducation }]
        )
        setSkills(Array.isArray(data.skills) ? cleanTextArray(data.skills) : [])
        setProjects(
          Array.isArray(data.projects) && data.projects.length
            ? data.projects.map((item: Project) => ({ ...emptyProject, ...item }))
            : [{ ...emptyProject }]
        )
        setCertifications(
          Array.isArray(data.certifications) && data.certifications.length
            ? data.certifications.map((item: Certification) => ({ ...emptyCertification, ...item }))
            : [{ ...emptyCertification }]
        )
        setLanguages(
          Array.isArray(data.languages) && data.languages.length
            ? data.languages.map((item: Language) => ({ ...emptyLanguage, ...item }))
            : [{ ...emptyLanguage }]
        )
        setApplyOptimization(data.applyOptimization ?? true)
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

      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current)
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

  const previewSummary = applyOptimization && analysis.optimizedSummary ? analysis.optimizedSummary : personalInfo.summary
  const previewExperience = experience.map((item, index) =>
    applyOptimization ? analysis.optimizedExperience[index] ?? [] : splitIntoStatements(item.description).slice(0, 3)
  )
  const resumeHeadline = cleanTextArray([targetRole, ...skills.slice(0, 3)]).slice(0, 4).join(' | ')
  const resumeContactLine = [personalInfo.address, personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.website]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' | ')
  const resumeSummary = condenseResumeSummary(personalInfo.summary.trim() || previewSummary)
  const resumeSkills = cleanTextArray(skills).slice(0, 10)
  const resumeExperienceEntries = experience
    .map((item, index) => ({
      ...item,
      bullets: (previewExperience[index]?.length ? previewExperience[index] : splitIntoStatements(item.description))
        .map(condenseResumeBullet)
        .filter(Boolean)
        .slice(0, 3)
    }))
    .filter((item) => item.jobTitle.trim() || item.company.trim())
    .slice(0, 3)
  const resumeEducationEntries = education.filter((item) => item.degree.trim() || item.school.trim()).slice(0, 2)
  const resumeSkillGroups = [resumeSkills.slice(0, 5), resumeSkills.slice(5)].filter((group) => group.length)
  const resumeCertifications = certifications.filter((item) => item.name.trim()).slice(0, 4)
  const resumeProjects = projects.filter((item) => item.name.trim()).slice(0, 2)
  const resumeLanguages = languages.filter((item) => item.name.trim()).slice(0, 3)
  const showProjectsInResume = resumeProjects.length > 0 && resumeExperienceEntries.length <= 1
  const hasResumeCore = Boolean(personalInfo.name.trim() && (personalInfo.summary.trim() || experience.some((item) => item.jobTitle.trim())))

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

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    setProjects(cleanedProjects.length ? cleanedProjects : [{ ...emptyProject }])
    setCertifications(cleanedCertifications.length ? cleanedCertifications : [{ ...emptyCertification }])
    setLanguages(cleanedLanguages.length ? cleanedLanguages : [{ ...emptyLanguage }])

    try {
      localStorage.setItem(STORAGE_KEY, workspaceSnapshot)
      showToast('Workspace saved on this device.')
    } catch {
      showToast('Workspace could not be saved on this device.')
    }
  }

  const loadSample = () => {
    setTargetRole(sampleData.targetRole)
    setJobDescription(sampleData.jobDescription)
    setExperienceLevel(sampleData.experienceLevel)
    setSummaryTone(sampleData.summaryTone)
    setApplyOptimization(sampleData.applyOptimization)
    setPersonalInfo(sampleData.personalInfo)
    setExperience(sampleData.experience)
    setEducation(sampleData.education)
    setSkills(sampleData.skills)
    setProjects(sampleData.projects)
    setCertifications(sampleData.certifications)
    setLanguages(sampleData.languages)
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
    setPersonalInfo(defaultPersonalInfo)
    setTargetRole('')
    setJobDescription('')
    setExperienceLevel('mid')
    setSummaryTone('balanced')
    setExperience([{ ...emptyExperience }])
    setEducation([{ ...emptyEducation }])
    setSkills([])
    setProjects([{ ...emptyProject }])
    setCertifications([{ ...emptyCertification }])
    setLanguages([{ ...emptyLanguage }])
    setPendingSkill('')
    setApplyOptimization(true)

    try {
      localStorage.removeItem(STORAGE_KEY)
      showToast('Workspace cleared.')
    } catch {
      showToast('Workspace cleared, but local storage could not be updated.')
    }
  }

  const generatePDF = async () => {
    const input = document.getElementById('resume-preview')

    if (!input) {
      showToast('Resume preview is not ready for export yet.')
      return
    }

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: '#fffdf8',
        useCORS: true
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 8
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2
      const widthScale = usableWidth / canvas.width
      const heightScale = usableHeight / canvas.height
      const fitScale = Math.min(widthScale, heightScale)
      const renderedWidth = canvas.width * fitScale
      const renderedHeight = canvas.height * fitScale
      const horizontalOffset = (pageWidth - renderedWidth) / 2

      pdf.addImage(imgData, 'PNG', horizontalOffset, margin, renderedWidth, renderedHeight)

      pdf.save('resumay-ats-resume.pdf')
      showToast('ATS resume exported as a single-page PDF.')
    } catch {
      showToast('PDF export failed. Please try again.')
    }
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

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

  const promoteKeywordToSkills = (keyword: string) => {
    if (skills.some((item) => item.toLowerCase() === keyword.toLowerCase())) {
      return
    }

    setSkills((current) => [...current, toDisplayKeyword(keyword)])
  }

  const updateArrayItem = <T,>(items: T[], setter: Dispatch<SetStateAction<T[]>>, index: number, field: keyof T, value: string) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setter(next)
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
            <img src="/resumay-logo.png" alt="ResuMay!" className="brand-logo" />
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
                <span className="eyebrow">Built for job seekers who need stronger callbacks.</span>
                <h1>You are qualified. ResuMay! helps your resume prove it.</h1>
                <p className="hero-lead">
                  Tailor your resume to each role, see how closely your draft matches the job before you apply, and build a
                  stronger application for real hiring pipelines across modern online job boards.
                </p>

                <div className="hero-actions">
                  <button type="button" className="primary-button" onClick={scrollToStudio}>
                    Start tailoring
                  </button>
                  <button type="button" className="secondary-button" onClick={loadSample}>
                    View sample flow
                  </button>
                </div>

                <div className="hero-chips" aria-label="Role coverage">
                  {roleCoverage.map((role) => (
                    <span key={role} className="chip">
                      {role}
                    </span>
                  ))}
                </div>

                <div className="hero-stats">
                  <div className="stat-card">
                    <strong>Role-targeted</strong>
                    <span>Tailor one resume to specific openings without rebuilding everything from scratch.</span>
                  </div>
                  <div className="stat-card">
                    <strong>{analysis.afterScore || 82}/100</strong>
                    <span>See how much of the job description your optimized draft is covering before you apply.</span>
                  </div>
                  <div className="stat-card">
                    <strong>Export-ready</strong>
                    <span>Finish with a polished PDF designed to travel better across recruiters, ATS tools, and job boards.</span>
                  </div>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-card hero-card-score">
                  <div className="hero-card-header">
                    <span>Target match snapshot</span>
                    <span className="status-pill status-pill-live">Live</span>
                  </div>
                  <div className="score-pair">
                    <div>
                      <small>Current</small>
                      <strong>{hasResumeCore ? analysis.beforeScore : 48}</strong>
                    </div>
                    <div className="score-arrow">
                      <i className="bi bi-arrow-right" />
                    </div>
                    <div>
                      <small>Optimized</small>
                      <strong>{hasResumeCore ? analysis.afterScore : 84}</strong>
                    </div>
                  </div>
                  <div className="score-track">
                    <span className="score-bar score-bar-before" style={{ width: `${hasResumeCore ? analysis.beforeScore : 48}%` }} />
                  </div>
                  <div className="score-track score-track-success">
                    <span className="score-bar score-bar-after" style={{ width: `${hasResumeCore ? analysis.afterScore : 84}%` }} />
                  </div>
                </div>

                <div className="hero-card hero-card-sheet">
                  <div className="resume-mini-sheet">
                    <div className="resume-mini-header">
                      <div>
                        <h2>{personalInfo.name || 'Jordan Rivera'}</h2>
                        <p>{targetRole || 'Operations Coordinator'}</p>
                      </div>
                      <span className="mini-badge mini-badge-success">ATS optimized</span>
                    </div>

                    <div className="resume-mini-section">
                      <span>Matched keywords</span>
                      <div className="mini-chip-row">
                        {(analysis.matchedKeywords.length ? analysis.matchedKeywords : ['documentation', 'scheduling', 'stakeholder management'])
                          .slice(0, 4)
                          .map((keyword) => (
                            <span key={keyword} className="mini-chip">
                              {toDisplayKeyword(keyword)}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="resume-mini-section">
                      <span>What changes</span>
                      <ul>
                        <li>Sharper role-specific summary</li>
                        <li>Stronger job-description keywords</li>
                        <li>Cleaner recruiter-facing structure</li>
                      </ul>
                    </div>
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
          <div className="shell proof-row">
            <div className="proof-card">
              <i className="bi bi-bullseye" />
              <div>
                <strong>More aligned applications</strong>
                <p>See the role gaps before you apply so you can send a resume that feels sharper and more intentional.</p>
              </div>
            </div>
            <div className="proof-card">
              <i className="bi bi-stars" />
              <div>
                <strong>Higher conversion signals</strong>
                <p>Use job-match scoring, keyword guidance, and stronger resume language in one focused workflow.</p>
              </div>
            </div>
            <div className="proof-card">
              <i className="bi bi-briefcase" />
              <div>
                <strong>Open to many job types</strong>
                <p>Useful for virtual assistants, admin, support, sales, marketing, operations, creative, and technical roles.</p>
              </div>
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
                Start with the target role, shape the content around the job description, and export a cleaner PDF you can
                send to real employers with more confidence.
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

            <div className="studio-grid">
              <div className="studio-form-column">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Step 1</span>
                      <h3>Targeting brief</h3>
                    </div>
                    <span className="panel-badge panel-badge-neutral">ATS engine</span>
                  </div>

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

                    <label className="switch-card">
                      <div>
                        <strong>Apply optimized content</strong>
                        <p>Preview the ATS-refined summary and bullets instead of the raw draft.</p>
                      </div>
                      <input
                        type="checkbox"
                        id="applyOptimization"
                        name="applyOptimization"
                        checked={applyOptimization}
                        onChange={(event) => setApplyOptimization(event.target.checked)}
                        aria-label="Apply optimized content"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Job description</span>
                    <textarea
                      id="jobDescription"
                      name="jobDescription"
                      rows={7}
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      placeholder="Paste the full job description to unlock keyword matching, fit scoring, and ATS suggestions."
                    />
                  </label>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Step 2</span>
                      <h3>Resume basics</h3>
                    </div>
                  </div>

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
                      id="personalSummary"
                      name="personalSummary"
                      rows={5}
                      value={personalInfo.summary}
                      onChange={(event) => setPersonalInfo({ ...personalInfo, summary: event.target.value })}
                      placeholder="Write the version you would normally use. ResuMay! will suggest a tighter ATS-ready version."
                    />
                  </label>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Step 3</span>
                      <h3>Experience</h3>
                    </div>
                    <button type="button" className="text-button" onClick={() => addArrayItem(setExperience, { ...emptyExperience })}>
                      <i className="bi bi-plus-circle" /> Add role
                    </button>
                  </div>

                  {experience.map((item, index) => (
                    <div key={`${item.jobTitle}-${index}`} className="repeat-card">
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
                            onChange={(event) => updateArrayItem(experience, setExperience, index, 'jobTitle', event.target.value)}
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
                            onChange={(event) => updateArrayItem(experience, setExperience, index, 'company', event.target.value)}
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
                          onChange={(event) => updateArrayItem(experience, setExperience, index, 'duration', event.target.value)}
                          placeholder="2022 - Present"
                        />
                      </label>

                      <label className="field">
                        <span>What did you do?</span>
                        <textarea
                          id={`experience_description_${index}`}
                          name={`experience_description_${index}`}
                          rows={4}
                          value={item.description}
                          onChange={(event) => updateArrayItem(experience, setExperience, index, 'description', event.target.value)}
                          placeholder="Add 2-4 sentences or bullet-style notes. ResuMay! will tighten them for ATS readability."
                        />
                      </label>
                    </div>
                  ))}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Step 4</span>
                      <h3>Skills and keyword coverage</h3>
                    </div>
                  </div>

                  <div className="skill-entry">
                    <input
                      type="text"
                      id="pendingSkill"
                      name="pendingSkill"
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
                    <button type="button" className="primary-button compact-button" onClick={addSkill}>
                      Add
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
                          <button key={keyword} type="button" className="tag-chip suggestion-chip" onClick={() => promoteKeywordToSkills(keyword)}>
                            + {toDisplayKeyword(keyword)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Supporting sections</span>
                      <h3>Education and projects</h3>
                    </div>
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Education</strong>
                      <button type="button" className="text-button" onClick={() => addArrayItem(setEducation, { ...emptyEducation })}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {education.map((item, index) => (
                      <div key={`${item.degree}-${index}`} className="repeat-card compact-repeat-card">
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
                              onChange={(event) => updateArrayItem(education, setEducation, index, 'degree', event.target.value)}
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
                              onChange={(event) => updateArrayItem(education, setEducation, index, 'year', event.target.value)}
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
                            onChange={(event) => updateArrayItem(education, setEducation, index, 'school', event.target.value)}
                            placeholder="UP / DLSU / Ateneo / UST"
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Projects</strong>
                      <button type="button" className="text-button" onClick={() => addArrayItem(setProjects, { ...emptyProject })}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {projects.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="repeat-card compact-repeat-card">
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
                            onChange={(event) => updateArrayItem(projects, setProjects, index, 'name', event.target.value)}
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
                            onChange={(event) => updateArrayItem(projects, setProjects, index, 'description', event.target.value)}
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
                            onChange={(event) => updateArrayItem(projects, setProjects, index, 'link', event.target.value)}
                            placeholder="https://github.com/..."
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Optional credibility boosts</span>
                      <h3>Certifications and languages</h3>
                    </div>
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Certifications</strong>
                      <button type="button" className="text-button" onClick={() => addArrayItem(setCertifications, { ...emptyCertification })}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {certifications.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="repeat-card compact-repeat-card">
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
                              onChange={(event) => updateArrayItem(certifications, setCertifications, index, 'name', event.target.value)}
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
                              onChange={(event) => updateArrayItem(certifications, setCertifications, index, 'year', event.target.value)}
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
                            onChange={(event) => updateArrayItem(certifications, setCertifications, index, 'issuer', event.target.value)}
                            placeholder="Issuer"
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="subpanel">
                    <div className="subpanel-heading">
                      <strong>Languages</strong>
                      <button type="button" className="text-button" onClick={() => addArrayItem(setLanguages, { ...emptyLanguage })}>
                        <i className="bi bi-plus-circle" /> Add
                      </button>
                    </div>

                    {languages.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="repeat-card compact-repeat-card">
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
                              onChange={(event) => updateArrayItem(languages, setLanguages, index, 'name', event.target.value)}
                              placeholder="Tagalog / Bisaya / Ilokano"
                            />
                          </label>

                          <label className="field">
                            <span>Proficiency</span>
                            <select
                              id={`language_proficiency_${index}`}
                              name={`language_proficiency_${index}`}
                              value={item.proficiency}
                              onChange={(event) => updateArrayItem(languages, setLanguages, index, 'proficiency', event.target.value)}
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
                </section>
              </div>

              <aside className="studio-side-column">
                <div className="sticky-stack">
                  <section className="panel panel-contrast">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">Live ATS score</span>
                        <h3>{analysis.afterScore}/100 projected match</h3>
                      </div>
                      <span className="panel-badge panel-badge-success">ATS optimized</span>
                    </div>

                    <p className="panel-description">{analysis.fitNote}</p>

                    <div className="score-meter-group">
                      <div className="meter-row">
                        <div className="meter-copy">
                          <span>Current draft</span>
                          <strong>{analysis.beforeScore}</strong>
                        </div>
                        <div className="meter">
                          <span className="meter-fill meter-fill-before" style={{ width: `${analysis.beforeScore}%` }} />
                        </div>
                      </div>

                      <div className="meter-row">
                        <div className="meter-copy">
                          <span>Optimized draft</span>
                          <strong>{analysis.afterScore}</strong>
                        </div>
                        <div className="meter">
                          <span className="meter-fill meter-fill-after" style={{ width: `${analysis.afterScore}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="checklist">
                      {analysis.checklist.map((item) => (
                        <div key={item.label} className={`check-item ${item.passed ? 'check-item-pass' : ''}`}>
                          <i className={`bi ${item.passed ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">Keyword visibility</span>
                        <h3>Matched and missing signals</h3>
                      </div>
                    </div>

                    <div className="keyword-panel">
                      <div>
                        <strong>Matched</strong>
                        <div className="keyword-cluster">
                          {analysis.matchedKeywords.length ? (
                            analysis.matchedKeywords.map((keyword) => (
                              <span key={keyword} className="tag-chip tag-chip-solid">
                                {toDisplayKeyword(keyword)}
                              </span>
                            ))
                          ) : (
                            <p className="empty-note">Add a job description to start tracking matches.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <strong>Still missing</strong>
                        <div className="keyword-cluster">
                          {analysis.missingKeywords.length ? (
                            analysis.missingKeywords.map((keyword) => (
                              <button key={keyword} type="button" className="tag-chip suggestion-chip" onClick={() => promoteKeywordToSkills(keyword)}>
                                + {toDisplayKeyword(keyword)}
                              </button>
                            ))
                          ) : (
                            <p className="empty-note">The optimized draft already covers the strongest signals we tracked.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">Suggested summary</span>
                        <h3>ATS-ready opener</h3>
                      </div>
                    </div>

                    <p className="suggestion-copy">{analysis.optimizedSummary}</p>
                  </section>

                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">Refined experience bullets</span>
                        <h3>Stronger recruiter language</h3>
                      </div>
                    </div>

                    <div className="suggestion-stack">
                      {analysis.optimizedExperience.some((group) => group.length) ? (
                        analysis.optimizedExperience.map((group, index) =>
                          group.length ? (
                            <div key={`optimized-${index}`} className="suggestion-card">
                              <strong>{experience[index]?.jobTitle || `Role ${index + 1}`}</strong>
                              <ul>
                                {group.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null
                        )
                      ) : (
                        <p className="empty-note">Add experience details and ResuMay! will rewrite them into clearer ATS bullets.</p>
                      )}
                    </div>
                  </section>

                  <section className="panel resume-panel">
                    <div className="resume-panel-topbar">
                      <div>
                        <span className="panel-kicker">Output preview</span>
                        <h3>Optimized resume sheet</h3>
                      </div>

                      <div className="resume-actions">
                        <button type="button" className="ghost-button compact-button" onClick={saveWorkspace}>
                          Save locally
                        </button>
                        <button type="button" className="primary-button compact-button" onClick={generatePDF} disabled={!hasResumeCore}>
                          Export PDF
                        </button>
                      </div>
                    </div>

                    <div className="resume-workspace">
                      <div id="resume-preview" className="resume-sheet">
                        <header className="resume-header">
                          <h2>{personalInfo.name || 'Your Name'}</h2>
                          <p className="resume-role">{resumeHeadline || targetRole || 'Target Role'}</p>
                          {resumeContactLine && <p className="resume-contact-line">{resumeContactLine}</p>}
                        </header>

                      {resumeSummary && (
                        <section className="resume-section">
                          <h3>Professional Summary</h3>
                          <p className="resume-section-copy">{resumeSummary}</p>
                        </section>
                      )}

                      {resumeExperienceEntries.length > 0 && (
                        <section className="resume-section">
                          <h3>Work Experience</h3>
                          {resumeExperienceEntries.map((item, index) => (
                            <article key={`${item.jobTitle}-${index}`} className="resume-role-block">
                              <div className="resume-role-row">
                                <div>
                                  <strong>{item.jobTitle}</strong>
                                  <span>{item.company}</span>
                                </div>
                                {item.duration && <em>{item.duration}</em>}
                              </div>

                              {item.bullets.length > 0 && (
                                <ul className="resume-bullets">
                                  {item.bullets.map((bullet) => (
                                    <li key={bullet}>{bullet}</li>
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
                          {resumeEducationEntries.map((item, index) => (
                            <article key={`${item.degree}-${index}`} className="resume-inline-block">
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
                            {resumeCertifications.map((item, index) => (
                              <li key={`${item.name}-${index}`}>
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
                          {resumeProjects.map((item, index) => (
                            <article key={`${item.name}-${index}`} className="resume-inline-block">
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
      </main>
    </div>
  )
}

export default App

