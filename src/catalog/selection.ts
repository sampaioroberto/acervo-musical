import type { SongKind } from "./types";
export type SelectionState = {
  kind: SongKind;
  ids: string[];
  notice: string | null;
};
export type SelectionAction =
  | { type: "add" | "remove"; id: string }
  | { type: "move"; id: string; toIndex: number }
  | { type: "switch-kind"; kind: SongKind; confirmed: boolean }
  | { type: "clear" };
export function changeSelection(
  state: SelectionState,
  action: SelectionAction,
): SelectionState {
  switch (action.type) {
    case "add":
      return state.ids.includes(action.id)
        ? state
        : { ...state, ids: [...state.ids, action.id], notice: null };
    case "remove":
      return {
        ...state,
        ids: state.ids.filter((id) => id !== action.id),
        notice: null,
      };
    case "move": {
      const from = state.ids.indexOf(action.id);
      if (from < 0 || action.toIndex < 0 || action.toIndex >= state.ids.length)
        return state;
      const ids = [...state.ids];
      ids.splice(action.toIndex, 0, ids.splice(from, 1)[0]);
      return { ...state, ids, notice: null };
    }
    case "switch-kind":
      return action.kind === state.kind ||
        (state.ids.length > 0 && !action.confirmed)
        ? state
        : { kind: action.kind, ids: [], notice: null };
    case "clear":
      return { ...state, ids: [], notice: null };
  }
}
