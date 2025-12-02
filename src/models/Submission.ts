import mongoose from 'mongoose'

const SubmissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  code: String,
  language: String,
  status: { type: String, default: 'Pending' },
  executionTime: Number,
  memory: Number,
  token: String,
  consecutiveFailures: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema)
