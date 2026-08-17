export type DependencyNodeType = 'input' | 'check' | 'finding' | 'output';

export interface DependencyNode {
  id: string;
  type: DependencyNodeType;
  phaseId: number;
  label: string;
}

export interface DependencyEdge {
  fromId: string;
  fromType: DependencyNodeType;
  toId: string;
  toType: DependencyNodeType;
}

export interface AffectedScope {
  inputId: string;
  inputVersionId: string;
  affectedChecks: string[];      // check_ids
  affectedFindings: string[];    // finding_ids
  affectedOutputs: string[];     // output_ids
  invalidatedAt: string;         // ISO 8601
}

export interface VersionRecord {
  versionId: string;
  inputId: string;
  versionNumber: number;
  artifactId: string | null;
  intakeBehavior: 'UP' | 'SI';
  active: boolean;
  validationResult: { passed: boolean; issues: unknown[] };
  intakeTimestamp: string;
  invalidatedBy: string | null;
  rerunTriggered: boolean;
  affectedScope: string[];
}
