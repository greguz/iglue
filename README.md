# iglue

Intuitive Data Binding engine

## Usage

```html
<div id="articles" i-each:article="articles" i-if="article.visible">
  <h1>
    { article.title }
  </h1>
  <p i-class:old="article.old">
    { article.content }
  </p>
</div>
```

```javascript
iglue.bind(document.getElementById("articles"), {
  articles: [{
    title: "Hello world",
    visible: true,
    old: true,
    content: "The cake is a lie"
  }, {
    title: "Glados is watching",
    visible: false,
    old: false,
    content: "Hello and, again, welcome to the Aperture Science computer-aided enrichment center."
  }]
});
```
