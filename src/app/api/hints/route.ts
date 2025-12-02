import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db'
import Submission from '@/src/models/Submission'
import Challenge from '@/src/models/Challenge'
import { requestHint } from '@/src/lib/gemini'

interface SubmissionDoc {
  userId: string
  challengeId: string
  code: string
  language: string
  status: string
  consecutiveFailures: number
}

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, challengeSlug } = body
  await connectToDatabase()
  const challenge = await Challenge.findOne({ slug: challengeSlug })
  if (!challenge) return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })

  const lastFailure = await Submission.findOne({ userId, challengeId: challenge._id }).sort({ createdAt: -1 }).lean() as SubmissionDoc | null
  if (!lastFailure || (lastFailure.consecutiveFailures || 0) < 2) {
    return NextResponse.json({ ok: false, error: 'Not eligible for hint yet' }, { status: 400 })
  }

  const prompt = `Problem: ${challenge.title}\n\nDescription:\n${challenge.description}\n\nUser code:\n${lastFailure.code}`
  const hint = await requestHint({ prompt })
  return NextResponse.json({ ok: true, hint })
}
