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

type ListItem = {
  format: () => string;
};

class List {
  private selectedIndex = 0;
  private running = true;
  private listItems: ListItem[] = [];
  private query = '';

  constructor(private items: string[]) {
    this.listItems = this.items.map((x, i) => ({
      format: () => this.selectedIndex === i ? `> ${x}` : `  ${x}`,
    }));
  }

  up() {
    this.selectedIndex = this.selectedIndex === 0 ? this.listItems.length - 1 : this.selectedIndex - 1;
  }

  down() {
    this.selectedIndex = (this.selectedIndex + 1) % this.listItems.length;
  }

  enter() {
    this.running = false;
  }

  async render() {
    const range = 10;
    let start = this.selectedIndex - range / 2;
    let end = this.selectedIndex + range / 2;
    if (start < 0) {
      start = 0;
      end = range;
    } else if (end > this.listItems.length - 1) {
      start = this.listItems.length - range;
      end = this.listItems.length;
    }

    const items = this.listItems.slice(start, end);
    items.push({ format: () => `Search: ${this.query}` });

    await renderList({
      items,
      onEnter: this.enter.bind(this),
      onUp: this.up.bind(this),
      onDown: this.down.bind(this),
      onSpace: () => {},
      onText: (s: string | null) => {
        if (s === null)
          this.query = this.query.slice(0, this.query.length - 1);
        else
        this.query += s;
      },
    });
  }

  async display() {
    while (this.running) {
      await this.render();
    }
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

async function renderList({
  items,

  onEnter,
  onSpace,
  onDown,
  onUp,
  onText,
}: {
  items: ListItem[];

  onEnter: () => void;
  onSpace?: () => void;
  onUp: () => void;
  onDown: () => void;
  onText: (s: string | null) => void;
}) {
  const lens: number[] = [];
  Deno.stdin.setRaw(true);
  const input = Deno.stdin;
  const output = Deno.stdout;

  await output.write(new TextEncoder().encode("\u001B[?25l")); // hides cursor

  for (const item of items) {
    const formattedItem = item.format();
    lens.push(formattedItem.length + 1);
    await output.write(new TextEncoder().encode(formattedItem));

    if (item !== items[items.length - 1]) {
      await output.write(new TextEncoder().encode("\n"));
    }
  }

  const data = new Uint8Array(3);
  const n = await input.read(data);

  if (!n) {
    return;
  }

  const str = new TextDecoder().decode(data.slice(0, n));

  switch (str) {
    case "\u0003": // ETX
    case "\u0004": // EOT
      throw new Error("Terminated by user.");

    case "\r": // CR
    case "\n": // LF
      onEnter();
      break;

    case "\u0020": // SPACE
      if (onSpace) {
        onSpace();
      }
      break;

    case "\u001b[A": // UP
      onUp();
      break;

    case "\u001b[B": // DOWN
      onDown();
      break;
    case "\u0008": // BACKSPACE
    case "\u007F": // BACKSPACE
      onText(null);
      break;
    default:
      onText(str);
      break;
  }
//  await output.write(new TextEncoder().encode("\u001B[?25h")); // show cursor
//  return;

  // clear list to rerender it
  for (let i = lens.length - 1; i > 0; --i) {
    // go to beginning of line
    await output.write(new TextEncoder().encode("\r"));
    // clear line
    await output.write(new TextEncoder().encode("\x1b[K"));
    // go up
    await output.write(new TextEncoder().encode("\x1b[A"));
  }
  // clear the first line
  await output.write(new TextEncoder().encode("\x1b[K"));
  await output.write(new TextEncoder().encode("\u001B[?25h")); // show cursor
}
