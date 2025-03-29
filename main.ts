import List from "./list.ts";

if (Deno.stdin.isTerminal()) {
  // console.log('Running in terminal: Exiting')
//  Deno.exit(0);
}

if (!Deno.stdin.isTerminal()) {
  const decoder = new TextDecoder();
  for await (const chunk of Deno.stdin.readable) {
    const text = decoder.decode(chunk);
    console.log(text);
  }
}

const items = [
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


const list = new List(items);
await list.display();


