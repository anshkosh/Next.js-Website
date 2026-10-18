import { expect, it } from "vitest";
import { mergeStartupMetadata, startupMetadataFields } from "@/lib/startup-metadata";
it("projects legacy/nullable metadata into safe typed display fields", () => {
  expect(startupMetadataFields(null).features).toEqual([]);
  const value = startupMetadataFields({ city: 42, foundedYear: "2025", features: [null, { title: "Pilot", description: "Testing", icon: "Rocket" }, { title: 12, description: "Invalid" }] });
  expect(value.city).toBe(""); expect(value.foundedYear).toBe("2025");
  expect(value.features).toEqual([{ title: "Pilot", description: "Testing", icon: "Rocket" }]);
});
it("does not use the display projection to erase legacy source identifiers on save", () => {
  expect(mergeStartupMetadata({ sourceId: "legacy", sourceProject: "migration", city: "Hyderabad" }, { city: "Delhi", twitterUrl: undefined }))
    .toEqual({ sourceId: "legacy", sourceProject: "migration", city: "Delhi" });
});
