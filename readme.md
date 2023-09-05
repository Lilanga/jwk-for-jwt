# JWK key exchange for JWT verification

This is a demo solution with two microservices to illustrate the use of JWK key endpoint in JWT validation.
Authentication service is responsible for generating JWT token and JWK key endpoint. The protected service is responsible for validating the JWT token using JWK key endpoint.

## Starting Projects

This project is using pnpm to maintain two microservices in a mono repo. The workspace file is configured for the two Projects. Make sure you have pnpm before starting it locally.

### Installing dependencies

We can use pnpm filter and install individual project dependencies
Ex:
`pnpm --filter jwkserver i` and `pnpm --filter secureservice i`

### Running services locally

We can use pnpm filter command to run both projects since both having same npm script command names
Ex:
`pnpm --filter secureservice --filter jwkserver run dev`

## Testing locally

You can use postman or similar tool to dispact calls to get tokens and call secure endpoint for JWT validation JWK keys.

### Following are the URLs exposed by these two microservices

Token endpoint:

```curl
curl --location 'http://localhost:3001/api/v1/auth' \
--header 'Content-Type: application/json' \
--data '{
   "userName":"Jane",
   "password":"pass123"
}'
```

Protected endpoint:

```curl
curl --location 'localhost:3000/api/v1/protected' \
--header 'Authorization: <JWT TOKEN FROM PREVIOUS CALL>'
```

JWKS endpoint

```curl
curl --location 'http://localhost:3001/.well-known/jwks.json'
```
