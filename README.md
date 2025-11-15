# SimpleJS-Blockchain

A minimal, educational blockchain implementation in Node.js. This project implements a simplified proof-of-work blockchain with elliptic-curve-signed transactions, local persistence, and a small HTTP API to interact with the chain. It's intended for learning and experimentation — **not** for production use.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project structure](#project-structure)
- [How it works (high level)](#how-it-works-high-level)
- [Running the project](#running-the-project)
- [API endpoints](#api-endpoints)
- [Client usage](#client-usage)
- [Data persistence](#data-persistence)
- [Security & caveats](#security--caveats)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- Basic block structure with `index`, `timestamp`, `transactions`, `previousHash`, `nonce`, and `hash`.
- SHA-256 hashing for blocks and transactions.
- Proof-of-work mining (configurable difficulty).
- Transaction signing and validation with `elliptic` (secp256k1).
- Simple mining reward mechanism.
- Local persistence to `./data/blockchain.json` so the chain and pending transactions survive restarts.
- Minimal Express HTTP API to inspect the chain, check balances, submit transactions, and trigger mining.

---

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

## Installation

```bash
# clone repository
git clone <your-repo-url>
cd <repo-folder>

# install dependencies
npm install
# or
# yarn install
```

Create a `data` folder at the project root (used for storing keys and blockchain state):

```bash
mkdir -p data
```

## Project structure

```
.
├─ data/                     # Local persistence (blockchain.json, private.key)
├─ src/                      # Source code
│  ├─ block.js               # Block class
│  ├─ blockchain.js          # Blockchain class (chain, mining, persistence)
│  ├─ transaction.js         # Transaction class (signing & validation)
│  └─ server.js              # Express API (chain, balance, pending, tx, mine)
├─ client.js                 # CLI client to create & sign transactions
├─ package.json
└─ README.md
```

````

> The code uses ES Modules (`import`/`export`) — ensure `"type": "module"` is present in `package.json` or run with appropriate flags.

---

## How it works (high level)

1. Transactions are created and signed by the sender using a secp256k1 private key.
2. Signed transactions are posted to the server and stored in `pendingTransactions`.
3. When mining is triggered, a new `Block` is created containing all pending transactions and the block is mined (proof-of-work) until its hash has a prefix of `difficulty` zeroes.
4. Once mined and validated, the block is appended to the chain and the miner receives a reward transaction which is added to `pendingTransactions` for the next block.
5. The blockchain persists to `./data/blockchain.json` after every successful mine or when transactions change.

---

## Running the project

Start the server:

```bash
node src/server.js
````

By default the server listens on port `3000`. You should see `Server running on port 3000` in the console.

---

## API endpoints

**GET /chain**

Returns the full blockchain (array of blocks).

**GET /balance/:address**

Returns the balance of the requested public key/address.

**GET /pending**

Returns the list of pending (unmined) transactions.

**POST /transaction**

Submit a signed transaction. JSON body shape:

```json
{
  "fromAddress": "<senderPublicKey>",
  "toAddress": "<recipientPublicKey>",
  "amount": "<amountToSend>",
  "timestamp": "...",
  "signature": "..."
}
```

Response: `201` on success or `400` with error message.

**POST /mine**

Trigger mining. JSON body:

```json
{ "rewardAddress": "<minerPublicKey>" }
```

Response JSON contains `success: true/false`.

---

## Client usage (example)

A simple client (`client.js`) helps create a signed transaction and POST it to the server.

Usage:

```bash
node client.js <recipientPublicKey> <amount>
```

On first run the client will generate and save a private key at `./data/private.key` (hex). It logs the private & public keys to the console (for learning only).

**Important:** The example client uses a locally-stored private key in plain hex — this is insecure and only intended for experimentation.

---

## Data persistence

The blockchain and pending transactions are written to `./data/blockchain.json` by `saveToFile()` and reloaded by `loadFromFile()` at startup. If an invalid chain or invalid pending transaction is detected, the loader will reset to the genesis block.

---

## Security & caveats

This project is intentionally minimal and educational. Important limitations:

- Not production-ready. No networking consensus between nodes (single-node local chain only).
- Proof-of-work difficulty is tiny (default `2`) for quick testing.
- Private keys are stored locally and unencrypted in `./data/private.key` — do not store real funds here.
- No replay protection, rate-limiting, or advanced transaction features.
- Mining and verification logic is naive and for demonstration only.

If you plan to extend the project toward real networking, consider adding:

- P2P networking and block/tx propagation.
- A canonical consensus algorithm and fork resolution.
- Transaction fee mechanism and mempool prioritization.
- Encrypted key storage / hardware wallet integration.

---

## Testing

Manual tests:

1. Start the server: `node server.js`.
2. Use `node client.js <recipient> <amount>` to create and send a signed transaction.
3. Inspect `/pending` and `/chain`.
4. POST to `/mine` with a rewardAddress to mint the block and receive mining reward.

Automated tests are not included; you can add a `test/` folder with Mocha/Jest for unit tests covering `Transaction`, `Block`, and `Blockchain` behaviors.

---

## Contributing

Contributions welcome! Open an issue or a pull request with small, focused changes. Suggested improvements:

- Add unit tests
- Improve API error handling
- Add CLI commands for wallet management (create/export/import keys)
- Add P2P network layer for multi-node operation

Please follow common GitHub workflows and include tests for new features.

---
