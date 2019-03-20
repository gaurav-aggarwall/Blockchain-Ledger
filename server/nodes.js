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
    res.json({ note: 'HELLO' });
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
        
        request(requestoptions);
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
        transactions: bitcoin.pendingTransactions
    }

    const nonce = bitcoin.proofOfWork(prevHash, currentBlock);
    const hash = bitcoin.hashBlock(nonce, prevHash, currentBlock);

    bitcoin.newTransaction('00', nodeID, 12.5);

    const newBlock = bitcoin.createNewBlock(nonce, prevHash, hash);

    bitcoin.networkNodes.forEach(node => {
        requestoptions = {
            uri: node + '/new-block',
            method: 'POST',
            body: { newBlock },
            json: true
        };
        
        request(requestoptions)
    });

    const reqOptions = {
        uri: bitcoin.currentNodeURL + '/transaction-broadcast',
        method: 'POST',
        body: { 
            sender: '00',
            amount: 12.5,
            receiver: nodeID
         },
        json: true
    };
    
    request(reqOptions)
    .then(data => {
        res.json({ 
            note: `Mining Successful`,
            block: newBlock
        });
    });
});


// Adding New Block Route
app.post('/new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const hash = newBlock.prevHash === lastBlock.hash;
    const index = newBlock.index === lastBlock.index + 1;

    if(hash && index){
        bitcoin.pendingTransactions = [];
        bitcoin.chains.push(newBlock);
        res.json({ note: 'New Block added' });
    } else {
        res.json({ note: 'Block rejected' });
    }   
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

    res.json({ note: 'DONE' });
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


// Consensus Route
app.get('/consensus', (req, res) => {
    Promise.all(bitcoin.networkNodes.map(newNodeURL => {
        const reqOptions = {
            uri: newNodeURL + '/blockchain',
            method: 'GET',
            json: true
        }

        return request(reqOptions)
    })) 
    .then(blockchains => {
        const currentLength = bitcoin.chains.length;
        let maxLength = currentLength;
        let newLongChain = null;
        let newPendingTransactions = null;

        blockchains.forEach(blockchain => {
            if(blockchain.chains.length > maxLength){
                maxLength = blockchain.chains.length;
                newLongChain = blockchain.chains;   
                newPendingTransactions = blockchain.pendingTransactions; 
            }
        });

        if(!newLongChain || newLongChain && !bitcoin.isChainValid(newLongChain)){
            res.json({
                note: 'Current Chain has not been replaced',
                chains: bitcoin.chains
            });
        } else if(newLongChain && bitcoin.isChainValid(newLongChain)){
            bitcoin.chains = newLongChain;
            bitcoin.pendingTransactions = newPendingTransactions;
            res.json({
                note: 'Current Chain has been replaced',
                chains: bitcoin.chains
            });
        }
    })
});


app.listen(PORT, () => {
    console.log(`Server stared on port ${PORT}`);
})