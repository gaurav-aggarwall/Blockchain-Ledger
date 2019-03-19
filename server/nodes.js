const experss = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const request = require('request-promise');

const Blockchain = require('../Blockchain/blockchain');

const PORT = process.env.PORT || process.argv[2] ;

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


// Transaction and Broadcast Route
app.post('/transaction-broadcast', (req, res) => {
    const transaction = bitcoin.newTransaction(req.body.sender, req.body.receiver, req.body.amount);
    bitcoin.addTransaction(transaction);
    
    bitcoin.networkNodes.forEach(node => {
        requestoptions = {
            uri: node + '/transaction',
            method: 'POST',
            body: { transaction },
            json: true
        };
        
        request(requestoptions).then(data => console.log(data));
    });
    res.json({ note: `Transaction added and broadcasted successfully` });
});


// Transaction Route
app.post('/transaction', (req, res) => {
    const newTransaction = req.body.transaction;
    const blockIndex = bitcoin.addTransaction(newTransaction);

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


// Register and Broadcast Route
app.post('/register-broadcast', (req, res) => {
    const newNodeURL = req.body.newNodeURL;

    if(bitcoin.networkNodes.indexOf(newNodeURL) > -1 || bitcoin.currentNodeURL == newNodeURL){
        return res.send('Node Already Present');
    }
    
    bitcoin.networkNodes.push(newNodeURL);

    const allNodes = [...bitcoin.networkNodes];
    allNodes.push(bitcoin.currentNodeURL);

    allNodes.forEach(node => {
        const requestToConnectedNodeOptions = {
            uri: node + '/register',
            method: 'POST',
            body: { newNodeURL },
            json: true
        }; 
    
        request(requestToConnectedNodeOptions);

        const requestToNewNodeOptions = {
            uri: newNodeURL + '/register',
            method: 'POST',
            body: { newNodeURL: node },
            json: true
        };
        
        request(requestToNewNodeOptions);
    }); 

    res.send('DONE');
});


// Register Node Route
app.post('/register', (req, res) => {
    const newNodeURL = req.body.newNodeURL;

    if(bitcoin.networkNodes.indexOf(newNodeURL) < 0 && bitcoin.currentNodeURL != newNodeURL){
        bitcoin.networkNodes.push(newNodeURL);
        return res.json(`New Node Registered Successfully for ${bitcoin.currentNodeURL}`);
    }else{
        return res.json(`Node ${newNodeURL} Already Present`);
    }    
});


app.listen(PORT, () => {
    console.log(`Server stared on port ${PORT}`);
})