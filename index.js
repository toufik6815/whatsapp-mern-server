//=====================importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages';
import Pusher from 'pusher';
import cors from 'corse';



//==================== app config
const app = express();
const port = process.env.PORT || 9000;
export default app;

const pusher = new Pusher({
    appId: "1115337",
    key: "7e2052d139fa7d66a8d9",
    secret: "83c40c76bfdb24a1153b",
    cluster: "eu",
    useTLS: true
  });

//=====================middleware
app.use(express.json());
app.use(cors())

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Header", "*");
    next();
})

//=======================DB config
const connection_url = `mongodb+srv://admin:salehadmin@cluster0.lvtch.mongodb.net/whatsapp?retryWrites=true&w=majority`

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', () => {
    console.log('DB connected');
    const msgCollection = db.collection("chat");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
         if(change.operationType === 'insert'){
             const messageDetails = change.fullDocument;
             pusher.trigger('messages', 'inserted', {
                 name: messageDetails.name,
                 message: messageDetails.message,
                 timestamp: messageDetails.timestamp,
                 received: messageDetails.received
             });
         }else{
             console.log('error trigger pusher');
         }
    })
})

// ============================??


//========================== api routes
app.get('/', (req, res) =>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})


app,post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})



//=============================listen
app.listen(port, () => console.log(`Listen on Localhost:${port}`))
