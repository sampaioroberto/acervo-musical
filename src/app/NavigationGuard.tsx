import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
type Guard = { requestLeave: () => boolean; warn: boolean };
const Navigation = createContext({
  requestLeave: (): boolean => true,
  register: (_guard: Guard) => () => {},
});
export function NavigationProvider({ children }: { children: ReactNode }) {
  const guard = useRef<Guard | null>(null);
  const value = useMemo(
    () => ({
      requestLeave: () => guard.current?.requestLeave() ?? true,
      register: (next: Guard) => {
        guard.current = next;
        return () => {
          if (guard.current === next) guard.current = null;
        };
      },
    }),
    [],
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (guard.current?.warn) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  return <Navigation.Provider value={value}>{children}</Navigation.Provider>;
}
export const useNavigationGuard = () => useContext(Navigation);
export function useEditorLeaveGuard(dirty: boolean, busy: boolean) {
  const { register } = useNavigationGuard();
  const requestLeave = useCallback(() => {
    if (busy) {
      window.alert("Aguarde a operação terminar antes de sair da edição.");
      return false;
    }
    return (
      !dirty ||
      window.confirm(
        "Sair da edição? Alterações não salvas do evento serão descartadas. Músicas já publicadas permanecem no acervo.",
      )
    );
  }, [dirty, busy]);
  useEffect(
    () => register({ requestLeave, warn: dirty || busy }),
    [register, requestLeave, dirty, busy],
  );
  return requestLeave;
}
