import List from "./list.ts";

const historyText = await Deno.readTextFile(Deno.env.get('HOME') + "/.zsh_history");
const inputList = historyText.split('\n')
  .filter(l => !!l)
  .map(l => (l.match(/^[^;]+;(.+)$/)?.[1] || ''));

const list = new List(inputList);
await list.display();
