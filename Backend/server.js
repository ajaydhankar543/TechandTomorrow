import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dummydata from './api/data.js'

dotenv.config()

const app = express()
const port = process.env.PORT || process.env.port || 3000

app.use(cors())

app.use(cors({
  origin: 'techandtomorrow.social'
}));


app.use(express.json()) // good to have

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api', (req, res) => {
  res.json({ message: 'API working!' })
})

app.get('/api/data', (req, res) => {
  res.json(dummydata)  // ✅ just serve the data directly
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})