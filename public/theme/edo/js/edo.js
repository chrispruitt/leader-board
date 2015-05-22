
var edo = edo || {};

edo.util = {};

/**
 * A jQuery object contains a collection of Document Object Model (DOM) elements that have been created from
 * an HTML string or selected from a document.
 * @typedef {object} jQuery
 * @see http://api.jquery.com/Types/#jQuery
 */

/**
 * A reference to a DOM element. If it is a string, it will be interpreted as a DOM id unless it is "html" or "body".
 * It can be prepended with a leading '#', but does not need to be. If it is a function, then it must return a jQuery
 * object when called. Otherwise, it can be a jQuery object or an HTMLElement.
 * @typedef {(string|function|jQuery|HTMLElement)} DomElement
 */

/**
 * A utility method to allow easy retrieval of a DOM element from a number by a number of methods, so other functions
 * need not be dependent on any single type of element identifier to work.
 *
 * @param {DomElement} identifier - A reference to a DOM element. If it is a string, it will be interpreted as a DOM id
 *                                  unless it is "html" or "body". It can be prepended with a leading '#', but does not
 *                                  need to be. If it is a function, then it must return a jQuery object when called.
 *                                  Otherwise, it can be a jQuery object or an HTMLElement.
 * @param {...*} [fnArgs] - If the elementIdentifier is a function, these arguments will be passed to that function.
 *
 * @returns {jQuery} A jQuery object that references a single DOM element.
 */
edo.util.getElement = function(identifier, fnArgs) {
    if (typeof identifier === "function") {
        fnArgs = Array.prototype.slice.call(arguments, 1);
        return identifier.apply(this, fnArgs);
    }
    else if (typeof identifier === "string") {
        identifier = $.trim(identifier);
        if (identifier.charAt(0) === "#" || identifier === "body" || identifier === "html") {
            return $(identifier);
        }
        return $("#" + identifier);
    }
    else if (typeof identifier === "object") {
        if (identifier instanceof jQuery) {
            return identifier;
        }
        else if (identifier) {
            return $(identifier);
        }
    }
};

/**
 * A JavaScript typedef, e.g. "string", "function", "object", "undefined"
 * @typedef {string} typedef
 */

/**
 * Given argument type ("object", "function", etc.) and either n other arguments or an Array of arguments,
 * return the first argument out of n such that typeof argument === type;
 *
 * @params {typedef} type - The type of the argument we are looking form
 * @params {...*|Array} args - The arguments to search through
 *
 * @returns {*} The first argument in args such that <code>typeof args[i] === type;</code>
 */
edo.util.getArgumentOfType = function(type, args) {
    args = (arguments.length === 2 && $.isArray(args) ? args : Array.prototype.slice.call(arguments, 1));
    for (var i=0; i < args.length; i++) {
        if (typeof args[i] === type) {
            return args[i];
        }
    }
};

/**
 * Dereference a JavaScript object/function/etc from a string reference (can include '.' and '['...']').
 * Does NOT do an 'eval' call, nor will it evaluate functions passed to it.
 *
 * @param {string} reference - A string reference to a JavaScript object/function/etc.
 * @param {typedef} [type] - An optional type that the returned object must be.
 *
 * @returns {*} The object/function/etc referenced by the argument, or undefined if no object found matching given type.
 *
 * @example
 * edo.util.dereference("edo.util.dereference");
 * edo.util.dereference("edo['util'][\"dereference\"]");
 * edo.util.dereference("edo['util'].dereference");
 * // returns function edo.util.dereference
 */
edo.util.dereference = function(reference, type) {
    if (reference) {
        var refParts = reference.split(/((["']\])?\[["'])|(["']\]\.?)|\./g);
        var object = window;

        // increment by 4, since refParts will include the three capture groups from the regex
        for (var i = 0; i < refParts.length && object && refParts[i]; i += 4) {
            object = object[refParts[i]];
        }

        if (!type || typeof object === type) {
            return object;
        }
    }
};

/**
 * @param {function} callFunction - A function to be called. If undefined or not a function, nothing will be called.
 * @param {*} [context=this] - The context to be used as 'this' within the called function. Must be provided if additional args are specified.
 * @param {...*} [args] - Any arguments to be passed to the callFunction.
 *
 * @see {@link Function.call}
 * @see {@link edo.util.apply}
 */
edo.util.call = function(callFunction, context, args) {
    if (typeof callFunction === "function") {
        context = context || this;
        args = Array.prototype.slice.call(arguments, 2);
        callFunction.apply(context, args);
    }
};

/**
 * @param {function} callFunction - a function to be called.
 * @param {*} context - The context to be used as 'this' within the called function.
 * @param {Array} argsArray - An array (or array-like object) of arguments to be passed to the callFunction.
 *
 * @see {@link Function.apply}
 * @see {@link edo.util.call}
 */
edo.util.apply = function(callFunction, context, argsArray) {
    if (typeof callFunction === "function") {
        context = context || this;
        callFunction.apply(context, argsArray);
    }
};

/**
 * A string containing placeholder markers (e.g. %s, %i, %2s, %(prop)s) for use with a string format function.
 * @typedef {string} stringTemplate
 * @see edo.util.stringFormat
 * @see https://github.com/alexei/sprintf.js
 */

