// Blockchain Constructor Function
// Chains - Chain Data
// Pending Transactions - Transactions made since last Block is pushed into the chain

function Blockchain() {
    this.chains = [];
    this.pendingTransactions = [];
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

module.exports = Blockchain ;