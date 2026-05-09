import List from "./components/list.ts";

const [historyFile] = Deno.args;
if (!historyFile) {
  console.error("Usage: improved-history <historyFile>");
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
  list = new List(items, Math.floor(Deno.consoleSize().rows / 4));
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
    console.log(result);
    Deno.exit(0);
  };

  list.display();
};

createList(inputList);