/**
 * Formats a string with the passed arguments, similar to Java's String#format() or C/C++/PHP's sprintf
 *
 * @param {stringTemplate} template - A string containing placeholder markers (e.g. %s, %i, %2s, %(prop)s) for use with a string format function.
 * @param {(...string|...number|Array|object)} args - The arguments to substitute placeholder markers with, either as multiple function arguments,
 *                                                    or as a single array of arguments, or as an object whose properties are identified with
 *                                                    placeholder markers resembling: %(strProp)s %(intProp)i
 *
 * @returns {string}
 *
 * @see https://github.com/alexei/sprintf.js
 */
edo.util.stringFormat = function(template, args) {
    return (arguments.length === 2 && $.isArray(arguments[1]) ? vsprintf : sprintf).apply(this, arguments);
};


/**
 * Remove the supplied leading character from the supplied string, if that character is
 * the first character in the string.
 * @returns {string} the string without the leading character
 */
edo.util.stripLeadingChar = function(str, leadingChar) {
    if (str.charAt(0) === leadingChar) {
        return str.substring(1);
    }
    return str;
};

/**
 * An object that represents a cookie
 * @typedef {object} Cookie
 *
 * @property {string} name
 * @property {string} value
 * @property {Date} [expiration]
 * @property {string} [path]
 * @property {string} [domain]
 * @property {boolean} [secure]
 */

/**
 * A collection of utility functions for managing cookies
 */
edo.util.cookie = {
    /**
     * Retrieves a cookie from the list of cookies in the document object, based on the cookie name.
     * If more than one cookie exists with the same name, the cookie with higher precedence will
     * be returned. This should be the cookie with the more specific path, per RFC 2965 standard.
     *
     * @param {string} name of the cookie
     *
     * @returns {string} the value of the cookie found with that name, if it exists.
     */
    get: function(name) {
        var cookieParts = ("; " + document.cookie).split("; " + name + "=");
        if (cookieParts.length >= 2) {
            return decodeURIComponent(cookieParts[1].split(";").shift());
        }
    },

    /**
     * Creates or updates a cookie with the specified information.
     *
     * @param {Cookie} cookie object that must contain 'name' and 'value', and can also include
     *                 {Date} 'expiration', 'path', 'domain', and {boolean} 'secure'
     */
    set: function(cookie) {
        document.cookie = edo.util.cookie.build(cookie);
    },

    /**
     * Deletes the cookie with the given name, and optionally, path and domain.
     *
     * @param {Cookie} cookie object with 'name', 'path', and 'domain'
     */
    remove: function(cookie) {
        document.cookie = edo.util.cookie.build({ name: cookie.name,
                                                  value: "",
                                                  expiration: new Date(0),
                                                  path: cookie.path,
                                                  domain: cookie.domain });
    },

    /**
     * Builds the cookie string from an object with cookie information, allowing the following syntax:
     * <code>
     *     document.cookie = edo.util.cookie.build({ name: 'myCookie', value: 'mmm... cookies...' });
     * </code>
     *
     * @param cookie {object} object that must contain 'name' and 'value', and can also include
     *               {Date} 'expiration', 'path', 'domain', and {boolean} 'secure'
     * @returns {string} a cookie in the string format expected by document.cookie
     */
    build: function(cookie) {
        var cookieParts = [];
        cookieParts.push(cookie.name + "=" + encodeURIComponent(cookie.value));
        if (cookie.expiration) {
            cookieParts.push("expires=" + cookie.expiration.toUTCString());
        }
        if (cookie.path) {
            cookieParts.push("path=" + cookie.path);
        }
        if (cookie.domain) {
            cookieParts.push("domain=" + cookie.domain);
        }
        if (cookie.secure) {
            cookieParts.push("secure");
        }
        return cookieParts.join("; ");
    }
};

/**
 * @returns {Date} the current time on the server. Relies on edo.constant.SERVER_TIME_OFFSET being set, typically
 * in a JSP or other place where the server's time is available (e.g. in the edo:pageSessionTimeoutSupport tag).
 */
edo.util.getCurrentServerTime = function() {
    return new Date(new Date() - edo.constant.SERVER_TIME_OFFSET);
};


edo.browser = {};
edo.browser.PREFIXES = ["Khtml", "Ms", "O", "Moz", "Webkit"];
edo.browser.STYLES = document.createElement("div").style;

/**
 * @param {string} style - The name of a CSS style, e.g. "margin", "transform", "opacity", etc.
 * @return {boolean} Whether or not the current browser supports the given style.
 */
edo.browser.supportsStyle = function(style) {
    if (style in edo.browser.STYLES) {
        return true;
    }
    style = style.replace(/^[a-z]/, function(value) {
        return value.toUpperCase();
    });
    for (var i=0; i < edo.browser.PREFIXES.length; i++) {
        if (edo.browser.PREFIXES[i] + style in edo.browser.STYLES) {
            return true;
        }
    }
    return false;
};


edo.tag = {};

/**
 * A repository for instantiated objects that extend {@link edo.tag.BaseTag} that allows for later retrieval
 * by id, via calls like  <code>var tagObject = edo.tag.cache.<tagName>.get("tag_id");</code>
 * @example
 * // returns object of type {@link edo.form.Form}
 * edo.tag.cache.form.get("my_form");
 */
