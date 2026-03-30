import { useState, useEffect } from 'react'
import './App.css'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Experience {
  jobTitle: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  degree: string;
  school: string;
  year: string;
}

interface Project {
  name: string;
  description: string;
  link: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
}

function App() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  const [experience, setExperience] = useState<Experience[]>([{ jobTitle: '', company: '', duration: '', description: '' }])

  const [education, setEducation] = useState<Education[]>([{ degree: '', school: '', year: '' }])

  const [skills, setSkills] = useState<string[]>([''])

  const [projects, setProjects] = useState<Project[]>([{ name: '', description: '', link: '' }])

  const [certifications, setCertifications] = useState<Certification[]>([{ name: '', issuer: '', year: '' }])

  const [feedback, setFeedback] = useState<string>('')

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('resumeData')
    if (saved) {
      const data = JSON.parse(saved)
      setPersonalInfo(data.personalInfo || personalInfo)
      setExperience(data.experience || experience)
      setEducation(data.education || education)
      setSkills(data.skills || skills)
      setProjects(data.projects || projects)
      setCertifications(data.certifications || certifications)
    }
  }, [])

  // Save to localStorage
  const saveData = () => {
    const data = { personalInfo, experience, education, skills, projects, certifications }
    localStorage.setItem('resumeData', JSON.stringify(data))
    setFeedback('Resume saved successfully!')
    setTimeout(() => setFeedback(''), 3000)
  }

  const addExperience = () => {
    setExperience([...experience, { jobTitle: '', company: '', duration: '', description: '' }])
  }

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const newExp = [...experience]
    newExp[index] = { ...newExp[index], [field]: value }
    setExperience(newExp)
  }

  const removeExperience = (index: number) => {
    if (experience.length > 1) {
      setExperience(experience.filter((_, i) => i !== index))
    }
  }

  const addEducation = () => {
    setEducation([...education, { degree: '', school: '', year: '' }])
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const newEdu = [...education]
    newEdu[index] = { ...newEdu[index], [field]: value }
    setEducation(newEdu)
  }

  const removeEducation = (index: number) => {
    if (education.length > 1) {
      setEducation(education.filter((_, i) => i !== index))
    }
  }

  const addSkill = () => {
    setSkills([...skills, ''])
  }

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills]
    newSkills[index] = value
    setSkills(newSkills)
  }

  const removeSkill = (index: number) => {
    if (skills.length > 1) {
      setSkills(skills.filter((_, i) => i !== index))
    }
  }

  const addProject = () => {
    setProjects([...projects, { name: '', description: '', link: '' }])
  }

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const newProj = [...projects]
    newProj[index] = { ...newProj[index], [field]: value }
    setProjects(newProj)
  }

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index))
    }
  }

  const addCertification = () => {
    setCertifications([...certifications, { name: '', issuer: '', year: '' }])
  }

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const newCert = [...certifications]
    newCert[index] = { ...newCert[index], [field]: value }
    setCertifications(newCert)
  }

  const removeCertification = (index: number) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter((_, i) => i !== index))
    }
  }

  const generatePDF = () => {
    const input = document.getElementById('resume-preview')
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
        const imgX = (pdfWidth - imgWidth * ratio) / 2
        const imgY = 0
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
        pdf.save('resume.pdf')
        setFeedback('PDF downloaded successfully!')
        setTimeout(() => setFeedback(''), 3000)
      })
    }
  }

  const printResume = () => {
    window.print()
    setFeedback('Print dialog opened!')
    setTimeout(() => setFeedback(''), 3000)
  }

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const isFormValid = personalInfo.name && validateEmail(personalInfo.email)

  return (
    <div className="app-container">
      <header className="bg-primary text-white text-center py-3">
        <h1><i className="bi bi-file-earmark-person"></i> Free Resume Builder</h1>
        <p>Build ATS-friendly resumes and land your dream job!</p>
      </header>
      {feedback && <div className="alert alert-success text-center">{feedback}</div>}
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-lg-6">
            <div className="form-section p-4 bg-light rounded shadow-sm">
              <h2><i className="bi bi-person-circle"></i> Personal Information</h2>
              <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" value={personalInfo.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonalInfo({...personalInfo, name: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email *</label>
                <input type="email" className={`form-control ${personalInfo.email && !validateEmail(personalInfo.email) ? 'is-invalid' : ''}`} value={personalInfo.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonalInfo({...personalInfo, email: e.target.value})} required />
                {personalInfo.email && !validateEmail(personalInfo.email) && <div className="invalid-feedback">Please enter a valid email.</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-control" value={personalInfo.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonalInfo({...personalInfo, phone: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                <input type="text" className="form-control" value={personalInfo.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonalInfo({...personalInfo, address: e.target.value})} />
              </div>
            </div>

            <div className="form-section p-4 bg-light rounded shadow-sm mt-4">
              <h2><i className="bi bi-briefcase"></i> Work Experience</h2>
              {experience.map((exp: Experience, index: number) => (
                <div key={index} className="mb-3 border p-3 rounded">
                  <div className="d-flex justify-content-between">
                    <h5>Experience {index + 1}</h5>
                    {experience.length > 1 && <button className="btn btn-outline-danger btn-sm" onClick={() => removeExperience(index)}><i className="bi bi-trash"></i></button>}
                  </div>
                  <input type="text" className="form-control mb-2" placeholder="Job Title" value={exp.jobTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExperience(index, 'jobTitle', e.target.value)} />
                  <input type="text" className="form-control mb-2" placeholder="Company" value={exp.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExperience(index, 'company', e.target.value)} />
                  <input type="text" className="form-control mb-2" placeholder="Duration (e.g., 2020-2023)" value={exp.duration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateExperience(index, 'duration', e.target.value)} />
                  <textarea className="form-control" placeholder="Description" value={exp.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateExperience(index, 'description', e.target.value)}></textarea>
                </div>
              ))}
              <button className="btn btn-outline-primary" onClick={addExperience}><i className="bi bi-plus-circle"></i> Add Experience</button>
            </div>

            <div className="form-section p-4 bg-light rounded shadow-sm mt-4">
              <h2><i className="bi bi-mortarboard"></i> Education</h2>
              {education.map((edu: Education, index: number) => (
                <div key={index} className="mb-3 border p-3 rounded">
                  <div className="d-flex justify-content-between">
                    <h5>Education {index + 1}</h5>
                    {education.length > 1 && <button className="btn btn-outline-danger btn-sm" onClick={() => removeEducation(index)}><i className="bi bi-trash"></i></button>}
                  </div>
                  <input type="text" className="form-control mb-2" placeholder="Degree" value={edu.degree} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'degree', e.target.value)} />
                  <input type="text" className="form-control mb-2" placeholder="School" value={edu.school} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'school', e.target.value)} />
                  <input type="text" className="form-control" placeholder="Year" value={edu.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEducation(index, 'year', e.target.value)} />
                </div>
              ))}
              <button className="btn btn-outline-primary" onClick={addEducation}><i className="bi bi-plus-circle"></i> Add Education</button>
            </div>

            <div className="form-section p-4 bg-light rounded shadow-sm mt-4">
              <h2><i className="bi bi-tools"></i> Skills</h2>
              {skills.map((skill: string, index: number) => (
                <div key={index} className="input-group mb-2">
                  <input type="text" className="form-control" value={skill} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSkill(index, e.target.value)} placeholder="Skill" />
                  {skills.length > 1 && <button className="btn btn-outline-danger" onClick={() => removeSkill(index)}><i className="bi bi-trash"></i></button>}
                </div>
              ))}
              <button className="btn btn-outline-primary" onClick={addSkill}><i className="bi bi-plus-circle"></i> Add Skill</button>
            </div>

            <div className="form-section p-4 bg-light rounded shadow-sm mt-4">
              <h2><i className="bi bi-folder"></i> Projects</h2>
              {projects.map((proj: Project, index: number) => (
                <div key={index} className="mb-3 border p-3 rounded">
                  <div className="d-flex justify-content-between">
                    <h5>Project {index + 1}</h5>
                    {projects.length > 1 && <button className="btn btn-outline-danger btn-sm" onClick={() => removeProject(index)}><i className="bi bi-trash"></i></button>}
                  </div>
                  <input type="text" className="form-control mb-2" placeholder="Project Name" value={proj.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProject(index, 'name', e.target.value)} />
                  <textarea className="form-control mb-2" placeholder="Description" value={proj.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProject(index, 'description', e.target.value)}></textarea>
                  <input type="url" className="form-control" placeholder="Link" value={proj.link} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProject(index, 'link', e.target.value)} />
                </div>
              ))}
              <button className="btn btn-outline-primary" onClick={addProject}><i className="bi bi-plus-circle"></i> Add Project</button>
            </div>

            <div className="form-section p-4 bg-light rounded shadow-sm mt-4">
              <h2><i className="bi bi-award"></i> Certifications</h2>
              {certifications.map((cert: Certification, index: number) => (
                <div key={index} className="mb-3 border p-3 rounded">
                  <div className="d-flex justify-content-between">
                    <h5>Certification {index + 1}</h5>
                    {certifications.length > 1 && <button className="btn btn-outline-danger btn-sm" onClick={() => removeCertification(index)}><i className="bi bi-trash"></i></button>}
                  </div>
                  <input type="text" className="form-control mb-2" placeholder="Certification Name" value={cert.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCertification(index, 'name', e.target.value)} />
                  <input type="text" className="form-control mb-2" placeholder="Issuer" value={cert.issuer} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCertification(index, 'issuer', e.target.value)} />
                  <input type="text" className="form-control" placeholder="Year" value={cert.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCertification(index, 'year', e.target.value)} />
                </div>
              ))}
              <button className="btn btn-outline-primary" onClick={addCertification}><i className="bi bi-plus-circle"></i> Add Certification</button>
            </div>

            <div className="mt-4 text-center">
              <button className="btn btn-success me-2" onClick={saveData} disabled={!isFormValid}><i className="bi bi-save"></i> Save Resume</button>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="preview-section p-4 bg-white rounded shadow-sm sticky-top">
              <h2><i className="bi bi-eye"></i> Resume Preview</h2>
              <div id="resume-preview" className="resume-preview border p-4" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
                <div className="text-center mb-4">
                  <h1 style={{ color: '#333' }}>{personalInfo.name || 'Your Name'}</h1>
                  <p>{personalInfo.email} | {personalInfo.phone}</p>
                  <p>{personalInfo.address}</p>
                </div>
                {experience.some(exp => exp.jobTitle || exp.company) && (
                  <div className="mb-4">
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Experience</h3>
                    {experience.filter(exp => exp.jobTitle || exp.company).map((exp: Experience, index: number) => (
                      <div key={index} className="mb-3">
                        <strong>{exp.jobTitle}</strong> at {exp.company} <em>({exp.duration})</em><br />
                        {exp.description}
                      </div>
                    ))}
                  </div>
                )}
                {education.some(edu => edu.degree || edu.school) && (
                  <div className="mb-4">
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Education</h3>
                    {education.filter(edu => edu.degree || edu.school).map((edu: Education, index: number) => (
                      <div key={index} className="mb-2">
                        <strong>{edu.degree}</strong> - {edu.school} ({edu.year})
                      </div>
                    ))}
                  </div>
                )}
                {skills.some(skill => skill) && (
                  <div className="mb-4">
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Skills</h3>
                    <ul className="list-inline">
                      {skills.filter(skill => skill).map((skill: string, index: number) => <li key={index} className="list-inline-item badge bg-secondary me-2">{skill}</li>)}
                    </ul>
                  </div>
                )}
                {projects.some(proj => proj.name) && (
                  <div className="mb-4">
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Projects</h3>
                    {projects.filter(proj => proj.name).map((proj: Project, index: number) => (
                      <div key={index} className="mb-3">
                        <strong>{proj.name}</strong>: {proj.description} {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer">(Link)</a>}
                      </div>
                    ))}
                  </div>
                )}
                {certifications.some(cert => cert.name) && (
                  <div className="mb-4">
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Certifications</h3>
                    {certifications.filter(cert => cert.name).map((cert: Certification, index: number) => (
                      <div key={index} className="mb-2">
                        {cert.name} - {cert.issuer} ({cert.year})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <button className="btn btn-primary me-2" onClick={generatePDF} disabled={!isFormValid}><i className="bi bi-download"></i> Download PDF</button>
                <button className="btn btn-secondary" onClick={printResume}><i className="bi bi-printer"></i> Print Resume</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p>&copy; 2026 Free Resume Builder. Built with ❤️ for job seekers everywhere.</p>
      </footer>
    </div>
  )
}

export default App