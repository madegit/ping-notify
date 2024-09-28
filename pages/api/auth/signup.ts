import type { NextApiRequest, NextApiResponse } from 'next'
import { hash } from 'bcrypt'
import clientPromise from '@/lib/mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    const existingUser = await db.collection('users').findOne({ email })

    if (existingUser) {
      return res.status(422).json({ message: 'Email already exists' })
    }

    const hashedPassword = await hash(password, 12)

    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
    })

    res.status(201).json({ message: 'User created', userId: result.insertedId })
  } catch (error) {
    console.error('Detailed error in signup:', error)
    res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}