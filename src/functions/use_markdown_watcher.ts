export function setupMarkdownWatcher(
  ref: HTMLDivElement | undefined,
  handler: () => void
) {
  if (!ref) return null;

  const observer = new MutationObserver(() => {
    handler();
  });

  observer.observe(ref, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return observer;
}
