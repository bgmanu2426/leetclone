import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function requestHint({ prompt }: { prompt: string }): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const systemPrompt = `You are a helpful coding tutor. The user is stuck on a coding problem and has failed multiple attempts. 
Provide a HINT to guide them in the right direction, but DO NOT give the complete solution.
Focus on:
1. Identifying potential issues in their approach
2. Suggesting algorithmic concepts they might need
3. Pointing out edge cases they might have missed
Keep the hint concise (2-4 sentences).`

    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini API error:', error)
    return 'Hint: Try breaking down the problem into smaller steps. Check your edge cases and make sure your logic handles all input types correctly.'
  }
}
