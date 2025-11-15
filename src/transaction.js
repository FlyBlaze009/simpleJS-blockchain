import EC from 'elliptic';
import crypto from 'crypto';

const ec = new EC.ec('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = new Date().toISOString();
    this.signature = null;
  }

  computeHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress)
      throw new Error('Public key does not match fromAddress');

    const txnHash = this.computeHash();
    const signature = signingKey.sign(txnHash, 'hex');
    this.signature = signature.toDER('hex');
  }

  isTransactionValid() {
    if (this.fromAddress === null) return true; // reward has no fromAddress

    if (!this.signature || this.signature.length === 0)
      throw new Error('No signature in this transaction');

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.computeHash(), this.signature);
  }

  toJSON() {
    return {
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      timestamp: this.timestamp,
      signature: this.signature,
    };
  }

  fromJSON(obj) {
    const txn = new Transaction(obj.fromAddress, obj.toAddress, obj.amount);
    txn.timestamp = obj.timestamp;
    txn.signature = obj.signature;
    return txn;
  }
}

export default Transaction;
