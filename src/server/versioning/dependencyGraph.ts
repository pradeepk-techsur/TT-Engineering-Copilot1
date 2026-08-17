import { db } from '@/db';
import { checkResults, findings, inputVersions } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { AffectedScope, DependencyEdge, DependencyNodeType } from './types';

// In-memory dependency graph for POC (replace with DB-backed graph in v2)
// Maps: nodeId → Set of dependent nodeIds with their types
const GRAPH: Map<string, DependencyEdge[]> = new Map();

/**
 * Register a dependency edge in the graph.
 * Called when a check, finding, or output is created that depends on an input version.
 */
export function registerDependency(
  fromId: string,
  fromType: DependencyNodeType,
  toId: string,
  toType: DependencyNodeType
): void {
  if (!GRAPH.has(fromId)) GRAPH.set(fromId, []);
  GRAPH.get(fromId)!.push({ fromId, fromType, toId, toType });
}

/**
 * BFS traversal from a logical input to find all affected checks, findings, outputs.
 * Following FRD F03 dependency graph structure.
 */
export async function traverseFromInput(inputId: string): Promise<AffectedScope> {
  const [activeVersion] = await db.select().from(inputVersions)
    .where(eq(inputVersions.inputId, inputId));

  // Start BFS from this input node
  const visited = new Set<string>();
  const queue: string[] = [inputId];
  const affectedChecks: string[] = [];
  const affectedFindings: string[] = [];
  const affectedOutputs: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const edges = GRAPH.get(nodeId) ?? [];
    for (const edge of edges) {
      if (!visited.has(edge.toId)) {
        queue.push(edge.toId);
        if (edge.toType === 'check') affectedChecks.push(edge.toId);
        if (edge.toType === 'finding') affectedFindings.push(edge.toId);
        if (edge.toType === 'output') affectedOutputs.push(edge.toId);
      }
    }
  }

  // For POC: also query DB for check_results and findings that reference this input version
  // (as a fallback for items registered via DB rather than in-memory graph)
  if (activeVersion) {
    const dbChecks = await db.select().from(checkResults)
      .where(eq(checkResults.invalidated, false));

    for (const check of dbChecks) {
      if (check.inputVersionIds.includes(inputId) || check.inputVersionIds.includes(activeVersion.versionId)) {
        if (!affectedChecks.includes(check.checkId)) affectedChecks.push(check.checkId);
      }
    }

    const dbFindings = await db.select().from(findings);
    for (const finding of dbFindings) {
      if (finding.checkId && affectedChecks.includes(finding.checkId)) {
        if (!affectedFindings.includes(finding.findingId)) affectedFindings.push(finding.findingId);
      }
    }
  }

  return {
    inputId,
    inputVersionId: activeVersion?.versionId ?? '',
    affectedChecks,
    affectedFindings,
    affectedOutputs,
    invalidatedAt: new Date().toISOString(),
  };
}

/**
 * Invalidate all items in an affected scope.
 * Marks check_results as invalidated; does NOT delete original results.
 */
export async function invalidateAffectedScope(scope: AffectedScope): Promise<void> {
  if (scope.affectedChecks.length > 0) {
    await db.update(checkResults)
      .set({ invalidated: true })
      .where(inArray(checkResults.checkId, scope.affectedChecks));
  }
  // findings and outputs flagged at application layer — not deleted
}

/** Get the full dependency graph as an adjacency list (for API endpoint) */
export function getDependencyGraph(): Record<string, DependencyEdge[]> {
  const result: Record<string, DependencyEdge[]> = {};
  GRAPH.forEach((edges, nodeId) => { result[nodeId] = edges; });
  return result;
}
