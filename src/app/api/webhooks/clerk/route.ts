import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db'
import User from '@/src/models/User'

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!CLERK_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(CLERK_WEBHOOK_SECRET)
  let evt: any

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  await connectToDatabase()

  if (evt.type === 'user.created') {
    const { id, email_addresses, username } = evt.data
    await User.create({
      clerkId: id,
      email: email_addresses?.[0]?.email_address,
      username: username || '',
      isAdmin: false
    })
  }

  return NextResponse.json({ ok: true })
}
