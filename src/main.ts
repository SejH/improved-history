import List from "./components/list.ts";
import { parseHistoryText } from "./utils/history.ts";

const [historyFile] = Deno.args;
if (!historyFile) {
  console.error("Usage: improved-history <historyFile>");
  Deno.exit(1);
}

const historyText = await Deno.readTextFile(historyFile);
const inputList = parseHistoryText(historyText);

const inputListHistory: string[][] = [];

let list: List | null = null;
const createList = async (items: string[]) => {
  await list ?.exit();
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
