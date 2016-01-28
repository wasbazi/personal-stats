d3.json('/report-data.json', function(error, data) {
  handleGeography(data)
  // handleActivities(data)
})
