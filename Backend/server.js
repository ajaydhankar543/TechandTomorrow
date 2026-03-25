import express from 'express'
const app = express()
import dotenv from 'dotenv'
dotenv.config()
const port = process.env.PORT || process.env.port || 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api', (req, res) => {
  res.json({ message: 'API working!' })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})