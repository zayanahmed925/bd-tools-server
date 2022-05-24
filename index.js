const express = require('express')
const cors = require('cors');
const app = express()
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(404).send({ message: 'UnAuthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwbja.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('bd-tools').collection('tools');
        const purchaseCollection = client.db('bd-tools').collection('purchase');
        const userCollection = client.db('bd-tools').collection('user');

        //verify admin
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role === 'admin') {
                next()
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' })
            }
        }
        //Load all tools
        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })
        //single tools load
        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const tools = await toolsCollection.findOne(query);
            res.send(tools);
        })
        //purchase single tools
        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase)
            res.send(result)
        })
        //get single purchase
        app.get('/purchase', verifyJwt, async (req, res) => {
            const userEmail = req.query.userEmail
            const decodedEmail = req.decoded.email;
            if (userEmail === decodedEmail) {
                const query = { userEmail: userEmail };
                const purchase = await purchaseCollection.find(query).toArray();
                res.send(purchase);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }
        })
        //user create and update
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '5d' })
            res.send({ result, token });
        })
        //get all user
        app.get('/users', verifyJwt, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
        })
        //make admin role
        app.put('/user/admin/:email', verifyJwt, verifyAdmin, async (req, res) => {
            const email = req.params.email;

            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        //Get admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })
        //Single Tools add
        app.post('/tools', verifyJwt, verifyAdmin, async (req, res) => {
            const newItem = req.body;
            const result = await toolsCollection.insertOne(newItem);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir)




app.get('/', (req, res) => {
    res.send('Bd tools running')
})

app.listen(port, () => {
    console.log(`Bd tools listening on port ${port}`)
})