edo.tag.cache = {
    put: function(tagObject) {
        var tagStore = edo.tag.cache.register(tagObject.getTagName());
        tagStore.put(tagObject);
    },
    register: function(tagName) {
        if(!edo.tag.cache[tagName]) {
            edo.tag.cache[tagName] = new edo.tag.cache.TagObjectStore();
        }
        return edo.tag.cache[tagName];
    },
    TagObjectStore: (function() {
        function TagObjectStore() {
            this._store = {};
        }
        TagObjectStore.prototype.get = function(tagId) {
            return this._store[tagId];
        };
        TagObjectStore.prototype.put = function(tagObject) {
            this._store[tagObject.getTagId()] = tagObject;
        };
        return TagObjectStore;
    })()
};

/**
 * The "abstract" base class for all custom JS objects that represent the contents of a JSP tag. Objects that extend
 * from the BaseTag will be stored in {@link edo.tag.cache} for later retrieval by id, and will have built-in event
 * binding/triggering functions.
 */
edo.tag.BaseTag = (function() {
    /**
     * @param {string} tagId - The id that can be used to retrieve the object from {@link edo.tag.cache}
     * @param {string} tagName - The name of the tag represented by this object
     * @constructor
     */
    function BaseTag(tagId, tagName) {
        this.tagId = tagId;
        this.tagName = tagName;
        edo.tag.cache.put(this);
    }

    BaseTag.prototype.getTagId = function() {
        return this.tagId;
    };
    BaseTag.prototype.getTagName = function() {
        return this.tagName;
    };

    /**
     * @callback BaseTag~eventCallback
     * @param {...*} [eventArgs]
     */

    /**
     * Subscribe a function that gets called when the given eventType is triggered.
     * A single function cannot be subscribed multiple times, even if this method is
     * called more than once.
     *
     * @param {string} eventType e.g. 'change', will depend on the type of object extending BaseTag
     * @param {BaseTag~eventCallback} eventFunction function to be called when event is triggered
     */
    BaseTag.prototype.on = function(eventType, eventFunction) {
        var eventListeners = getEventListeners.call(this, eventType);
        if (typeof eventFunction === "function" && $.inArray(eventFunction, eventListeners) < 0) {
            eventListeners.push(eventFunction);
        }
    };

    /**
     * Trigger all functions subscribed to the given eventType. Functions will be called
     * with 'this' referring to the BaseTag instance it is called from, and will
     * be passed an argument with relevant event data.
     *
     * @param {string} eventType e.g. 'change', will depend on the type of object extending BaseTag
     * @param {...*} [eventArgs] arguments to pass to event handler functions
     */
    BaseTag.prototype.trigger = function(eventType, eventArgs) {
        var self = this;
        eventArgs = Array.prototype.slice.call(arguments, 1);
        $.each(getEventListeners.call(this, eventType), function(i, eventFunction) {
            var args = [eventFunction, eventType];
            Array.prototype.push.apply(args, eventArgs);
            self.triggerEventListener.apply(self, args);
        });
    };

    /**
     * Trigger an individual event listener function. Defined here primarily to allow
     * subclasses to override and add additional logic.
     *
     * @param eventListener {BaseTag~eventCallback} the event listener function to be called
     * @param eventType {string} e.g. 'change', will depend on the type of object extending BaseTag
     * @param {...*} [eventArgs] arguments to pass to event listener function
     */
    BaseTag.prototype.triggerEventListener = function(eventListener, eventType, eventArgs) {
        eventArgs = Array.prototype.slice.call(arguments, 2);
        edo.util.apply(eventListener, this, eventArgs);
    };

    function getEventListeners(eventType) {
        this.eventListeners = this.eventListeners || {};
        this.eventListeners[eventType] = this.eventListeners[eventType] || [];
        return this.eventListeners[eventType];
    }

    return BaseTag;
})();

edo.tag.input = {};
edo.tag.input.SelectButton = (function() {
    SelectButton.prototype = Object.create(edo.tag.BaseTag.prototype);

    function SelectButton(tagId, selectButtonContainer, backingSelect) {
        edo.tag.BaseTag.call(this, tagId, (backingSelect ? "inputSelectButton" : "selectButton"));

        this.isInitialized = false;
        this.container = edo.util.getElement(selectButtonContainer || tagId);
        this.backingSelect = edo.util.getElement(backingSelect);
        this.button = this.container.find("button");
        this.buttonLabel = this.button.find(".select-button-label");
        this.buttonLabelStartValue = this.buttonLabel.find(".select-button-value");
        this.menu = this.container.find(".select-button-menu");
        this.menuItems = this.menu.find("a");

        var key = this.hasBackingSelect() ? this.backingSelect.val() : this.buttonLabelStartValue.text();
        if (key) {
            this.selectItemByKey(key);
        }

        var self = this;
        this.menuItems.click(function(e) {
            e.preventDefault();
            self.selectItem($(this));
        });
        this.isInitialized = true;
    }

    SelectButton.prototype.getContainer = function() {
        return this.container;
    };
    SelectButton.prototype.getButton = function() {
        return this.button;
    };
    SelectButton.prototype.getMenu = function() {
        return this.menu;
    };
    SelectButton.prototype.getBackingSelect = function() {
        return this.backingSelect;
    };
    SelectButton.prototype.hasBackingSelect = function() {
        return typeof this.backingSelect !== "undefined";
    };

    SelectButton.prototype.getSelectedKey = function() {
        return this.selectedKey;
    };
    SelectButton.prototype.getSelectedValue = function() {
        return this.selectedValue;
    };

    SelectButton.prototype.selectItemByKey = function(key) {
        var item = this.menuItems.filter("[href=" + key + "]").first();
        this.selectItem(item);
    };
    SelectButton.prototype.selectItem = function(item) {
        this.selectedKey = item.attr("href");
        this.selectedValue = item.text();

        if (this.hasBackingSelect()) {
            this.backingSelect.val(this.selectedKey).change();
        }
        this.buttonLabel.text(this.selectedValue);
        this.menuItems.removeClass("selected");
        item.addClass("selected");

        if (this.isInitialized) {
            this.trigger("change", this.selectedKey, this.selectedValue);
        }
    };


    return SelectButton;
})();


