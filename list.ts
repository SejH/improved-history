type ListItem = {
  format: () => string;
};

const BACKSPACE = null;

function logToFile(...args: any[]) {
  // Deno.writeTextFile("./list.log", args.join(" ") + "\n", { append: true });
}

const consoleColors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  FgGray: "\x1b[90m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
  BgGray: "\x1b[100m",
};

function colorString(x: string, color: keyof typeof consoleColors) {
  return `${consoleColors[color]}${x}${consoleColors.Reset}`;
}

export default class List {
  private displayRange: number = Math.floor(Deno.consoleSize().rows / 2);
  public selectedIndex = 0;
  private running = true;
  private listItems: ListItem[] = [];
  public query = "";
  public searchResults: number[] = [];
  public result: string | null = null;

  constructor(private items: string[]) {
    this.selectedIndex = this.items.length - 1;
    this.listItems = this.items.map((x, i) => ({
      format: () => {
        if (this.selectedIndex === i) {
          return colorString(`> ${x}`, "FgCyan");
        }
        if (this.searchResults.includes(i)) {
          return colorString(`  ${x}`, "FgGreen");
        }
        return `  ${x}`;
      },
    }));
  }

  onUp() {
    this.selectedIndex = (this.selectedIndex - 1 + this.listItems.length) %
      this.listItems.length;
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
    this.result = this.items[this.selectedIndex];
  }

  exit() {
    this.running = false;
    this.result = "";
  }

  onClear() {
    if (this.query === "") // Quick way to exit the program Crl-k Crl-k
      this.exit();
    this.query = "";
    this.searchResults = [];
  }

  searchUp() {
    // Find previous search result relative to selectedIndex
    const index = this.searchResults.findIndex((resultIndex) =>
      resultIndex >= this.selectedIndex
    );
    if (index === -1 && this.searchResults.length > 0) {
      this.selectedIndex = this.searchResults[this.searchResults.length - 1];
      return;
    }
    if (index === 0) {
      return;
    }
    this.selectedIndex = this.searchResults[index - 1];
  }

  searchDown() {
    // Find next search result relative to selectedIndex
    this.selectedIndex = this.searchResults
      .find((resultIndex) => resultIndex > this.selectedIndex) ||
      this.selectedIndex;
  }

  onText(s: string | typeof BACKSPACE) {
    if (s === BACKSPACE) {
      this.query = this.query.slice(0, this.query.length - 1);
    } else {
      this.query += s;
    }

    this.searchResults = this.search();
    if (this.searchResults.length === 0) {
      return;
    }

    this.selectedIndex = this.searchResults
      .find((resultIndex) => resultIndex >= this.selectedIndex) ||
      this.searchResults[this.searchResults.length - 1];
  }

  search() {
    const match = (line: string, query: string) => {
      return query.split(" ").every((word) =>
        line.toLowerCase().includes(word.toLowerCase())
      );
    };

    if (this.query.length === 0) {
      return [];
    }

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

    const str = new TextDecoder().decode(data.slice(0, n));

    switch (str) {
      case "\u0003": // ETX
      case "\u0004": // EOT
        this.exit();
        break;

      case "\r": // CR
      case "\n": // LF
        this.onEnter();
        break;

      case "\u0012": // Crl-r
        this.searchUp();
        break;
      case "\u0013": // Crl-s
        this.searchDown();
        break;

      case "\u001bn": // M-n
        this.onEnd();
        break;

      case "\u001bp": // M-p
        this.onStart();
        break;

      case "\u001b[A": // UP
      case "\u001bOA": // UP
      case "\u0010": // Crl-p
        this.onUp();
        break;

      case "\u001b[B": // DOWN
      case "\u001bOB": // DOWN
      case "\u000e": // Crl-n
        this.onDown();
        break;

      case "\u000B":
        this.onClear();
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
    Deno.stdin.setRaw(false);
  }
}
