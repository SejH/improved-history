async function main() {
  const input = Deno.stdin;
  input.setRaw(true);

  const data = new Uint8Array(8);
  const n = await input.read(data);

  if (!n) {
    return;
  }

  console.log(data);
  let result = "\\u00";
  data.slice(0, n).forEach((x) => {
    if (x >= 0x20 && x <= 0x7f) {
      const char = String.fromCharCode(x);
      result += char;
    } else {
      result += x.toString(16);
    }
  });
  console.log(result);
}

await main();