edo.alert = {};
edo.alert.CLOSE_BUTTON_HTML = '<button type="button" class="close" data-dismiss="alert" aria-label="%(closeLabel)s"><span aria-hidden="true">&times;</span></button>';
edo.alert.POPDOWN_HTML = '<div %(idAttr)s class="alert alert-popdown alert-%(alertType)s %(alertDismissible)s">%(closeButton)s<span class="popdown-message">%(content)s</span></div>';
edo.alert.TYPES = { SUCCESS: "success", INFO: "info", WARNING: "warning", DANGER: "danger" };

/**
 * Pops an alert down from the top of a container element. Typically used as a notification alert that pops down from
 * the page body or a panel/widgetBox. When used for an entire page, the alert will be fixed to the top of the browser
 * window, not the body element.
 *
 * @param {DomElement} container - The DOM element from the top of which the alert should pop down.
 * @param {string} content - Text and/or DOM content to put inside the alert popdown
 * @param {object} [options] - Configurable (optional) parameters
 * @param {string} [options.contentId] - The DOM id to apply to the new popdown alert
 * @param {edo.alert.TYPES} [options.alertType=edo.alert.Types.INFO] - The type of alert. Must be an enumerated value of {@link edo.alert.TYPES}.
 * @param {boolean} [options.autoHide=false] - Whether the alert should automatically hide itself after 3.5 seconds. If false, the popdown will have a close button.
 * @param {string} [options.closeLabel=Close] - The accessibility label for the close button (only relevant if options.autoHide == false)
 */
edo.alert.popdown = function(container, content, options) {
    container = edo.util.getElement(container);
    container.css("position", "relative");
    container.children(".alert-popdown").remove();

    options = options || {};
    options.closeLabel = options.closeLabel || "Close";
    options.alertType = options.alertType || "info";
    options.alertDismissible = options.autoHide ? "" : "alert-dismissible";
    options.closeButton = options.autoHide ? "" : edo.util.stringFormat(edo.alert.CLOSE_BUTTON_HTML, options);
    options.idAttr = options.contentId ? 'id="' + options.contentId + '"' : "";
    options.content = content;

    var alertPopdown = edo.util.stringFormat(edo.alert.POPDOWN_HTML, options);

    alertPopdown = $(alertPopdown).appendTo(container);

    if (!edo.browser.supportsStyle("transform")) {
        edo.alert.polyfillPopdownTranslation(alertPopdown, 150);
    }

    var animation = alertPopdown.slideDown("fast");
    if (options.autoHide) {
        animation.delay(3500).slideUp("fast");
    }
};

edo.alert.polyfillPopdownTranslation = function(alertPopdown, resizeThrottleTime) {
    var timeout;
    $(window).resize(function() {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(function() {
            translateX(alertPopdown);
        }, resizeThrottleTime);
    });
    translateX(alertPopdown);

    function translateX(alertPopdown) {
        // "left" style will be 0 when alertPopdown is in full-width responsive view, otherwise 50%
        var leftStyle = (window.getComputedStyle ? window.getComputedStyle(alertPopdown[0], null) : alertPopdown[0].currentStyle).left;
        var isFullWidthResponsiveView = parseInt(leftStyle) === 0;

        alertPopdown.css("margin-left", isFullWidthResponsiveView ? 0 : -(alertPopdown.outerWidth() / 2) + "px");
    }
};


edo.form = {
    /**
     * @deprecated use edo.form.processResponse(...) instead.
     */
    processFormResponse: function(formResponse, formContainer, fieldContainer, successFunction, failFunction) {
        var form = edo.util.getElement(formContainer);
        form.find('.form-group').removeClass('has-error has-warning has-success');
        form.find('.help-block').empty();
        form.find('.alert').remove();
        if (formResponse && formResponse.status === "FAIL") {
            for (var i=0; i < formResponse.response.length; i++) {
                var item = formResponse.response[i];
                var container = edo.util.getElement(fieldContainer, item.field, form);
                var errorBlock = container.find(".help-block");

                container.removeClass("has-success has-warning").addClass("has-error");
                container.find("*").removeClass("has-success has-warning");
                errorBlock.removeClass("hidden");
                errorBlock.show();

                var errorText = errorBlock.html();
                if (errorText) {
                    errorText += "<br/>";
                }
                errorText += item.defaultMessage;

                errorBlock.html(errorText);
            }
            if (typeof(failFunction) === "function") {
                failFunction(formResponse);
            }
        }
        else if (typeof(successFunction) === "function") {
            successFunction(formResponse);
        }
    }
};

edo.form.GLOBAL_VALIDATION_CONTAINER_HTML = '<div id="%s" class="alert alert-danger">%s</div>';
edo.form.VALIDATION_MESSAGE_DELIMITER = '<br/>';

