import crypto from 'crypto';
import Transaction from './transaction.js';
class Block {
  constructor(index, timestamp, transactions, previousHash) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.computeHash();
  }

  computeHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.previousHash +
          this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.computeHash();
    }
  }

  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash,
    };
  }

  fromJSON(obj) {
    const txns = obj.transactions.map((txnObj) => {
      const txn = new Transaction(
        txnObj.fromAddress,
        txnObj.toAddress,
        txnObj.amount
      );
      txn.timestamp = txnObj.timestamp;
      txn.signature = txnObj.signature;

      return txn;
    });
    const block = new Block(obj.index, obj.timestamp, txns, obj.previousHash);
    block.nonce = obj.nonce;
    block.hash = obj.hash;

    return block;
  }
}

export default Block;
