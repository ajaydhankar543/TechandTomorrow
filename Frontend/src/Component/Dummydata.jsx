'use client'
import { useState, useEffect } from 'react'
// import express from 'express'
// const app = express()
// app.use(express.json())

export default function Dummydata() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>
          {user.name} — {user.email}
        </li>
      ))}
    </ul>
  )
}