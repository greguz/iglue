# iglue

[![npm version](https://badge.fury.io/js/iglue.svg)](https://badge.fury.io/js/iglue) [![Dependencies Status](https://david-dm.org/greguz/iglue.svg)](https://david-dm.org/greguz/iglue.svg)

A simple and unobtrusive UI microframework.

## Motivation

I've worked with [Rivets.js](https://github.com/mikeric/rivets) for some time,
then I fell in love with [Vue.js](https://github.com/vuejs/vue),
but sometimes I just wanted something in between,
something cool and well written like _Vue_,
but simple and unobtrusive like _Rivets_...

So I came out to write **iglue**.

## Browser support

**iglue** supports all browsers that are ES5-compliant,
so IE8 and below are not supported.

## Usage

```html
<div id="articles" i-each:article="articles" i-if="article.visible">
  <h1>{ article.title }</h1>
  <p i-class:old="article.old">{ article.content }</p>
</div>
```

```javascript
iglue.bind(document.getElementById("articles"), {
  articles: [
    {
      title: "Hello world",
      visible: true,
      old: true,
      content: "The cake is a lie"
    },
    {
      title: "Glados is watching",
      visible: false,
      old: false,
      content:
        "Hello and, again, welcome to the Aperture Science computer-aided enrichment center."
    }
  ]
});
```
