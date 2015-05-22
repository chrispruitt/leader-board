
edo.geo = {};

edo.geo.LocationSearch = (function() {
    LocationSearch.prototype = Object.create(edo.tag.BaseTag.prototype);

    var slideToggle = { width: "toggle", paddingLeft: "toggle", paddingRight: "toggle" };

    // Constructor
    function LocationSearch(autocompleteInputId, locationForm, map, options) {
        edo.tag.BaseTag.call(this, autocompleteInputId, "inputAddress");
        var self = this;

        this.isInitialized = false;

        var initOptions = options || {};
        if (initOptions.usePlacesApi === true || initOptions.usePlacesApi === false) {
            this.usePlacesApi = initOptions.usePlacesApi;
        }
        else {
            this.usePlacesApi = typeof google.maps.places !== "undefined";
        }

        initOptions.messages = initOptions.messages || {};
        this.messages = {
            buttonClear: initOptions.messages.buttonClear || "Clear",
            errorNotFound: initOptions.messages.errorNotFound || "Not Found",
            errorMultipleResults: initOptions.messages.errorMultipleResults || "Multiple results found"
        };

        this.forceChooseFirstApiResult = initOptions.forceChooseFirstApiResult;
        this.allowedGeocodeLocationTypes = [];
        $.each(initOptions.allowedGeocodeLocationTypes, function(i, locationType) {
            if (edo.geo.LocationType.hasOwnProperty(locationType)) {
                self.allowedGeocodeLocationTypes.push(edo.geo.LocationType[locationType]);
            }
        });

        this.autocompleteInput = document.getElementById(autocompleteInputId);
        if (this.usePlacesApi) {
            this.autocomplete = new google.maps.places.Autocomplete(this.autocompleteInput);
            bindEnterKeyToFirstResultOrGeocode(this);
        } else {
            bindEnterKeyToGeocode(this);
        }

        this.geocoder = new google.maps.Geocoder();

        this.locationForm = new edo.geo.LocationForm($(this.autocompleteInput).parents("form").first(), locationForm);
        this.map = map;

        if (this.map) {
            if (this.usePlacesApi) {
                this.autocomplete.bindTo("bounds", this.map);
            }

            this.mapMarkerInfo = new google.maps.InfoWindow();
            this.mapMarker = new google.maps.Marker({
                map: this.map,
                anchorPoint: new google.maps.Point(0, -29)
            });

            setupMapResizeEvent(this.map);
        }

        if (this.map && initOptions.inputInsideMap) {
            putAutocompleteInputInsideMap(this);
            resizeAutocompleteInputForMap(this);
        } else {
            $(this.autocompleteInput).wrap("<span></span>");
            this.autocompleteControls = $(this.autocompleteInput).parent();
            this.autocompleteControls.append("<span class='input-group-btn'></span>");
            this.autocompleteButtons = this.autocompleteControls.children(".input-group-btn").first();
        }
        this.autocompleteButtons.hide();

        showSearchButtonWhenNoAutocompleteResults(this, self.usePlacesApi ? 500 : 0);

        var initializationPendingGeocode = false;
        var initialOptions = { doNotEraseExistingValues: true, suppressChangeEvent: true, fireInitializeEvent: true,
            suppressFormUpdate: !initOptions.overwriteInputsOnInitialize};
        if (this.locationForm.hasExistingAddress()) {
            initializationPendingGeocode = true;
            searchLocationViaGeocode(this, this.locationForm.getFormattedAddress(), initialOptions);
        }
        else if (this.locationForm.hasExistingGeocode()) {
            initializationPendingGeocode = true;
            searchLocationViaReverseGeocode(this,
                                            this.locationForm.latitude.getValue(),
                                            this.locationForm.longitude.getValue(),
                                            this.locationForm.getLocationType(),
                                            initialOptions);
        }

        if (this.usePlacesApi) {
            google.maps.event.addListener(this.autocomplete, "place_changed", function () {
                var place = self.autocomplete.getPlace();
                if (place.address_components) {
                    updatePlace(self, place);
                }
                else if (place.name) {
                    searchLocationViaGeocode(self, place.name);
                }
            });
        }
        $(this.autocompleteInput).change(function(event) {
            // FIXME: should not re-geocode if self.hasLocation(), should just change input value back to self.formattedAddress
            if (!self.isLocationFound) {
                searchLocationViaGeocode(self, this.value);
            }
        });

        if (!initializationPendingGeocode) {
            this.isInitialized = true;
            this.trigger("initialize", this.getLocation());
        }
    }

    /**
     * Update the LocationSearch with an address geocoded from the provided searchString.
     * Currently does not support searches against the Google Places API.
     *
     * @param searchString required plaintext string to find an address/geolocation for.
     * @param options optional object with attributes that affect how the search is done.
     * @param onSuccess optional function to call after the search is complete (before change event is fired).
     */
    LocationSearch.prototype.search = function(searchString, options, onSuccess) {
        // TODO: trigger Places search when usePlacesApi === true
        var searchOptions = edo.util.getArgumentOfType("object", options, onSuccess);
        var onSearchSuccess = edo.util.getArgumentOfType("function", options, onSuccess);
        searchLocationViaGeocode(this, searchString, searchOptions, onSearchSuccess);
    };

    /**
     * @returns {boolean} whether this LocationSearch widget is currently displaying a particular location.
     */
    LocationSearch.prototype.hasLocation = function() {
        // If the isLocationFound flag is true, then we can shortcut the expensive logic and return true.
        // Otherwise, the input field may be dirty (i.e. has been changed from original value, but not yet
        // geocoded), so we have to check the form inputs to see if they have values.
        if (this.isLocationFound) {
            return true;
        }
        return this.locationForm.hasExistingGeocode() || this.locationForm.hasExistingAddress();
    };

    /**
     * @returns {object} an object that represents the location. Will have attributes for
     *          address, address2, city, state, locationType, etc. to match the data that the
     *          form inputs store (i.e. the attributes will match the attributes given in the
     *          locationForm in the constructor for LocationSearch).
     */
    LocationSearch.prototype.getLocation = function() {
        return this.locationForm.getLocation();
    };

    /**
     * @override
     * @inheritDoc
     */
    LocationSearch.prototype.on = function(eventType, eventFunction) {
        edo.tag.BaseTag.prototype.on.call(this, eventType, eventFunction);

        // if initialization was already complete by the time the event handler was requested,
        // we just call the eventFunction immediately
        if ("initialize" === eventType && this.isInitialized) {
            edo.util.call(eventFunction, this, this.getLocation());
        }
    };

    function updatePlace(self, place, options, successFunction) {
        self.formattedAddress = place.formatted_address;
        self.autocompleteInput.value = self.formattedAddress;
        if (typeof(options) === "undefined" || !options || !options.suppressFormUpdate) {
            self.locationForm.updateLocation(place, options);
        }
        showLocationOnMap(self, place);
        markLocationAsFound(self);
        hideErrorAddon(self);
        showClearButton(self);
        if (typeof successFunction === "function") {
            successFunction.call(self, self.getLocation());
        }
        if (typeof(options) === "undefined" || !options || !options.suppressChangeEvent) {
            self.trigger("change", self.getLocation());
        }
    }

    function showLocationOnMap(self, place) {
        if (!self.map || !place.geometry) {
            return;
        }
        hideMapMarker(self.mapMarker, self.mapMarkerInfo);
        fitMapViewportToPlace(self.map, place);
        showMapMarkerForPlace(self.mapMarker, place);
        showMapMarkerInfoTip(self.map, self.mapMarker, self.mapMarkerInfo, self.locationForm.getInfoTipHtml());
    }

    function searchLocationViaGeocode(self, searchString, options, successFunction) {
        var address = searchString.replace(/\s/g, "+");
        self.geocoder.geocode({address: address}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                var filteredResults = getResultsFilteredByLocationType(results, self.allowedGeocodeLocationTypes);
                if (filteredResults.length && (filteredResults.length === 1 || self.forceChooseFirstApiResult)) {
                    updatePlace(self, filteredResults[0], options, successFunction);
                }
                else if (filteredResults.length > 1) {
                    clearResults(self, searchString, self.messages.errorMultipleResults, options);
                }
                else {
                    clearResults(self, searchString, self.messages.errorNotFound, options);
                }
            }
            else {
                clearResults(self, searchString, self.messages.errorNotFound, options);
            }

            if (options && options.fireInitializeEvent && !self.isInitialized) {
                self.isInitialized = true;
                self.trigger("initialize", self.getLocation());
            }
        });
    }

    function searchLocationViaReverseGeocode(self, latitude, longitude, locationType, options, successFunction) {
        self.geocoder.geocode({ latLng: { lat: latitude, lng: longitude } }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                var locationTypes = locationType ? [locationType] : self.allowedGeocodeLocationTypes;
                var filteredResults = getResultsFilteredByLocationType(results, locationTypes);
                if (filteredResults.length) {
                    updatePlace(self, filteredResults[0], options, successFunction);
                }
                else {
                    clearResults(self, "", self.messages.errorNotFound, options);
                }
            }
            else {
                clearResults(self, "", self.messages.errorNotFound, options);
            }

            if (options && options.fireInitializeEvent && !self.isInitialized) {
                self.isInitialized = true;
                self.trigger("initialize", self.getLocation());
            }
        });
    }

    function getResultsFilteredByLocationType(results, locationTypes) {
        if (!locationTypes || !locationTypes.length) {
            return results;
        }
        var filteredResults = [];
        $.each(results, function(i, place) {
            $.each(locationTypes, function(i, locationType) {
                if (locationType.placeType === place.types[0]) {
                    filteredResults.push(place);
                    return false;
                }
            });
        });
        return filteredResults;
    }

    function clearResults(self, searchString, errorString, options) {
        if (self.map) {
            hideMapMarker(self.mapMarker, self.mapMarkerInfo);
        }
        hideClearButton(self);
        hideSearchButton(self);
        if (errorString) {
            showErrorAddon(self, errorString);
        }
        if (self.hasLocation()) {
            self.locationForm.clearLocation(options);
            self.autocompleteInput.value = searchString || "";
            unmarkLocationAsFound(self);
            if (typeof(options) === "undefined" || !options || !options.suppressChangeEvent) {
                self.trigger("change", self.getLocation());
            }
        }
    }

    function hideMapMarker(marker, info) {
        info.close();
        marker.setVisible(false);
    }
    function fitMapViewportToPlace(map, place) {
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
    }
    function showMapMarkerForPlace(marker, place) {
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
    }
    function showMapMarkerInfoTip(map, marker, info, infoContent) {
        info.setContent(infoContent);
        info.open(map, marker);
    }

    function putAutocompleteInputInsideMap(self) {
        var mapControls = document.createElement("div");
        mapControls.setAttribute("id", self.autocompleteInput.id + "_map_controls");
        mapControls.className = "map-controls";
        mapControls.appendChild(self.autocompleteInput);

        var autocompleteButtons = document.createElement("span");
        autocompleteButtons.className = "input-group-btn hidden";
        mapControls.appendChild(autocompleteButtons);

        self.autocompleteButtons = $(autocompleteButtons);
        self.autocompleteControls = $(mapControls);

        self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(mapControls);
    }

    function resizeAutocompleteInputForMap(self) {
        google.maps.event.addListener(self.map, "resize", function() {
            self.autocompleteControls.css("width", Math.min((self.map.getDiv().offsetWidth - 150), 450) + "px");
        });
        google.maps.event.trigger(self.map, "resize");
    }

    function showSearchButtonWhenNoAutocompleteResults(self, waitTime) {
        var searchTimeout = null;
        $(self.autocompleteInput).keyup(function(event) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                if (!self.autocompleteInput.value) {
                    unmarkLocationAsFound(self);
                    hideSearchButton(self);
                } else if(!isDropdownShowing(self) && self.autocompleteInput.value !== self.formattedAddress) {
                    if (!isKeypressEnter(event) && !self.searchButton) {
                        unmarkLocationAsFound(self);
                        showSearchButton(self);
                    }
                }
                else {
                    markLocationAsFound(self);
                }
            }, waitTime);
        });
    }

    function showSearchButton(self) {
        hideErrorAddon(self);
        self.searchButton = showAddon(self.searchButton,
                                    $("<button class='btn btn-default' type='button'><i class='fa fa-search'></i></button>"),
                                    self.autocompleteControls, self.autocompleteButtons,
                                    function() { onSearchButtonClick(self); });
    }
    function hideSearchButton(self) {
        hideAddon(self.searchButton, self.autocompleteControls);
        self.searchButton = null;
    }
    function onSearchButtonClick(self) {
        var currentValue = self.autocompleteInput.value;
        if (currentValue) {
            searchLocationViaGeocode(self, currentValue);
        }
    }

    function showErrorAddon(self, errorMessage) {
        hideSearchButton(self);
        hideClearButton(self);
        self.autocompleteControls.addClass("has-error");
        self.errorAddon = showAddon(self.errorAddon,
                                    $("<span class='input-group-addon'>" + errorMessage + "</span>"),
                                    self.autocompleteControls);
    }
    function hideErrorAddon(self) {
        hideAddon(self.errorAddon, self.autocompleteControls);
        self.autocompleteControls.removeClass("has-error");
        self.errorAddon = null;
    }

    function showClearButton(self) {
        self.autocompleteControls.addClass("has-success");
        self.clearButton = showAddon(self.clearButton,
                                     $("<button class='btn btn-default' type='button'>" + self.messages.buttonClear + "</button>"),
                                     self.autocompleteControls, self.autocompleteButtons,
                                     function() { clearResults(self); });
    }
    function hideClearButton(self) {
        hideAddon(self.clearButton, self.autocompleteControls);
        self.clearButton = null;
    }

    function showAddon(currentAddon, addonHtml, controls, parent, onClickFunction) {
        if (!currentAddon) {
            controls.addClass("input-group");

            parent = parent || controls;

            var addon = $(addonHtml).appendTo(parent);

            parent.removeClass("hidden");
            parent.show();

            addon.animate(slideToggle, 0);
            addon.animate(slideToggle, 200);
            if (onClickFunction) {
                addon.click(onClickFunction);
            }
            return addon;
        }
        return currentAddon;
    }
    function hideAddon(addon, controls) {
        if (addon) {
            addon.animate(slideToggle, 200).promise().always(function() {
                addon.remove();
                var autocompleteButtons = controls.children(".input-group-btn");
                if (!autocompleteButtons.children(".btn").length) {
                    autocompleteButtons.hide();
                    autocompleteButtons.addClass("hidden");
                    if (!controls.children(".input-group-addon").length) {
                        controls.removeClass("input-group");
                    }
                }
            });
        }
    }

    function markLocationAsFound(self) {
        self.isLocationFound = true;
        hideSearchButton(self);
    }
    function unmarkLocationAsFound(self) {
        self.isLocationFound = false;
        self.autocompleteControls.removeClass("has-success");
    }

    function breadthFirstSearch(object, matchesCriteria) {
        var queue = [];
        var visited = [];
        var i;
        queue.push(object);
        visited.push(object);
        while (queue.length) {
            var val = queue.shift();
            if (val && typeof val === "object") {
                if (matchesCriteria(val)) {
                    return val;
                }
                if ($.isArray(val)) {
                    for (i=0; i<val.length; i++) {
                        breadthFirstSearchProcessValue(val[i], queue, visited);
                    }
                }
                else if (val instanceof Node) {
                    if (val.hasChildNodes()) {
                        var children = val.childNodes;
                        for (i=0; i<children.length; i++) {
                            breadthFirstSearchProcessValue(children[i], queue, visited);
                        }
                    }
                }
                else {
                    for (var property in val) {
                        if (val.hasOwnProperty(property)) {
                            breadthFirstSearchProcessValue(val[property], queue, visited);
                        }
                    }
                }
            }
        }
    }
    function breadthFirstSearchProcessValue(val, queue, visited) {
        for (var i=0; i<visited.length; i++) {
            if (visited[i] === val) {
                return;
            }
        }
        queue.push(val);
        visited.push(val);
    }

    function getAutocompleteDropdownUsingAssumptionsAboutAutocompleteObjectStructure(autocomplete) {
        var dropdown = null;
        var obj = autocomplete.gm_accessors_.place;
        $.each(Object.keys(obj), function(i, key) {
            if (typeof (obj[key]) === "object" && obj[key].hasOwnProperty("gm_accessors_")) {
                obj = obj[key].gm_accessors_.input[key];
                return false;
            }
        });
        $.each(Object.keys(obj), function(i, key) {
            if (obj[key] instanceof Node && $(obj[key]).hasClass("pac-container")) {
                dropdown = obj[key];
                return false;
            }
        });
        return dropdown;
    }

    function getAutocompleteDropdownIfOnlyOneOnPage() {
        var dropdowns = $(".pac-container");
        return dropdowns.length === 1 ? dropdowns.first().get(0) : null;
    }

    function getAutocompleteDropdown(self) {
        if (!self.usePlacesApi) {
            return null;
        }
        // Lazily instantiate this.autocompleteDropdown.
        // Google's autocomplete widget doesn't give us documented access to the dropdown, so we have to
        // figure out our own way of getting it. So, if it is not already instantiated, we first find
        // any elements with the class "pac-container", and if there is only 1, just use that. Otherwise,
        // we try to access the dropdown via the undocumented (and subject to change) structure of the
        // Google autocomplete object. Lastly, if that fails (i.e. Google has changed the structure of
        // the widget), we do a breadth-first-search through the structure of the widget, which is slow,
        // but will ultimately find the dropdown.
        self.autocompleteDropdown = self.autocompleteDropdown ||
                                    getAutocompleteDropdownIfOnlyOneOnPage() ||
                                    getAutocompleteDropdownUsingAssumptionsAboutAutocompleteObjectStructure(self.autocomplete) ||
                                    breadthFirstSearch(self.autocomplete, function(val) {
                                        return val.className === "pac-container";
                                    });
        return self.autocompleteDropdown;
    }

    function isDropdownShowing(self) {
        return self.usePlacesApi ? getAutocompleteDropdown(self).hasChildNodes() : false;
    }
    function isSelectionInDropdown(self) {
        var dropdown = getAutocompleteDropdown(self);
        return dropdown ? $(dropdown).find(".pac-item-selected").length > 0 : false;
    }
    function isKeypressEnter(event) {
        return event.which === 13 || event.keyCode === 13;
    }

    function bindEnterKeyToGeocode(self) {
        var $autocompleteInput = $(self.autocompleteInput);
        $autocompleteInput.keydown(function(event) {
            if (isKeypressEnter(event)) {
                if (!self.isLocationFound) {
                    event.preventDefault();
                }
                searchLocationViaGeocode(self, $autocompleteInput.val(), null, function() {
                    $autocompleteInput.blur();
                });
            }
        });
    }

    function bindEnterKeyToFirstResultOrGeocode(self) {
        // store the original event binding function
        var _addEventListener = (self.autocompleteInput.addEventListener) ? self.autocompleteInput.addEventListener : self.autocompleteInput.attachEvent;

        function addEventListenerWrapper(type, listener) {
            // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
            // and then trigger the original listener.
            if (type === "keydown") {
                var orig_listener = listener;
                listener = function(event) {
                    if (isKeypressEnter(event)) {
                        if (!self.isLocationFound) {
                            event.preventDefault();
                        }
                        var selected = simulateSelectFromDropdown(self, orig_listener, event);
                        if (!selected && !self.isLocationFound) {
                            searchLocationViaGeocode(self, self.autocompleteInput.value);
                        }
                    }
                    else {
                        orig_listener.apply(self.autocompleteInput, [event]);
                    }
                };
            }
            _addEventListener.apply(self.autocompleteInput, [type, listener]);
        }
        self.autocompleteInput.addEventListener = addEventListenerWrapper;
        self.autocompleteInput.attachEvent = addEventListenerWrapper;
    }

    function simulateSelectFromDropdown(self, listener, enterEvent) {
        if (isDropdownShowing(self)) {
            if (!isSelectionInDropdown(self)) {
                var simulatedDownArrow = $.Event("keydown", { keyCode: 40, which: 40 });
                listener.apply(self.autocompleteInput, [simulatedDownArrow]);
            }
            listener.apply(self.autocompleteInput, [enterEvent]);
            return true;
        }
        return false;
    }

    function setupMapResizeEvent(map) {
        var currentWidth = map.getDiv().offsetWidth;
        $(window).resize(function() {
            var prevWidth = currentWidth;
            currentWidth = map.getDiv().offsetWidth;
            if (prevWidth !== currentWidth) {
                google.maps.event.trigger(map, "resize");
            }
        });
    }

    return LocationSearch;
})();

