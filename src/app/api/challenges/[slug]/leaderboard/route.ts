import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db'
import Submission from '@/src/models/Submission'
import Challenge from '@/src/models/Challenge'

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  await connectToDatabase()
  const challenge = await Challenge.findOne({ slug: params.slug })
  if (!challenge) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

  // Get all accepted submissions for this challenge, sorted by execution time
  const submissions = await Submission.find({ challengeId: challenge._id, status: 'Accepted' })
    .sort({ executionTime: 1, createdAt: 1 })
    .lean()

  const entries = submissions.map((s: any) => ({
    userId: s.userId,
    status: s.status,
    executionTime: s.executionTime,
    createdAt: s.createdAt
  }))

  return NextResponse.json({ ok: true, entries })
}
