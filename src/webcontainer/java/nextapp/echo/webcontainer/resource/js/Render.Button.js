// FIXME TriCellTable orientations
// FIXME alignment

/**
 * Component rendering peer: Button
 */
EchoAppRender.ButtonSync = Core.extend(EchoRender.ComponentSync, {

    $static: {
        _createPrototypeButton: function() {
            var divElement = document.createElement("div");
            divElement.tabIndex = "0";
            divElement.style.outlineStyle = "none";
            divElement.style.cursor = "pointer";
            return divElement;
        },

        _defaultIconTextMargin: new EchoApp.Extent(5)
    },
    
    $load: function() {
        this._prototypeButton = this._createPrototypeButton();
        EchoRender.registerPeer("Button", this);
    },
    
    $construct: function() { },
    
    /**
     * Registers listners on the button.  This method is invoked lazily, i.e., the first time the button
     * is focused or moused over.  The initial focus/mouseover listeners are removed by this method.
     * This strategy is used for performance reasons due to the fact that many buttons may be present 
     * on the screen, and each button has many event listeners.
     */
    _addEventListeners: function() {
        // Remove initialization listeners.
        WebCore.EventProcessor.remove(this._divElement, "focus", new Core.MethodRef(this, this._processInitFocus), false);
        WebCore.EventProcessor.remove(this._divElement, "mouseover", 
                new Core.MethodRef(this, this._processInitMouseOver), false);
        
        WebCore.EventProcessor.add(this._divElement, "click", new Core.MethodRef(this, this._processClick), false);
        WebCore.EventProcessor.add(this._divElement, "keypress", new Core.MethodRef(this, this._processKeyPress), false);
        if (this.component.getRenderProperty("rolloverEnabled")) {
            var mouseEnterLeaveSupport = WebCore.Environment.PROPRIETARY_EVENT_MOUSE_ENTER_LEAVE_SUPPORTED;
            var enterEvent = mouseEnterLeaveSupport ? "mouseenter" : "mouseover";
            var exitEvent = mouseEnterLeaveSupport ? "mouseleave" : "mouseout";
            WebCore.EventProcessor.add(this._divElement, enterEvent, 
                    new Core.MethodRef(this, this._processRolloverEnter), false);
            WebCore.EventProcessor.add(this._divElement, exitEvent, 
                    new Core.MethodRef(this, this._processRolloverExit), false);
        }
        if (this.component.getRenderProperty("pressedEnabled")) {
            WebCore.EventProcessor.add(this._divElement, "mousedown", new Core.MethodRef(this, this._processPress), false);
            WebCore.EventProcessor.add(this._divElement, "mouseup", new Core.MethodRef(this, this._processRelease), false);
        }
        WebCore.EventProcessor.add(this._divElement, "focus", new Core.MethodRef(this, this._processFocus), false);
        WebCore.EventProcessor.add(this._divElement, "blur", new Core.MethodRef(this, this._processBlur), false);
        
        WebCore.EventProcessor.addSelectionDenialListener(this._divElement);
    },
    
    _doAction: function() {
        this.component.doAction();
    },
    
    _getCombinedAlignment: function() {
        var primary = this.component.getRenderProperty("alignment");
        var secondary = this.component.getRenderProperty("textAlignment");
        
        if (primary == null) {
            return secondary;
        } else if (secondary == null) {
            return primary;
        }
        
        var horizontal = primary.horizontal;
        if (horizontal == EchoApp.Alignment.DEFAULT) {
            horizontal = secondary.horizontal;
        }
        var vertical = primary.vertical;
        if (vertical == EchoApp.Alignment.DEFAULT) {
            vertical = secondary.vertical;
        }
        return new EchoApp.Alignment(horizontal, vertical);
    },
    
    getElement: function() {
        return this._divElement;
    },
    
    _processBlur: function(e) {
        if (!this.client.verifyInput(this.component)) {
            return;
        }
        this._setFocusState(false);
    },
    
    _processClick: function(e) {
        if (!this.client.verifyInput(this.component)) {
            return;
        }
        this.component.application.setFocusedComponent(this.component);
        this._doAction();
    },
    
    _processFocus: function(e) {
        if (!this.client.verifyInput(this.component)) {
            return;
        }
        this._setFocusState(true);
    },
    
    /**
     * Initial focus listener.  This listener is invoked the FIRST TIME the button is focused.
     * It invokes the addListeners() method to lazily add the full listener set to the button.
     */
    _processInitFocus: function(e) {
        this._addEventListeners();
        this._processFocus(e);
    },
    
    /**
     * Initial mouse over listener.  This listener is invoked the FIRST TIME the button is moused over.
     * It invokes the addListeners() method to lazily add the full listener set to the button.
     */
    _processInitMouseOver: function(e) {
        this._addEventListeners();
        if (this.component.getRenderProperty("rolloverEnabled")) {
            this._processRolloverEnter(e);
        }
    },
    
    _processKeyPress: function(e) {
        if (!this.client.verifyInput(this.component)) {
            return true;
        }
        if (e.keyCode == 13) { // FIXME This will fail in IE (I think)
            this._doAction();
            return false;
        } else {
            return true;
        }
    },
    
    _processPress: function(e) {
        if (!this.client.verifyInput(this.component)) {
            return;
        }
        WebCore.DOM.preventEventDefault(e);
        this._setPressedState(true);
    },
    
    _processRelease: function(e) {
        if (!this.client.verifyInput(this.component)) {
            return;
        }
        this._setPressedState(false);
    },
    
    _processRolloverEnter: function(e) {
        if (!this.client.verifyInput(this.component) || WebCore.dragInProgress) {
            return;
        }
        this.component.application.addFocusListener(new Core.MethodRef(this, this._processRolloverExit));
        this._setRolloverState(true);
    },
    
    _processRolloverExit: function(e) {
        if (!this.client.verifyInput(this.component)) {
            return;
        }
        this.component.application.removeFocusListener(new Core.MethodRef(this, this._processRolloverExit));
        this._setRolloverState(false);
    },
    
    renderAdd: function(update, parentElement) {
        this._enabled = this.component.isRenderEnabled();
        
        this._divElement = EchoAppRender.ButtonSync._prototypeButton.cloneNode(false); 
    
        EchoAppRender.Color.render(
                EchoAppRender.getEffectProperty(this.component, "foreground", "disabledForeground", !this._enabled), 
                this._divElement, "color");
        EchoAppRender.Color.render(
                EchoAppRender.getEffectProperty(this.component, "background", "disabledBackground", !this._enabled), 
                this._divElement, "backgroundColor");
        EchoAppRender.Border.render(
                EchoAppRender.getEffectProperty(this.component, "border", "disabledBorder", !this._enabled), 
                this._divElement);
        EchoAppRender.Font.render(
                EchoAppRender.getEffectProperty(this.component, "font", "disabledFont", !this._enabled), 
                this._divElement);
        EchoAppRender.FillImage.render(
                EchoAppRender.getEffectProperty(this.component, "backgroundImage", "disabledBackgroundImage", !this._enabled),
                this._divElement);
        
        EchoAppRender.Insets.renderComponentProperty(this.component, "insets", null, this._divElement, "padding");
        EchoAppRender.Alignment.renderComponentProperty(this.component, "alignment", null, this._divElement, true);
        
        var toolTipText = this.component.getRenderProperty("toolTipText");
        if (toolTipText) {
            this._divElement.title = toolTipText;
        }
        var width = this.component.getRenderProperty("width");
        if (width) {
            this._divElement.style.width = width.toString();
        }
        var height = this.component.getRenderProperty("height");
        if (height) {
            this._divElement.style.height = height.toString();
            this._divElement.style.overflow = "hidden";
        }
        
        this._renderContent();
        
        if (this._enabled) {
            // Add event listeners for focus and mouseover.  When invoked, these listeners will register the full gamut
            // of button event listeners.  There may be a large number of such listeners depending on how many effects
            // are enabled, and as such we do this lazily for performance reasons.
            WebCore.EventProcessor.add(this._divElement, "focus", new Core.MethodRef(this, this._processInitFocus), false);
            WebCore.EventProcessor.add(this._divElement, "mouseover", 
                    new Core.MethodRef(this, this._processInitMouseOver), false);
        }
    
        parentElement.appendChild(this._divElement);
    },
    
    _renderContent: function() {
        var text = this.component.getRenderProperty("text");
        var icon = EchoAppRender.getEffectProperty(this.component, "icon", "disabledIcon", !this._enabled);
        if (text) {
            if (icon) {
                // Text and icon.
                var iconTextMargin = this.component.getRenderProperty("iconTextMargin", 
                        EchoAppRender.ButtonSync._defaultIconTextMargin);
                var orientation = EchoAppRender.TriCellTable.getOrientation(this.component, "textPosition");
                var tct = new EchoAppRender.TriCellTable(orientation, 
                        EchoAppRender.Extent.toPixels(iconTextMargin));
                this._renderButtonText(tct.tdElements[0], text);
                this._iconElement = this._renderButtonIcon(tct.tdElements[1], icon);
                this._divElement.appendChild(tct.tableElement);
            } else {
                // Text only.
                this._renderButtonText(this._divElement, text);
            }
        } else if (icon) {
            // Icon only.
            this._iconElement = this._renderButtonIcon(this._divElement, icon);
        }
    },
    
    _renderButtonText: function(element, text) {
        element.appendChild(document.createTextNode(text));
        if (!this.component.getRenderProperty("lineWrap", true)) {
            element.style.whiteSpace = "nowrap";
        }
    },
    
    _renderButtonIcon: function(element, icon) {
        var imgElement = document.createElement("img");
        imgElement.src = icon.url ? icon.url : icon;
        imgElement.alt = "";
        if (icon.width) {
            imgElement.style.width = icon.width.toString();
        }
        if (icon.height) {
            imgElement.style.height = icon.height.toString();
        }
        element.appendChild(imgElement);
        return imgElement;
    },
    
    renderDispose: function(update) {
        this.client.application.removeFocusListener(new Core.MethodRef(this, this._processRolloverExit));
        WebCore.EventProcessor.removeAll(this._divElement);
        this._iconElement = null;
    },
    
    renderFocus: function() {
        WebCore.DOM.focusElement(this._divElement);
        this._setFocusState(true);
    },
    
    renderUpdate: function(update) {
        var element = this._divElement;
        var containerElement = element.parentNode;
        this.renderDispose(update);
        containerElement.removeChild(element);
        this.renderAdd(update, containerElement);
        return false; // Child elements not supported: safe to return false.
    },
    
    _setFocusState: function(focusState) {
        if (!this.component.getRenderProperty("focusedEnabled")) {
            // Render default focus aesthetic.
            var background = this.component.getRenderProperty("background");
            if (background != null) {
                var newBackground = focusState ? background.adjust(0x20, 0x20, 0x20) : background;
                EchoAppRender.Color.render(newBackground, this._divElement, "backgroundColor");
            }
            return;
        } else {
            var foreground = EchoAppRender.getEffectProperty(this.component, "foreground", "focusedForeground", focusState);
            var background = EchoAppRender.getEffectProperty(this.component, "background", "focusedBackground", focusState);
            var backgroundImage = EchoAppRender.getEffectProperty(
                    this.component, "backgroundImage", "focusedBackgroundImage", focusState);
            var font = EchoAppRender.getEffectProperty(this.component, "font", "focusedFont", focusState);
            var border = EchoAppRender.getEffectProperty(this.component, "border", "focusedBorder", focusState);
            
            EchoAppRender.Color.renderClear(foreground, this._divElement, "color");
            EchoAppRender.Color.renderClear(background, this._divElement, "backgroundColor");
            EchoAppRender.FillImage.renderClear(backgroundImage, this._divElement, "backgroundColor");
            EchoAppRender.Font.renderClear(font, this._divElement);
            EchoAppRender.Border.renderClear(border, this._divElement);
        
            if (this._iconElement) {
                var icon = EchoAppRender.getEffectProperty(this.component, "icon", "focusedIcon", focusState);
                if (icon && icon.url != this._iconElement.src) {
                    this._iconElement.src = icon.url;
                }
            }
        }
    },
    
    _setPressedState: function(pressedState) {
        var foreground = EchoAppRender.getEffectProperty(this.component, "foreground", "pressedForeground", pressedState);
        var background = EchoAppRender.getEffectProperty(this.component, "background", "pressedBackground", pressedState);
        var backgroundImage = EchoAppRender.getEffectProperty(
                this.component, "backgroundImage", "pressedBackgroundImage", pressedState);
        var font = EchoAppRender.getEffectProperty(this.component, "font", "pressedFont", pressedState);
        var border = EchoAppRender.getEffectProperty(this.component, "border", "pressedBorder", pressedState);
        
        EchoAppRender.Color.renderClear(foreground, this._divElement, "color");
        EchoAppRender.Color.renderClear(background, this._divElement, "backgroundColor");
        EchoAppRender.FillImage.renderClear(backgroundImage, this._divElement, "backgroundColor");
        EchoAppRender.Font.renderClear(font, this._divElement);
        EchoAppRender.Border.renderClear(border, this._divElement);
        
        if (this._iconElement) {
            var icon = EchoAppRender.getEffectProperty(this.component, "icon", "pressedIcon", pressedState);
            if (icon && icon.url != this._iconElement.src) {
                this._iconElement.src = icon.url;
            }
        }
    },
    
    _setRolloverState: function(rolloverState) {
        var foreground = EchoAppRender.getEffectProperty(this.component, "foreground", "rolloverForeground", rolloverState);
        var background = EchoAppRender.getEffectProperty(this.component, "background", "rolloverBackground", rolloverState);
        var backgroundImage = EchoAppRender.getEffectProperty(
                this.component, "backgroundImage", "rolloverBackgroundImage", rolloverState);
        var font = EchoAppRender.getEffectProperty(this.component, "font", "rolloverFont", rolloverState);
        var border = EchoAppRender.getEffectProperty(this.component, "border", "rolloverBorder", rolloverState);
        
        EchoAppRender.Color.renderClear(foreground, this._divElement, "color");
        EchoAppRender.Color.renderClear(background, this._divElement, "backgroundColor");
        EchoAppRender.FillImage.renderClear(backgroundImage, this._divElement, "backgroundColor");
        EchoAppRender.Font.renderClear(font, this._divElement);
        EchoAppRender.Border.renderClear(border, this._divElement);
    
        if (this._iconElement) {
            var icon = EchoAppRender.getEffectProperty(this.component, "icon", "rolloverIcon", rolloverState);
            if (icon && icon.url != this._iconElement.src) {
                this._iconElement.src = icon.url;
            }
        }
    }
});

