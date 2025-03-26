import { assertEquals } from "@std/assert";
import { search } from "./history.ts";

Deno.test(function addTest() {
  const input = [
    '10067  dd/mm/yyyy  lls',
    '10068  dd/mm/yyyy  ls',
    '10069  dd/mm/yyyy  deno run main.ts',
    '10070  dd/mm/yyyy  echo "foo" | deno run main.ts',
    '10071  dd/mm/yyyy  tmux',
    '10072  dd/mm/yyyy  ls',
    '10073  dd/mm/yyyy  deno',
    '10074  dd/mm/yyyy  ls',
    '10075  dd/mm/yyyy  cp main_test.ts history_test.ts',
    '10076  dd/mm/yyyy  ls',
    '10076  dd/mm/yyyy  test Deno',
  ];
  const result = [2, 3, 6, 10];
  result.forEach(x => console.log('expected:', input[x]));
  assertEquals(search(input, 'deno'), result);
});
