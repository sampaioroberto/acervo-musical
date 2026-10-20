import { ArrowUp, ArrowDown, X, FileDown, Library } from "lucide-react";
import type { Song } from "./types";
import type { SelectionAction } from "./selection";
export function SelectionPanel({
  songs,
  notice,
  dispatch,
  onCompose,
}: {
  songs: Song[];
  notice: string | null;
  dispatch: (a: SelectionAction) => void;
  onCompose: (songs: Song[]) => void;
}) {
  return (
    <aside className="selection-panel" aria-label="Sua seleção">
      <div className="selection-heading">
        <span className="selection-icon">
          <Library size={21} />
        </span>
        <div>
          <h2>Sua seleção</h2>
          <p>Ordem no PDF</p>
        </div>
        <span className="selection-count">
          {songs.length}
          <small>/4</small>
        </span>
      </div>
      <div className="selection-slots">
        {Array.from({ length: 4 }, (_, i) => {
          const song = songs[i];
          return (
            <div
              key={song?.id ?? "empty-" + i}
              className={"selection-slot " + (song ? "filled" : "")}
            >
              <span className="slot-number">{i + 1}</span>
              {song ? (
                <>
                  <span className="slot-title">{song.title}</span>
                  <div className="slot-actions">
                    <button
                      aria-label={"Subir " + song.title}
                      disabled={i === 0}
                      onClick={() =>
                        dispatch({ type: "move", id: song.id, toIndex: i - 1 })
                      }
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      aria-label={"Descer " + song.title}
                      disabled={i === songs.length - 1}
                      onClick={() =>
                        dispatch({ type: "move", id: song.id, toIndex: i + 1 })
                      }
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      aria-label={"Retirar " + song.title}
                      onClick={() => dispatch({ type: "remove", id: song.id })}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <span className="slot-empty">Escolha uma música</span>
              )}
            </div>
          );
        })}
      </div>
      {notice && (
        <p role="status" className="error">
          {notice}
        </p>
      )}
      <button
        className="button primary generate"
        disabled={songs.length !== 4}
        onClick={() => onCompose(songs)}
      >
        <FileDown size={18} />
        Gerar PDF<span>→</span>
      </button>
      <p className="selection-help">
        {songs.length < 4
          ? "Selecione " +
            (4 - songs.length) +
            " música" +
            (songs.length === 3 ? "" : "s") +
            " para continuar."
          : "Confira a prévia antes de baixar."}
      </p>
      {songs.length > 0 && (
        <button
          className="text-button clear"
          onClick={() => dispatch({ type: "clear" })}
        >
          Limpar seleção
        </button>
      )}
    </aside>
  );
}