/**
 * Component rendering peer: ToggleButton
 */
EchoAppRender.ToggleButtonSync = Core.extend(EchoAppRender.ButtonSync, {
    
    $load: function() {
        EchoRender.registerPeer("ToggleButton", this);
    },
    
    $construct: function() {
        this._selected = false;
        this._stateElement = null;
    },
    
    _createStateElement: function() { },
    
    _doAction: function() {
        this.setSelected(!this._selected);
        EchoAppRender.ButtonSync.prototype._doAction.call(this);
    },
    
    renderAdd: function(update, parentElement) {
        this._selected = this.component.getRenderProperty("selected");
        
        EchoAppRender.ButtonSync.prototype.renderAdd.call(this, update, parentElement);
    },
    
    _getStateIcon: function() {
        var icon;
        if (this._selected) {
            icon = EchoAppRender.getEffectProperty(this.component, "selectedStateIcon", "disabledSelectedStateIcon", 
                    !this._enabled);
        }
        if (!icon) {
            icon = EchoAppRender.getEffectProperty(this.component, "stateIcon", "disabledStateIcon", !this._enabled);
        }
        return icon;
    },
    
    _renderContent: function() {
        var text = this.component.getRenderProperty("text");
        var icon = this.component.getRenderProperty("icon");
        this._stateElement = this._createStateElement();
        
        var entityCount = (text ? 1 : 0) + (icon ? 1 : 0) + (this._stateElement ? 1 : 0);
        if (entityCount == 1) {
            if (text) {
                this._renderButtonText(this._divElement, text);
            } else if (icon) {
                this._iconElement = this._renderButtonIcon(this._divElement, icon);
            } else {
                this._divElement.appendChild(this._stateElement);
            }
        } else if (entityCount == 2) {
            var orientation = EchoAppRender.TriCellTable.TRAILING_LEADING;;
            var margin;
            if (this._stateElement) {
                margin = this.component.getRenderProperty("stateMargin", EchoAppRender.ButtonSync._defaultIconTextMargin);
            } else {
                margin = this.component.getRenderProperty("iconTextMargin", EchoAppRender.ButtonSync._defaultIconTextMargin);
            }
            var tct = new EchoAppRender.TriCellTable(orientation, EchoAppRender.Extent.toPixels(margin));
            if (text) {
                this._renderButtonText(tct.tdElements[0], text);
                if (icon) {
                    this._iconElement = this._renderButtonIcon(tct.tdElements[1], icon);
                } else {
                    tct.tdElements[1].appendChild(this._stateElement);
                }
            } else {
                this._iconElement = this._renderButtonIcon(tct.tdElements[0], icon);
                tct.tdElements[1].appendChild(this._stateElement);
            }
            this._divElement.appendChild(tct.tableElement);
        } else if (entityCount == 3) {
            var orientation = EchoAppRender.TriCellTable.TRAILING_LEADING;
            var margin = this.component.getRenderProperty("iconTextMargin", EchoAppRender.ButtonSync._defaultIconTextMargin);
            var stateOrientation = EchoAppRender.TriCellTable.TRAILING_LEADING;
            var stateMargin = this.component.getRenderProperty("stateMargin", EchoAppRender.ButtonSync._defaultIconTextMargin);
            var tct = new EchoAppRender.TriCellTable(orientation, 
                EchoAppRender.Extent.toPixels(margin), stateOrientation, EchoAppRender.Extent.toPixels(stateMargin));
            this._renderButtonText(tct.tdElements[0], text);
            this._iconElement = this._renderButtonIcon(tct.tdElements[1], icon);
            tct.tdElements[2].appendChild(this._stateElement);
            this._divElement.appendChild(tct.tableElement);
        }
    },
    
    renderDispose: function(update) {
        EchoAppRender.ButtonSync.prototype.renderDispose.call(this, update);
        if (this._stateElement) {
            WebCore.EventProcessor.removeAll(this._stateElement);
            this._stateElement = null;
        }
    },
    
    /**
     * Selects or deselects this button.
     * 
     * @param newState {Boolean} the new selection state
     */
    setSelected: function(newState) {
        if (this._selected == newState) {
            return;
        }
        this._selected = newState;
        this.component.setProperty("selected", newState);
        
        this._updateStateElement();
    },
    
    _updateStateElement: function() {
    }
});

