import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
console.log(process.env, 'process.env::::::');
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('API is working!');
});

// Add routes here later
export default app;
