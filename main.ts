import List from "./list.ts";

const [commandFile, historyFile] = Deno.args;
if (!commandFile || !historyFile) {
  console.error("Usage: improved-history <commandFile> <historyFile>");
  Deno.exit(1);
}

const historyText = await Deno.readTextFile(historyFile);
const inputList = historyText.split("\n")
  .filter((l) => !!l)
  .map((l) => (l.match(/^[^;]+;(.+)$/)?.[1] || l));

const inputListHistory: string[][] = [];

let list: List | null = null;
const createList = async (items: string[]) => {
  await list?.exit();
  // await new Promise(resolve => setTimeout(resolve, 1000));
  list = new List(items);
  list.onCompact = (compact) => {
    inputListHistory.push(items);
    createList(compact);
  };

  list.onUnCompact = () => {
    const prevList = inputListHistory.pop();
    if (!prevList) {
      return;
    }
    createList(prevList);
  };

  list.onResult = (result) => {
    if (!result) {
      return;
    }
    // write command to commandFile to be read by shell
    const encoder = new TextEncoder();
    const data = encoder.encode(result);
    Deno.writeFileSync(commandFile, data);
    Deno.exit(0);
  }

  list.display();
}

createList(inputList);
