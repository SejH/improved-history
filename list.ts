import { InputHandlers, ListItem, renderList } from "./renderList.ts";
import color from "./color.ts";

const BACKSPACE = null;

function logToFile(...args: any[]) {
  // Deno.writeTextFile("./list.log", args.join(" ") + "\n", { append: true });
}

export default class List {
  private displayRange: number = Math.floor(Deno.consoleSize().rows / 4);
  public selectedIndex = 0;
  private savedIndex: number | null = null;
  private running = true;
  private listItems: ListItem[] = [];
  public query = "";
  public searchResults: number[] = [];
  public result: string | null = null;
  private rendering: Promise<void> | null = null;
  public onCompact: (compact: string[]) => void = () => {};
  public onUnCompact: () => void = () => {};
  public onResult: (result: string | null) => void = () => {};

  constructor(private items: string[]) {
    this.selectedIndex = this.items.length - 1;
    this.generateListItems();
  }

  private generateListItems() {
    this.listItems = this.items.map((x, i) => ({
      format: () => {
        const numLen = (n: number) => {
          return n.toString().length;
        };
        const paddingLength = numLen(this.items.length);
        const padding = (reduce = 0) => {
          return " ".repeat(paddingLength - reduce);
        };
        if (this.selectedIndex === i) {
          return color(`${padding(1)}> ${x}`, "FgCyan");
        }
        if (this.searchResults.includes(i)) {
          return color(`${i}${padding(numLen(i))} ${x}`, "FgGreen");
        }
        return `${i}${padding(numLen(i))} ${x}`;
      },
    }));
  }

  onUp() {
    this.savedIndex = null;
    this.selectedIndex = (this.selectedIndex - 1 + this.listItems.length) %
      this.listItems.length;
  }

  onDown() {
    this.savedIndex = null;
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
    this.onResult(this.result);
  }

  async exit() {
    this.running = false;
    this.result = "";
    await this.rendering;
  }

  onClear() {
    if (this.query === "") { // Quick way to exit the program Crl-k Crl-k
      this.exit();
    }
    this.query = "";
    if (this.savedIndex !== null) {
      this.selectedIndex = this.savedIndex;
    }
    this.savedIndex = null;
    this.searchResults = [];
  }

  searchUp() {
    // Find previous search result relative to selectedIndex
    const index = this.searchResults.findIndex((resultIndex) =>
      resultIndex >= this.selectedIndex
    );
    if (index === -1) {
      if (this.searchResults.length > 0) {
        this.selectedIndex = this.searchResults[this.searchResults.length - 1];
      }
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
      if (this.query === "") {
        this.savedIndex = this.selectedIndex;
      }
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

  compactMode() {
    if (this.searchResults.length === 0) {
      return;
    }

    const compact = [
      ...new Set(this.searchResults.map((i) => this.items[i])),
    ];
    this.onCompact(compact);
  }

  unCompact() {
    this.onUnCompact();
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
    await renderList(list, {
      handlers: this.inputHandlers,
      defaultHandler: (str) => this.onText(str),
    });
  }

  private inputHandlers: InputHandlers = {
    "\u0003": this.exit.bind(this), // ETX
    "\u0004": this.exit.bind(this), // EOT

    "\r": this.onEnter.bind(this), // CR
    "\n": this.onEnter.bind(this), // LF

    "\u0012": this.searchUp.bind(this), // Crl-r

    "\u0013": this.searchDown.bind(this), // Crl-s

    "\u001bp": this.onStart.bind(this), // M-p

    "\u001bn": this.onEnd.bind(this), // M-n

    "\u001b[A": this.onUp.bind(this), // UP
    "\u001bOA": this.onUp.bind(this), // UP
    "\u0010": this.onUp.bind(this), // Crl-p

    "\u001b[B": this.onDown.bind(this), // DOWN
    "\u001bOB": this.onDown.bind(this), // DOWN
    "\u000e": this.onDown.bind(this), // Crl-n

    "\u000B": this.onClear.bind(this), // Crl-k

    "\u0015": this.compactMode.bind(this), // Crl-u
    "\u0009": this.unCompact.bind(this), // Crl-i

    "\u0008" : this.onText.bind(this, BACKSPACE), // BACKSPACE
    "\u007F" : this.onText.bind(this, BACKSPACE), // BACKSPACE
  };

  async display() {
    while (this.running) {
      this.rendering = this.render();
      await this.rendering;
    }
  }
}
