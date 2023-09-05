const express = require('express')
const jose = require('node-jose')
const sqlite3 = require('sqlite3')
const bodyparser = require('body-parser')
const crypto = require('crypto')

const db = new sqlite3.Database(':memory:')
const app = express()
const port = process.env.JWKPORT

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: false }))
let signingKey = null

// Using in memory database for demo purposes
db.serialize(() => {
  db.run(`CREATE TABLE users (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    userName VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    role VARCHAR(5) NOT NULL
    );`)

  const insertStatement = db.prepare('INSERT INTO users (userName, password, role) VALUES (?, ?, ?)')
  insertStatement.run('John', 'testpass', 'read')
  insertStatement.run('Jane', 'pass123', 'write')
  insertStatement.finalize()
})

// generate key pair on demand
const createKeysForSigning = async () => {
  const keyStore = jose.JWK.createKeyStore()

  const props = {
    use: 'sig', alg: 'RS256'
  }

  const createdKey = await keyStore.generate('RSA', 2048, props)
  return createdKey
}

// Create signing key pairs at the start, this can be configured to run periodically to rotate keys and store them secured cache with TTL
(async () => {
  signingKey = await createKeysForSigning()
})().catch(e => {
  console.log(`error occured while generating signing key: ${e}`)
})

// Generate JWT token with given claims
const generateJWT = async (claims, signKey) => {
  console.log(signKey)
  const jwt = await jose.JWS.createSign({ alg: 'RS256', format: 'compact' }, signKey).update(JSON.stringify(claims), 'utf8').final()
  return jwt
}

// Check database for user
const getUser = async (userName, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT ID, role FROM users WHERE userName = ? AND password = ?'

    db.get(sql, [userName, password], (err, user) => {
      if (err) {
        reject(err)
      }
      if (!user) {
        reject(new Error('User not found'))
      }

      resolve(user)
    })
  })
}

// Authentication endpoint
app.post('/api/v1/auth', async (req, res) => {
  const { userName, password } = req.body
  console.log(req.body)
  let user = null
  try {
    user = await getUser(userName, password)
  } catch (err) {
    return res.status(401).json({ message: 'credentials not correct' })
  }
  const dt = new Date()
  const iat = Math.floor((dt.getTime() / 1000))
  const exp = Math.floor(new Date(dt.getTime() + (20 * 60 * 1000)) / 1000)
  const sessionId = crypto.randomUUID()
  const jti = crypto.randomUUID()

  const claims = {
    sessionId,
    role: user.role,
    exp,
    iat,
    nbf: iat,
    jti
  }

  const signedJWT = await generateJWT(claims, signingKey)

  res.json({ jwt: signedJWT })
})

// JWKS Signing key exchange endpoint
app.get('/.well-known/jwks.json', async (req, res) => {
  const jwks = {
    keys: [signingKey]
  }

  res.json(jwks)
})

app.listen(port, () => {
  console.log(`Authorisation keys server running on PORT ${port}`)
})
