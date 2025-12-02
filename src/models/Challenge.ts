import mongoose from 'mongoose'

const StarterCodeSchema = new mongoose.Schema({
  language: String,
  code: String
}, { _id: false })

const TestCaseSchema = new mongoose.Schema({
  input: String,
  output: String
}, { _id: false })

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  supportedLanguages: [{ name: String, id: Number, monaco: String }],
  starterCode: [StarterCodeSchema],
  testCases: [TestCaseSchema],
  creatorId: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema)
