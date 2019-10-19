import React, {Component} from "react";

import CodeMirror from "@uiw/react-codemirror";
import "codemirror/keymap/sublime";
import "antd/dist/antd.css";
import {observer, inject} from "mobx-react";

import Dialog from "./layout/Dialog";
import Navbar from "./layout/Navbar";
import StyleEditor from "./layout/StyleEditor";

import "./App.css";
import "./utils/mdMirror.css";

import {markdownParser, markdownParserWechat, updateMathjax} from "./utils/helper";
import {uploadAdaptor} from "./utils/imageHosting";
import {message} from "antd";

@inject("content")
@inject("navbar")
@inject("dialog")
@observer
class App extends Component {
  constructor(props) {
    super(props);
    this.focus = false;
    this.scale = 1;
    this.state = {
      isDragOver: false,
    };
  }

  componentDidUpdate() {
    updateMathjax();
  }

  setCurrentIndex(index) {
    this.index = index;
  }

  getInstance = (instance) => {
    if (instance) {
      this.props.content.setMarkdownEditor(instance.editor);
    }
  };

  handleScroll = () => {
    const {markdownEditor} = this.props.content;
    const cmData = markdownEditor.getScrollInfo();
    const editorToTop = cmData.top;
    const editorScrollHeight = cmData.height - cmData.clientHeight;
    this.scale = (this.previewWrap.offsetHeight - this.previewContainer.offsetHeight + 55) / editorScrollHeight;
    if (this.index === 1) {
      this.previewContainer.scrollTop = editorToTop * this.scale;
    } else {
      this.editorTop = this.previewContainer.scrollTop / this.scale;
      markdownEditor.scrollTo(null, this.editorTop);
    }
  };

  handleChange = (editor) => {
    if (this.focus) {
      const content = editor.getValue();
      this.props.content.setContent(content);
    }
  };

  handleFocus = () => {
    this.focus = true;
  };

  handleBlur = () => {
    this.focus = false;
  };

  getStyleInstance = (instance) => {
    if (instance) {
      this.styleEditor = instance.editor;
      this.styleEditor.on("keyup", (cm, e) => {
        if ((e.keyCode >= 65 && e.keyCode <= 90) || e.keyCode === 189) {
          cm.showHint(e);
        }
      });
    }
  };

  handleDrop = (instance, e) => {
    this.setState({isDragOver: false});
    // e.preventDefault();
    console.log(e.dataTransfer.files[0]);
    if (!(e.dataTransfer && e.dataTransfer.files)) {
      return;
    }
    const {files} = e.dataTransfer;
    for (let i = 0; i < files.length; i++) {
      console.log(files[i]);
      if (files[i].size > 1024 * 1024 * 5) {
        message.error("文件大小超过 5 M！");
        continue;
      }
      if (!files[i].type.includes("image")) {
        message.warning("上传文件类型不是图片！");
      }
      uploadAdaptor({file: files[i], content: this.props.content});
    }
  };

  handlePaste = (instance, e) => {
    if (e.clipboardData.files) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        uploadAdaptor({file: e.clipboardData.files[i], content: this.props.content});
      }
    }
  };

  handleDragOver = () => {
    this.setState({isDragOver: true});
  };

  handleDragLeave = () => {
    this.setState({isDragOver: false});
  };

  render() {
    const {codeNum} = this.props.navbar;
    const parseHtml =
      codeNum === 0
        ? markdownParserWechat.render(this.props.content.content)
        : markdownParser.render(this.props.content.content);
    return (
      <div className="App">
        <Navbar />
        <div className="text-container">
          <div
            className={`text-box  ${this.state.isDragOver ? "codemirror-ext" : null}`}
            onMouseOver={(e) => this.setCurrentIndex(1, e)}
          >
            <CodeMirror
              value={this.props.content.content}
              options={{
                theme: "md-mirror",
                keyMap: "sublime",
                mode: "markdown",
                lineWrapping: true,
                lineNumbers: false,
              }}
              onChange={this.handleChange}
              onScroll={this.handleScroll}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
              onDrop={this.handleDrop}
              onPaste={this.handlePaste}
              onDragOver={this.handleDragOver}
              onDragLeave={this.handleDragLeave}
              ref={this.getInstance}
            />
          </div>
          <div id="marked-text" className="text-box" onMouseOver={(e) => this.setCurrentIndex(2, e)}>
            <div
              id="wx-box"
              className="wx-box"
              onScroll={this.handleScroll}
              ref={(node) => {
                this.previewContainer = node;
              }}
            >
              <section
                id="layout"
                className="layout"
                dangerouslySetInnerHTML={{
                  __html: parseHtml,
                }}
                ref={(node) => {
                  this.previewWrap = node;
                }}
              />
            </div>
          </div>

          {this.props.navbar.isStyleEditorOpen ? (
            <div className="text-box">
              <StyleEditor />
            </div>
          ) : null}

          <Dialog />
        </div>
      </div>
    );
  }
}

export default App;
