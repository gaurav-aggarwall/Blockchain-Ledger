const sha = require('sha256');


// Blockchain Constructor Function
// Chains - Chain Data
// Pending Transactions - Transactions made since last Block is pushed into the chain

function Blockchain() {
    this.chains = [];
    this.pendingTransactions = [];

    // Genesios Block
    this.createNewBlock(1, '0', '0');    
}

// Creating New Blocks to be pushed into the chain
Blockchain.prototype.createNewBlock = function(nonce, prevHash, hash) {
    const newBlock = {
        index: this.chains.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce,
        prevHash,
        hash
    };

    this.pendingTransactions = [];
    this.chains.push(newBlock);

    return newBlock;
}

// Retrieving Last Block
Blockchain.prototype.getLastBlock = function() {
    return this.chains[this.chains.length - 1];
}

// Creating New Transactions 
Blockchain.prototype.newTransaction = function(sender, receiver, amount) {
    const transaction = {
        sender,
        receiver,
        amount
    };

    this.pendingTransactions.push(transaction);

    return this.getLastBlock()['index'] + 1;
}

// Hash Block
Blockchain.prototype.hashBlock = function(nonce, prevHash, currentBlock) {
    const dataStr = prevHash + nonce.toString() + JSON.stringify(currentBlock);
    const hash = sha(dataStr);
    return hash;
}

// Proof Of Work
Blockchain.prototype.proofOfWork = function(prevHash, currentBlock) {
    let nonce = 0;
    let hash = this.hashBlock(nonce, prevHash, currentBlock);

    while(hash.substr(0,4) != '0000'){
        nonce++;
        hash = this.hashBlock(nonce, prevHash, currentBlock);
    }

    return nonce;
}

module.exports = Blockchain ;