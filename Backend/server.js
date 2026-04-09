import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dummydata from './api/data.js'
import connectDB from './api/config/db.js'
import router from './api/routes/userRoutes.js'  // ✅ clean default import

dotenv.config()
connectDB()

const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: ['https://techandtomorrow.social', 'http://localhost:5173']
}))
app.use(express.json())

app.use('/api/users', router)  // ✅ use ES module import, not require()



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api', (req, res) => {
  res.json({ message: 'API working!' })
})

app.get('/api/data', (req, res) => {
  res.json(dummydata)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})