edo.geo.GooglePlaceType = {
    street_number: { length: "long_name" },
    route: { length: "long_name" },
    subpremise: { length: "long_name" },
    neighborhood: { length: "long_name" },
    locality: { length: "long_name" },
    administrative_area_level_2: { length: "long_name" },
    administrative_area_level_1: { length: "short_name" },
    country: { length: "short_name" },
    postal_code: { length: "short_name" }
};

edo.geo.LocationType = {
    address: { format: "%(street_number)s %(route)s", placeType: "street_address" },
    address2: { format: "%(subpremise)s" },
    neighborhood: { format: "%(neighborhood)s", placeType: "neighborhood" }, // TODO: add support for location form input
    city: { format: "%(locality)s", placeType: "locality" },
    county: { format: "%(administrative_area_level_2)s", placeType: "administrative_area_level_2" }, // TODO: add support for location form input
    state: { format: "%(administrative_area_level_1)s", placeType: "administrative_area_level_1" },
    postalCode: { format: "%(postal_code)s", placeType: "postal_code" },
    country: { format: "%(country)s", placeType: "country" },
    latitude: { format: "%(latitude).10f" },
    longitude: { format: "%(longitude).10f" }
};

edo.geo.GooglePlaceWrapper = (function() {
    function GooglePlaceWrapper(place) {
        this.placeTypeValues = {};

        var placeType;
        for (var i = 0; i < place.address_components.length; i++) {
            placeType = place.address_components[i].types[0];
            if (edo.geo.GooglePlaceType.hasOwnProperty(placeType)) {
                this.placeTypeValues[placeType] = place.address_components[i][edo.geo.GooglePlaceType[placeType].length];
            }
        }
        for (placeType in edo.geo.GooglePlaceType) {
            if (edo.geo.GooglePlaceType.hasOwnProperty(placeType) && !this.placeTypeValues.hasOwnProperty(placeType)) {
                this.placeTypeValues[placeType] = "";
            }
        }
        this.placeTypeValues.latitude = place.geometry.location.lat();
        this.placeTypeValues.longitude = place.geometry.location.lng();

        placeType = place.types[0];
        for (var locationType in edo.geo.LocationType) {
            if (edo.geo.LocationType.hasOwnProperty(locationType) && edo.geo.LocationType[locationType].placeType === placeType) {
                this.locationType = locationType;
            }
        }
        this.locationType = this.locationType || "";
    }

    GooglePlaceWrapper.prototype.getValue = function(locationType) {
        return edo.util.stringFormat(locationType.format, this.placeTypeValues);
    };

    GooglePlaceWrapper.prototype.getLocationType = function() {
        return this.locationType;
    };

    return GooglePlaceWrapper;
})();

