export function normalizeText(text:string):string{
 return text.replace(/\r\n?/g,'\n').normalize('NFC').split('\n').map(line=>{let result='';for(const c of line){result+=c==='\t'?' '.repeat(4-Array.from(result).length%4):c;}return result}).join('\n');
}

