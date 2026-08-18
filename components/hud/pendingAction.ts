// Lets the command palette kick off a report/suggestions run from any page:
// stash the intent, jump to '/', and PlatformPanel picks it up on mount.
export type PendingAction = 'report' | 'suggestions';

const STORAGE_KEY = 'pran:pending-action';
const EVENT_NAME = 'pran:action';

export function triggerPendingAction(action: PendingAction, pathname: string, router: { push: (href: string) => void }) {
  sessionStorage.setItem(STORAGE_KEY, action);
  if (pathname === '/') {
    window.dispatchEvent(new CustomEvent<PendingAction>(EVENT_NAME, { detail: action }));
  } else {
    router.push('/');
  }
}

export function consumePendingAction(): PendingAction | null {
  const action = sessionStorage.getItem(STORAGE_KEY) as PendingAction | null;
  if (action) sessionStorage.removeItem(STORAGE_KEY);
  return action;
}

export function onPendingAction(handler: (action: PendingAction) => void) {
  const listener = (e: Event) => {
    const action = (e as CustomEvent<PendingAction>).detail;
    sessionStorage.removeItem(STORAGE_KEY);
    handler(action);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
