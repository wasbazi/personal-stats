var data = require('../data.json')
var _ = require('lodash-node')

function reportData(req, res, next) {
  var cleanData = sanitizeData(data)
  res.send(200, cleanData)
  return next()
}

module.exports = reportData

function safeToFixed(num, precision) {
  if (!num || !num.toFixed) {
    return num
  }

  return Number(num.toFixed(precision))
}

function sanitizeData(data) {
  data.snapshots = data.snapshots.map(function(snapshot) {
    if (!snapshot.responses) {
      return snapshot
    }

    if (snapshot.location) {
      snapshot.location.placemark = _.pick(snapshot.location.placemark, ['subAdministrativeArea', 'administrativeArea', 'country', 'locality'])
      snapshot.location.longitude = safeToFixed(snapshot.location.longitude, 3)
      snapshot.location.latitude = safeToFixed(snapshot.location.latitude, 3)
    }

    if (snapshot.weather) {
      snapshot.weather.longitude = safeToFixed(snapshot.weather.longitude, 3)
      snapshot.weather.latitude = safeToFixed(snapshot.weather.latitude, 3)
    }

    snapshot.responses = snapshot.responses.map(function(response) {
      var locationResponse = response.locationResponse
      if (!locationResponse) {
        return response
      }
      var location = locationResponse.location

      if (!location) {
        return response
      }

      location.longitude = safeToFixed(location.longitude, 3)
      location.latitude = safeToFixed(location.latitude, 3)
      locationResponse.text = ''

      return response
    })

    return snapshot
  })

  return data.snapshots
}
