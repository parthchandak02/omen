import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { openOmen, outputSelector, reveal, waitForFrame } from "./omen-test-helpers";
import { test } from "./toolcraft-product-test";
import { OMEN_DEFAULTS, OMEN_TARGETS, VIEWS } from "../src/omen/omen-settings";

test(`browser: omen control ${OMEN_TARGETS.view}`, async ({ page }) => {
  const session = await openOmen(page);
  const order = [...VIEWS.filter((view) => view.value !== OMEN_DEFAULTS.view), ...VIEWS.filter((view) => view.value === OMEN_DEFAULTS.view)];
  for (const option of order) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(OMEN_TARGETS.view, async (field) => {
        await reveal(field);
        await field.getByRole("button", { exact: true, name: option.label }).click();
        await waitForFrame(page);
      }),
      { requirementId: OMEN_TARGETS.view, selector: outputSelector },
    );
  }
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Show", { requirementId: OMEN_TARGETS.view, target: OMEN_TARGETS.view });
  await expectToolcraftReferenceParity(async () => true, true, { requirementId: OMEN_TARGETS.view, target: OMEN_TARGETS.view });
});
