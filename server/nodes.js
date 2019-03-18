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


// Register and Broadcast Route
app.post('/register-broadcast', (req, res) => {
    const newNodeURL = req.body.newNodeURL;

    if(bitcoin.networkNodes.indexOf(newNodeURL) == -1){
        bitcoin.networkNodes.push(newNodeURL);
    }

    const regNodesPromises = [];    
    bitcoin.networkNodes.forEach(node => {
        const requestOptions = {
            uri: node + '/register',
            method: 'POST',
            body: { newNodeURL },
            json: true
        };

        regNodesPromises.push(request(requestOptions));
    });
    
    Promise.all(regNodesPromises)
    .then(data => {
        const bulkRequestOptions = {
            uri: newNodeURL + '/register-bulk',
            method: 'POST',
            body: { allNodes: [...bitcoin.networkNodes, bitcoin.currentNodeURL] },
            json: true
        };

        return request(bulkRequestOptions);
    }).then(data => {
        res.json({note: 'New Node Registered Successfully'});
    })
});


// Register Node Route
app.post('/register', (req, res) => {
    const newNodeURL = req.body.newNodeURL;

    if(bitcoin.networkNodes.indexOf(newNodeURL) == -1 && bitcoin.currentNodeURL != newNodeURL){
        bitcoin.networkNodes.push(newNodeURL);
        res.json('New Node Registered Successfully');
    }else{
        res.json(`Node ${newNodeURL} Already Present`);
    }
    
});


// Register Multiple Nodes
app.post('/register-bulk', (req, res) => {
    const allNodesURL = req.body.allNodes;

    allNodesURL.forEach(nodeURL => {
        if(bitcoin.networkNodes.indexOf(nodeURL) == -1 && bitcoin.currentNodeURL != nodeURL){
            bitcoin.networkNodes.push(nodeURL);
            res.json('Bulk Nodes Registeration Successfully');
        }else{
            res.json('Node Already Present');
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server stared on port ${PORT}`);
})