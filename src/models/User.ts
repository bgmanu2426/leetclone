import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String },
  username: { type: String },
  isAdmin: { type: Boolean, default: false }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
