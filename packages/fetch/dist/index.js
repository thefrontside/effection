
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./fetch.cjs.production.min.js')
} else {
  module.exports = require('./fetch.cjs.development.js')
}
