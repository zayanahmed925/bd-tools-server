const express = require('express')
const cors = require('cors');
const app = express()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwbja.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('bd-tools').collection('tools');
        const purchaseCollection = client.db('bd-tools').collection('purchase');

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
        app.get('/purchase', async (req, res) => {
            const userEmail = req.query.userEmail
            const query = { userEmail: userEmail };
            const purchase = await purchaseCollection.find(query).toArray();
            res.send(purchase);
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