edo.form.processResponse = function(formResponse, formContainer, options) {
    var processingOptions = options || {};
    edo.form.clearValidationState(formContainer);

    if (formResponse && formResponse.status === "SUCCESS") {
        edo.util.call(processingOptions.success, processingOptions.context, formResponse);
    }
    else if (formResponse && formResponse.status === "FAIL") {
        $.each(formResponse.response, function(i, error) {
            if (error.field) {
                edo.input.addValidationError(error.field, error.defaultMessage, {
                    formContainer: formContainer, inputContainer: processingOptions.inputContainer
                });
            }
            else {
                edo.form.addGlobalValidationError(formContainer, error.defaultMessage);
            }
        });

        edo.util.call(processingOptions.fail, processingOptions.context, formResponse);
    }

};
edo.form.clearValidationState = function(formContainer) {
    var validationClasses = "has-error has-warning has-success";

    var form = edo.util.getElement(formContainer);
    var formControlGroups = form.find(".form-group");

    form.removeClass(validationClasses);
    formControlGroups.removeClass(validationClasses);
    formControlGroups.find("*").removeClass(validationClasses);

    form.find(".help-block").empty();
    form.find(".alert").remove();
};
edo.form.addGlobalValidationError = function(formContainer, validationMessage){
    var validationContainerId = formContainer.attr("id") + "_errors";
    var validationContainer = edo.util.getElement(validationContainerId);
    if (validationContainer.length) {
        edo.form.addToValidationContainer(validationContainer, validationMessage);
    }
    else {
        formContainer.prepend(edo.util.stringFormat(edo.form.GLOBAL_VALIDATION_CONTAINER_HTML, validationContainerId, validationMessage));
    }
};
edo.form.addToValidationContainer = function(validationContainer, validationMessage) {
    var validationMessages = validationContainer.html();
    var validationMessagesArray = validationMessages.split(edo.form.VALIDATION_MESSAGE_DELIMITER);
    if ($.inArray(validationMessage, validationMessagesArray) === -1) {
        if (validationMessages) {
            validationMessages += edo.form.VALIDATION_MESSAGE_DELIMITER;
        }
        validationMessages += validationMessage;

        validationContainer.html(validationMessages);
    }
};

edo.form.Form = (function() {
    Form.prototype = Object.create(edo.tag.BaseTag.prototype);

    /**
     * An object to manage the state of the <edo:form> and <edo:formAjax> JSP tags.
     *
     * @param {string} formId - The DOM id of the form.
     * @param {url} validateUrl - The URL to POST to in order to retrieve a form validation response.
     * @param {(function|string)} [onSuccess] - Either the function to call upon validation success, or "submit" to
     *                                          simply call the native form submit.
     * @constructor
     */
    function Form(formId, validateUrl, onSuccess) {
        edo.tag.BaseTag.call(this, formId, (onSuccess === "submit" ? "form" : "formAjax"));
        var self = this;

        this.form = edo.util.getElement(formId);
        this.validateUrl = validateUrl;
        this.onSuccess = (onSuccess === "submit" ? function() { submitForm.call(this); } : function(formResponse) {
            edo.util.call(onSuccess, self, formResponse);
            triggerSubmittedEvents.call(self, formResponse);
        });

        this.form.submit(function(e) {
            e.preventDefault();
            self.submit();
            return false;
        });

        var actionNameInput = $("<input type=\"hidden\">");
        this.form.append(actionNameInput);
        this.form.find("input[type=submit]").click(function() {
            if (this.name) {
                actionNameInput.attr("name", this.name);
                actionNameInput.val(this.value);
            }
        });
    }

    Form.prototype.submit = function() {
        var self = this;

        var pendingSubmit = {
            cancel: function() {
                pendingSubmit.completed = true;
                self.trigger("submitCanceled");
            },
            pause: function() {
                pendingSubmit.paused = true;
            },
            complete: function() {
                if (!pendingSubmit.completed) {
                    pendingSubmit.completed = true;
                    var postData = self.form.serializeArray();
                    $.post(self.validateUrl, postData, function (response) {
                        var processingOptions = { context: self, success: self.onSuccess, fail: triggerSubmittedEvents };
                        edo.form.processResponse(response, self.form, processingOptions);
                    }, "json");
                }
            }
        };

        triggerSubmitEvents.call(this, pendingSubmit);

        if (!pendingSubmit.paused) {
            pendingSubmit.complete();
        }
    };

    /**
     * @override
     * Overridden from {@link edo.tag.BaseTag}. If the eventType is "submit" and the eventData
     * is a pendingSubmit that has been canceled, then it will not trigger the event listener.
     */
    Form.prototype.triggerEventListener = function(eventListener, eventType, pendingSubmit) {
        if (!(eventType === "submit" && pendingSubmit.completed)) {
            edo.tag.BaseTag.prototype.triggerEventListener.apply(this, arguments);
        }
    };

    var submitForm = function() {
        this.form.off("submit");
        this.form.submit();
    };

    var triggerSubmitEvents = function(pendingSubmit) {
        this.trigger("submit", pendingSubmit);
        if (!pendingSubmit.canceled) {
            $.EventBus("beforeFormAjaxSubmitted").publish();
        }
    };
    var triggerSubmittedEvents = function(formResponse) {
        $.EventBus("afterFormAjaxSubmitted").publish();
        this.trigger("submitted", formResponse);
    };

    return Form;
})();


