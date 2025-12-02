import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db'
import Submission from '@/src/models/Submission'
import Challenge from '@/src/models/Challenge'
import { submitToJudge0, getSubmissionResult } from '@/src/lib/judge0'
import { JUDGE0_LANGUAGE_MAP } from '@/src/lib/constants'

type SupportedLanguage = keyof typeof JUDGE0_LANGUAGE_MAP

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, challengeSlug, code, language } = body as { userId: string; challengeSlug: string; code: string; language: string }

  await connectToDatabase()
  const challenge = await Challenge.findOne({ slug: challengeSlug })
  if (!challenge) return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })

  const lang = JUDGE0_LANGUAGE_MAP[language as SupportedLanguage]
  if (!lang) return NextResponse.json({ ok: false, error: 'Unsupported language' }, { status: 400 })

  // concatenate test cases' inputs to a single stdin for now — in production run each test case separately
  const stdin = challenge.testCases.map((t: any) => t.input).join('\n')

  const submitRes = await submitToJudge0({ source_code: code, language_id: lang.id, stdin })
  const token = submitRes.token || submitRes.token

  const submission = await Submission.create({ userId, challengeId: challenge._id, code, language, status: 'Submitted', token })

  // poll once for result (in prod use background worker)
  const result = await getSubmissionResult(token)

  // map result to our status
  const status = result.status?.description || 'Unknown'
  submission.status = status
  submission.executionTime = result.time ? Number(result.time) : undefined
  submission.memory = result.memory ? Number(result.memory) : undefined

  // determine correctness: naive check against expected outputs
  const stdout = result.stdout || ''
  const expectedOutputs = challenge.testCases.map((t: any) => t.output.trim()).join('\n')
  const accepted = stdout.trim() === expectedOutputs.trim()
  if (accepted) {
    submission.consecutiveFailures = 0
  } else {
    submission.consecutiveFailures = (submission.consecutiveFailures || 0) + 1
  }

  await submission.save()

  return NextResponse.json({ ok: true, submission, accepted })
}
