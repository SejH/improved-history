type ListItem = {
  format: () => string;
};

const BACKSPACE = null;

function logToFile(...args: any[]) {
  // Deno.writeTextFile("./list.log", args.join(" ") + "\n", { append: true });
}

export default class List {
  private displayRange: number = 20;
  private selectedIndex = 0;
  private running = true;
  private listItems: ListItem[] = [];
  private query = '';
  private searchResults: number[] = [];
  private searchIndex: number | null = null;

  constructor(private items: string[]) {
    this.selectedIndex = this.items.length - 1;
    this.listItems = this.items.map((x, i) => ({
      format: () => this.selectedIndex === i ? `> ${x}` : `  ${x}`,
    }));
  }

  onUp() {
    this.selectedIndex = (this.selectedIndex - 1 + this.listItems.length) % this.listItems.length;
  }

  onDown() {
    this.selectedIndex = (this.selectedIndex + 1) % this.listItems.length;
  }

  onStart() {
    this.selectedIndex = 0;
  }

  onEnd() {
    this.selectedIndex = this.listItems.length - 1;
  }

  onEnter() {
    this.running = false;
  }

  searchUp() {
    if (this.searchIndex === null)
      return;
    this.searchIndex = (this.searchIndex - 1 + this.searchResults.length) % this.searchResults.length;
    this.selectedIndex = this.searchResults[this.searchIndex];
  }
  searchDown() {
    if (this.searchIndex === null)
      return;
    this.searchIndex = (this.searchIndex + 1) % this.searchResults.length;
    this.selectedIndex = this.searchResults[this.searchIndex];
  }

  onText(s: string | typeof BACKSPACE) {
    if (s === BACKSPACE)
      this.query = this.query.slice(0, this.query.length - 1);
    else
      this.query += s;

    if (this.query.length > 0) {
      this.searchResults = this.search();
      // logToFile("search", this.searchResults);
      if (this.searchResults.length > 0) {
        // find next match after current selection
        this.searchIndex = this.searchResults.findIndex(i => i >= this.selectedIndex);
        if (this.searchIndex === -1)
          this.searchIndex = this.searchResults.length - 1;

        this.selectedIndex = this.searchResults[this.searchIndex];
      } else {
        this.searchIndex = null;
      }
    } else {
      this.searchIndex = null;
    }
  }

  search() {
    const match = (line: string, query: string) => {
      return line.toLowerCase().includes(query.toLowerCase());
    };

    return this.items.reduce((acc, line, index) => {
      if (match(line, this.query)) {
        acc.push(index);
      }
      return acc;
    }, [] as number[]);
  }

  async render() {
    let start = this.selectedIndex - this.displayRange / 2;
    let end = this.selectedIndex + this.displayRange / 2;
    if (start < 0) {
      start = 0;
      end = this.displayRange;
    } else if (end > this.listItems.length - 1) {
      start = this.listItems.length - this.displayRange;
      end = this.listItems.length;
    }

    const list = this.listItems.slice(start, end);
    list.push({ format: () => `Search: ${this.query}` });
    await this.renderList(list);
  }

  async display() {
    while (this.running) {
      try {
        await this.render();
      } catch {
        console.log();
        return;
      }
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(this.items[this.selectedIndex]);
    Deno.writeFileSync("/tmp/improved-history_command", data);
  }

  private hideCursor() {
    Deno.stdout.write(new TextEncoder().encode("\u001B[?25l"));
  }

  private showCursor() {
    Deno.stdout.write(new TextEncoder().encode("\u001B[?25h"));
  }

  private async renderList(list: ListItem[]) {
    let printedLines = 0;
    const terminalWidth = Deno.consoleSize().columns;
    Deno.stdin.setRaw(true);
    const input = Deno.stdin;
    const output = Deno.stdout;

    this.hideCursor();
    for (const item of list) {
      const formattedItem = item.format();
      printedLines += Math.ceil(formattedItem.length / terminalWidth);
      await output.write(new TextEncoder().encode(formattedItem));

      if (item !== list[list.length - 1]) {
        await output.write(new TextEncoder().encode("\n"));
      }
    }
    this.showCursor();

    const data = new Uint8Array(3);
    const n = await input.read(data);

    if (!n) {
      return;
    }

    // logToFile("input:", data.slice(0, n).map(x => x.toString(16)).join(","));
    logToFile("input:", data.slice(0, n));

    const str = new TextDecoder().decode(data.slice(0, n));
    logToFile('len:', str.length)
    logToFile('input:', str, '\n');
    switch (str) {
      case "\u0003": // ETX
      case "\u0004": // EOT
      throw new Error("Terminated by user.");

      case "\r": // CR
      case "\n": // LF
      logToFile('enter!');
      this.onEnter();
      break;

      case "\u0012": // Crl-r
      this.searchUp();
      break;
      case "\u0013": // Crl-s
      this.searchDown();
      break;

      case "\u001bn":
        this.onEnd();
      break;

      case "\u001bp":
        this.onStart();
      break;

      case "\u001b[A": // UP
      case "\u001bOA":
      case "\u0010":
      this.onUp();
      break;

      case "\u001b[B": // DOWN
      case "\u001bOB":
      case "\u000e":
      this.onDown();
      break;

      case "\u0008": // BACKSPACE
      case "\u007F": // BACKSPACE
      this.onText(BACKSPACE);
      break;
      default:
        this.onText(str);
      break;
    }

    this.hideCursor();
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
    this.showCursor();
  }
}