edo.input = {};

/**
 * Find the surrounding form control group element for a given form input.
 *
 * @param {DomElement} input - A form input to find the surrounding form control group for.
 * @param {DomElement} [formContainer] - The form that the input is a part of. If provided, will verify that the input
 *                                       is a descendant of the formContainer in the DOM.
 * @returns {jQuery} The form control group for the given input.
 */
edo.input.findFormControlGroup = function(input, formContainer) {
    input = edo.util.getElement(input);
    if (formContainer) {
        formContainer = edo.util.getElement(formContainer);
        input = input.filter(function() {
            return formContainer.has(this).length;
        });
    }
    return input.closest(".form-group");
};

/**
 * Adds a given error message and error styling for the given input
 *
 * @param {DomElement} input - A form input to add error messaging to
 * @param {string} validationMessage - The validation message to apply
 * @param {object} [options] - Optional parameters.
 * @param {DomElement} [options.inputContainer] - Defaults to the input's form control group, but can be overridden here;
 * @param {DomElement} [options.formContainer] - Can be provided to explicitly reference only an input within this formContainer
 */
edo.input.addValidationError = function(input, validationMessage, options) {
    options = options || {};
    var inputContainer;
    if (options.inputContainer) {
        inputContainer = edo.util.getElement(options.inputContainer, input);
    }
    else {
        inputContainer = edo.input.findFormControlGroup(input, options.formContainer);
    }
    var validationContainer = inputContainer.find(".help-block");
    if (validationContainer.length) {
        inputContainer.removeClass("has-success has-warning").addClass("has-error");
        inputContainer.find("*").removeClass("has-success has-warning");
        validationContainer.removeClass("hidden");
        validationContainer.show();

        edo.form.addToValidationContainer(validationContainer, validationMessage);
    }
    else {
        var formContainer = options.formContainer || input.closest("form");
        edo.form.addGlobalValidationError(formContainer, validationMessage);
    }
};

/**
 * Removes any validation messages and styling for a given input.
 * @param {DomElement} input - The input for which validation should be cleared.
 */
edo.input.clearValidationState = function(input) {
    var validationClasses = "has-error has-warning has-success";
    var formControlGroup = edo.input.findFormControlGroup(input);

    formControlGroup.removeClass(validationClasses);
    formControlGroup.find("*").removeClass(validationClasses);
    formControlGroup.find(".help-block").empty();
};


edo.modal = {

    EVENTS: ["show","shown","hide","hidden"],

    /**
     * Callback invoked immediately upon showing the modal.
     * @callback modalShowCallback
     * @this {jQuery} the modal jQuery object
     * @param {Event} e - the DOM event object
     */

    /**
     * Callback invoked once the modal is fully rendered and visible (after animation time).
     * @callback modalShownCallback
     * @this {jQuery} the modal jQuery object
     * @param {Event} e - the DOM event object
     */

    /**
     * Callback invoked immediately upon hiding the modal.
     * @callback modalHideCallback
     * @this {jQuery} the modal jQuery object
     * @param {Event} e - the DOM event object
     */

    /**
     * Callback invoked once the modal is fully hidden from the page (after animation time).
     * @callback modalHiddenCallback
     * @this {jQuery} the modal jQuery object
     * @param {Event} e - the DOM event object
     */

    /**
     * Version 2 of ajaxLoadModal function. Uses the default_modal_container div, and passes modalId
     * (and additional user specified params) as a param on the loadUrl. A params object and
     * success callback function can optionally passed to this method. The modal jQuery object will
     * be passed to any success callback function.
     *
     * @param {url} loadUrl - The URL from which the modal content will be AJAX'd.
     * @param {object} [params] - URL query params to send to the loadUrl. Required if callbacks argument is provided.
     * @param {object} [callbacks] - Callback functions corresponding to modal events.
     * @param {modalShowCallback} [callbacks.show] - Callback invoked immediately upon showing the modal.
     * @param {modalShownCallback} [callbacks.shown] - Callback invoked once the modal is fully rendered and visible (after animation time).
     * @param {modalHideCallback} [callbacks.hide] - Callback invoked immediately upon hiding the modal.
     * @param {modalHiddenCallback} [callbacks.hidden] - Callback invoked once the modal is fully hidden from the page (after animation time).
     */
    loadAjax: function(loadUrl, params, callbacks) {
        callbacks = callbacks || {};
        var modalContainer = $("#default_modal_container");
        $.ajax({
            type: "GET",
            url: loadUrl,
            dataType: "html",
            data: params
        })
        .done(function(modal) {
            $(modal).appendTo(modalContainer)
                .on("show.bs.modal", function(e) {
                    edo.util.call(callbacks.show, this, e);
                })
                .on("shown.bs.modal", function(e) {
                    edo.util.call(callbacks.shown, this, e);
                    $.EventBus("initializeWidgets").publish(this);
                })
                .on("hide.bs.modal", function(e) {
                    edo.util.call(callbacks.hide, this, e);
                })
                .on("hidden.bs.modal", function(e) {
                    edo.util.call(callbacks.hidden, this, e);
                    this.remove();
                })
                .modal("show");
        })
        .fail(function() {
            $("#error_loading_modal").modal("show");
        });
    }
};


edo.sessionTimeout = {};

/**
 * Callback invoked when session check finds the current time before the warning time.
 * @callback sessionActiveCallback
 * @param {number} sessionExpirationTime - The server time at which point the session will expire
 */

