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

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { slug, title, description, difficulty, supportedLanguages, starterCode, testCases, creatorId } = body
    
    await connectToDatabase()
    const challenge = await Challenge.findOne({ slug })
    
    if (!challenge) {
      return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })
    }
    
    if (challenge.creatorId !== creatorId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 })
    }
    
    challenge.title = title
    challenge.description = description
    challenge.difficulty = difficulty
    challenge.supportedLanguages = supportedLanguages
    challenge.starterCode = starterCode
    challenge.testCases = testCases
    
    await challenge.save()
    return NextResponse.json({ ok: true, challenge })
  } catch (error) {
    console.error('Challenge update error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update challenge' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')
    const creatorId = url.searchParams.get('creatorId')
    
    if (!slug || !creatorId) {
      return NextResponse.json({ ok: false, error: 'Missing slug or creatorId' }, { status: 400 })
    }
    
    await connectToDatabase()
    const challenge = await Challenge.findOne({ slug })
    
    if (!challenge) {
      return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })
    }
    
    if (challenge.creatorId !== creatorId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 })
    }
    
    await Challenge.deleteOne({ slug })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Challenge delete error', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete challenge' }, { status: 500 })
  }
}
