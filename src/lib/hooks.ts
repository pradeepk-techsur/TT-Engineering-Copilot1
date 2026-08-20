'use client';

import useSWR from 'swr';

import type { GateAdvisoryResponse, RiskScore } from '@/shared/types/risk';

const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Shared SWR config for the lifecycle document.
 *
 * The stepper, the sidebar phase rail and the lifecycle summary banner all
 * need the same data. Each used to declare its own `useSWR('/api/lifecycle')`
 * with a different `refreshInterval`, which gave the app three independent
 * poll timers for one resource — three times the requests, and on a slow
 * backend enough added latency to make whole pages feel stuck.
 *
 * One key + one identical config means SWR dedupes the request and the
 * consumers share a single timer.
 */
const LIFECYCLE_KEY = '/api/lifecycle';

export interface LifecyclePhase {
  phaseId: number;
  phaseName: string;
  phaseState: string;
  gateState?: string;
  technicalReview?: string | null;
  externalIntakeBehavior?: string;
  internalIntakeBehavior?: string;
}

export interface LifecycleData {
  productName?: string;
  projectId?: string;
  projectType?: string;
  projectCategory?: string;
  projectStatus?: string;
  currentPhase?: number;
  currentGate?: number;
  phases?: LifecyclePhase[];
}

export function useLifecycle() {
  return useSWR<LifecycleData>(LIFECYCLE_KEY, fetcher, {
    // Lifecycle state changes on human gate decisions, not continuously.
    refreshInterval: 15000,
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 5000,
  });
}

/** Phase input readiness. Polled while the user is working on intake. */
export function usePhaseInputs(phaseId: number) {
  return useSWR(`/api/phases/${phaseId}/inputs`, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

/** Phase execution status. Faster, because this is what changes during a run. */
export function usePhaseExecutionStatus(phaseId: number) {
  return useSWR(`/api/phases/${phaseId}/execution-status`, fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

/** LLM key status for the top bar. One fetch, cached across navigation. */
export function useLlmKeyStatus() {
  return useSWR<{ configured: boolean }>('/api/settings/llm-key', fetcher, {
    // Only changes when the user edits it on the settings page, so don't poll.
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60000,
  });
}

/**
 * The Overall Risk Score for one phase/gate.
 *
 * Calculated server-side from structured rules, so it only moves when a
 * finding, action, check or artifact does — no need to poll it hard.
 */
export function usePhaseRisk(phaseId: number) {
  return useSWR<RiskScore>(`/api/risk/phase/${phaseId}`, fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 5000,
  });
}

/** Risk scores for all ten phases, for the Product Lifecycle View. */
export function useLifecycleRisk() {
  return useSWR<{ phases: RiskScore[]; byPhase: Record<number, RiskScore> }>(
    '/api/risk/lifecycle',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 10000,
    }
  );
}

/**
 * The gate advisory: header counts, risk score, AI recommendation with its
 * rationale / strengths / risks / next steps, and the decisions already
 * recorded. One request, because the gate header and the advisory panel must
 * never disagree with each other.
 */
export function useGateAdvisory(gateId: number) {
  return useSWR<GateAdvisoryResponse>(`/api/gates/${gateId}/advisory`, fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 5000,
  });
}
