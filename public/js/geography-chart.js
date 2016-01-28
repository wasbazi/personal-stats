function handleGeography(data) {
  d3.json('/js/vendor/d3/state.json', function(error, topo) {
    var states = topojson.feature(topo, topo.objects.state).features
    var projection = d3.geo.mercator()
    projection.scale(750).center([-104.99, 39.74])

    var svg = makeMap(data, projection, states, topo)

    svg.call(d3.behavior.zoom().on('zoom', function() {
      redraw(svg, data, projection)
    }))
  })

  var prevScale = 1
  function redraw(svg, data, projection) {
    svg.selectAll('circle')
      .attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')')
    svg.selectAll('path')
      .attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')')

    if (!scaleShift(d3.event.scale, prevScale)) {
      prevScale - d3.event.scale
      return
    }

    if (d3.event.scale > 1.5) {
      drawCircles(svg, data, projection, d3.event.scale)
      svg.selectAll('path').attr('opacity', 0.25)
    } else {
      svg.selectAll('path').attr('opacity', 0.75)
      svg.selectAll('circle')
        .transition()
        .attr('r', '0px')
        .remove()
    }

    prevScale = d3.event.scale
  }

  function scaleShift(scale, prevScale) {
   return (prevScale < 1.5 && scale > 1.5) ||
     (prevScale > 1.5 && scale < 1.5)
  }

  function drawCircles(svg, data, projection, scale) {
    var series = _.values(groupData(data, scale))

    // hover tooltips
    var tip = d3.tip()
      .attr('class', 'd3-tip location-circle-tip')
      .offset([-10, 0])
      .html(function(d) {
        console.log(d)
        return '<strong>Visits:</strong> <span>' + d.times + '</span>' +
          '<br><strong>Location:</strong> <span>' + d.placemark.locality + '</span>'
        ;
      })

    svg.call(tip);

    var paletteScale = getScale(series, '#EFEFFF', '#02386F')
    // add circles to svg
    var circles = svg.selectAll('circle').data(series)
      .enter()
        .append('circle')
        .attr('class', 'location-circle')
        .attr('stroke-width', function() {
          return ((1 / scale) * 0.25) + 'px'
        })
        .attr('cx', function(d) {
          return projection([d.longitude, d.latitude])[0]
        })
        .attr('cy', function(d) {
          return projection([d.longitude, d.latitude])[1]
        })
        .attr('r', '0px')
        .attr('fill', function(d) {
          return paletteScale(d.times)
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .transition()
        .attr('r', function() {
          return ((1 / scale) * 6) + 'px'
        })
  }

  function getScale(series, startColor, endColor) {
    var onlyValues = series.map(function(loc) {
      return loc.times
    })
    var minValue = Math.min.apply(null, onlyValues)
    var maxValue = Math.max.apply(null, onlyValues)

    return d3.scale.linear()
      .domain([minValue, maxValue])
      .range([startColor, endColor])
  }

  function makeMap(data, projection, states, topo) {
    var seriesHash = groupData(data, 1)
    var path = d3.geo.path().projection(projection)
    var svg = d3.select('#location-map').append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 960 500')
      .attr('preserveAspectRatio', 'xMidYMid meet')

    // hover tooltips
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        var stateData = seriesHash[d.properties.STUSPS10] || {times: 0}
        return '<strong>Visits:</strong> <span>' + stateData.times + '</span>';
      })

    svg.call(tip);

    var paletteScale = getScale(_.values(seriesHash), '#EFEFFF', '#02386F')
    // add states from topojson
    svg.selectAll('path')
      .data(states).enter()
      .append('path')
      .attr('class', 'feature')
      .style('fill', function(d) {
        var stateData = seriesHash[d.properties.STUSPS10] || {times: 0}
        if (!stateData.times) {
          return '#F5F5F5'
        }
        return paletteScale(stateData.times)
      })
      .attr('d', path)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)

    svg.append('path')
      .datum(topojson.mesh(topo, topo.objects.state, ineqFunc))
      .attr('class', 'mesh')
      .attr('d', path)

    // legend
    var legend = d3.select('#legend')
      .append('ul')
      .attr('class', 'list-inline')

    var keys = legend.selectAll('li.key')
      .data(paletteScale.ticks(6))

    keys.enter().append('li')
      .attr('class', 'key')
      .style('border-top-color', function(d) {
        return paletteScale(d)
      })
      .text(function(d) {
        return d
      })


    return svg

    function ineqFunc(a, b) {
      return a !== b
    }
  }

  function groupData(data, scale) {
    var locationHash = {}
    data.forEach(function(entry) {
      var loc = entry.location
      if (!loc) {
        return
      }

      var id = loc.placemark.administrativeArea
      if (scale > 1.5) {
        id = loc.placemark.locality
      }
      if (!id) {
        return
      }
      if (!locationHash[id]) {
        locationHash[id] = loc
        loc.times = 0
        loc.id = id
      }

      locationHash[id].times += 1
    })

    return locationHash
  }
  }
