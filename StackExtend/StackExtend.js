/* StackExtend.js - v0.5-alpha by Antonio225 (or Antonio).
 * License: MIT
*/

const missingDependencies = [];

// Check dependencies
if (!window.katex) {
  missingDependencies.push("KaTeX (0.16.8) [https://github.com/KaTeX/KaTeX]");
}

if (!window.mermaid) {
  missingDependencies.push("Mermaid (10.2.4) [https://github.com/mermaid-js/mermaid]");
}

if (!window.filterXSS) {
  missingDependencies.push("js-xss (1.0.14) [https://github.com/leizongmin/js-xss]");
}

if (!window.ABCJS) {
  missingDependencies.push("abcjs (6.2.2) [https://github.com/paulrosen/abcjs]");
}


if (missingDependencies.length > 0) {
  console.error("Couldn't load StackExtend! Missing dependencies:\n\n- " + missingDependencies.join(";\n- ") + ".");
}


const StackExtend = {
  // Private variables
  _hasOpenModal: void 0,
  _version: "0.5-alpha",
  
  // Public variables
  texts: {
    lightTheme: "Turn on dark theme.",
    darkTheme: "Turn on light theme.",
    noMdocFound: "This page doesn't exists."
  },
  
  xssProtection: {
    whitelist: {},
    allowCommentTag: true,
    onIgnoreTag: (name, html, opts)=>{
      return !["!doctype", "acronym", "applet", "base", "basefont", "big", "body", "canvas", "center", "dialog", "dir", "embed", "font", "form", "frame", "frameset", "head", "html", "label", "link", "meta", "noframes", "noscript", "object", "script", "strike", "style", "template", "textarea", "time", "title", "tt"].includes(name.toLowerCase()) ? html : "";
    },
    onIgnoreTagAttr: (tag, name, value, whitelist)=>{
      return (!name.toLowerCase().startsWith("on") && !name.toLowerCase().startsWith("xlink") && !["style", "width", "height"].includes(name.toLowerCase())) ? name + "=\"" + value.replace("\"", "\\\"") + "\"" : "";
    }
  },
  
  defaultOptions: {
    firstPage: "index",
    modes: {},
    htmlHideOverflow: true,
    background: true,
    rollTo: "",
    changeThemeInterval: 1000,
    
    toDarkChange: (e)=>{}
  },
  
  defaultModes: {
    stackedit: {
      name: "StackEdit",
      description: "Very similiar to StackEdit's style but with some modifications.",
      src: "./viewer/Themes/Styles/StackEdit.css",
      toDarkDuration: ".15s",
      toDarkFunction: "ease",
      darkTheme: "#000",
      lightTheme: "#fff"
    }
  },
  
  // Properties
  get version() {
    return this._version;
  },
  
  get hasOpenModal() {
    return !!this._hasOpenModal;
  },
  
  // Private methods
  async _loadModalPage(mdoc, page, elPageTitle, elContent) {
    if (!(page in mdoc.pages)) console.error("Page '" + page + "' is not present in " + mdoc.pages);
    if (mdoc.pages[page].html?.__proto__.constructor !== HTMLUnknownElement) mdoc.pages[page].html = (await this.getStackExtendMarkDown(mdoc.pages[page].text, "")).content.html;
    
    elPageTitle.textContent = mdoc.pages[page].title || (page !== "index" ? page.replace("_", " ") : "");
    elContent.innerHTML = mdoc.pages[page].html.innerHTML;
    
    // MDOC support
    for (let a of elContent.querySelectorAll("a")) {
      if (a.getAttribute("href").startsWith("@")) {
        let mdocLink = a.getAttribute("href");
        mdocLink = mdocLink.substring(1, mdocLink.length);
        
        let span = document.createElement("SPAN");
        if (mdocLink in mdoc.pages) {
          span.classList.add("mdoclink");
          span.title = mdocLink;
          span.addEventListener("click", async ()=>{
            await this._loadModalPage(mdoc, mdocLink, elPageTitle, elContent);
          });
          
          span.innerHTML = a.innerHTML;
        } else {
          span.classList.add("failmdoclink");
          span.title = this.texts.noMdocFound;
          
          span.innerHTML = a.innerHTML;
        }
        a.replaceWith(span);
      } else if (a.getAttribute("href").startsWith("http")) {
        a.addEventListener("click", e=>{
          e.preventDefault(true);
          if (a.getAttribute("target") === "_blank") {
            window.open(a.href);
          } else {
            window.location.href = a.href;
          }
        });
      }
    }
  },
  
  _cssPropertyProtection(prop) {
    return prop.split(";")[0].split("\n")[0] + ";";
  },
  
  // Public methods
  async getStackEditMarkDown(text, fileName) {
    text = text || "";
    fileName = fileName || "";
    
    const iframe = document.createElement("IFRAME");
    iframe.src = "https://stackedit.io/app#origin=" + encodeURIComponent(`${window.location.protocol}//${window.location.host}`) + "&fileName=" + encodeURIComponent(fileName) + "&contentText=" + encodeURIComponent(text) + "&contentProperties=&silent=true";
    iframe.style = "display: none;";
    iframe.allowfullscreen = false;
    iframe.allowpaymentrequest = false;
    
    document.body.appendChild(iframe);
    
    return new Promise(res=>{
      window.addEventListener("message", async (e)=>{
        if (e.origin === "https://stackedit.io" && e.source === iframe.contentWindow) {
          if (e.data.type === "fileChange") {
            window.removeEventListener("message", e);
            iframe.remove();
            res(e.data.payload);
          }
        }
      });
    });
  },
  
  async getStackExtendMarkDown(text, fileName) {
    const elContent = document.createElement("MARKDOWN");
    const htmlchunks = document.createElement("DIV")
    const stackextend = document.createElement("DIV");
    const data = await this.getStackEditMarkDown(text, fileName);
    
    stackextend.innerHTML = data.content.html;
    htmlchunks.textContent = "";
    
    var isChunking = false;
    for (let i of stackextend.children) {
      let node = i.cloneNode(true);
      let merge = true;
      let outer = true;
      
      if (node.tagName === "PRE") {
        let code = node.children[0];
        switch(code.classList[1]) {
          case "language-stackhtml":
            outer = false;
            node.textContent = window.filterXSS(code.textContent, this.xssProtection);
            break;
          case "language-stackhtmlChunk":
            isChunking = true;
            outer = false;
            node.textContent = window.filterXSS(code.textContent, this.xssProtection);
            break;
          case "language-stackhtmlChunkend":
            isChunking = false;
            outer = false;
            node.textContent = window.filterXSS(code.textContent, this.xssProtection);
            break;
          case "language-mermaid":
            outer = false;
            node.textContent = (await window.mermaid.render("mermaidSvg-" + (Math.floor(Math.random()*9999)), code.textContent)).svg;
            break;
          case "language-abc":
            outer = false;
            let el = document.createElement("DIV");
            el.classList.add("abc-notation-block");
            window.ABCJS.renderAbc(el, code.textContent);
            node.textContent = el.outerHTML;
        }
      }
      
      if (node.tagName === "P") {
        for (let kdisplay of node.children) {
          if (kdisplay.tagName === "SPAN") {
            if (kdisplay.classList[0] === "katex--display") {
              kdisplay.innerHTML = window.katex.renderToString(kdisplay.textContent, {"displayMode": true,"leqno": false,"fleqn": false,"throwOnError": true,"errorColor": "#cc0000","strict": "warn","output": "htmlAndMathml","trust": false,"macros": {"\\f": "#1f(#2)"}});
            }
            if (kdisplay.classList[0] === "katex--inline") {
              kdisplay.innerHTML = window.katex.renderToString(kdisplay.textContent, {"displayMode": false,"leqno": false,"fleqn": false,"throwOnError": true,"errorColor": "#cc0000","strict": "warn","output": "htmlAndMathml","trust": false,"macros": {"\\f": "#1f(#2)"}});
            }
          }
        }
      }
      
      
      let content = (outer ? node.outerHTML : node.textContent);
      if (isChunking) {
        htmlchunks.textContent = htmlchunks.textContent + content;
        merge = false;
      } else if (!isChunking && htmlchunks.childNodes.length > 0) {
        content = htmlchunks.textContent + content;
        htmlchunks.textContent = "";
      }
      if (merge) elContent.innerHTML = elContent.innerHTML + content;
    }
    
    data.content.html = elContent;
    return data;
  },
  
  openModal(mdoc, options) {
    if (!this._hasOpenModal) {
      // Check arguments
      if ((typeof mdoc) !== "object" && (typeof mdoc.pages) !== "object" && (typeof mdoc.pages.index) !== "object" && (typeof mdoc.pages.index.text) !== "string" && (typeof (mdoc.pages.index.title || "")) !== "string" && (typeof mdoc.name) !== "string") {
        console.error("'mdoc' argument must be '{pages:{index:{text:\"string\",title:\"string (optional)\"},name:\"string\"}', got '" + mdoc + "'.");
      }
      
      options = Object.assign(this.defaultOptions, ((typeof options) === "object") ? options : {});
      let choosedMode = void 0;
      const modes = Object.assign(options.modes, this.defaultModes);
      for (let i in modes) {
        if ((typeof modes[i]) !== "object" && (typeof modes[i].src) !== "string" && (typeof modes[i].name) !== "string") {
          console.error("'modes[" + i + "]' argument must be '{src:\"string\",title:\"string\"}', got '" + modes[i] + "'.")
        }
        if (!choosedMode) choosedMode = modes[i];
      }
      
      // Modal
      if (options.htmlHideOverflow) document.body.parentElement.style = "overflow: hidden;";
      
      const bg = document.createElement("DIV");
      const wrapper = document.createElement("DIV");
      const container = document.createElement("DIV");
      const styleOut = document.createElement("STYLE");
      const styleIn = document.createElement("STYLE");
      const iframe = document.createElement("IFRAME");
      
      iframe.src = "./viewer/index.html";
      iframe.sandbox = "allow-same-origin";
      iframe.classList.add("stackExtendFrame");
      
      container.appendChild(iframe);
      container.classList.add("stackExtendFrameContainer");
      
      if (options.background) wrapper.appendChild(container);
      if (options.background) wrapper.classList.add("StackExtendContainer");
      
      this._hasOpenModal = options.background ? bg : wrapper;
      this._hasOpenModal.appendChild(options.background ? wrapper : container);
      this._hasOpenModal.classList.add(options.background ? "StackExtendBG" : "StackExtendContainer");
      
      styleOut.innerHTML = ":root{--StackExtendDarkThemeFunction:" + this._cssPropertyProtection(choosedMode.toDarkFunction || "ease") + "--StackExtendDarkThemeDuration:" + this._cssPropertyProtection(choosedMode.toDarkDuration || ".15s") + "--StackExtendDarkThemeColorImage:" + this._cssPropertyProtection(choosedMode.lightTheme || "#fff") + "}";
      styleIn.innerHTML = ":root{--toDarkFunction:" + this._cssPropertyProtection(choosedMode.toDarkFunction || "ease") + "--toDarkDuration:" + this._cssPropertyProtection(choosedMode.toDarkDuration || ".15s") + "--toDarkTheme:" + this._cssPropertyProtection(choosedMode.darkTheme || "#000") + "--toLightTheme:" + this._cssPropertyProtection(choosedMode.lightTheme || "#fff") + "}";
      
      iframe.addEventListener("load", async ()=>{
        iframe.contentWindow.document.head.appendChild(styleIn);
        
        const elTitle = iframe.contentWindow.document.getElementById("title");
        const elPageTitle = iframe.contentWindow.document.getElementById("pageName");
        const elContent = iframe.contentWindow.document.getElementById("content");
        const elThemeBtn = iframe.contentWindow.document.getElementById("themeBtn");
        const elApp = iframe.contentWindow.document.getElementById("app");
        const elStackEdit = iframe.contentWindow.document.getElementById("StackEdit");
        
        elTitle.removeAttribute("id");
        elPageTitle.removeAttribute("id");
        elContent.removeAttribute("id");
        elApp.removeAttribute("id");
        elStackEdit.removeAttribute("id");
        elThemeBtn.removeAttribute("id");
        elThemeBtn.title = this.texts.lightTheme;
        elThemeBtn.addEventListener("click", ()=>{
          if (!elThemeBtn.classList.contains("buttonDisabled")) {
            const e = {
              _preventDefault: false,
              
              get prevented() {
                return this._preventDefault;
              },
              get hasDarkTheme() {
                return elApp.classList.contains("darkTheme");
              },
              
              preventDefault(b) {
                this._preventDefault = b;
              }
              
            };
            options.toDarkChange(e);
            if (!e.prevented) {
              if (elApp.classList.contains("darkTheme")) {
                elThemeBtn.title = this.texts.lightTheme;
                elApp.classList.remove("darkTheme");
                styleOut.innerHTML = ":root{--StackExtendDarkThemeFunction:" + this._cssPropertyProtection(choosedMode.toDarkFunction || "ease") + "--StackExtendDarkThemeDuration:" + this._cssPropertyProtection(choosedMode.toDarkDuration || ".15s") + "--StackExtendDarkThemeColorImage:" + this._cssPropertyProtection(choosedMode.lightTheme || "#fff") + "}";
              } else {
                elThemeBtn.title = this.texts.darkTheme;
                elApp.classList.add("darkTheme");
                styleOut.innerHTML = ":root{--StackExtendDarkThemeFunction:" + this._cssPropertyProtection(choosedMode.toDarkFunction || "ease") + "--StackExtendDarkThemeDuration:" + this._cssPropertyProtection(choosedMode.toDarkDuration || ".15s") + "--StackExtendDarkThemeColorImage:" + this._cssPropertyProtection(choosedMode.lightTheme || "#fff") + "}:root{--StackExtendDarkThemeColorImage:" + this._cssPropertyProtection(choosedMode.darkTheme || "#000") + "}";
              }
              elThemeBtn.classList.add("buttonDisabled");
              setTimeout(()=>{elThemeBtn.classList.remove("buttonDisabled")},options.changeThemeInterval);
            }
          }
        });
        
        elStackEdit.addEventListener("click", e=>{
          e.preventDefault(true);
          window.open(elStackEdit.href);
        });
        
        elTitle.textContent = mdoc.name;
        await this._loadModalPage(mdoc, options.firstPage, elPageTitle, elContent);
        if (options.rollTo !== "") iframe.contentWindow.location.href = iframe.contentWindow.location.href.split("#")[0] + "#" + options.rollTo;
      });
      
      document.head.appendChild(styleOut);
      document.body.appendChild(this._hasOpenModal);
      return true;
    }
    return false;
  },
  
  closeModal() {
    if (this._hasOpenModal) {
      this._hasOpenModal.remove();
      this._hasOpenModal = void 0;
    }
  }
};

window.StackExtend = StackExtend;