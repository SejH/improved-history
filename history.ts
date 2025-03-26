function match(line: string, query: string) {
  return line.toLowerCase().includes(query.toLowerCase());
}

export function search(history: string[], query: string) {
  return history.reduce((acc, line) => {
    if (match(line, query)) {
      acc.push(history.indexOf(line));
    }
    return acc;
  }, [] as number[]);
}
