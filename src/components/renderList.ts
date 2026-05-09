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

async function writeOutput(output: typeof Deno.stderr, text: string) {
  await output.write(encoder.encode(text));
}

async function hideCursor(output: typeof Deno.stderr) {
  await writeOutput(output, "\u001B[?25l");
}

async function showCursor(output: typeof Deno.stderr) {
  await writeOutput(output, "\u001B[?25h");
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
  const output = Deno.stderr;
  input.setRaw(true);

  await hideCursor(output);
  for (const item of list) {
    const formattedItem = item.format();

    // Hack to get the length of the displayed characters
    const displayedLength = formattedItem.endsWith("\x1b[0m")
      ? formattedItem.length - 9
      : formattedItem.length;
    printedLines += Math.ceil(displayedLength / terminalWidth);
    await writeOutput(output, formattedItem);

    if (item !== list[list.length - 1]) {
      await writeOutput(output, "\n");
    }
  }
  await showCursor(output);

  const data = new Uint8Array(4);
  const n = await input.read(data);

  if (!n) {
    return;
  }

  await hideCursor(output);
  // clear list to rerender it
  while (--printedLines) {
    // go to beginning of line
    await writeOutput(output, "\r");
    // clear line
    await writeOutput(output, "\x1b[K");
    // go up
    await writeOutput(output, "\x1b[A");
  }
  // clear the first line
  await writeOutput(output, "\x1b[K");
  await showCursor(output);
  input.setRaw(false);

  const str = new TextDecoder().decode(data.slice(0, n));
  if (handlers[str]) {
    handlers[str]();
  } else {
    defaultHandler(str);
  }
}
