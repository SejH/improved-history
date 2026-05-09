import { assertEquals } from "@std/assert";
import List from "./list.ts";
import color from "../utils/color.ts";

const input = [
  ": 1743326021:0;source ~/.zshrc",
  ": 1743326030:0;ls",
  ": 1743326034:0;deno run compile",
  ": 1743326039:0;ls",
  ": 1743326103:0;rm improved-history",
  ": 1743326105:0;deno run compile",
  ": 1743326108:0;ls",
  ": 1743326118:0;gst",
  ": 1743326124:0;gd",
  ": 1743326130:0;gst",
  ": 1743326133:0;gco -b dev",
  ": 1743326133:0;deno test --watch",
  ": 1743326134:0;ga .",
  ": 1743326135:0;gst",
  ": 1743326135:0;gc",
  ": 1743326143:0;gst",
  ": 1743326925:0;ls",
  ": 1743326936:0;cp history_test.ts list_test.ts",
  ": 1743326967:0;tail ~/.zsh_history",
  ": 1743326977:0;tail -n 20 ~/.zsh_history",
];

const query = "deno";
const result = [2, 5, 11];

Deno.test("search finds all case-insensitive matches", () => {
  const list = new List(input);

  list.onText(query);

  assertEquals(list.searchResults, result);
});

Deno.test("search supports multi-word queries in any case", () => {
  const list = new List([
    "deno run compile",
    "git status",
    "Deno test --watch",
    "deno task dev",
  ]);

  list.onText("DENO run");

  assertEquals(list.searchResults, [0]);
  assertEquals(list["selectedIndex"], 0);
});

Deno.test("search selects a matching first item when starting at index zero", () => {
  const list = new List(["deno run compile", "deno test", "git status"]);

  list.onStart();
  list.onText("deno");

  assertEquals(list.searchResults, [0, 1]);
  assertEquals(list["selectedIndex"], 0);
});

Deno.test("searchUp moves to previous matches without overshooting the first match", () => {
  const list = new List(input);

  list.onText(query);

  assertEquals(list["selectedIndex"], 11);
  list.searchUp();
  assertEquals(list["selectedIndex"], 5);
  list.onDown();
  assertEquals(list["selectedIndex"], 6);
  list.searchUp();
  assertEquals(list["selectedIndex"], 5);
  list.searchUp();
  assertEquals(list["selectedIndex"], 2);
});

Deno.test("searchUp wraps to the last match when selection is after all results", () => {
  const list = new List(input);

  list.onEnd();
  list.onText(query);

  assertEquals(list["selectedIndex"], 11);
});

Deno.test("searchDown moves to next matches and stops at the last match", () => {
  const list = new List(input);

  list.onText(query);

  assertEquals(list["selectedIndex"], 11);
  list.onUp();
  list.searchDown();
  assertEquals(list["selectedIndex"], 11);
  list.onStart();
  assertEquals(list["selectedIndex"], 0);
  list.searchDown();
  assertEquals(list["selectedIndex"], 2);
  list.searchDown();
  assertEquals(list["selectedIndex"], 5);
  list.searchDown();
  assertEquals(list["selectedIndex"], 11);
  list.searchDown();
  assertEquals(list["selectedIndex"], 11);
});

Deno.test("arrow navigation wraps and supports repeated movement", () => {
  const list = new List(["one", "two", "three"]);

  assertEquals(list["selectedIndex"], 2);
  list.onDown();
  assertEquals(list["selectedIndex"], 0);
  list.onUp();
  assertEquals(list["selectedIndex"], 2);
  list.onUp(2);
  assertEquals(list["selectedIndex"], 0);
  list.onDown(4);
  assertEquals(list["selectedIndex"], 1);
});

Deno.test("start and end navigation select list boundaries", () => {
  const list = new List(input);

  list.onStart();
  assertEquals(list["selectedIndex"], 0);
  list.onEnd();
  assertEquals(list["selectedIndex"], input.length - 1);
});

Deno.test("backspace updates query and clears results when query becomes empty", () => {
  const list = new List(input);

  list.onStart();
  list.onDown(7);
  list.onText("deno");
  assertEquals(list["selectedIndex"], 11);

  list.onText(null);
  assertEquals(list.query, "den");
  assertEquals(list.searchResults, [2, 5, 11]);

  list.onText(null);
  list.onText(null);
  list.onText(null);
  assertEquals(list.query, "");
  assertEquals(list.searchResults, []);
  assertEquals(list["selectedIndex"], 11);
});

Deno.test("clear resets query, results, and saved selection", () => {
  const list = new List(input);

  list.onStart();
  list.onDown(4);
  list.onText("deno");
  assertEquals(list["selectedIndex"], 5);

  list.onClear();

  assertEquals(list.query, "");
  assertEquals(list.searchResults, []);
  assertEquals(list["selectedIndex"], 4);
});

Deno.test("no-match search keeps current selection and records no results", () => {
  const list = new List(input);

  list.onStart();
  list.onText("not-present");

  assertEquals(list.searchResults, []);
  assertEquals(list["selectedIndex"], 0);
});

Deno.test("enter stores and reports the selected result", () => {
  const list = new List(["first", "second", "third"]);
  let reported: string | null = null;
  list.onResult = (result) => {
    reported = result;
  };

  list.onDown();
  list.onEnter();

  assertEquals(list.result, "first");
  assertEquals(reported, "first");
  assertEquals(list["running"], false);
});

Deno.test("compact mode emits unique matching commands in result order", () => {
  const list = new List([
    "deno test",
    "git status",
    "deno test",
    "deno run compile",
  ]);
  let compacted: string[] | null = null;
  list.onCompact = (compact) => {
    compacted = compact;
  };

  list.onText("deno");
  list.compactMode();

  assertEquals(compacted, ["deno test", "deno run compile"]);
});

Deno.test("compact mode does nothing without search results", () => {
  const list = new List(["git status"]);
  let called = false;
  list.onCompact = () => {
    called = true;
  };

  list.compactMode();

  assertEquals(called, false);
});

Deno.test("unCompact delegates to callback", () => {
  const list = new List(["git status"]);
  let called = false;
  list.onUnCompact = () => {
    called = true;
  };

  list.unCompact();

  assertEquals(called, true);
});

Deno.test("list item formatting highlights selection and search matches", () => {
  const list = new List(["deno test", "git status", "deno run"]);

  list.onStart();
  list.onText("deno");

  const formatted = [0, 1, 2].map((i) => list["formatListItem"](i));
  assertEquals(formatted[0], color("> deno test", "FgCyan"));
  assertEquals(formatted[1], "1 git status");
  assertEquals(formatted[2], color("2 deno run", "FgGreen"));
});
