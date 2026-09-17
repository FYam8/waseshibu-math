# Shared Today Planner

Status: canonical pure planner implemented; school adapters remain responsible for candidate construction.

`src/engine/todayPlanner.ts` owns the reusable ordering primitives for Today:

- resumable route session;
- pending reinforcement;
- due review;
- next past paper;
- ordinary practice;
- optional saved work.

The engine treats exam and problem IDs as opaque strings. It never derives a
year, form, question number, route, target meaning, or label from an ID.

School packages inject candidates and the ordered exam route. WaseShibu keeps
its year/target rules. Rikkyo keeps its A/B-aware exam order. The common engine
only selects the first incomplete opaque route ID and orders explicitly
classified candidates.

`todayPlanner.runtime.js` is a deterministic browser bundle generated from the
TypeScript source. The build gate regenerates it in a temporary directory and
requires byte equality, so downstream static apps do not maintain a second
copy of the algorithm.

This extraction does not change WaseShibu persistence, daily plan keys, queue
caps, target semantics, routes, or learner-state writes.
