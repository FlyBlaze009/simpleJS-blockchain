import express from 'express';
import Blockchain from './blockchain.js';
import Transaction from './transaction.js';

const app = express();
const bc = new Blockchain();
const PORT = 3000;

app.use(express.json());

app.get('/chain', (req, res) => {
  res.status(200).json(bc.chain);
});

app.get('/balance/:address', (req, res) => {
  const balance = bc.getBalanceOfAddress(req.params.address);
  res.status(200).json({
    address: req.params.address,
    balance,
  });
});

app.get('/pending', (req, res) => {
  res.status(200).json(bc.viewPendingTransactions());
});

app.post('/transaction', (req, res) => {
  const { fromAddress, toAddress, amount, timestamp, signature } = req.body;
  try {
    const transaction = new Transaction(fromAddress, toAddress, amount);
    transaction.timestamp = timestamp;
    transaction.signature = signature;

    if (!transaction.isTransactionValid())
      return res.status(400).json({ error: 'Invalid transaction' });

    bc.addTransaction(transaction);
    res.status(201).json({ status: 'success' });
  } catch (error) {
    console.error('Error adding transaction : ', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/mine', (req, res) => {
  const { rewardAddress } = req.body;
  if (!rewardAddress)
    res.status(400).json({ error: 'Reward Address required!' });
  const success = bc.minePendingTransactions(rewardAddress);
  res.json({ success });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
