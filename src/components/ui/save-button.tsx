"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Hidden inputs have no "default" separate from their value, so they are compared with a copy
// taken when the form loads (and again after each successful save, when the form resets).
function hiddenValues(form: HTMLFormElement) {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[type="hidden"]'))
    .map((input) => `${input.name}=${input.value}`)
    .join("&");
}

function hasChanges(form: HTMLFormElement, hiddenAtStart: string) {
  for (const element of Array.from(form.elements) as Field[]) {
    if (!element.name || ("disabled" in element && element.disabled)) continue;
    if (element instanceof HTMLSelectElement) {
      if (Array.from(element.options).some((o) => o.selected !== o.defaultSelected)) {
        // A select with no option marked as default shows its first option.
        const noDefault = !Array.from(element.options).some((o) => o.defaultSelected);
        if (!(noDefault && element.selectedIndex === 0)) return true;
      }
    } else if (element instanceof HTMLTextAreaElement) {
      if (element.value !== element.defaultValue) return true;
    } else if (element instanceof HTMLInputElement) {
      const type = element.type;
      if (type === "hidden" || type === "submit" || type === "button" || type === "reset") continue;
      if (type === "checkbox" || type === "radio") {
        if (element.checked !== element.defaultChecked) return true;
      } else if (type === "file") {
        if (element.files && element.files.length > 0) return true;
      } else if (element.value !== element.defaultValue) {
        return true;
      }
    }
  }
  return hiddenValues(form) !== hiddenAtStart;
}

// A submit button that stays off until something in its form is changed, so it never suggests
// there is something to save when there isn't. It turns off again after a successful save.
export function SaveButton({ disabled, ...props }: ComponentProps<typeof Button>) {
  const ref = useRef<HTMLButtonElement>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    let hiddenAtStart = hiddenValues(form);
    const check = () => setDirty(hasChanges(form, hiddenAtStart));
    // "reset" fires before the fields change back, so look again once they have.
    const onReset = () =>
      setTimeout(() => {
        hiddenAtStart = hiddenValues(form);
        check();
      });
    form.addEventListener("input", check);
    form.addEventListener("change", check);
    form.addEventListener("reset", onReset);
    // Saved values arrive as new defaults after the page refreshes; widgets may set hidden inputs.
    const observer = new MutationObserver(check);
    observer.observe(form, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["value", "checked", "selected"] });
    check();
    return () => {
      form.removeEventListener("input", check);
      form.removeEventListener("change", check);
      form.removeEventListener("reset", onReset);
      observer.disconnect();
    };
  }, []);

  return <Button ref={ref} type="submit" disabled={disabled || !dirty} {...props} />;
}
