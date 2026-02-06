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

function hideCursor() {
  Deno.stdout.write(new TextEncoder().encode("\u001B[?25l"));
}

function showCursor() {
  Deno.stdout.write(new TextEncoder().encode("\u001B[?25h"));
}

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
  const output = Deno.stdout;
  input.setRaw(true);

  hideCursor();
  for (const item of list) {
    const formattedItem = item.format();

    // Hack to get the length of the displayed characters
    const displayedLength = formattedItem.endsWith("\x1b[0m")
      ? formattedItem.length - 9
      : formattedItem.length;
    printedLines += Math.ceil(displayedLength / terminalWidth);
    await output.write(new TextEncoder().encode(formattedItem));

    if (item !== list[list.length - 1]) {
      await output.write(new TextEncoder().encode("\n"));
    }
  }
  showCursor();

  const data = new Uint8Array(4);
  const n = await input.read(data);

  if (!n) {
    return;
  }

  hideCursor();
  // clear list to rerender it
  while (--printedLines) {
    // go to beginning of line
    await output.write(new TextEncoder().encode("\r"));
    // clear line
    await output.write(new TextEncoder().encode("\x1b[K"));
    // go up
    await output.write(new TextEncoder().encode("\x1b[A"));
  }
  // clear the first line
  await output.write(new TextEncoder().encode("\x1b[K"));
  showCursor();
  input.setRaw(false);

  const str = new TextDecoder().decode(data.slice(0, n));
  if (handlers[str]) {
    handlers[str]();
  } else {
    defaultHandler(str);
  }
}
