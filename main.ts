import List from "./list.ts";

const [commandFile, historyFile] = Deno.args;
if (!commandFile || !historyFile) {
  console.error("Usage: improved-history <commandFile> <historyFile>");
  Deno.exit(1);
}

const historyText = await Deno.readTextFile(historyFile);
const inputList = historyText.split("\n")
  .filter((l) => !!l)
  .map((l) => (l.match(/^[^;]+;(.+)$/)?.[1] || ""));

const list = new List(inputList);
await list.display();

// write command to commandFile to be read by shell
if (list.result) {
  const encoder = new TextEncoder();
  const data = encoder.encode(list.result);
  Deno.writeFileSync(commandFile, data);
}
