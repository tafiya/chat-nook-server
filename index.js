const express =require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app =express();
require('dotenv').config()
const cors =require('cors');
var jwt = require('jsonwebtoken');
const port =process.env.PORT || 5300;

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.bescutn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares 
const verifyToken = (req, res, next) => {
  // console.log('inside verify new token==',req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })

}
// use verify admin after verifyToken
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

const userCollection = client.db("chatNookCollection").collection("users");
    const postCollection = client.db("chatNookCollection").collection("allPosts");
    const announcementCollection =client.db("chatNookCollection").collection("announcements");
    const commentCollection =client.db("chatNookCollection").collection("comment");
 
         // jwt related api
         app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            //console.log('generated token',token)
            res.send({ token });
          })

 
    //users related api
    app.get('/users',verifyToken,verifyAdmin,  async (req, res) => {
        const result = await userCollection.find().toArray();
        res.send(result);
      });
      
      app.get('/users/admin/:email', verifyToken, async (req, res) => {
        const email = req.params.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: 'forbidden access' })
        }
  
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.role === 'admin';
        }
        res.send({ admin });
      })
  
      app.post('/users',async(req,res)=>{
        const user = req.body;
        // insert email if user doesnt exists: 
        // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
        const query = { email: user.email }
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: 'user already exists', insertedId: null })
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
      })
  
      app.patch('/users/admin/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: 'admin'
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })
      app.delete('/users/:id',verifyToken,verifyAdmin,  async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await userCollection.deleteOne(query);
        res.send(result);
      })

    //post related api
    app.get('/posts',async(req,res)=>{
 
        const result= await postCollection.find().toArray(); 
        res.send(result);
    })

    app.post('/posts', async (req, res) => {
        const item = req.body;
        const result = await postCollection.insertOne(item);
        res.send(result);
      });
       //announcement related api
    app.get('/announcements',async(req,res)=>{
 
      const result= await announcementCollection.find().toArray(); 
      res.send(result);
  })

  app.post('/announcements', async (req, res) => {
      const item = req.body;
      const result = await announcementCollection.insertOne(item);
      res.send(result);
    });
//comment section
       //announcement related api
       app.get('/comment',async(req,res)=>{
 
        const result= await commentCollection.find().toArray(); 
        res.send(result);
    })
  
    app.post('/comment', async (req, res) => {
        const item = req.body;
        const result = await commentCollection.insertOne(item);
        res.send(result);
      });


app.get('/',(req,res)=>{
    res.send('boss is running');

})
app.listen(port,()=>{
    console.log(`Bistro Biss is sitting on port ${port}`);
})