/**
 * Callback invoked when session check finds the current time after the warning time (and the warning has not yet been invoked).
 * @callback sessionWarningCallback
 * @param {number} sessionExpirationTime - The server time at which point the session will expire
 */

/**
 * Callback invoked when session check finds that the session has expired.
 * @callback sessionTimeoutCallback
 */

/**
 * Initialize session timeout support, supplying event callbacks and params. Automatically start checking for session
 * timeout/warning if autorun is set to true.
 *
 * @param {boolean} isAuthenticatedUser - Whether there is an authenticated user in session that needs to be logged out.
 * @param {object} [options] - Configurable (optional) parameters.
 * @param {number} [options.warningTimeBeforeTimeout=180000] - The amount of time (in ms) before session expiration that the warning callback function should be called.
 * @param {object} [options.cookie=sessionExpiration] - Information about the cookie where the session expiration date is being stored.
 * @param {boolean} [options.autorun] - When true, will set up intervals to automatically check for session expiration.
 * @param {sessionActiveCallback} [options.active] - Callback invoked when session check finds the current time before the warning time.
 * @param {sessionWarningCallback} [options.warning] - Callback invoked when session check finds the current time after the warning time (and the warning has not yet been invoked).
 * @param {sessionTimeoutCallback} [options.timeout] - Callback invoked when session check finds that the session has expired.
 */
edo.sessionTimeout.initialize = function (isAuthenticatedUser, options) {
    if (isAuthenticatedUser && !edo.sessionTimeout.isInitialized) {
        edo.sessionTimeout.isInitialized = true;
        options = options || {};

        var params = {};
        params.warningTimeBeforeTimeout = options.warningTimeBeforeTimeout || 180000; // 3 minutes
        params.cookie = options.cookie || { name: "sessionExpiration", path: "/" };
        edo.sessionTimeout.params = params;

        edo.sessionTimeout.updateCookieExpiration();

        var defaultCallbacks = {};
        defaultCallbacks.active = function(sessionExpirationTime) {
            window.setTimeout(edo.sessionTimeout.checkForTimeout, timeTillWarning(sessionExpirationTime));
            edo.util.call(options.active, this, sessionExpirationTime);
        };
        defaultCallbacks.warning = function(sessionExpirationTime) {
            window.setTimeout(edo.sessionTimeout.checkForTimeout, timeTillTimeout(sessionExpirationTime));
            edo.util.call(options.warning, this, sessionExpirationTime);
        };
        defaultCallbacks.timeout = options.timeout;
        edo.sessionTimeout.defaultCallbacks = defaultCallbacks;

        if (options.autorun) {
            window.setTimeout(edo.sessionTimeout.checkForTimeout, timeTillWarning(edo.util.cookie.get(params.cookie.name)));
        }
    }

    function timeTillWarning(sessionExpirationTime) {
        return sessionExpirationTime - params.warningTimeBeforeTimeout - edo.util.getCurrentServerTime();
    }
    function timeTillTimeout(sessionExpirationTime) {
        return sessionExpirationTime - edo.util.getCurrentServerTime();
    }
};

/**
 * Invoke a check on the current state of the session. The check will try to find out whether the session is still active,
 * whether to invoke the warning function (e.g. pop up a session timeout warning modal), or whether to invoke the timeout
 * function (e.g. redirect to the login page).
 *
 * @param {object} [callbacks] - Optional callback functions. If undefined, will use the default callbacks specified in edo.sessionTimeout.initialize()
 * @param {sessionActiveCallback} [callbacks.active] - Callback invoked when session check finds the session active and before the warning time.
 * @param {sessionWarningCallback} [callbacks.warning] - Callback invoked when session check finds the current time after the warning time (and the warning has not yet been invoked).
 * @param {sessionTimeoutCallback} [callbacks.timeout] - Callback invoked when session check finds that the session has expired.
 */
edo.sessionTimeout.checkForTimeout = function(callbacks) {
    if (edo.sessionTimeout.isInitialized) {
        callbacks = callbacks || edo.sessionTimeout.defaultCallbacks;
        var params = edo.sessionTimeout.params;
        var currentTime = edo.util.getCurrentServerTime();
        var sessionExpirationTime = edo.util.cookie.get(params.cookie.name);

        if (sessionExpirationTime) {
            sessionExpirationTime = parseInt(sessionExpirationTime);
            var sessionWarningTime = sessionExpirationTime - params.warningTimeBeforeTimeout;

            if (currentTime >= sessionExpirationTime) {
                edo.util.cookie.remove(params.cookie);
                edo.util.call(callbacks.timeout);
            }
            else if (currentTime >= sessionWarningTime && !edo.sessionTimeout.isWarningInvoked) {
                edo.sessionTimeout.isWarningInvoked = true;
                edo.util.call(callbacks.warning, this, sessionExpirationTime);
            }
            else if (currentTime < sessionWarningTime) {
                edo.sessionTimeout.isWarningInvoked = false;
                edo.sessionTimeout.updateCookieExpiration(sessionExpirationTime);
                edo.util.call(callbacks.active, this, sessionExpirationTime);
            }
        }
        else if (edo.sessionTimeout.isWarningInvoked) {
            // If the warning was invoked, but the cookie does not exist (i.e. has expired),
            // we know that the session timeout has occurred, so we invoke the timeout callback.
            edo.util.call(callbacks.timeout);
        }
    }
};

