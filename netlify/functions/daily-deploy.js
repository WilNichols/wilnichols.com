const fetch = require('node-fetch')
import { schedule } from '@netlify/functions'

// This is sample build hook
const BUILD_HOOK = process.env.BUILD_HOOK

const handler = schedule('0 6 * * 1,2,3,4,5,6,7', async () => {
  await fetch(BUILD_HOOK, {
    method: 'POST'
  }).then((response) => {
    console.log('Build hook response:', response.json())
  })

  return {
    statusCode: 200
  }
}

export {
  handler
}
