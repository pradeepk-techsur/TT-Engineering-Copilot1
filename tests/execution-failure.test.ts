import { describe, it, expect } from 'vitest';
import { readableFailure } from '@/server/orchestrator/executionFailure';
import { PHASE_IDS, baselinePhaseState } from '@/db/baseline';

/**
 * A phase run fails after the route has already answered 202, so the only
 * place the reason can go is the phase row. What gets stored is what the run
 * bar shows, which makes the readability of the message a real concern rather
 * than a cosmetic one: the Anthropic SDK throws its errors as a JSON envelope,
 * and the sentence worth reading is nested two levels inside it.
 */
describe('readableFailure', () => {
  it('lifts the message out of an Anthropic error envelope, keeping the status', () => {
    // Dataset: the exact shape the SDK threw when the key hit its spend cap.
    const raw =
      '400 {"type":"error","error":{"type":"invalid_request_error",' +
      '"message":"You have reached your specified API usage limits. ' +
      'You will regain access on 2026-09-01 at 00:00 UTC."},"request_id":"req_011"}';

    const { message, code } = readableFailure(new Error(raw));

    expect(message).toBe(
      '400 You have reached your specified API usage limits. ' +
      'You will regain access on 2026-09-01 at 00:00 UTC.'
    );
    expect(code).toBe('invalid_request_error');
    // The envelope itself must not survive into something a person reads.
    expect(message).not.toContain('{');
    expect(message).not.toContain('request_id');
  });

  it('keeps a plain message exactly as thrown', () => {
    const { message } = readableFailure(new Error('Network timeout after 120000ms'));
    expect(message).toBe('Network timeout after 120000ms');
  });

  it('carries the error code through when one is set and no envelope is present', () => {
    const err = Object.assign(new Error('Anthropic API key is not configured.'), {
      code: 'LLM_KEY_NOT_CONFIGURED',
    });
    expect(readableFailure(err)).toEqual({
      message: 'Anthropic API key is not configured.',
      code: 'LLM_KEY_NOT_CONFIGURED',
    });
  });

  it('does not throw on a non-Error, or on text that only looks like JSON', () => {
    expect(readableFailure('just a string').message).toBe('just a string');

    const malformed = readableFailure(new Error('failed at {unparseable'));
    expect(malformed.message).toBe('failed at {unparseable');
  });
});

/**
 * A new cycle clears the run. A failure belonging to the run that was cleared
 * would otherwise be reported against the fresh phase that replaced it.
 */
describe('baseline clears the last failure', () => {
  it('carries no execution error for any phase', () => {
    for (const phaseId of PHASE_IDS) {
      expect(baselinePhaseState(phaseId).executionError).toBeNull();
    }
  });
});
