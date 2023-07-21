mermaid.initialize({ startOnLoad: true, flowchart: { useMaxWidth: false, htmlLabels: true } });

const officialOptions = {};
const officialMdoc = {pages:{index:{text:`# Welcome to StackExtend!
Hello everyone, in this document I'll teach you how to use **StackExtend.js**!
## What is StackExtend?
First off, **StackExtend** is a tool for building HTML Elements with plain [MarkDown](https://it.wikipedia.org/wiki/Markdown) text, powered by [StackEdit](https://github.com/benweet/stackedit).
\`\`\`mermaid
graph LR
A(MarkDown plaintext) --> B((StackExtend)) --> C{StackEdit} --> D((StackExtend)) --> E(HTML Element)
\`\`\`
In this graph above, you can see the following steps:
1. The **MarkDown text** pass throught **StackExtend**;
2. **StackExtend** makes a request to **StackEdit's servers** that returns the **data** containing the **HTML string**;
3. This **HTML string** passes trougth **StackExtend** again for **extending the HTML** by adding more custom things;
4. The returned value is the same **data** returned by StackEdit's website, but the \`html\` value is replaced with a \`<markdown>{HTML}</markdown>\` Element.
## How do I use it
To use **StackExtend.js** you'll need to install it. You can do it by goint to [this repository](https://github.com/Antonio225t/StackExtend) and select a version in the branch
## Objects
### MDOC object
A **MDOC** is a document that contains pages in MarkDown wich then will be converted in HTML.
#### MDOC-Root
|    Key    |         Type         | Required | Description |
| --------- | -------------------- | :------: | ----------- |
| \`pages\` | [PageContainer](#mdoc-pagecontainer) | X | An object where the keys are the names of the pages. |
| \`name\` | String | X | The name of the document to be displayed. |
#### MDOC-PageContainer
|    Key    |         Type       | Required | Description |
| --------- | ------------------ | :------: | ----------- |
| \`index\` | [Page](#mdoc-page) | X | The first page to load (by default). |
| \`...\`  | [Page](#mdoc-page) | | Other pages defined by the user. |
#### MDOC-Page
|    Key   | Type | Required | Description |
| -------- | ---- | :------: | ----------- |
| \`text\` | String | X | The **MarkDown** plain text. |
| \`title\` | String | | The title of the page that can be displayed. If empty not set, the \`key\` of the [PageContainer](#mdoc-pagecontainer) will be displayed (if the page is \`index\` and this value is empty, nothing will be displayed). |
| \`html\` | [HTMLUnknownElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement) | | This is used by StackExtend to store the HTML element containing the MarkDown text converted into HTML. |
#### MDOC example
\`\`\`json
{ // Root
  "pages": { // PageContainer
    "index": { // Page
      "text": "Click [here](@another_page) to go to the hidden page."
    },
    "another_page": { // Page
      "text": "# Hello World!\\nClick [here](@index) to go back to the index.",
      "title": "Hidden page"
    }
  },
  "name": "Test Document"
}
\`\`\`
### Mode object
A **Mode** is a way of styling the MarkDown or the modal.
#### Mode-Root
| Key | Type | Required | Description |
| --- | ---- | :------: | ----------- |
| \`name\` | String | X | The name of the way of styling used. |
| \`description\` | String | | Description of a Mode. |
| \`src\` | String | * | Source to a \`.css\` stylesheet. Required if **style** is empty. |
| \`style\` | String | * | Stylesheet in plaintext. Required if **src** is empty. |
| \`toDarkDuration\` | String | | Duration of the transition when switching to dark theme (default is **15s**). |
| \`toDarkFunction\` | String | | Function of the transition when switching to dark theme (default is **ease**). |
| \`darkTheme\` | String | | The color or image of the background to match the dark theme (default is **#000**). |
| \`lightTheme\` | String | | The color or image of the background to match the light theme (default is **#fff**). |
#### Mode example
\`\`\`json
{ // Root
  "name": "StackEdit",
  "description": "Very similiar to StackEdit's style but with some modifications.",
  "src": "./viewer/Themes/Styles/StackEdit.css",
  "toDarkDuration": "15s",
  "toDarkFunction": "ease",
  "darkTheme": "#000",
  "lightTheme": "#fff"
}
\`\`\``},"Hello_World":{text:"# Hi!\nThis is a page!"}},name:"StackExtend"};

const search = new URLSearchParams(window.location.search);
const mdoc = search.get("mdoc");
const opts = search.get("options");

if (!mdoc) {
  window.mdoc = officialMdoc;
} else {
  if (mdoc.startsWith("http")) {
    const script = document.createElement("SCRIPT");
    script.type = "text/javascript";
    script.src = mdoc;
    
    document.head.appendChild(script);
  } else {
    window.mdoc = JSON.parse(atob(decodeURIComponent(mdoc)));
  }
}

if (!opts) {
  window.options = officialOptions;
} else {
  if (opts.startsWith("http")) {
    const script = document.createElement("SCRIPT");
    script.type = "text/javascript";
    script.src = opts;
    
    document.head.appendChild(script);
  } else {
    window.options = JSON.parse(atob(decodeURIComponent(opts)));
  }
}

setInterval(()=>{
  if (window.mdoc) {
    clearInterval(this);
    StackExtend.openModal(window.mdoc, window.options);
  }
},10);