/**
 * Component rendering peer: CheckBox
 */
EchoAppRender.CheckBoxSync = Core.extend(EchoAppRender.ToggleButtonSync, {
    
    $load: function() {
        EchoRender.registerPeer("CheckBox", this);
    },
    
    _createStateElement: function() {
        var stateIcon = this._getStateIcon();
        var stateElement;
        if (stateIcon) {
            stateElement = document.createElement("img");
            stateElement.src = stateIcon.url;
        } else {
            stateElement = document.createElement("input");
            stateElement.type = "checkbox";
            stateElement.defaultChecked = this._selected ? true : false;
            WebCore.EventProcessor.add(stateElement, "change", new Core.MethodRef(this, this._processStateChange), false);
        }
        return stateElement;
    },
    
    _processStateChange: function(e) {
        this._updateStateElement();
    },
        
    _updateStateElement: function() {
        var stateIcon = this._getStateIcon();
        if (stateIcon) {
            this._stateElement.src = stateIcon.url;
        } else {
            this._stateElement.checked = this._selected ? true : false;
        }
    }
});

/**
 * Component rendering peer: RadioButton
 */
EchoAppRender.RadioButtonSync = Core.extend(EchoAppRender.ToggleButtonSync, {

    $static: {
    
        _nextNameId: 0,
        
        /**
         * Contains mappings from RadioButton render ids to EchoApp.ButtonGroup objects.
         * 
         * @type {Core.Arrays.LargeMap}
         */
        _groups: new Core.Arrays.LargeMap()
    },

    $load: function() {
        EchoRender.registerPeer("RadioButton", this);;
    },

    $construct: function() {
        this._buttonGroup = null;
    },

    _doAction: function() {
        if (this._buttonGroup) {
            this._buttonGroup.deselect();
        }
        EchoAppRender.ToggleButtonSync.prototype._doAction.call(this);
    },
    
    renderAdd: function(update, parentElement) {
        var groupId = this.component.getRenderProperty("group");
        if (groupId) {
            var group = EchoAppRender.RadioButtonSync._groups.map[groupId];
            if (!group) {
                group = new EchoApp.ButtonGroup(groupId);
                EchoAppRender.RadioButtonSync._groups.map[groupId] = group;
            }
            group.add(this);
            this._buttonGroup = group;
        }
        EchoAppRender.ToggleButtonSync.prototype.renderAdd.call(this, update, parentElement);
    },
    
    _createStateElement: function() {
        var stateIcon = this._getStateIcon();
        var stateElement;
        if (stateIcon) {
            stateElement = document.createElement("img");
            stateElement.src = stateIcon.url;
        } else {
            stateElement = document.createElement("input");
            stateElement.type = "radio";
            stateElement.name = "__echo_" + EchoAppRender.RadioButtonSync._nextNameId++;
            stateElement.defaultChecked = this._selected ? true : false;
            WebCore.EventProcessor.add(stateElement, "change", new Core.MethodRef(this, this._processStateChange), false);
        }
        return stateElement;
    },
    
    _processStateChange: function(e) {
        this._updateStateElement();
    },
    
    renderDispose: function(update) {
        EchoAppRender.ToggleButtonSync.prototype.renderDispose.call(this, update);
        if (this._buttonGroup) {
            this._buttonGroup.remove(this);
            if (this._buttonGroup.size() == 0) {
                EchoAppRender.RadioButtonSync._groups.remove(this._buttonGroup.getId());
            }
            this._buttonGroup = null;
        }
    },
    
    _updateStateElement: function() {
        var stateIcon = this._getStateIcon();
        if (stateIcon) {
            this._stateElement.src = stateIcon.url;
        } else {
            this._stateElement.checked = this._selected ? true : false;
        }
    }
});

