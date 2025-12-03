import axios from 'axios'
import { DEFAULT_CPU_TIME, DEFAULT_MEMORY } from './constants'

// Use Judge0 CE hosted API (free tier) or local fallback
const BASE = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
const API_KEY = process.env.JUDGE0_API_KEY || ''

// Check if using hosted API (RapidAPI)
const isHosted = BASE.includes('rapidapi.com')

const getHeaders = () => {
  if (isHosted && API_KEY) {
    return {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    }
  }
  return { 'Content-Type': 'application/json' }
}

export async function submitToJudge0({ source_code, language_id, stdin }: { source_code: string; language_id: number; stdin?: string }) {
  // Use wait=true for synchronous execution (returns result directly)
  const res = await axios.post(
    `${BASE}/submissions?base64_encoded=false&wait=true`,
    {
      source_code,
      language_id,
      stdin,
      cpu_time_limit: DEFAULT_CPU_TIME,
      memory_limit: DEFAULT_MEMORY
    },
    { 
      headers: getHeaders(),
      timeout: 30000 
    }
  )
  return res.data
}

export async function getSubmissionResult(token: string) {
  // Poll with retries until execution completes
  const maxRetries = 10
  const delay = 1000 // 1 second
  
  for (let i = 0; i < maxRetries; i++) {
    const res = await axios.get(
      `${BASE}/submissions/${token}?base64_encoded=false`,
      { headers: getHeaders() }
    )
    const data = res.data
    
    // Status IDs: 1=In Queue, 2=Processing, 3+=Completed
    if (data.status?.id >= 3) {
      return data
    }
    
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  // Return last result even if still processing
  const res = await axios.get(
    `${BASE}/submissions/${token}?base64_encoded=false`,
    { headers: getHeaders() }
  )
  return res.data
}
