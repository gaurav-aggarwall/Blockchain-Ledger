const experss = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');

const Blockchain = require('../Blockchain/blockchain');

const PORT = process.env.PORT || 3000 ;

const bitcoin = new Blockchain();
const nodeID = uuid().split('-').join('');

const app = experss();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


//Home Route
app.get('/', (req, res) => {
    res.send('HELLO');
});


// Blockchain Route
app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});


// Transaction Route
app.post('/transaction', (req, res) => {
    const blockIndex = bitcoin.newTransaction(req.body.sender, req.body.receiver, req.body.amount);
    res.json({ note: `Transaction will be added to ${blockIndex} block.` });
});


// Mining Route
app.get('/mine', (req, res) => {
    const prevBlock = bitcoin.getLastBlock();
    const prevHash = prevBlock.hash;
    const currentBlock = {
        index: prevBlock.index + 1,
        transactilasons: bitcoin.pendingTransactions
    }

    const nonce = bitcoin.proofOfWork(prevHash, currentBlock);
    const hash = bitcoin.hashBlock(nonce, prevHash, currentBlock);

    bitcoin.newTransaction('00', nodeID, 12.5);

    const newBlock = bitcoin.createNewBlock(nonce, prevHash, hash);

    res.json({ 
        note: `Mining Successful`,
        block: newBlock
    });
});


app.listen(PORT, () => {
    console.log(`Server stared on port ${PORT}`);
})