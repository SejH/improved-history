import { assertEquals } from "@std/assert";
import List from "./list.ts";

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

Deno.test(function searchTest() {
  const list = new List(input);
  list.onText(query);
  assertEquals(list.searchResults, result);
});

Deno.test(function searchUpTest() {
  const list = new List(input);

  list.onText(query);
  assertEquals(list.selectedIndex, 11);
  list.searchUp();
  assertEquals(list.selectedIndex, 5);
  list.onDown();
  assertEquals(list.selectedIndex, 6);
  list.searchUp();
  assertEquals(list.selectedIndex, 5);
  list.searchUp();
  assertEquals(list.selectedIndex, 2);
});

Deno.test(function searchDownTest() {
  const list = new List(input);
  list.onText(query);
  assertEquals(list.selectedIndex, 11);
  list.onUp();
  list.searchDown();
  assertEquals(list.selectedIndex, 11);
  list.onStart();
  assertEquals(list.selectedIndex, 0);
  list.searchDown();
  assertEquals(list.selectedIndex, 2);
  list.searchDown();
  assertEquals(list.selectedIndex, 5);
});
