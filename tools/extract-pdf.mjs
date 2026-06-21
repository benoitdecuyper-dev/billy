import fs from 'node:fs';
import { PDFParse } from 'pdf-parse';
const buf = fs.readFileSync(process.argv[2]);
const parser = new PDFParse({ data: new Uint8Array(buf) });
const res = await parser.getText();
process.stdout.write(res.text);
