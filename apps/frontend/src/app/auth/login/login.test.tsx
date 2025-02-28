import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "./page";
import "@testing-library/jest-dom";

describe("LoginPage", () => {
  it("deve renderizar corretamente", () => {
    render(<LoginPage />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("deve exibir erro ao tentar logar com dados inválidos", async () => {
    render(<LoginPage />);

    const submitButton = screen.getByText("Entrar");
    fireEvent.click(submitButton);

    expect(await screen.findByText("E-mail inválido")).toBeInTheDocument();
    expect(
      await screen.findByText("A senha deve ter no mínimo 6 caracteres")
    ).toBeInTheDocument();
  });
});
