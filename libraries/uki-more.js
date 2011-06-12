uki.more = {};
uki.more.utils = {
    range: function (d, a) {
        for (var h = new Array(a - d), b = 0; d <= a; d++, b++) h[b] = d;
        return h
    }
};
uki.extend(uki, uki.more.utils);
uki.more.view = {};
uki.viewNamespaces.push("uki.more.view.");
uki.more.view.treeList = {};
uki.view.declare("uki.more.view.TreeList", uki.view.List, function (d) {
    function a(b, e, g) {
        for (e = e; e < b.length; e++) b[e] += g
    }
    function h(b) {
        b = uki.attr(b, "children");
        for (var e = b.length, g = 0; g < b.length; g++) if (b[g].__opened) e += h(b[g]);
        return e
    }
    this._setup = function () {
        d._setup.call(this);
        this._render = new uki.more.view.treeList.Render
    };
    this.listData = d.data;
    this.data = uki.newProp("_treeData", function (b) {
        this._treeData = b;
        this._data = this._treeNodeToListData(b);
        b = false;
        for (var e = this.listData().length - 1; e >= 0; e--) if (this._data[e].__opened) {
            b = true;
            this._openSubElement(e)
        }
        this.listData(this._data);
        b && this.trigger("open")
    });
    this._treeNodeToListData = function (b, e) {
        e = e || 0;
        return uki.map(b, function (g) {
            g.__indent = e;
            return g
        })
    };
    this.toggle = function (b) {
        this._data[b].__opened ? this.close(b) : this.open(b)
    };
    this._openSubElement = function (b) {
        var e = this._data[b],
            g = uki.attr(e, "children");
        if (!g || !g.length) return 0;
        var i = g.length;
        e.__opened = true;
        this._data.splice.apply(this._data, [b + 1, 0].concat(this._treeNodeToListData(g, e.__indent + 1)));
        for (e = g.length - 1; e >= 0; e--) if (this._data[b + 1 + e].__opened) i += this._openSubElement(b + 1 + e);
        return i
    };
    this.open = function (b) {
        if (this._data[b].__opened) return this;
        var e = this._openSubElement(b),
            g = uki.binarySearch(b, this._selectedIndexes),
            i = this._lastClickIndex,
            c = this._selectedIndexes;
        this.clearSelection(true);
        a(c, g + (c[g] == b ? 1 : 0), e);
        this.listData(this._data);
        this.selectedIndexes(c);
        this._lastClickIndex = i > b ? i + e : i;
        this.trigger("open");
        return this
    };
    this.close = function (b) {
        var e = this._data[b],
            g = this._selectedIndexes,
            i = uki.attr(e, "children");
        if (!(!i || !i.length || !e.__opened)) {
            i = h(e);
            e.__opened = false;
            this._data.splice(b + 1, i);
            e = uki.binarySearch(b, g);
            for (var c = e + (g[e] == b ? 1 : 0), f = 0, j = this._lastClickIndex; g[c + f] && g[c + f] <= b + i;) f++;
            this.clearSelection(true);
            a(g, c, -i);
            f > 0 && g.splice(e, f);
            this.listData(this._data);
            this.selectedIndexes(g);
            this._lastClickIndex = j > b ? j - i : j;
            this.trigger("close")
        }
    };
    this._mousedown = function (b) {
        if (b.target.className.indexOf("toggle-tree") > -1) {
            var e = uki.dom.offset(this._dom);
            this.toggle((b.pageY - e.y) / this._rowHeight << 0)
        } else d._mousedown.call(this, b)
    };
    this._keypress = function (b) {
        d._keypress.call(this, b);
        b = b.domEvent;
        if (b.which == 39 || b.keyCode == 39) this.open(this._lastClickIndex);
        else if (b.which == 37 || b.keyCode == 37) this.close(this._lastClickIndex)
    }
});
uki.more.view.treeList.Render = uki.newClass(uki.view.list.Render, new(function () {
    this._parentTemplate = new uki.theme.Template('<div class="${classPrefix}-row ${classPrefix}-${opened}" style="margin-left:${indent}px"><div class="${classPrefix}-toggle"><i class="toggle-tree"></i></div>${text}</div>');
    this._leafTemplate = new uki.theme.Template('<div class="${classPrefix}-row" style="margin-left:${indent}px">${text}</div>');
    this.initStyles = function () {
        this.classPrefix = "treeList-" + uki.guid++;
        var d = (new uki.theme.Template(".${classPrefix}-row { color: #333; position:relative; padding-top:4px; margin-left: 35px; } .${classPrefix}-toggle { overflow: hidden; position:absolute; left:-15px; top:5px; width: 10px; height:9px; } .${classPrefix}-toggle i { display: block; position:absolute; left: 0; top: 0; width:20px; height:18px; background: url(${imageSrc});} .${classPrefix}-selected { background: url(${backgSrc}); } .${classPrefix}-selected .${classPrefix}-row { color: #FFF; } .${classPrefix}-selected i { left: -10px; } .${classPrefix}-selected-blured { background: url(${backgSrc}); } .${classPrefix}-selected-blured .${classPrefix}-row { color: #FFF; } .${classPrefix}-selected-blured i { left: -10px; } .${classPrefix}-opened i { top: -9px; } .treeList-unread { position: absolute; padding: 2px 4px; min-width: 14px; text-align: center; right: 5px; top: 3px; color: white; background: #94A7C8; -webkit-border-radius: 10px; -moz-border-radius: 10px; border-radius: 10px; line-height: 10px; font-size: 10px; font-weight: bold; } .${classPrefix}-selected .treeList-unread { background: white; color: #94A7C8; } .${classPrefix}-selected-blured .treeList-unread { background: white; color: #94A7C8; }")).render({
            classPrefix: this.classPrefix,
            imageSrc: "libraries/uki-arrows.png",
            backgSrc: "libraries/uki-sidebar-selected.png"
        });
        uki.dom.createStylesheet(d)
    };
    this.render = function (d) {
        this.classPrefix || this.initStyles();
        var a = d.data,
            h = uki.attr(d, "children");
        return h && h.length ? this._parentTemplate.render({
            text: a,
            indent: d.__indent * 18 + 35,
            classPrefix: this.classPrefix,
            opened: d.__opened ? "opened" : ""
        }) : this._leafTemplate.render({
            text: a,
            indent: d.__indent * 18 + 35,
            classPrefix: this.classPrefix
        })
    };
    this.setSelected = function (d, a, h, b) {
        d.className = !h ? "" : b ? this.classPrefix + "-selected" : this.classPrefix + "-selected-blured"
    }
}));
uki.view.declare("uki.more.view.ToggleButton", uki.view.Button, function (d) {
    this._setup = function () {
        d._setup.call(this);
        this._focusable = false
    };
    this.value = this.checked = uki.newProp("_checked", function (a) {
        this._checked = !! a;
        this._updateBg()
    });
    this._updateBg = function () {
        this._backgroundByName(this._disabled ? "disabled" : this._down || this._checked ? "down" : this._over ? "hover" : "normal")
    };
    this._mouseup = function () {
        if (this._down) {
            this._down = false;
            this._disabled || this.checked(!this.checked())
        }
    }
});
uki.view.declare("uki.more.view.RadioButton", uki.more.view.ToggleButton, function () {
    var d = uki.view.Radio;
    this.group = uki.newProp("_group", function (a) {
        d.unregisterGroup(this);
        this._group = a;
        d.registerGroup(this);
        this.checked() && d.clearGroup(this)
    });
    this.value = this.checked = uki.newProp("_checked", function (a) {
        this._checked = !! a;
        a && d.clearGroup(this);
        this._updateBg()
    });
    this._mouseup = function () {
        if (this._down) {
            this._down = false;
            if (!this._checked && !this._disabled) {
                this.checked(!this._checked);
                this.trigger("change", {
                    checked: this._checked,
                    source: this
                })
            }
        }
    }
});
uki.more.view.splitTable = {};
uki.view.declare("uki.more.view.SplitTable", uki.view.Container, function (d) {
    var a = uki.geometry.Rect,
        h = uki.geometry.Size,
        b = "rowHeight data packSize visibleRectExt render selectedIndex focusable textSelectable multiselect".split(" ");
    this._defaultHandlePosition = 200;
    this._headerHeight = 17;
    this._style = function (c, f) {
        this._leftHeader.style(c, f);
        this._rightHeader.style(c, f);
        return d._style.call(this, c, f)
    };
    this.columns = uki.newProp("_columns", function (c) {
        this._columns = uki.build(c);
        this._totalWidth = 0;
        this._leftHeader.columns([this._columns[0]]);
        this._columns[0].bind("beforeResize", uki.proxy(this._syncHandlePosition, this, this._columns[0]));
        for (c = 1; c < this._columns.length; c++) {
            this._columns[c].position(c - 1);
            this._columns[c].bind("beforeResize", uki.proxy(this._rightColumnResized, this, this._columns[c]))
        }
        this._updateTotalWidth();
        this._rightHeader.columns(Array.prototype.slice.call(this._columns, 1));
        this._splitPane.leftMin(this._columns[0].minWidth() - 1);
        this._syncHandlePosition(this._splitPane)
    });
    uki.each(b, function (c, f) {
        this[f] = function (j) {
            if (j === undefined) return this._leftList[f]();
            this._leftList[f](j);
            this._rightList[f](j);
            return this
        }
    }, this);
    this.hasFocus = function () {
        return this._leftList.hasFocus() || this._rightList.hasFocus()
    };
    this.rightColumns = function () {
        return this._rightHeader.columns()
    };
    this._rightColumnResized = function () {
        this._updateTotalWidth();
        this._horizontalScroll.layout()
    };
    this.rowHeight = function (c) {
        if (c === undefined) return this._leftList.rowHeight();
        this._leftList.rowHeight(c);
        this._rightList.rowHeight(c);
        return this
    };
    this.data = function (c) {
        if (c === undefined) return uki.map(this._leftList.data(), function (f, j) {
            return [f].concat(this._rightList.data()[j])
        }, this);
        this._leftList.data(uki.map(c, function (f) {
            return [f[0]]
        }));
        this._rightList.data(uki.map(c, function (f) {
            return f.slice(1)
        }));
        this._splitPane.minSize(new h(0, this._leftList.minSize().height));
        this._verticalScroll.layout()
    };
    this._createDom = function () {
        d._createDom.call(this);
        var c = uki.view.ScrollPane.initScrollWidth(),
            f = this.rect().height - this._headerHeight - c;
        uki([{
            view: "table.Header",
            rect: new a(this._defaultHandlePosition, this._headerHeight),
            anchors: "left top"
        }, {
            view: "Box",
            className: "table-header-container",
            style: {
                overflow: "hidden"
            },
            rect: new a(this._defaultHandlePosition, 0, this.rect().width - this._defaultHandlePosition - 1, this._headerHeight),
            anchors: "left top right",
            childViews: {
                view: "table.Header",
                rect: new a(this.rect().width - this._defaultHandlePosition - 1, this._headerHeight),
                anchors: "top left right",
                className: "table-header"
            }
        }, {
            view: "ScrollPane",
            rect: new a(0, this._headerHeight, this.rect().width, f),
            anchors: "left top right bottom",
            className: "table-v-scroll",
            scrollV: true,
            childViews: [{
                view: "HSplitPane",
                rect: new a(this.rect().width, f),
                anchors: "left top right bottom",
                className: "table-horizontal-split-pane",
                handlePosition: this._defaultHandlePosition,
                handleWidth: 1,
                leftChildViews: [{
                    view: "List",
                    rect: new a(this._defaultHandlePosition, f),
                    anchors: "left top right bottom",
                    className: "table-list-left"
                }],
                rightChildViews: [{
                    view: "Box",
                    rect: "0 0 100 100",
                    anchors: "left top right bottom",
                    style: {
                        overflow: "hidden"
                    },
                    rect: new a(this.rect().width - this._defaultHandlePosition - 1, f),
                    childViews: {
                        view: "ScrollPane",
                        rect: new a(this.rect().width - this._defaultHandlePosition - 1, f + c),
                        scrollableV: false,
                        scrollableH: true,
                        anchors: "left top right bottom",
                        className: "table-h-scroll",
                        childViews: [{
                            view: "List",
                            rect: new a(this.rect().width - this._defaultHandlePosition - 1, f + c),
                            anchors: "left top right bottom"
                        }]
                    }
                }]
            }]
        }, {
            view: "ScrollPane",
            rect: new a(this._defaultHandlePosition + 1, f + this._headerHeight, this.rect().width - this._defaultHandlePosition - 1, c),
            anchors: "left bottom right",
            scrollableH: true,
            scrollableV: false,
            scrollH: true,
            className: "table-h-scroll-bar",
            childViews: {
                view: "Box",
                rect: "1 1",
                anchors: "left top"
            }
        }]).appendTo(this);
        this._verticalScroll = uki("ScrollPane[className=table-v-scroll]", this)[0];
        this._horizontalScroll = uki("ScrollPane[className=table-h-scroll]", this)[0];
        this._horizontalScrollBar = uki("ScrollPane[className=table-h-scroll-bar]", this)[0];
        this._leftList = uki("List:eq(0)", this)[0];
        this._rightList = uki("List:eq(1)", this)[0];
        this._splitPane = uki("HSplitPane", this)[0];
        this._leftHeader = uki("table.Header:eq(0)", this)[0];
        this._rightHeader = uki("table.Header:eq(1)", this)[0];
        this._rightHeaderContainer = uki("[className=table-header-container]", this)[0];
        this._dummyScrollContents = uki("Box", this._horizontalScrollBar);
        this._leftList._scrollableParent = this._verticalScroll;
        this._rightList._scrollableParent = this._verticalScroll;
        this._verticalScroll.bind("scroll", uki.proxy(this._leftList._scrollableParentScroll, this._leftList));
        this._verticalScroll.bind("scroll", uki.proxy(this._rightList._scrollableParentScroll, this._rightList));
        this._leftList.render(new uki.more.view.splitTable.Render(this._leftHeader));
        this._rightList.render(new uki.more.view.splitTable.Render(this._rightHeader));
        this._bindEvents()
    };
    this._bindEvents = function () {
        this._splitPane.bind("handleMove", uki.proxy(this._syncHandlePosition, this, this._splitPane));
        this._horizontalScroll.bind("scroll", uki.proxy(this._syncHScroll, this, this._horizontalScroll));
        this._horizontalScrollBar.bind("scroll", uki.proxy(this._syncHScroll, this, this._horizontalScrollBar));
        this._leftList.bind("selection", uki.proxy(this._syncSelection, this, this._leftList));
        this._rightList.bind("selection", uki.proxy(this._syncSelection, this, this._rightList))
    };
    var e = false;
    this._syncHandlePosition = function (c) {
        if (!e) {
            e = true;
            var f;
            if (c == this._splitPane) {
                c = this._splitPane.handlePosition() + 1;
                this.columns()[0].width(c)
            } else {
                c = this.columns()[0].width();
                this._splitPane.handlePosition(c - 1).layout()
            }
            this._leftHeader.rect(new a(c, this._headerHeight)).layout();
            f = this._rightHeaderContainer.rect().clone();
            f.x = c;
            f.width = this._rect.width - c - uki.view.ScrollPane.initScrollWidth();
            this._rightHeaderContainer.rect(f).layout();
            f = this._horizontalScrollBar.rect().clone();
            f.x = c;
            f.width = this._rect.width - c - uki.view.ScrollPane.initScrollWidth();
            this._horizontalScrollBar.rect(f).layout();
            e = false
        }
    };
    var g = false;
    this._syncHScroll = function (c) {
        if (!g) {
            g = true;
            var f = c == this._horizontalScroll ? this._horizontalScrollBar : this._horizontalScroll;
            c = c.scrollLeft();
            f.scrollLeft(c);
            this._rightHeader.dom().style.marginLeft = -c + "px";
            g = false
        }
    };
    var i = false;
    this._syncSelection = function (c) {
        if (!i) {
            i = true;
            (c == this._leftList ? this._rightList : this._leftList).selectedIndexes(c.selectedIndexes());
            i = false
        }
    };
    this._updateTotalWidth = function () {
        this._totalWidth = 0;
        for (var c = 1; c < this._columns.length; c++) this._totalWidth += this._columns[c].width();
        this._rightHeader.minSize(new h(this._totalWidth, 0));
        this._rightList.minSize(new h(this._totalWidth, this._rightList.minSize().height));
        this._dummyScrollContents.rect(new a(this._totalWidth, 1)).parent().layout();
        this._rightHeader.minSize(new h(this._totalWidth, 0));
        this._horizontalScroll.layout()
    }
});
uki.more.view.splitTable.Render = uki.newClass(uki.view.table.Render, new function () {
    this.setSelected = function (d, a, h, b) {
        b = true;
        d.style.backgroundColor = h && b ? "#3875D7" : h ? "#CCC" : "";
        d.style.color = h && b ? "#FFF" : "#000"
    }
});
uki.view.declare("uki.more.view.Form", uki.view.Container, function (d) {
    this._setup = function () {
        d._setup.call(this);
        uki.extend(this, {
            _method: "GET",
            _action: ""
        })
    };
    this.action = uki.newProp("_action", function (a) {
        this._dom.action = this._action = a
    });
    this.method = uki.newProp("_method", function (a) {
        this._dom.method = this._method = a
    });
    this.submit = function () {
        this._dom.submit()
    };
    this.reset = function () {
        this._dom.reset()
    };
    this._createDom = function () {
        this._dom = uki.createElement("form", d.defaultCss);
        this._initClassName();
        this._dom.action = this._action;
        this._dom.method = this._method
    }
});
uki.view.declare("uki.more.view.Select", uki.view.Checkbox, function (d) {
    this._backgroundPrefix = "select-";
    this._popupBackground = "theme(select-popup)";
    this._listBackground = "theme(select-list)";
    this._popupOffset = 0;
    this._setup = function () {
        d._setup.call(this);
        this._inset = new uki.geometry.Inset(0, 20, 0, 4);
        this._focusable = this._selectFirst = true;
        this._options = [];
        this._maxPopupHeight = 200;
        this._lastScroll = 0
    };
    this.Render = uki.newClass(uki.view.list.Render, function () {
        this.render = function (a) {
            return '<span style="line-height: 22px; text-align: left; white-space: nowrap; margin: 0 4px; cursor: default">' + a + "</span>"
        };
        this.setSelected = function (a, h, b) {
            a.style.backgroundColor = b ? "#3875D7" : "";
            a.style.color = b ? "#FFF" : "#000"
        }
    });
    this.selectFirst = uki.newProp("_selectFirst");
    this.opened = function () {
        return this._popup.visible() && this._popup.parent()
    };
    this.popupAnchors = function (a) {
        if (a === undefined) return this._popup.anchors();
        this._popup.anchors(a);
        return this
    };
    this._createDom = function () {
        d._createDom.call(this);
        this.style({
            fontWeight: "normal",
            textAlign: "left"
        });
        this._label.style.overflow = "hidden";
        this._popup = uki({
            view: "Popup",
            anchors: "left top",
            rect: "100 100",
            style: {
                zIndex: 1E3
            },
            offset: this._popupOffset,
            background: this._popupBackground,
            relativeTo: this,
            visible: false,
            childViews: [{
                view: "ScrollPane",
                rect: "100 100",
                anchors: "left top right bottom",
                childViews: [{
                    view: "List",
                    rect: "100 100",
                    anchors: "left top right bottom",
                    rowHeight: 22,
                    textSelectable: false,
                    focusable: true,
                    background: this._listBackground,
                    render: new this.Render,
                    style: {
                        fontSize: "12px"
                    }
                }]
            }]
        })[0];
        this._popup.hide();
        this._list = uki("List", this._popup)[0];
        this._scroll = uki("ScrollPane", this._popup)[0];
        this._popup.bind("toggle", uki.proxy(function () {
            this._down = this._popup.visible();
            if (this._popup.visible()) {
                this._updateWidth();
                this._scroll.scrollTop(this._lastScroll)
            }
            this._checked = this._popup.visible();
            this._updateBg()
        }, this));
        this.bind(this._list.keyPressEvent(), function (a) {
            if (this.preventTransfer) this.preventTransfer = false;
            else this._popup.visible() && this._list.trigger(a.type, a)
        });
        this.bind("blur", function () {
            setTimeout(uki.proxy(function () {
                if (!this._hasFocus && this.opened()) {
                    this._lastScroll = this._scroll.scrollTop();
                    this._popup.hide()
                }
            }, this), 50)
        });
        this._list.bind("focus", uki.proxy(function () {
            this._hasFocus = false;
            this.focus()
        }, this));
        this._list.bind("click", uki.proxy(this.selectCurrent, this))
    };
    this.contentsSize = function (a) {
        var h = this.html();
        this.html(this._longestText);
        a = d.contentsSize.call(this, a);
        this.html(h);
        return a
    };
    this._keydown = function (a) {
        if ((a.which == 32 || a.which == 13) && this._popup.visible()) this.selectCurrent(a);
        else if ((a.which == 40 || a.which == 38) && !this._popup.visible()) {
            this._popup.toggle();
            a.preventDefault();
            this.preventTransfer = true
        } else d._keydown.call(this, a)
    };
    this.selectCurrent = function (a) {
        this.selectedIndex() == -1 ? this.text(this._selectFirst && this._options[0] ? this._options[0].text : "") : this.text(this._options[this.selectedIndex()].text);
        this._lastScroll = this._scroll.scrollTop();
        this._popup.hide();
        a && this.trigger("change", {
            source: this
        })
    };
    this.value = function (a) {
        if (a === undefined) return this._options[this.selectedIndex()] ? this._options[this.selectedIndex()].value : undefined;
        else {
            var h = -1,
                b, e = this._options.length,
                g;
            for (g = 0; g < e; g++) {
                b = this._options[g];
                if (b.value == a) {
                    h = g;
                    break
                }
            }
            this.selectedIndex(h);
            this.selectCurrent()
        }
    };
    this.maxPopupHeight = uki.newProp("_maxPopupHeight");
    this._updateWidth = function () {
        if (!(this._widthCached || !this._options.length)) {
            var a = this._list.dom().firstChild.firstChild.firstChild,
                h = a.innerHTML;
            a.innerHTML = this._longestText;
            this._widthCached = a.offsetWidth + 8;
            a.innerHTML = h;
            this._popup.rect(new uki.geometry.Rect(this._popup.rect().x, this._popup.rect().y, Math.max(this._widthCached, this.rect().width), Math.min(this._maxPopupHeight, this._options.length * 22))).layout()
        }
    };
    this.options = uki.newProp("_options", function (a) {
        this._options = a;
        this._list.data(uki.map(a, "text")).selectedIndex(0);
        this._selectFirst && a.length > 0 && this.text(a[0].text);
        this._longestText = "";
        uki.each(a, function (h, b) {
            if (b.text.length > this._longestText.length) this._longestText = b.text
        }, this);
        this._widthCached = false;
        this._lastScroll = 0
    });
    uki.delegateProp(this, "selectedIndex", "_list");
    this._updateBg = function () {
        return d._updateBg.call(this)
    };
    this._mousedown = function (a) {
        d._mousedown.call(this, a);
        if (!this.disabled()) {
            this._popup.toggle();
            this.trigger("toggle", {
                opened: this.opened()
            })
        }
    };
    this._mouseup = function () {
        if (this._down) this._down = false
    }
});
uki.Collection.addAttrs(["options"]);
(function () {
    function d(h, b) {
        return new uki.background.CssBox((b || "") + "background: url(" + uki.theme.imageSrc(h) + "); background-position: 100% 50%; background-repeat: no-repeat;")
    }
    var a = uki.extend({}, uki.theme.Base, {
        backgrounds: {
            "select-normal": function () {
                return new uki.background.Multi(d("select-handle-normal"), uki.theme.background("button-normal"))
            },
            "select-hover": function () {
                return new uki.background.Multi(d("select-handle-normal"), uki.theme.background("button-hover"))
            },
            "select-checked-normal": function () {
                return new uki.background.Multi(d("select-handle-normal"), uki.theme.background("button-down"))
            },
            "select-disabled": function () {
                return new uki.background.Multi(d("select-handle-normal", "opacity:0.4;"), uki.theme.background("button-disabled"))
            },
            "select-popup": function () {
                return uki.theme.background("popup-normal")
            }
        },
        imageSrcs: {
            "select-handle-normal": function () {
                return ["select-down-m.png", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAABkCAYAAABtnKvPAAAAeUlEQVRo3u3SMQ2AMBAFUCQgAQlIQUKTthq6IhEpOIAOTIWFABPvkr/c8IZ/15VStu6rgcPhcDgcDofD4XA4HA6HnybnvNRsF1ke4yGEoUJrA691379SS4xxavDx1c5TSvMBh08Oegv253A4HA6Hw+FwOBwOh8P/ie9z0RuWFOYPhAAAAABJRU5ErkJggg==", "select-down-m.gif"]
            }
        }
    });
    a.backgrounds["select-checked-hover"] = a.backgrounds["select-checked-normal"];
    uki.theme.register(a)
})();