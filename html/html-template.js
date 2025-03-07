function getHtml() { return `

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      html, body { height: 100vh; margin: 0; padding: 0; }
      iframe { width: 100%; height: 100vh; border: none; }
    </style>
  </head>
  <body>
    <iframe srcdoc="

      <!DOCTYPE html>
      <html lang='en'>
        <head>
          <meta charset='UTF-8'>
          <meta name='viewport' 
                content='width=device-width, initial-scale=1.0'>
          <style>
            **cssContent**
          </style>
        </head>
        <body style='font-weight:bold; font-size: 1.25em;'>
          <h3>Definition Stack</h3>
          <div></div>
        </body>
      </html>

  "></iframe>
  </body>
</html>
`}

module.exports = { getHtml }