/**
 * Updates the session timeout cookie so it will expire when the session times out.
 *
 * @param [sessionExpirationTime] the current session expiration time from the cookie.
 *                              If not provided, it will be retrieved from the cookie.
 */
edo.sessionTimeout.updateCookieExpiration = function(sessionExpirationTime) {
    var params = edo.sessionTimeout.params;

    sessionExpirationTime = sessionExpirationTime || edo.util.cookie.get(params.cookie.name);
    params.cookie.value = sessionExpirationTime;
    params.cookie.expiration = new Date(parseInt(sessionExpirationTime) + edo.constant.SERVER_TIME_OFFSET);

    edo.util.cookie.set(params.cookie);
};


edo.tree = {
    getValue: function(node) {
        return node.li_attr.value;
    },
    create: function(containerId, dataUrl, dataFunction, dataSuccessFunction, options) {
        var treeContainer = $("#" + containerId);
        var plugins = [];
        if (options.types) {
            plugins.push("types");
        }

        treeContainer.jstree({
            "types": options.types,
            "core": {
                "multiple": options.multiple,
                "data": {
                    "url": dataUrl,
                    "data": dataFunction,
                    "success": dataSuccessFunction
                }
            },
            "plugins": plugins
        });

        treeContainer.on("ready.jstree", function(e, data) {
            $.EventBus("treeLoaded").publish(treeContainer);
            var count = 0;
            setTimeout(onTreeLoaded, 300);
            function onTreeLoaded() {
                count++;
                var selectedNode = treeContainer.find(".jstree-clicked").first();

                if (selectedNode && selectedNode.offset()) {
                    scrollToSelectedNode(treeContainer, selectedNode);
                }
                else if (count <=3) {
                    setTimeout(onTreeLoaded, 300);
                }
            }
            function scrollToSelectedNode(treeContainer, selectedNode) {
                treeContainer.scrollTop(0);
                var offset = selectedNode.offset().top - treeContainer.offset().top;
                var treeHeight = treeContainer.height();
                offset = offset - (treeHeight/2);
                treeContainer.scrollTop(offset);
            }
        });

        if (options.boundInput) {
            treeContainer.on("changed.jstree", function(e, data) {
                if (data.action === "select_node") {
                    options.boundInput.val(edo.tree.getValue(data.node));
                }
            });
        }
    },
    node: {
        getChildWithValue: function(tree, parentNode, value) {
            return tree.get_children_dom(parentNode).filter("[value='" + value +"']").first().attr("id");
        }
    },
    createNode: function(tree, parentNode, nodeData) {
        tree.deselect_all();
        if (tree.is_loaded(parentNode)) {
            var newNodeId = tree.create_node(parentNode, nodeData);
            tree.select_node(newNodeId, false, false);
        }
        else {
            tree.open_node(parentNode, function() {
                var newNode = edo.tree.node.getChildWithValue(tree, parentNode, nodeData.li_attr.value);
                if (newNode) {
                    tree.select_node(newNode, false, false);
                } else {
                    edo.tree.createNode(tree, parentNode, nodeData);
                }
            });
        }
    },
    deleteNode: function(tree, selectedNode) {
        tree.delete_node([selectedNode]);
    },
    registerModalAction: function(treeContainer, actionType, actionEvent, actionButtonId, modalId, modalUrl) {
        var tree = treeContainer.jstree(true);
        var actionButton = $("#" + actionButtonId);

        actionButton.addClass(actionType.buttonClass);
        if (!tree.get_selected().length) {
            actionButton.addClass("disabled");
        }
        treeContainer.on("changed.jstree", function(e, data) {
            if (data.action === "select_node") {
                actionButton.removeClass("disabled");
            }
            if (data.action === "deselect_node") {
                actionButton.addClass("disabled");
            }
        });

        actionButton.click(function() {
            var selectedNodes = tree.get_selected(true);
            if (selectedNodes.length) {
                var selectedNode = selectedNodes[0];
                var doTreeAction = function(nodeData) {
                    actionType.action(tree, selectedNode, nodeData);
                    $.EventBus(actionEvent).unsubscribe(doTreeAction);
                };
                $.EventBus(actionEvent).subscribe(doTreeAction);
                edo.modal.loadAjax(modalUrl,
                    {
                      modalId: modalId,
                      actionType: actionType.id,
                      nodeValue: edo.tree.getValue(selectedNode)
                    },
                    {
                      hidden: function() { $.EventBus(actionEvent).unsubscribe(doTreeAction); }
                    }
                );
            }
        });
    }
};
edo.tree.ActionType = {
    CREATE_NODE: { id: "CREATE_NODE", action: edo.tree.createNode, buttonClass: "btn-success" },
    DELETE_NODE: { id: "DELETE_NODE", action: edo.tree.deleteNode, buttonClass: "btn-danger" }
};


edo.offer = {};

edo.offer.triggerRatingUpdate = function(event, networkDealNumber) {
    event = $.event.fix(event);
    event.preventDefault();

    var target = $(event.target.nodeName == "SPAN" ? event.target.parentNode : event.target);
    var rating = target.hasClass("active") ? null : target.data("rating");

    target.blur().siblings(".btn-thumbs").removeClass("active").focus().blur();
    $.EventBus("offerRatingUpdate").publish(networkDealNumber, rating);
};
