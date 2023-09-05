const express = require('express')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')

const app = express()
const PORT = process.env.PORT

// Create a JWKS client to fetch JWKs from a remote URL
const jwksClientInstance = jwksClient({
  jwksUri: process.env.JWKS_SERVER
})

// Middleware to authenticate incoming requests
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' })
  }

  // Verify the JWT token using JWK from authenticate server
  jwt.verify(token, getKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token verfication is failed' })
    }

    req.user = decoded
    next()
  })
}

// Get the correct key for JWT verification
const getKey = (header, callback) => {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err)
    }

    if (!key) {
      return callback(new Error('Invalid token'), null)
    }

    const signingKey = key.publicKey || key.rsaPublicKey

    callback(null, signingKey)
  })
}

app.get('/api/v1/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'Authenticate and authorised to access the endpoint', user: req.user })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
