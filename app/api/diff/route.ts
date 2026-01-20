import { NextRequest, NextResponse } from 'next/server'
import { diff } from '../../../src/core'
import { fetchUNDocument } from '../../../src/un-fetcher'

export async function POST(request: NextRequest) {
  try {
    const { symbolA, symbolB } = await request.json()

    if (!symbolA || !symbolB) {
      return NextResponse.json(
        { error: 'Both symbolA and symbolB are required' },
        { status: 400 }
      )
    }

    // Fetch documents from UN API
    const [docA, docB] = await Promise.all([
      fetchUNDocument(symbolA),
      fetchUNDocument(symbolB),
    ])

    const result = diff(docA.lines, docB.lines)

    // Return the result directly - uses camelCase from core
    return NextResponse.json({
      score: result.score,
      items: result.items,
      formats: { left: docA.format, right: docB.format },
    })
  } catch (error) {
    console.error('Error processing diff:', error)
    return NextResponse.json(
      { error: 'Failed to process diff' },
      { status: 500 }
    )
  }
}
