import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  NavigationProvider,
  useNavigationGuard,
  useEditorLeaveGuard,
} from "../../src/app/NavigationGuard";
afterEach(() => vi.restoreAllMocks());
function Fixture({ dirty, busy }: { dirty: boolean; busy: boolean }) {
  useEditorLeaveGuard(dirty, busy);
  const { requestLeave } = useNavigationGuard();
  return (
    <button
      onClick={() => {
        if (requestLeave()) history.replaceState(null, "", "#/left");
      }}
    >
      Sair da edição
    </button>
  );
}
it("asks before discarding edits and warns before closing the browser", () => {
  history.replaceState(null, "", "#/admin/events");
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const view = render(
    <NavigationProvider>
      <Fixture dirty busy={false} />
    </NavigationProvider>,
  );
  fireEvent.click(screen.getByRole("button"));
  expect(confirm).toHaveBeenCalledOnce();
  expect(location.hash).toBe("#/admin/events");
  const close = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(close);
  expect(close.defaultPrevented).toBe(true);
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button"));
  expect(location.hash).toBe("#/left");
  view.unmount();
  const after = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
});
it("blocks leaving during a write even if the user would accept discarding", () => {
  history.replaceState(null, "", "#/admin/events");
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
  render(
    <NavigationProvider>
      <Fixture dirty busy />
    </NavigationProvider>,
  );
  fireEvent.click(screen.getByRole("button"));
  expect(alert).toHaveBeenCalledOnce();
  expect(confirm).not.toHaveBeenCalled();
  expect(location.hash).toBe("#/admin/events");
});
