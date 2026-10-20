import { it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePdfPreview } from "../../src/pdf/usePdfPreview";
import { makePrintSongs } from "./fixtures";
import type { LyricOptions, PdfResult } from "../../src/pdf/types";
const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("../../src/pdf/lyrics", () => ({ generateLyricsPdf: generate }));
it("discards stale completions and invalidates the old result during a new generation", async () => {
  const tasks: ((r: PdfResult) => void)[] = [];
  generate.mockImplementation(
    () => new Promise<PdfResult>((resolve) => tasks.push(resolve)),
  );
  const songs = makePrintSongs("lyrics", "Canção");
  const { result, rerender } = renderHook(
    ({ options }: { options: LyricOptions }) => usePdfPreview(songs, options),
    {
      initialProps: {
        options: { family: "sans", sizing: { mode: "auto" } } as LyricOptions,
      },
    },
  );
  rerender({
    options: { family: "serif", sizing: { mode: "manual", size: 12 } },
  });
  await act(async () =>
    tasks[1]({
      ok: true,
      bytes: new Uint8Array([2]),
      fontSize: 12,
      pageCount: 1,
    }),
  );
  expect(result.current.result).toMatchObject({ ok: true, fontSize: 12 });
  await act(async () =>
    tasks[0]({
      ok: true,
      bytes: new Uint8Array([1]),
      fontSize: 16,
      pageCount: 1,
    }),
  );
  expect(result.current.result).toMatchObject({ ok: true, fontSize: 12 });
  rerender({ options: { family: "mono", sizing: { mode: "auto" } } });
  expect(result.current.status).toBe("loading");
  expect(result.current.result).toBeNull();
  await act(async () =>
    tasks[2]({
      ok: false,
      issues: [{ code: "overflow", songIds: ["1"], message: "Não cabe" }],
    }),
  );
  await waitFor(() => expect(result.current.status).toBe("invalid"));
});
