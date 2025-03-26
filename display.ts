import { search } from "./history.ts";

export function display(history: string[], query: string) {
  const results = search(history, query);
  results.forEach(x => console.log(history[x]));
}
