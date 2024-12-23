var system = require('system')
var webpage = require('webpage')

// Read in arguments
var args = system.args
var htmlPath = args[1]
var pdfPath = args[2]
var cwd = args[3]
var runningsPath = args[4]
var cssPath = args[5]
var highlightCssPath = args[6]
var paperFormat = args[7]
var paperOrientation = args[8]
var paperBorder = args[9]
var renderDelay = parseInt(args[10], 10)
var loadTimeout = parseInt(args[11], 10)

var page = webpage.create()

// Load custom runnings (header/footer)
var runnings = require(runningsPath)

// Page settings
page.paperSize = {
  format: paperFormat,
  orientation: paperOrientation,
  margin: paperBorder,
  header: runnings.header,
  footer: runnings.footer
}

page.zoomFactor = 1

// Load the HTML content
var loaded = false
page.open(htmlPath, function (status) {
  if (status !== 'success') {
    console.error('Unable to load HTML content')
    phantom.exit(1)
  }

  // Apply styles
  if (cssPath) {
    page.evaluate(function (csspath) {
      var link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = csspath
      document.head.appendChild(link)
    }, cssPath)
  }

  if (highlightCssPath) {
    page.evaluate(function (highlightcsspath) {
      var link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = highlightcsspath
      document.head.appendChild(link)
    }, highlightCssPath)
  }

  loaded = true
})

// Timeout if page is not loaded after specified timeout
setTimeout(function () {
  if (!loaded) {
    console.error('Timeout loading HTML content')
    phantom.exit(1)
  }
}, loadTimeout)

// Render the PDF after specified delay
setTimeout(function () {
  if (!loaded) return

  // Render PDF
  page.render(pdfPath)
  phantom.exit(0)
}, renderDelay)
