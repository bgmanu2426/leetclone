import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leetclone'

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

let cached: { conn: typeof mongoose | null } = { conn: null }

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  const conn = await mongoose.connect(MONGODB_URI)
  cached.conn = conn
  return conn
}
