import { NextResponse } from 'next/server';
import { getDependencyGraph } from '@/server/versioning/dependencyGraph';

export async function GET() {
  return NextResponse.json(getDependencyGraph());
}
