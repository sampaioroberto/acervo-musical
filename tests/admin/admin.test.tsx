import { it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AdminPage } from "../../src/admin/AdminPage";
import type { AuthPort, Access, AuthChange } from "../../src/backend/auth";
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
it.each(["denied", "rejected"] as const)(
  "clears private forms before a delayed session check is %s",
  async (outcome) => {
    let listener = () => {};
    let resolve: (value: Access) => void = () => {};
    let reject: (reason: Error) => void = () => {};
    let delayed = false;
    const auth: AuthPort = {
      current: () =>
        delayed
          ? new Promise<Access>((yes, no) => {
              resolve = yes;
              reject = no;
            })
          : Promise.resolve("admin"),
      signIn: async () => {},
      signOut: async () => {},
      subscribe: (l) => {
        listener = l;
        return () => {};
      },
    };
    render(<AdminPage repo={memoryRepo().repo} auth={auth} />);
    expect(await screen.findByLabelText("Enviar arquivos")).toBeInTheDocument();
    act(() => {
      delayed = true;
      listener();
    });
    expect(screen.queryByLabelText("Enviar arquivos")).not.toBeInTheDocument();
    expect(screen.getByText("Verificando acesso…")).toBeInTheDocument();
    await act(async () => {
      outcome === "denied" ? resolve("denied") : reject(Error("offline"));
    });
    expect(screen.queryByLabelText("Enviar arquivos")).not.toBeInTheDocument();
  },
);
it("keeps editing mounted during a same-account token refresh", async () => {
  let listener: (change?: AuthChange) => void = () => {};
  let delayed = false;
  let resolve: (value: Access) => void = () => {};
  const auth: AuthPort = {
    current: () =>
      delayed
        ? new Promise<Access>((yes) => {
            resolve = yes;
          })
        : Promise.resolve("admin"),
    signIn: async () => {},
    signOut: async () => {},
    subscribe: (l) => {
      listener = l;
      return () => {};
    },
  };
  render(<AdminPage repo={memoryRepo().repo} auth={auth} />);
  const input = await screen.findByLabelText("Enviar arquivos");
  act(() => {
    delayed = true;
    listener({ identityChanged: false });
  });
  expect(screen.getByLabelText("Enviar arquivos")).toBe(input);
  await act(async () => {
    resolve("admin");
  });
  expect(screen.getByLabelText("Enviar arquivos")).toBe(input);
});
