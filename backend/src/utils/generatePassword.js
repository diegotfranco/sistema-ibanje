import crypto from 'crypto';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const genPassword = (password) => {

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 2 ** 14, r: 8, p: 5 }).toString('hex');

  fs.appendFileSync(__dirname + '/hashs.txt', `senha ${password}: ${hash}.${salt}\n\n`);
  return `${hash}.${salt}`;;
}


async function processLineByLine() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    args.forEach((val, index) => {
      console.log((index + 1) + ': ' + val);
      console.log(genPassword(val));
    });
  }
  else {
    const fileStream = fs.createReadStream('senhas.txt');

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      genPassword(line);
    }
  }
}

await processLineByLine();

