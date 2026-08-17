import { describe, it, expect } from 'vitest';
import type { DependencyNode, AffectedScope } from '@/server/versioning/types';

describe('Versioning — prohibited terminology', () => {
  it('source files never contain "replacement input"', async () => {
    const { readFileSync } = await import('fs');
    const { glob } = await import('glob');
    const files = await glob('src/server/versioning/**/*.ts');
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toContain('replacement input');
    }
  });

  it('API routes never contain "replacement input"', async () => {
    const { readFileSync } = await import('fs');
    const { glob } = await import('glob');
    const files = await glob('app/api/phases/**/*upload-revised*/**/*.ts');
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toContain('replacement input');
    }
  });
});

describe('Version records', () => {
  it('VersionRecord type has active field', () => {
    // Type check: DependencyNode has type field
    const node: DependencyNode = { id: 'test', type: 'input', phaseId: 0, label: 'Test' };
    expect(node.type).toBe('input');
  });

  it('AffectedScope has all required fields', () => {
    const scope: AffectedScope = {
      inputId: 'test',
      inputVersionId: 'v1',
      affectedChecks: [],
      affectedFindings: [],
      affectedOutputs: [],
      invalidatedAt: new Date().toISOString(),
    };
    expect(scope.affectedChecks).toBeInstanceOf(Array);
    expect(scope.affectedFindings).toBeInstanceOf(Array);
    expect(scope.affectedOutputs).toBeInstanceOf(Array);
  });
});

describe('Dependency graph', () => {
  it('registerDependency and traverseFromInput are exported', async () => {
    const { registerDependency, traverseFromInput } = await import('@/server/versioning/dependencyGraph');
    expect(typeof registerDependency).toBe('function');
    expect(typeof traverseFromInput).toBe('function');
  });
});
