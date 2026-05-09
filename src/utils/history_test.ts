import { assertEquals } from "@std/assert";
import { parseHistoryLine, parseHistoryText } from "./history.ts";

Deno.test("parseHistoryLine removes zsh metadata before the first separator", () => {
  assertEquals(
    parseHistoryLine(": 1743326034:0;deno run compile"),
    "deno run compile",
  );
});

Deno.test("parseHistoryLine keeps lines without zsh metadata", () => {
  assertEquals(parseHistoryLine("git status"), "git status");
});

Deno.test("parseHistoryLine keeps lines without text on both sides of the separator", () => {
  assertEquals(parseHistoryLine(";git status"), ";git status");
  assertEquals(parseHistoryLine("git status;"), "git status;");
});

Deno.test("parseHistoryLine preserves semicolons inside the command", () => {
  assertEquals(
    parseHistoryLine(": 1743326034:0;echo one; echo two"),
    "echo one; echo two",
  );
});

Deno.test("parseHistoryText skips empty lines and parses commands", () => {
  const historyText = [
    ": 1743326034:0;deno run compile",
    "",
    "git status",
    ": 1743326039:0;echo one; echo two",
    "",
  ].join("\n");

  assertEquals(parseHistoryText(historyText), [
    "deno run compile",
    "git status",
    "echo one; echo two",
  ]);
});
