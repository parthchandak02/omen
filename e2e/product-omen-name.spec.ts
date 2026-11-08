import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { fieldValue, openOmen, outputSelector, reveal, waitForFrame } from "./omen-test-helpers";
import { expect, test } from "./toolcraft-product-test";
import { NAME_PRESETS, OMEN_TARGETS } from "../src/omen/omen-settings";

test(`browser: omen control ${OMEN_TARGETS.name}`, async ({ page }) => {
  const session = await openOmen(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(OMEN_TARGETS.name, async () => {
      await fieldValue(page, OMEN_TARGETS.name, "Margaret");
      await waitForFrame(page);
    }),
    { requirementId: OMEN_TARGETS.name, selector: outputSelector },
  );
  await expect(page.locator(outputSelector)).toHaveAttribute("data-name-found", "true");
  await fieldValue(page, OMEN_TARGETS.name, "Zzxq");
  await waitForFrame(page);
  await expect(page.locator(outputSelector)).toHaveAttribute("data-name-found", "false");
  await expectToolcraftReferenceParity(async () => (await getToolcraftControlFieldByTarget(page, OMEN_TARGETS.name)).getByRole("textbox").inputValue(), "Zzxq", {
    requirementId: OMEN_TARGETS.name,
    target: OMEN_TARGETS.name,
  });
});

test(`browser: omen control ${OMEN_TARGETS.preset}`, async ({ page }) => {
  const session = await openOmen(page);
  const order = [...NAME_PRESETS.slice(1), NAME_PRESETS[0]];
  for (const preset of order) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(OMEN_TARGETS.preset, async (field) => {
        await reveal(field);
        await field.getByRole("button", { exact: true, name: preset.label }).click();
        await waitForFrame(page);
      }),
      { requirementId: OMEN_TARGETS.preset, selector: outputSelector },
    );
    await expect((await getToolcraftControlFieldByTarget(page, OMEN_TARGETS.name)).getByRole("textbox")).toHaveValue(preset.label);
  }
  await expectToolcraftReferenceParity(async () => (await getToolcraftControlFieldByTarget(page, OMEN_TARGETS.name)).getByRole("textbox").inputValue(), NAME_PRESETS[0].label, {
    requirementId: OMEN_TARGETS.preset,
    target: OMEN_TARGETS.preset,
  });
});
