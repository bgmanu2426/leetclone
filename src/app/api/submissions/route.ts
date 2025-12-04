import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db'
import Submission from '@/src/models/Submission'
import Challenge from '@/src/models/Challenge'
import { submitToJudge0, getSubmissionResult } from '@/src/lib/judge0'
import { JUDGE0_LANGUAGE_MAP } from '@/src/lib/constants'

type SupportedLanguage = keyof typeof JUDGE0_LANGUAGE_MAP

// GET submissions for a challenge
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const userId = searchParams.get('userId')
    const all = searchParams.get('all') === 'true'

    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Slug is required' }, { status: 400 })
    }

    await connectToDatabase()
    
    const challenge = await Challenge.findOne({ slug })
    if (!challenge) {
      return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })
    }

    let query: any = { challengeId: challenge._id }
    
    // If not fetching all (creator view), filter by user
    if (!all && userId) {
      query.userId = userId
    }

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({ ok: true, submissions })
  } catch (error) {
    console.error('GET submissions error', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// Wrap user code with stdin/stdout handling
function wrapCode(code: string, language: string): string {
  if (language === 'python') {
    return `${code}

# Auto-generated runner
import sys
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    args = line.split(',')
    # Try to convert to numbers if possible
    parsed_args = []
    for arg in args:
        try:
            parsed_args.append(int(arg))
        except ValueError:
            try:
                parsed_args.append(float(arg))
            except ValueError:
                parsed_args.append(arg)
    # Find and call the first defined function
    import inspect
    funcs = [obj for name, obj in list(locals().items()) if callable(obj) and not name.startswith('_')]
    if funcs:
        result = funcs[-1](*parsed_args)
        print(result)
`
  }
  
  if (language === 'javascript') {
    return `${code}

// Auto-generated runner
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
rl.on('line', (line) => {
  const args = line.trim().split(',').map(x => isNaN(x) ? x : Number(x));
  // Find the first function defined
  const funcNames = Object.keys(this).filter(k => typeof this[k] === 'function' && !k.startsWith('_'));
  if (funcNames.length > 0) {
    const result = this[funcNames[funcNames.length - 1]](...args);
    console.log(result);
  }
});
`
  }

  if (language === 'cpp') {
    // For C++, expect user to write complete program
    return code
  }

  if (language === 'java') {
    // For Java, expect user to write complete program  
    return code
  }

  return code
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, challengeSlug, code, language, mode = 'submit' } = body as { 
      userId: string; 
      challengeSlug: string; 
      code: string; 
      language: string;
      mode?: 'run' | 'submit';
    }

    await connectToDatabase()
    const challenge = await Challenge.findOne({ slug: challengeSlug })
    if (!challenge) return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 })

    const lang = JUDGE0_LANGUAGE_MAP[language as SupportedLanguage]
    if (!lang) return NextResponse.json({ ok: false, error: 'Unsupported language' }, { status: 400 })

    const stdin = challenge.testCases.map((t: any) => t.input).join('\n')

    // Wrap user code with stdin/stdout handling
    const wrappedCode = wrapCode(code, language)

    // Submit with wait=true - returns result directly
    const result = await submitToJudge0({ source_code: wrappedCode, language_id: lang.id, stdin })
    
    // If we get a token but no status, need to poll
    let finalResult = result
    if (result?.token && (!result.status || result.status.id < 3)) {
      finalResult = await getSubmissionResult(result.token)
    }

    const stdout = finalResult.stdout || ''
    const stderr = finalResult.stderr || ''
    const compile_output = finalResult.compile_output || ''
    
    // Parse individual test case results
    const outputLines = stdout.trim().split('\n').filter((l: string) => l.trim())
    const testCaseResults = challenge.testCases.map((tc: any, index: number) => {
      const actualOutput = outputLines[index]?.trim() || ''
      const expectedOutput = tc.output.trim()
      const passed = actualOutput === expectedOutput
      return {
        testCase: index + 1,
        input: tc.input,
        expected: expectedOutput,
        actual: actualOutput,
        passed
      }
    })
    
    const allPassed = testCaseResults.every((tc: any) => tc.passed)
    const accepted = allPassed && finalResult.status?.id === 3

    // Only save submission if mode is 'submit'
    if (mode === 'submit') {
      const token = result?.token || 'sync-' + Date.now()
      const submission = await Submission.create({ 
        userId, 
        challengeId: challenge._id, 
        code, 
        language, 
        status: finalResult.status?.description || 'Unknown', 
        token 
      })

      submission.executionTime = finalResult.time ? Number(finalResult.time) : undefined
      submission.memory = finalResult.memory ? Number(finalResult.memory) : undefined
      
      if (accepted) {
        submission.consecutiveFailures = 0
      } else {
        // Get previous submission to track consecutive failures
        const lastSubmission = await Submission.findOne({ 
          userId, 
          challengeId: challenge._id 
        }).sort({ createdAt: -1 }).skip(1)
        submission.consecutiveFailures = (lastSubmission?.consecutiveFailures || 0) + 1
      }

      await submission.save()

      return NextResponse.json({ 
        ok: true, 
        submission, 
        accepted,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        compile_output: compile_output.trim(),
        testCaseResults,
        totalPassed: testCaseResults.filter((tc: any) => tc.passed).length,
        totalTests: testCaseResults.length,
        status: finalResult.status,
        mode: 'submit'
      })
    }

    // Run mode - just return results without saving
    return NextResponse.json({ 
      ok: true, 
      accepted,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      compile_output: compile_output.trim(),
      testCaseResults,
      totalPassed: testCaseResults.filter((tc: any) => tc.passed).length,
      totalTests: testCaseResults.length,
      status: finalResult.status,
      executionTime: finalResult.time ? Number(finalResult.time) : undefined,
      memory: finalResult.memory ? Number(finalResult.memory) : undefined,
      mode: 'run'
    })
  } catch (error) {
    console.error('Submission API error', error)
    const message = error instanceof Error ? error.message : 'Unknown submission error'
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