edo.geo.LocationComponent = (function() {
    function LocationComponent(formInput, locationType) {
        this.formInput = formInput;
        this.locationType = locationType;
    }

    LocationComponent.prototype.getValue = function() {
        var value = this.formInput.val() || null;
        if (value && (this.locationType === edo.geo.LocationType.latitude || this.locationType === edo.geo.LocationType.longitude)) {
            value = +value;
        }
        return value;
    };
    LocationComponent.prototype.setValue = function(value) {
        this.formInput.val(value);
    };
    LocationComponent.prototype.clearValue = function() {
        this.formInput.val("");
    };

    return LocationComponent;
})();

edo.geo.LocationForm = (function() {
    function LocationForm(form, formInputs) {
        this.form = edo.util.getElement(form);

        this.locationComponents = [];

        this.address = addLocationComponent(this, formInputs.address, edo.geo.LocationType.address);
        this.address2 = addLocationComponent(this, formInputs.address2, edo.geo.LocationType.address2);
        this.city = addLocationComponent(this, formInputs.city, edo.geo.LocationType.city);
        this.state = addLocationComponent(this, formInputs.state, edo.geo.LocationType.state);
        this.postalCode = addLocationComponent(this, formInputs.postalCode, edo.geo.LocationType.postalCode);
        this.country = addLocationComponent(this, formInputs.country, edo.geo.LocationType.country);
        this.latitude = addLocationComponent(this, formInputs.latitude, edo.geo.LocationType.latitude);
        this.longitude = addLocationComponent(this, formInputs.longitude, edo.geo.LocationType.longitude);

        this.locationTypeInput = addInput(this.form, formInputs.locationType);
    }

    var addLocationComponent = function(self, inputId, locationType) {
        var input = addInput(self.form, inputId);
        if (input) {
            var locationComponent = new edo.geo.LocationComponent(input, locationType);
            self.locationComponents.push(locationComponent);
            return locationComponent;
        }
    };
    var addInput = function(form, inputId) {
        if (inputId) {
            var input = form.find("#" + inputId);
            if (input.length) {
                return input;
            }
        }
    };

    LocationForm.prototype.getLocation = function() {
        var location = {};
        if (this.address)    { location.address = this.address.getValue(); }
        if (this.address2)   { location.address2 = this.address2.getValue(); }
        if (this.city)       { location.city = this.city.getValue(); }
        if (this.state)      { location.state = this.state.getValue(); }
        if (this.postalCode) { location.postalCode = this.postalCode.getValue(); }
        if (this.country)    { location.country = this.country.getValue(); }
        if (this.latitude)   { location.latitude = this.latitude.getValue(); }
        if (this.longitude)  { location.longitude = this.longitude.getValue(); }
        if (this.locationTypeInput) { location.locationType = this.locationTypeInput.val() || null; }
        return location;
    };

    LocationForm.prototype.updateLocation = function(place, options) {
        var placeWrapper = new edo.geo.GooglePlaceWrapper(place);
        $.each(this.locationComponents, function(i, locationComponent) {
            var locationComponentValue = placeWrapper.getValue(locationComponent.locationType);
            if (!options || !options.doNotEraseExistingValues || !hasValue(locationComponent) || locationComponentValue) {
                locationComponent.setValue(locationComponentValue);
            }
        });
        if (this.locationTypeInput) {
            this.locationTypeInput.val(placeWrapper.getLocationType());
        }
    };

    LocationForm.prototype.clearLocation = function(options) {
        $.each(this.locationComponents, function(i, locationComponent) {
            if (!options || !options.doNotEraseExistingValues || !hasValue(locationComponent)) {
                locationComponent.clearValue();
            }
        });
        if (this.locationTypeInput) {
            this.locationTypeInput.val("");
        }
    };

    /**
     * @returns {boolean} whether any address fields are populated (i.e. address1, address2, city, state, etc.)
     */
    LocationForm.prototype.hasExistingAddress = function() {
        for (var i=0; i < this.locationComponents.length; i++) {
            var locationComponent = this.locationComponents[i];
            if (hasValue(locationComponent) && !isGeoComponent(this, locationComponent)) {
                return true;
            }
        }
        return false;
    };
    /**
     * @returns {boolean} whether the geocode fields are populated (i.e. latitude & longitude)
     */
    LocationForm.prototype.hasExistingGeocode = function() {
        return hasValue(this.latitude) && hasValue(this.longitude);
    };

    var isGeoComponent = function(self, locationComponent) {
        return locationComponent === self.latitude || locationComponent === self.longitude;
    };

    LocationForm.prototype.getLocationType = function() {
        if (this.locationTypeInput) {
            var locationTypeVal = this.locationTypeInput.val();
            if (locationTypeVal && edo.geo.LocationType.hasOwnProperty(locationTypeVal)) {
                return edo.geo.LocationType[locationTypeVal];
            }
        }
    };

    LocationForm.prototype.getFormattedAddress = function() {
        var addressValues = [];
        for (var i=0; i < this.locationComponents.length; i++) {
            var locationComponent = this.locationComponents[i];
            if (hasValue(locationComponent) && !isGeoComponent(this, locationComponent)) {
                addressValues.push(locationComponent.getValue());
            }
        }
        return addressValues.join(", ");
    };

    LocationForm.prototype.getInfoTipHtml = function() {
        var infoHtml = "";
        if (hasValue(this.address)) {
            infoHtml += "<div style=\"white-space: nowrap;\"><b>" + this.address.getValue() + "</b>";
            if (hasValue(this.address2)) {
                infoHtml += " <span class=\"text-muted\">" + this.address2.getValue() + "</span>";
            }
            infoHtml += "</div>";
        }
        var hasCity = hasValue(this.city);
        var hasState = hasValue(this.state);
        var hasPostalCode = hasValue(this.postalCode);
        var hasCountry = hasValue(this.country);
        if (hasCity || hasState || hasPostalCode || hasCountry) {
            infoHtml += "<div style=\"white-space: nowrap;\">";
            if (hasCity) {
                infoHtml += this.city.getValue();
                if (hasState || hasPostalCode) {
                    infoHtml += ", ";
                }
            }
            if (hasState) {
                infoHtml += this.state.getValue() + " ";
            }
            if (hasPostalCode) {
                infoHtml += this.postalCode.getValue();
            }
            if (hasCountry) {
                if (hasCity || hasState || hasPostalCode) {
                    infoHtml += ", ";
                }
                infoHtml += this.country.getValue();
            }
            infoHtml += "</div>";
        }
        infoHtml += edo.util.stringFormat("<div class=\"text-muted\" style=\"white-space: nowrap\">%.4f, %.4f</div>",
                                          this.latitude.getValue(), this.longitude.getValue());

        return infoHtml;
    };

    var hasValue = function(locationComponent) {
        return locationComponent && locationComponent.getValue() !== null;
    };

    return LocationForm;
})();
