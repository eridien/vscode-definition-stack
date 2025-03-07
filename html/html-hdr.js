function getPug() { return `

head
  meta(charset="UTF-8")
  meta(name="viewport" 
       content="width=device-width, initial-scale=1.0")
  link(href="**cssPath**"       rel="stylesheet")
  link(href="**customCssPath**" rel="stylesheet")
  script(src="**jsPath**")
body(style="font-family:'Courier New', Courier, monospace; \
            font-size: 16px;")
  | Definition Stack
  #body

`;}

module.exports = { getPug }
