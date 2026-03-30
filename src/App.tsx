import { useEffect, useRef, useState } from 'react'
import './App.css'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

const STORAGE_KEY = 'resumeForgeOptimizerData'

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
  targetRole: 'Senior Frontend Engineer',
  jobDescription:
    'We are hiring a Senior Frontend Engineer to lead React and TypeScript development for our customer platform. You will partner cross-functionally with product, design, and backend teams to build accessible interfaces, improve frontend architecture, optimize performance, and mentor engineers. Experience with component libraries, API integration, analytics, testing, and responsive design is strongly preferred.',
  experienceLevel: 'senior' as ExperienceLevel,
  summaryTone: 'technical' as SummaryTone,
  applyOptimization: true,
  personalInfo: {
    name: 'Jordan Rivera',
    email: 'jordan.rivera@example.com',
    phone: '+1 (555) 214-8801',
    address: 'Austin, TX',
    linkedin: 'linkedin.com/in/jordanrivera',
    website: 'jordancodes.dev',
    summary:
      'Frontend engineer with experience shipping product interfaces for SaaS teams. Strong in React, TypeScript, collaboration, and turning messy requirements into polished customer experiences.'
  },
  experience: [
    {
      jobTitle: 'Senior Frontend Engineer',
      company: 'Northstar Cloud',
      duration: '2022 - Present',
      description:
        'Built reusable React components for a customer portal. Worked closely with product and design to launch new dashboard experiences. Improved performance across several high-traffic pages.'
    },
    {
      jobTitle: 'Frontend Engineer',
      company: 'Beacon Labs',
      duration: '2019 - 2022',
      description:
        'Maintained TypeScript interfaces for internal tools and marketing pages. Integrated APIs for customer data workflows. Supported QA fixes and collaborated across engineering and support teams.'
    }
  ],
  education: [{ degree: 'B.S. Computer Science', school: 'University of Texas', year: '2019' }],
  skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Design Systems', 'API Integration', 'Accessibility'],
  projects: [
    {
      name: 'Analytics Workspace',
      description:
        'Designed and shipped a self-serve analytics workspace with reusable charts, filters, and export workflows.',
      link: 'https://github.com/example/analytics-workspace'
    }
  ],
  certifications: [{ name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', year: '2023' }],
  languages: [{ name: 'Spanish', proficiency: 'Professional' }]
}

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
    .split(/\n|•|;|\.(?!\d)/)
    .map((line) => line.replace(/^[\-\u2022]\s*/, '').trim())
    .filter(Boolean)
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
    ? `ResumeForge found ${matchedKeywords.length} of ${trackedKeywords.length} target signals already present. Bring in ${missingKeywords.slice(0, 3).map(toDisplayKeyword).join(', ') || 'missing priorities'} to make the story tighter.`
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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return
    }

    try {
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
    } catch {
      setFeedback('Saved data could not be restored. Starting with a fresh workspace.')
      setTimeout(() => setFeedback(''), 3000)
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
  const hasResumeCore = Boolean(personalInfo.name.trim() && (personalInfo.summary.trim() || experience.some((item) => item.jobTitle.trim())))

  const showToast = (message: string) => {
    setFeedback(message)
    setTimeout(() => setFeedback(''), 3000)
  }

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const saveWorkspace = () => {
    const cleanedSkills = cleanTextArray(skills)
    const cleanedProjects = cleanObjectArray(projects, (item) => `${item.name}|${item.description}|${item.link}`)
    const cleanedCertifications = cleanObjectArray(certifications, (item) => `${item.name}|${item.issuer}|${item.year}`)
    const cleanedLanguages = cleanObjectArray(languages, (item) => `${item.name}|${item.proficiency}`)

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
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
    )

    setSkills(cleanedSkills)
    setProjects(cleanedProjects.length ? cleanedProjects : [{ ...emptyProject }])
    setCertifications(cleanedCertifications.length ? cleanedCertifications : [{ ...emptyCertification }])
    setLanguages(cleanedLanguages.length ? cleanedLanguages : [{ ...emptyLanguage }])
    showToast('Workspace saved on this device.')
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
    setTimeout(scrollToStudio, 100)
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
    localStorage.removeItem(STORAGE_KEY)
    showToast('Workspace cleared.')
  }

  const generatePDF = async () => {
    const input = document.getElementById('resume-preview')

    if (!input) {
      return
    }

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
    const renderedHeight = (canvas.height * usableWidth) / canvas.width
    let heightLeft = renderedHeight
    let position = margin

    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, renderedHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = heightLeft - renderedHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, renderedHeight)
      heightLeft -= pageHeight - margin * 2
    }

    pdf.save('resume-forge-ats-resume.pdf')
    showToast('ATS resume exported as PDF.')
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

  const updateArrayItem = <T,>(items: T[], setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, field: keyof T, value: string) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setter(next)
  }

  const addArrayItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, item: T) => {
    setter((current) => [...current, item])
  }

  const removeArrayItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number) => {
    setter((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current))
  }

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="topbar">
        <div className="shell">
          <div className="brand-lockup">
            <div className="brand-mark">RF</div>
            <div>
              <p className="brand-name">ResumeForge</p>
              <p className="brand-subtitle">ATS-first resume optimization studio</p>
            </div>
          </div>

          <nav className="topbar-links" aria-label="Primary">
            <a href="#how-it-works">How it works</a>
            <a href="#studio">Studio</a>
            <a href="#faq">FAQ</a>
          </nav>

          <button type="button" className="ghost-button topbar-button" onClick={scrollToStudio}>
            Optimize free
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Free ATS targeting. No account. No credits.</span>
              <h1>Build a resume that actually mirrors the job you want.</h1>
              <p className="hero-lead">
                ResumeForge combines a full resume builder with ATS keyword guidance, stronger summary suggestions, and refined
                experience bullets so your resume reads cleaner for both recruiters and scanners.
              </p>

              <div className="hero-actions">
                <button type="button" className="primary-button" onClick={scrollToStudio}>
                  Start optimizing
                </button>
                <button type="button" className="secondary-button" onClick={loadSample}>
                  Load sample flow
                </button>
              </div>

              <div className="hero-chips" aria-label="Product highlights">
                <span className="chip">Job description matching</span>
                <span className="chip">Live ATS preview</span>
                <span className="chip">Local-only save</span>
                <span className="chip">PDF export</span>
              </div>

              <div className="hero-stats">
                <div className="stat-card">
                  <strong>3-in-1</strong>
                  <span>Builder, optimizer, and export preview in one screen.</span>
                </div>
                <div className="stat-card">
                  <strong>{analysis.afterScore || 82}/100</strong>
                  <span>Projected ATS fit once optimized content is applied.</span>
                </div>
                <div className="stat-card">
                  <strong>0 friction</strong>
                  <span>Free to use, no signup wall, no credit packs, no gated downloads.</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-card hero-card-score">
                <div className="hero-card-header">
                  <span>Target match snapshot</span>
                  <span className="status-pill">Live</span>
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
                      <p>{targetRole || 'Senior Frontend Engineer'}</p>
                    </div>
                    <span className="mini-badge">ATS preview</span>
                  </div>

                  <div className="resume-mini-section">
                    <span>Matched keywords</span>
                    <div className="mini-chip-row">
                      {(analysis.matchedKeywords.length ? analysis.matchedKeywords : ['react', 'typescript', 'accessibility'])
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
                      <li>Sharper target-role summary</li>
                      <li>Keyword-aware bullet refinement</li>
                      <li>Cleaner recruiter-facing structure</li>
                    </ul>
                  </div>
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
                <strong>Job-targeted, not generic</strong>
                <p>Start with the role and job description so the resume adapts around the hiring signal.</p>
              </div>
            </div>
            <div className="proof-card">
              <i className="bi bi-stars" />
              <div>
                <strong>Guided optimization</strong>
                <p>See matched keywords, gaps, summary upgrades, and stronger bullet language without leaving the builder.</p>
              </div>
            </div>
            <div className="proof-card">
              <i className="bi bi-unlock" />
              <div>
                <strong>Still free and no-login</strong>
                <p>Your workflow stays fast: save locally, keep editing, and export without credit walls.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="story-section">
          <div className="shell story-grid">
            <div className="section-heading">
              <span className="eyebrow">How ResumeForge works</span>
              <h2>A FixResume-style flow, but built around your own free builder.</h2>
              <p>
                We kept the high-conviction product structure users expect from an ATS optimizer, then layered your editable
                resume workspace underneath it.
              </p>
            </div>

            <div className="story-cards">
              <article className="story-card">
                <span className="story-step">01</span>
                <h3>Target the role first</h3>
                <p>Paste the job description, define your target role, and choose the tone of the resume you want to send.</p>
              </article>
              <article className="story-card">
                <span className="story-step">02</span>
                <h3>Shape the resume around it</h3>
                <p>Update your summary, experience, and skills while ResumeForge surfaces stronger ATS language and gaps.</p>
              </article>
              <article className="story-card">
                <span className="story-step">03</span>
                <h3>Export the optimized version</h3>
                <p>Toggle optimized content on, review the live preview, and export a polished PDF when the score looks right.</p>
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
                    <span className="panel-badge">ATS engine</span>
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
                        placeholder="e.g. Product Manager or Frontend Engineer"
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
                        placeholder="+1 (555) 000-0000"
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
                        placeholder="City, State"
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
                      placeholder="Write the version you would normally use. ResumeForge will suggest a tighter ATS-ready version."
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
                            placeholder="Senior Frontend Engineer"
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
                            placeholder="Northstar Cloud"
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
                          placeholder="Add 2-4 sentences or bullet-style notes. ResumeForge will tighten them for ATS readability."
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
                              placeholder="B.S. Computer Science"
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
                            placeholder="University name"
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
                              placeholder="Spanish"
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
                      <span className="panel-badge panel-badge-warm">Free optimizer</span>
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
                        <p className="empty-note">Add experience details and ResumeForge will rewrite them into clearer ATS bullets.</p>
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

                    <div id="resume-preview" className="resume-sheet">
                      <header className="resume-header">
                        <div>
                          <h2>{personalInfo.name || 'Your Name'}</h2>
                          <p className="resume-role">{targetRole || 'Target role'}</p>
                        </div>

                        <div className="resume-contact">
                          {personalInfo.email && <span>{personalInfo.email}</span>}
                          {personalInfo.phone && <span>{personalInfo.phone}</span>}
                          {personalInfo.address && <span>{personalInfo.address}</span>}
                          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                          {personalInfo.website && <span>{personalInfo.website}</span>}
                        </div>
                      </header>

                      {previewSummary && (
                        <section className="resume-section">
                          <h3>Professional Summary</h3>
                          <p>{previewSummary}</p>
                        </section>
                      )}

                      {experience.some((item) => item.jobTitle || item.company) && (
                        <section className="resume-section">
                          <h3>Experience</h3>
                          {experience.map((item, index) =>
                            item.jobTitle || item.company ? (
                              <article key={`${item.jobTitle}-${index}`} className="resume-role-block">
                                <div className="resume-role-row">
                                  <div>
                                    <strong>{item.jobTitle}</strong>
                                    <span>{item.company}</span>
                                  </div>
                                  <em>{item.duration}</em>
                                </div>

                                {previewExperience[index]?.length ? (
                                  <ul className="resume-bullets">
                                    {previewExperience[index].map((bullet) => (
                                      <li key={bullet}>{bullet}</li>
                                    ))}
                                  </ul>
                                ) : null}
                              </article>
                            ) : null
                          )}
                        </section>
                      )}

                      {skills.length > 0 && (
                        <section className="resume-section">
                          <h3>Skills</h3>
                          <div className="resume-tag-row">
                            {skills.map((skill) => (
                              <span key={skill} className="resume-tag">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {projects.some((item) => item.name) && (
                        <section className="resume-section">
                          <h3>Projects</h3>
                          {projects.map((item, index) =>
                            item.name ? (
                              <article key={`${item.name}-${index}`} className="resume-inline-block">
                                <strong>{item.name}</strong>
                                <p>{item.description}</p>
                                {item.link && (
                                  <a href={item.link} target="_blank" rel="noreferrer">
                                    {item.link}
                                  </a>
                                )}
                              </article>
                            ) : null
                          )}
                        </section>
                      )}

                      {education.some((item) => item.degree || item.school) && (
                        <section className="resume-section">
                          <h3>Education</h3>
                          {education.map((item, index) =>
                            item.degree || item.school ? (
                              <article key={`${item.degree}-${index}`} className="resume-inline-block">
                                <strong>{item.degree}</strong>
                                <p>
                                  {item.school}
                                  {item.year ? ` • ${item.year}` : ''}
                                </p>
                              </article>
                            ) : null
                          )}
                        </section>
                      )}

                      {certifications.some((item) => item.name) && (
                        <section className="resume-section">
                          <h3>Certifications</h3>
                          {certifications.map((item, index) =>
                            item.name ? (
                              <article key={`${item.name}-${index}`} className="resume-inline-block">
                                <strong>{item.name}</strong>
                                <p>
                                  {item.issuer}
                                  {item.year ? ` • ${item.year}` : ''}
                                </p>
                              </article>
                            ) : null
                          )}
                        </section>
                      )}

                      {languages.some((item) => item.name) && (
                        <section className="resume-section">
                          <h3>Languages</h3>
                          <div className="resume-tag-row">
                            {languages.map((item, index) =>
                              item.name ? (
                                <span key={`${item.name}-${index}`} className="resume-tag">
                                  {item.name}
                                  {item.proficiency ? ` • ${item.proficiency}` : ''}
                                </span>
                              ) : null
                            )}
                          </div>
                        </section>
                      )}
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
              <span className="eyebrow">Questions people usually ask</span>
              <h2>Everything important stays simple.</h2>
            </div>

            <div className="faq-grid">
              <article className="faq-card">
                <h3>Is this still a builder, or only an optimizer?</h3>
                <p>
                  Both. ResumeForge keeps the editable builder but wraps it inside a role-first optimization workflow so the
                  final resume is easier to target.
                </p>
              </article>
              <article className="faq-card">
                <h3>Does it require an account or credits?</h3>
                <p>
                  No. This version stays free and no-login. You can save locally in your browser and export without any paywall.
                </p>
              </article>
              <article className="faq-card">
                <h3>How does the ATS optimization work?</h3>
                <p>
                  ResumeForge analyzes the job description, extracts likely keywords, compares them against your draft, and
                  suggests summary and bullet language that closes the gap.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="closing-cta">
          <div className="shell closing-card">
            <div>
              <span className="eyebrow">Ready to tighten your next application?</span>
              <h2>Turn your resume into a sharper, job-matched story in one pass.</h2>
              <p>Paste the role, tune the content, and export the optimized version without leaving the page.</p>
            </div>
            <button type="button" className="primary-button" onClick={scrollToStudio}>
              Open optimizer studio
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
