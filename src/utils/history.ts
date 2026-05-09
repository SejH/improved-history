export function parseHistoryLine(line: string) {
  const separatorIndex = line.indexOf(";");
  if (separatorIndex <= 0 || separatorIndex === line.length - 1) {
    return line;
  }

  return line.slice(separatorIndex + 1);
}

export function parseHistoryText(historyText: string) {
  return historyText.split("\n")
    .filter((line) => !!line)
    .map(parseHistoryLine);
}
