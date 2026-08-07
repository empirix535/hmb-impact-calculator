import { defineMcp } from "@lovable.dev/mcp-js";
import compareCoverageTargets from "./tools/compare-coverage-targets";
import getCountryInputs from "./tools/get-country-inputs";
import listCountries from "./tools/list-countries";
import runBudgetImpact from "./tools/run-budget-impact";

export default defineMcp({
  name: "impact-navigator",
  title: "Impact Navigator",
  version: "0.1.0",
  instructions:
    "Tools for the H-IUD Heavy Menstrual Bleeding budget impact model. Use `list_countries` to see available countries, `get_country_inputs` for a country's cost/effectiveness/DALY parameters, `run_budget_impact` for a single 5-year scenario at a chosen H-IUD coverage target, and `compare_coverage_targets` to sweep several targets at once. All model parameters are built into the app; nothing is user-specific.",
  tools: [listCountries, getCountryInputs, runBudgetImpact, compareCoverageTargets],
});
