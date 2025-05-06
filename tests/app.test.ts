import { expect, test } from "vitest";
import { Application } from "@/app";

test("able to create application", () => {
  expect(new Application()).toBeDefined();
});
