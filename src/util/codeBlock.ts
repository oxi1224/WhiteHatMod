export function codeBlock(lang: string, content: string) {
  return `\`\`\`${lang}\n${content}\`\`\``;
}