import { it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AdminPage } from "../../src/admin/AdminPage";
import type { AuthPort, Access } from "../../src/backend/auth";
import { memoryRepo } from "./memoryRepo";
it("removes administrative data and forms when the session expires", async () => {
  let access: Access = "admin",
    listener = () => {};
  const auth: AuthPort = {
    current: async () => access,
    signIn: async () => {},
    signOut: async () => {},
    subscribe: (l) => {
      listener = l;
      return () => {};
    },
  };
  render(<AdminPage repo={memoryRepo().repo} auth={auth} />);
  expect(
    await screen.findByRole("heading", { name: "Administrar acervo" }),
  ).toBeInTheDocument();
  await act(async () => {
    access = "anonymous";
    listener();
  });
  expect(
    await screen.findByRole("heading", { name: "Entrar na administração" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Administrar acervo" }),
  ).not.toBeInTheDocument();
});
it("does not show an upload form to a different authenticated account", async () => {
  const auth: AuthPort = {
    current: async () => "denied",
    signIn: async () => {},
    signOut: async () => {},
    subscribe: () => () => {},
  };
  render(<AdminPage repo={memoryRepo().repo} auth={auth} />);
  expect(
    await screen.findByText("Esta conta não tem acesso à administração."),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Enviar arquivos")).not.toBeInTheDocument();
});
