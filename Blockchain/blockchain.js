const sha = require('sha256');
const uuid = require('uuid/v1');

const URL = process.argv[3];


// Blockchain Class
// Chains - Chain Data
// Pending Transactions - Transactions made since last Block is pushed into the chain
class Blockchain {
    constructor() {
        this.chains = [];
        this.pendingTransactions = [];
        this.currentNodeURL = URL;
        this.networkNodes = [];

        // Genesis Block
        this.createNewBlock(1, '0', '0');
    }


    // Creating New Blocks to be pushed into the chain
    createNewBlock(nonce, prevHash, hash) {
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
    getLastBlock() {
        return this.chains[this.chains.length - 1];
    }


    // Creating New Transactions 
    newTransaction(sender, receiver, amount) {
        const transaction = {
            sender,
            receiver,
            amount,
            id: uuid().split('-').join('')
        };

        return transaction;
    }


    // Adding Transaction into Pending Array 
    addTransaction(transaction) {
        this.pendingTransactions.push(transaction);
        return this.getLastBlock().index + 1;
    }
        

    // Hash Block
    hashBlock(nonce, prevHash, currentBlock) {
        const dataStr = prevHash + nonce.toString() + JSON.stringify(currentBlock);
        const hash = sha(dataStr);
        return hash;
    }


    // Proof Of Work
    proofOfWork(prevHash, currentBlock) {
        let nonce = 0;
        let hash = this.hashBlock(nonce, prevHash, currentBlock);
        while (hash.substr(0, 4) != '0000') {
            nonce++;
            hash = this.hashBlock(nonce, prevHash, currentBlock);
        }
        return nonce;
    }
}



module.exports = Blockchain ;