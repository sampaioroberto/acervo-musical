import type { CatalogRepository } from "./repository";
import type { Song } from "./types";
import { filterSongs } from "./search";
const titles = [
  "Canção do amanhecer",
  "Caminho das águas",
  "Casa de vento",
  "Horizonte sereno",
];
const verses = [
  "O dia abre a sua janela\nE a luz encontra o quintal\nUma voz pequena desperta\nNo silêncio da manhã\n\nVou seguindo esse caminho\nCom o tempo a me ensinar\nCada passo, um novo encontro\nCada encontro, um lugar",
  "Água clara corre leve\nPelas pedras do lugar\nLeva as folhas, leva os dias\nSempre encontra o seu lugar\n\nQuando a tarde muda a margem\nE o caminho se refaz\nSigo o curso desse rio\nNa certeza de chegar",
  "Minha casa tem janelas\nPara o vento atravessar\nCada porta guarda histórias\nCada canto, um descansar\n\nLá no fundo do quintal\nUma árvore floresceu\nTrouxe sombra para a tarde\nE um abrigo que cresceu",
  "No horizonte desenhado\nHá um céu por descobrir\nVou guardando cada instante\nQue me ensina a prosseguir\n\nQuando a noite se aproxima\nE as estrelas vêm brilhar\nPonho os sonhos na varanda\nE me permito descansar",
];
export function createDemoRepository(): CatalogRepository {
  const songs: Song[] = (["lyrics", "chords"] as const).flatMap((kind) =>
    titles.map((title, i) => ({
      id: kind + "-" + i,
      title,
      artist: "Acervo Musical",
      kind,
      status: "published",
      content:
        kind === "lyrics"
          ? verses[i]
          : verses[i]
              .split("\n")
              .map((line, n) =>
                line ? (n % 2 ? "G       D" : "C       Am") + "\n" + line : "",
              )
              .join("\n"),
      createdAt: "2026-10-20T12:00:00Z",
      updatedAt: "2026-10-20T12:00:00Z",
    })),
  );
  return { listPublished: async (query) => filterSongs(songs, query) };
}
