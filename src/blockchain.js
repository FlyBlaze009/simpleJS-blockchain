import Block from './block.js';
import Transaction from './transaction.js';
import * as fs from 'fs';

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.rewardValue = 50;

    this.loadFromFile(); // load local data if available
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(rewardAddress) {
    let latestBlock = this.getLatestBlock();
    let newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      [...this.pendingTransactions],
      latestBlock.hash
    );

    newBlock.mineBlock(this.difficulty);

    if (
      newBlock.previousHash !== latestBlock.hash ||
      newBlock.hash !== newBlock.computeHash()
    ) {
      console.log('Cannot add new block because the hash does not match');
      return false;
    }

    this.chain.push(newBlock);
    this.pendingTransactions = [
      new Transaction(null, rewardAddress, this.rewardValue),
    ];
    this.saveToFile();
    return true;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      if (
        currentBlock.previousHash !== previousBlock.hash ||
        currentBlock.hash !== currentBlock.computeHash()
      )
        return false;

      for (const trans of currentBlock.transactions) {
        if (!trans.isTransactionValid()) return false;
      }
    }

    return true;
  }

  addTransaction(txn) {
    if (this.getBalanceOfAddress(txn.fromAddress) < txn.amount)
      throw new Error('Insufficient Balance');
    if (txn.fromAddress === null)
      throw new Error('Cannot add reward transaction manually');
    if (!txn.isTransactionValid()) throw new Error('Invalid Transaction');
    this.pendingTransactions.push(txn);
    this.saveToFile();
  }

  viewPendingTransactions() {
    return this.pendingTransactions;
  }

  getBalanceOfAddress(address) {
    let balance = 0;
    // compute from chain
    for (const block of this.chain) {
      for (const txn of block.transactions) {
        if (txn.fromAddress === address) balance -= txn.amount;
        if (txn.toAddress === address) balance += txn.amount;
      }
    }

    //compute from pending transactions
    for (const txn of this.pendingTransactions) {
      if (txn.fromAddress === null) continue; // to prevent unmined rewards from being spent early
      if (txn.fromAddress === address) balance -= txn.amount;
      if (txn.toAddress === address) balance += txn.amount;
    }

    return balance;
  }

  saveToFile() {
    const blocksJSON = this.chain.map((b) => b.toJSON());
    const pendingTransactionsJSON = this.pendingTransactions.map((pt) =>
      pt.toJSON()
    );
    const blockchainToFile = {
      version: '1.0',
      createdAt: new Date().toDateString(),
      chain: blocksJSON,
      pendingTransactions: pendingTransactionsJSON,
    };
    fs.writeFileSync(
      './data/blockchain.json',
      JSON.stringify(blockchainToFile)
    );
  }

  loadFromFile() {
    const filePath = './data/blockchain.json';
    if (!fs.existsSync(filePath)) {
      console.log('No local blockchain found, starting new chain...');
      return;
    }
    console.log('Loading local blockchain from data/blockchain.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    this.chain = data.chain.map((b) => {
      const txns = b.transactions.map((t) => {
        const txn = new Transaction(t.fromAddress, t.toAddress, t.amount);
        txn.timestamp = t.timestamp;
        txn.signature = t.signature;

        return txn;
      });

      const block = new Block(b.index, b.timestamp, txns, b.previousHash);
      block.nonce = b.nonce;
      block.hash = b.hash;

      return block;
    });
    if (!this.isChainValid()) {
      console.error('Invalid chain detected');
      this.chain = [this.createGenesisBlock()];
      return;
    }

    this.pendingTransactions = data.pendingTransactions.map((t) => {
      const txn = new Transaction(t.fromAddress, t.toAddress, t.amount);
      txn.timestamp = t.timestamp;
      txn.signature = t.signature;
      if (!txn.isTransactionValid()) {
        console.error('Invalid pending transaction in local data');
        return;
      }
      return txn;
    });

    console.debug('Loaded blockchain successfully!');
  }
}

export default Blockchain;
