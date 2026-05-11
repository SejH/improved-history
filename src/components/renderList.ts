/*
export type Inputs = {
  [key: string]: () => void;
  default: (str: string) => void;
};
*/

export type InputHandlers = {
  [key: string]: () => void;
};

export type DefaultInputHandler = (str: string) => void;

export type ListItem = {
  format: () => string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const HIDE_CURSOR = "[?25l";
const SHOW_CURSOR = "[?25h";

export async function renderList(
  list: ListItem[],
  { handlers, defaultHandler }: {
    handlers: InputHandlers;
    defaultHandler: DefaultInputHandler;
  },
) {
  let printedLines = 0;
  const terminalWidth = Deno.consoleSize().columns;
  const input = Deno.stdin;
  const output = Deno.stderr;
  input.setRaw(true);

  const parts: string[] = [HIDE_CURSOR];
  for (const item of list) {
    const formattedItem = item.format();

    const displayedLength = formattedItem.replace(/\x1b\[[0-9;]*m/g, "").length;
    printedLines += Math.ceil(displayedLength / terminalWidth);
    parts.push(formattedItem);

    if (item !== list[list.length - 1]) {
      parts.push("\n");
    }
  }
  parts.push(SHOW_CURSOR);
  await output.write(encoder.encode(parts.join("")));

  const data = new Uint8Array(4);
  const n = await input.read(data);

  if (!n) {
    return;
  }

  const clearParts: string[] = [HIDE_CURSOR];
  let linesToClear = printedLines;
  // clear list to rerender it
  while (--linesToClear) {
    // go to beginning of line, clear line, go up
    clearParts.push("\r\x1b[K\x1b[A");
  }
  // clear the first line
  clearParts.push("\x1b[K");
  clearParts.push(SHOW_CURSOR);
  await output.write(encoder.encode(clearParts.join("")));
  input.setRaw(false);

  const str = decoder.decode(data.slice(0, n));
  if (handlers[str]) {
    handlers[str]();
  } else {
    defaultHandler(str);
  }
}
