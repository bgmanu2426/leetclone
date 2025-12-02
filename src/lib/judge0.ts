import axios from 'axios'
import { DEFAULT_CPU_TIME, DEFAULT_MEMORY } from './constants'

const BASE = process.env.JUDGE0_API_URL || 'http://localhost:2358'

export async function submitToJudge0({ source_code, language_id, stdin }: { source_code: string; language_id: number; stdin?: string }) {
  const res = await axios.post(
    `${BASE}/submissions?base64_encoded=false&wait=false`,
    {
      source_code,
      language_id,
      stdin,
      cpu_time_limit: DEFAULT_CPU_TIME,
      memory_limit: DEFAULT_MEMORY
    }
  )
  return res.data
}

export async function getSubmissionResult(token: string) {
  const res = await axios.get(`${BASE}/submissions/${token}?base64_encoded=false`)
  return res.data
}
