type ListItem = {
  format: () => string;
};

const BACKSPACE = null;

export default class List {
  private selectedIndex = 0;
  private running = true;
  private listItems: ListItem[] = [];
  private query = '';

  constructor(private items: string[]) {
    this.listItems = this.items.map((x, i) => ({
      format: () => this.selectedIndex === i ? `> ${x}` : `  ${x}`,
    }));
  }

  onUp() {
    this.selectedIndex = this.selectedIndex === 0 ? this.listItems.length - 1 : this.selectedIndex - 1;
  }

  onDown() {
    this.selectedIndex = (this.selectedIndex + 1) % this.listItems.length;
  }

  onEnter() {
    this.running = false;
  }

  onText(s: string | typeof BACKSPACE) {
    if (s === BACKSPACE)
      this.query = this.query.slice(0, this.query.length - 1);
    else
      this.query += s;
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

    const list = this.listItems.slice(start, end);
    list.push({ format: () => `Search: ${this.query}` });
    await this.renderList(list);
  }

  async display() {
    while (this.running) {
      await this.render();
    }
  }

  async renderList(list: ListItem[]) {
    const lens: number[] = [];
    Deno.stdin.setRaw(true);
    const input = Deno.stdin;
    const output = Deno.stdout;

    await output.write(new TextEncoder().encode("\u001B[?25l")); // hides cursor
    for (const item of list) {
      const formattedItem = item.format();
      lens.push(formattedItem.length + 1);
      await output.write(new TextEncoder().encode(formattedItem));

      if (item !== list[list.length - 1]) {
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
      this.onEnter();
      break;

//      case "\u0020": // SPACE
//      this.onSpace();
//      break;

      case "\u001b[A": // UP
      this.onUp();
      break;

      case "\u001b[B": // DOWN
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
}
