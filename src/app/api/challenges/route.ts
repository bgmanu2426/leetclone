import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { connectToDatabase } from '@/src/lib/db'
import Challenge from '@/src/models/Challenge'

export async function POST(req: Request) {
  const body = await req.json()
  const { title, description, difficulty, supportedLanguages, starterCode, testCases, creatorId } = body
  await connectToDatabase()
  const slug = uuidv4()
  const challenge = await Challenge.create({ title, description, difficulty, supportedLanguages, starterCode, testCases, creatorId, slug })
  return NextResponse.json({ ok: true, challenge })
}

export async function GET(req: Request) {
  await connectToDatabase()
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) {
    const list = await Challenge.find().limit(50).lean()
    return NextResponse.json({ ok: true, list })
  }
  const challenge = await Challenge.findOne({ slug }).lean()
  return NextResponse.json({ ok: true, challenge })
}
