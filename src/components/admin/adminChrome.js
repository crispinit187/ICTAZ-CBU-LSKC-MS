import { createContext, useContext, useEffect } from "react";

/* What the shared management layout offers to the pages inside it. */
export const AdminChrome = createContext({ setPending: () => {} });

/* Which page is on screen and whether it is fading out or in. App.jsx fills this in. */
export const PageTransition = createContext({
  phase: "in",
  shownPath: "",
  livePath: "",
});

/* A page can tell the sidebar how many registrations are waiting (the badge on Approvals). */
export function useSidebarPending(value) {
  const { setPending } = useContext(AdminChrome);
  useEffect(() => {
    setPending(value);
    return () => setPending(undefined);
  }, [value, setPending]);
}
