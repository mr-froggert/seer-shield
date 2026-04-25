import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppPreferencesProvider } from "../context/AppPreferencesContext";
import { AppShell } from "./AppShell";
import { ApyLabel } from "./ApyAdjustmentIndicator";
import { RiskAdjustedApySettingsPanel } from "./RiskAdjustedApySettingsPanel";

describe("risk-adjusted APY UI", () => {
  it("renders the settings panel in the sidebar and mobile nav", () => {
    render(
      <AppPreferencesProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<div>Home</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppPreferencesProvider>
    );

    expect(screen.getAllByLabelText("Risk-adjusted APY settings")).toHaveLength(2);
  });

  it("disables inputs until the toggle is enabled and exposes tooltip copy", async () => {
    const user = userEvent.setup();

    render(
      <AppPreferencesProvider>
        <RiskAdjustedApySettingsPanel />
      </AppPreferencesProvider>
    );

    const depegInput = screen.getByRole("textbox", { name: "Asset depeg recoverable %" });
    const exploitInput = screen.getByRole("textbox", { name: "Platform exploit recoverable %" });

    expect(depegInput).toBeDisabled();
    expect(exploitInput).toBeDisabled();
    expect(screen.getByLabelText("About risk-adjusted APY")).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("tooltip", {
        name: /Globally adjusts APY displays/
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Enable global APY adjustment/i }));

    expect(depegInput).toBeEnabled();
    expect(exploitInput).toBeEnabled();
  });

  it("allows resetting and retyping percent inputs", async () => {
    const user = userEvent.setup();

    render(
      <AppPreferencesProvider>
        <RiskAdjustedApySettingsPanel />
      </AppPreferencesProvider>
    );

    await user.click(screen.getByRole("checkbox", { name: /Enable global APY adjustment/i }));

    const depegInput = screen.getByRole("textbox", { name: "Asset depeg recoverable %" });

    expect(depegInput).toHaveValue("85%");

    await user.click(depegInput);
    fireEvent.change(depegInput, { target: { value: "" } });
    expect(depegInput).toHaveValue("0%");

    fireEvent.change(depegInput, { target: { value: "82" } });
    expect(depegInput).toHaveValue("82%");

    await user.tab();
    expect(depegInput).toHaveValue("82%");
  });

  it("clamps percent inputs to 100 while editing", async () => {
    const user = userEvent.setup();

    render(
      <AppPreferencesProvider>
        <RiskAdjustedApySettingsPanel />
      </AppPreferencesProvider>
    );

    await user.click(screen.getByRole("checkbox", { name: /Enable global APY adjustment/i }));

    const exploitInput = screen.getByRole("textbox", { name: "Platform exploit recoverable %" });

    await user.click(exploitInput);
    fireEvent.change(exploitInput, { target: { value: "999" } });

    expect(exploitInput).toHaveValue("100");

    await user.tab();
    expect(exploitInput).toHaveValue("100%");
  });

  it("shows the APY adjustment dot only when adjusted mode is active", () => {
    const { rerender } = render(<ApyLabel showAdjustment={false}>APY range</ApyLabel>);

    expect(screen.queryByLabelText("Risk-adjusted APY active")).not.toBeInTheDocument();

    rerender(<ApyLabel showAdjustment>APY range</ApyLabel>);

    expect(screen.getByLabelText("Risk-adjusted APY active")).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("tooltip", {
        name: "This APY is adjusted using Seer exploit/depeg risk assumptions and your configured recovery settings."
      })
    ).toBeInTheDocument();
  });
});
