import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dummydata from './api/data.js'
import connectDB from './api/config/db.js'
import router from './api/routes/userRoutes.js'  // ✅ clean default import

dotenv.config()

const app = express()

app.use(express.json()); // request body read karne ke liye

connectDB()
const port = process.env.PORT || 5000


// 3️⃣ CORS — baaki sab middleware se pehle
app.use(cors({
  origin: ['https://techandtomorrow.social', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))



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

// ✅ Express 5-safe catch-all
app.use((req, res) => {
  res.status(404).send('Not Found');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})