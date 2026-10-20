import { useId } from "react";
import type { SongDraft, SongKind } from "../catalog/types";
export function SongFields({
  value,
  onChange,
  disabled = false,
  contentLabel = "Conteúdo",
  autoFocusTitle = false,
}: {
  value: SongDraft;
  onChange: (s: SongDraft) => void;
  disabled?: boolean;
  contentLabel?: string;
  autoFocusTitle?: boolean;
}) {
  const id = useId();
  return (
    <div className="song-fields">
      <label htmlFor={id + "title"}>
        Título
        <input
          id={id + "title"}
          className="song-title-input"
          autoFocus={autoFocusTitle}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          required
          disabled={disabled}
        />
      </label>
      <label htmlFor={id + "kind"}>
        Tipo de conteúdo
        <select
          id={id + "kind"}
          value={value.kind}
          onChange={(e) =>
            onChange({ ...value, kind: e.target.value as SongKind })
          }
          disabled={disabled}
        >
          <option value="lyrics">Letra</option>
          <option value="chords">Cifra</option>
        </select>
      </label>
      <label htmlFor={id + "content"}>
        {contentLabel}
        <textarea
          id={id + "content"}
          className={value.kind === "chords" ? "mono" : ""}
          value={value.content}
          onChange={(e) => onChange({ ...value, content: e.target.value })}
          rows={11}
          wrap={value.kind === "chords" ? "off" : "soft"}
          required
          disabled={disabled}
        />
      </label>
    </div>
  );
}
