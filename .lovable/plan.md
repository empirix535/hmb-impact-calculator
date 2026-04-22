
# Refine Market Share Shift Logic

Update the BIA model so cannibalization rates behave as strict weights of the H-IUD gain, sliders stay linked at 100%, and the zero-floor constraint triggers a deterministic re-allocation with clear UI feedback.

## 1. Engine — weighted shift with re-allocation

In `src/lib/bia/engine.ts`, replace the current per-arm formula with an iterative allocator:

- Inputs: `MS_0 = { hIud, ns, surgical, untreated }`, target `MS_H,1`, weights `δ = { ns, surgical, untreated }` (assumed normalized to 1.0).
- Compute `ΔMS_H = MS_H,1 − MS_H,0`. If `ΔMS_H ≤ 0`, skip re-allocation (no cannibalization needed; just apply proportional give-back or leave shares unchanged per spec — v1 only handles uplift).
- Initialize `remaining = ΔMS_H`, `activeArms = ['ns','surgical','untreated']`, `clamped = {}`.
- Loop until `remaining ≈ 0` or no active arms:
  1. Renormalize weights across `activeArms` so they sum to 1.
  2. For each active arm `i`: `requested_i = δ_i_norm × remaining`.
  3. If `requested_i ≥ MS_i_current`: set `MS_i,1 = 0`, mark arm clamped, subtract `MS_i_current` from `remaining`, remove from `activeArms`.
  4. Else: subtract `requested_i` from `MS_i_current`, subtract from `remaining`.
  5. If a full pass produced no clamps, finalize and exit.
- If `activeArms` empties before `remaining` is exhausted, the H-IUD target is infeasible — return a `feasible: false` flag plus the achievable `MS_H,1` (the rest of the arms summed to 0).
- Return enriched result: `{ marketShares_1, clampedArms: string[], reallocated: boolean, feasible: boolean, achievableHIud: number }`.

Add a small pure helper `normalizeDeltas(δ)` that returns weights summing to 1 (used by both engine and UI).

## 2. Hook — linked δ sliders

In `src/hooks/useBiaModel.ts` (or wherever δ state lives):

- Store δ as `{ ns, surgical, untreated }` always summing to 1.0.
- Expose `setDelta(arm, newValue)` that:
  1. Clamps `newValue` to `[0, 1]`.
  2. Computes `remainingBudget = 1 − newValue` to distribute across the other two arms.
  3. Scales the other two by their previous relative proportion: `other_i_new = remainingBudget × (other_i_old / sum(others_old))`.
  4. Edge case: if `sum(others_old) === 0`, split `remainingBudget` evenly across the other two arms.
- Memoize engine output via `useMemo` keyed on `[P, MS_0, MS_H_1, δ, costs, effectiveness, anemia]`.

## 3. UI feedback in ControlCenter

In `src/components/bia/ControlCenter.tsx` (cannibalization section):

- Render each δ slider with its live percentage label; sliders are bound to `setDelta` so dragging one visibly nudges the others.
- A small "Σ δ = 100%" badge under the group confirms the invariant.
- For each arm, if `result.clampedArms.includes(arm)`:
  - Show a muted amber `AlertTriangle` icon next to the slider label.
  - Wrap it in a `Tooltip`: "This arm reached 0% — its remaining share was re-allocated to the other treatment arms based on their weights."
- If `!result.feasible`:
  - Show a single `Alert` (variant default, amber accent) above the H-IUD target slider: "Target H-IUD share exceeds available baseline. Maximum achievable: {achievableHIud}%." with a "Snap to max" button that sets `MS_H,1 = achievableHIud`.

## 4. Breakdown table

In `src/components/bia/BreakdownTable.tsx`, add a "Status" column showing `—`, `Re-allocated`, or `Clamped to 0%` per arm so the math is auditable.

## Files touched

- `src/lib/bia/engine.ts` — new allocator + return shape
- `src/lib/bia/types.ts` — extend result type with `clampedArms`, `reallocated`, `feasible`, `achievableHIud`
- `src/hooks/useBiaModel.ts` — linked `setDelta`
- `src/components/bia/ControlCenter.tsx` — linked sliders + warnings
- `src/components/bia/BreakdownTable.tsx` — status column

## Out of scope

Negative `ΔMS_H` (H-IUD share decrease) re-allocation back to other arms; user-editable weight normalization strategies; per-arm min/max caps beyond the 0% floor.
