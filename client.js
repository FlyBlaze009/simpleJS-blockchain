import crypto from 'crypto';
import EC from 'elliptic';
import fs from 'fs';

const url = 'http://localhost:3000/transaction';
const key_path = './data/private.key';
const ec = new EC.ec('secp256k1');

function getKey() {
  // if key exists locally, get it, otherwise generate new key
  if (fs.existsSync(key_path)) {
    console.log('Local key found!');
    return fs.readFileSync(key_path, 'utf8').trim();
  }
  console.log('No local key found, generating new key');
  const key = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(key_path, key);
  return key;
}

function computeHash(fromAddress, toAddress, amount, timestamp) {
  return crypto
    .createHash('sha256')
    .update(fromAddress + toAddress + amount + timestamp)
    .digest('hex');
}

async function main() {
  const args = process.argv.slice(2);
  const toAddress = args[0];
  const amount = parseFloat(args[1]);

  if (!toAddress || isNaN(amount)) {
    console.error('Invalid arguments passed');
    console.error('Use : node client.js <recipientPublicKey> <amount>');
    process.exit(1);
  }

  const privateKey = getKey();
  const keypair = ec.keyFromPrivate(privateKey);
  const publicKey = keypair.getPublic('hex');

  console.log('Private Key : ', privateKey);
  console.log('Public Key : ', publicKey);

  const timestamp = new Date().toISOString();

  const hash = await computeHash(publicKey, toAddress, amount, timestamp);
  const signature = keypair.sign(hash, 'hex').toDER('hex');
  const data = {
    fromAddress: publicKey,
    toAddress,
    amount,
    timestamp,
    signature,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.status == 201) console.log('Success');
  else console.log(response.error);
}

main();
