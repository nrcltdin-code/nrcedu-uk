"use client";

import { useEffect, useRef } from "react";

// React empties a form after its server action runs. When the action returned an error, that
// throws away everything the person typed. React resets before the new result is on the page, so
// this cancels its reset every time and resets the form itself once the result is known and is
// not an error. Render it inside the <form>, on every render (not only when there is an error).
export function KeepValuesOnError({ state, failed }: { state: unknown; failed: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  const ownReset = useRef(false);
  const lastState = useRef(state);

  useEffect(() => {
    const form = marker.current?.closest("form");
    if (!form) return;
    const keep = (event: Event) => {
      if (!ownReset.current) event.preventDefault();
    };
    form.addEventListener("reset", keep);
    return () => form.removeEventListener("reset", keep);
  }, []);

  // Each submission returns a new state object.
  useEffect(() => {
    if (lastState.current === state) return;
    lastState.current = state;
    const form = marker.current?.closest("form");
    if (failed || !form) return;
    ownReset.current = true;
    form.reset();
    ownReset.current = false;
  }, [state, failed]);

  return <span ref={marker} hidden />;
}
