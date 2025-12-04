import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/src/lib/db'
import Challenge from '@/src/models/Challenge'

// Helper to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return (user.publicMetadata?.role as string) === 'admin'
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await isUserAdmin(userId)
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
  }

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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await isUserAdmin(userId)
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { slug, title, description, difficulty, supportedLanguages, starterCode, testCases } = body
    
    await connectToDatabase()
    const challenge = await Challenge.findOne({ slug })
    
    if (!challenge) {
      return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })
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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await isUserAdmin(userId)
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Missing slug' }, { status: 400 })
    }
    
    await connectToDatabase()
    const challenge = await Challenge.findOne({ slug })
    
    if (!challenge) {
      return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })
    }
    
    await Challenge.deleteOne({ slug })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Challenge delete error', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete challenge' }, { status: 500 })
  }
}
