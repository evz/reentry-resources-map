var facilityTypeOptions = [
  "reentry",
  "housing",
  "food",
  "employment",
  "health",
  "family_and_relationships",
  "advocacy",
  "legal",
  "veterans"
];
var restrictionOptions = [
  "men_only",
  "women_only",
  "prohibits_sex_offenders"
];
var flagOptions = [
  "men_only",
  "women_only",
  "women_children_only",
  "prohibits_sex_offenders",
  "hiv_aids",
  "substance_free",
  "parolees",
  "lgbtq_only"
];
var iconMap = {
  "reentry": "icon-reentry",
  "housing": "icon-home",
  "food": "icon-food",
  "health": "icon-heartbeat",
  "legal": "icon-gavel",
  "employment": "icon-work",
  "veterans": "icon-vets",
  "family_and_relationships": "icon-users",
  "advocacy": "icon-advocacy",
  "women_only": "icon-female",
  "men_only": "icon-male",
  "women_children_only": "icon-child"
};

var CartoDbLib = CartoDbLib || {};
var CartoDbLib = {
  map_centroid:    [40.1242, -89.1486],
  defaultZoom:     7,
  lastClickedLayer: null,
  locationScope:   "illinois",
  currentPinpoint: null,
  layerUrl: 'https://pjsier.carto.com/api/v2/viz/ee44a586-1d4f-11e7-8c92-0e3ebc282e83/viz.json',
  tableName: 'combined_irgi_resources',
  userName: 'pjsier',
  geoSearch: '',
  whereClause: ' WHERE clerks is null ',
  typeSelections: '',
  userSelection: '',
  radius: '',
  resultsCount: 0,
  fields : "id, address, name, website, phone, hours, notes, restrictions, online_only, " + facilityTypeOptions.join(", ") + ", " + flagOptions.join(", "),

  initialize: function(){
    //reset filters
    $("#search-address").val(CartoDbLib.convertToPlainString($.address.parameter('address')));
    $("#search-radius").val(CartoDbLib.convertToPlainString($.address.parameter('radius')));
    $("#select-type").val(CartoDbLib.convertToPlainString($.address.parameter('type')));

    var num = $.address.parameter('modal_id');

    if (typeof num !== 'undefined') {
      var sql = new cartodb.SQL({ user: CartoDbLib.userName });
      sql.execute("SELECT " + CartoDbLib.fields + " FROM " + CartoDbLib.tableName + " WHERE id = " + num)
      .done(function(data) {
        CartoDbLib.modalPop(data.rows[0]);
      });
    }

    geocoder = new google.maps.Geocoder();
    // initiate leaflet map
    if (!CartoDbLib.map) {
      CartoDbLib.map = new L.Map('mapCanvas', {
        center: CartoDbLib.map_centroid,
        zoom: CartoDbLib.defaultZoom
      });

      CartoDbLib.google = new L.Google('ROADMAP', {animate: false});

      CartoDbLib.map.addLayer(CartoDbLib.google);

      //add hover info control
      CartoDbLib.info = L.control({position: 'bottomleft'});

      CartoDbLib.info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      // method that we will use to update the control based on feature properties passed
      CartoDbLib.info.update = function (props) {
        var facilityType = ""

        if (props) {
          $.each(props, function (prop, value) {
            if ($.inArray(String(prop), facilityTypeOptions) > -1 && value == 'Yes') {
              facilityType += (CartoDbLib.formatText(prop) + ", ")
            }
          });
          facilityType = facilityType.slice(0, -2);

          this._div.innerHTML = "<strong>" + props.name + "</strong><br />" + facilityType + "<br />" + props.address;
        }
        else {
          this._div.innerHTML = 'Hover over a location';
        }
      };

      CartoDbLib.info.clear = function(){
        this._div.innerHTML = 'Hover over a location';
      };

      //add results control
      CartoDbLib.results_div = L.control({position: 'topright'});

      CartoDbLib.results_div.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'results-count');
        this._div.innerHTML = "";
        return this._div;
      };

      CartoDbLib.results_div.update = function (count){
        this._div.innerHTML = count + ' locations found';
      };

      CartoDbLib.results_div.addTo(CartoDbLib.map);

      CartoDbLib.info.addTo(CartoDbLib.map);
      CartoDbLib.clearSearch();
      CartoDbLib.renderMap();
      CartoDbLib.renderList();
      CartoDbLib.renderSavedResults();
      CartoDbLib.updateSavedCounter();
      CartoDbLib.getResults();
    }
  },

  doSearch: function() {
    CartoDbLib.clearSearch();
    var address = $("#search-address").val();
    CartoDbLib.radius = $("#search-radius").val();

    if (CartoDbLib.radius == null && address != "") {
      CartoDbLib.radius = 8050;
    }
    if (address != "") {
      if (address.toLowerCase().indexOf(CartoDbLib.locationScope) == -1)
        address = address + " " + CartoDbLib.locationScope;

      geocoder.geocode( { 'address': address }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          CartoDbLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          CartoDbLib.getClerk(results[0].address_components);
          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', CartoDbLib.radius);
          CartoDbLib.address = address;
          // Must call create SQL before setting language parameter.
          CartoDbLib.createSQL();
          $.address.parameter('type', encodeURIComponent(CartoDbLib.typeSelections));

          CartoDbLib.setZoom();
          CartoDbLib.addIcon();
          CartoDbLib.addCircle();
          CartoDbLib.renderMap();
          CartoDbLib.renderList();
          CartoDbLib.getResults();

        }
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      CartoDbLib.map.setView(new L.LatLng( CartoDbLib.map_centroid[0], CartoDbLib.map_centroid[1] ), CartoDbLib.defaultZoom)

      CartoDbLib.createSQL();
      $.address.parameter('type', encodeURIComponent(CartoDbLib.typeSelections));

      CartoDbLib.renderList();
      CartoDbLib.renderMap();
      CartoDbLib.getResults();
    }
  },

  renderMap: function() {
      var layerOpts = {
        user_name: CartoDbLib.userName,
        type: 'cartodb',
        cartodb_logo: false,
        sublayers: [
          {
            sql: "SELECT * FROM " + CartoDbLib.tableName + CartoDbLib.whereClause,
            cartocss: $('#probation-maps-styles').html().trim(),
            interactivity: CartoDbLib.fields
          }
        ]
      }

      CartoDbLib.dataLayer = cartodb.createLayer(CartoDbLib.map, layerOpts, { https: true })
        .addTo(CartoDbLib.map)
        .done(function(layer) {
          CartoDbLib.sublayer = layer.getSubLayer(0);
          CartoDbLib.sublayer.setInteraction(true);
          CartoDbLib.sublayer.on('featureOver', function(e, latlng, pos, data, subLayerIndex) {
            $('#mapCanvas div').css('cursor','pointer');
            CartoDbLib.info.update(data);
          })
          CartoDbLib.sublayer.on('featureOut', function(e, latlng, pos, data, subLayerIndex) {
            $('#mapCanvas div').css('cursor','inherit');
            CartoDbLib.info.clear();
          })
          CartoDbLib.sublayer.on('featureClick', function(e, latlng, pos, data) {
              CartoDbLib.modalPop(data);
          })
          CartoDbLib.sublayer.on('error', function(err) {
            console.log('error: ' + err);
          })
        }).on('error', function(e) {
          console.log('ERROR')
          console.log(e)
        });
  },

  renderList: function() {
    var sql = new cartodb.SQL({ user: CartoDbLib.userName });
    var results = $('#results-list');

    if (CartoDbLib == ' WHERE clerks is null ') {
      CartoDbLib.whereClause = '';
    }

    results.empty();

    sql.execute("SELECT " + CartoDbLib.fields + " FROM " + CartoDbLib.tableName + CartoDbLib.whereClause)
      .done(function(listData) {
        var obj_array = listData.rows;
        if (listData.rows.length == 0) {
          results.append("<p class='no-results'>No results. Please broaden your search.</p>");
        }
        else {
          CartoDbLib.createSearchHeader(listData.rows.length);
          for (idx in obj_array) {
            if (obj_array[idx].website != "") {
              if (!obj_array[idx].website.match(/^http/)) {
                obj_array[idx].website = "http://" + obj_array[idx].website;
              }
            }
            obj_array[idx].icons = CartoDbLib.getIcons(obj_array[idx]);
            obj_array[idx].flags = CartoDbLib.getFlags(obj_array[idx]);
            obj_array[idx].cookie = CartoDbLib.checkCookieDuplicate(obj_array[idx].id) == false;
          }
          obj_array = obj_array.sort(function(a, b) {
            return (a.address===null)-(b.address===null) || -(a.address>b.address)||+(a.address<b.address);
          });
          var source = $('#results-list-template').html();
          var template = Handlebars.compile(source);
          var result = template(obj_array);
          $('#results-list').html(result);
          $('.icon-star-o').tooltip();
          $('.icon-star').tooltip();
        }
    }).done(function(listData) {
        $(".facility-name").on("click", function() {
          var thisName = $(this).text();
          var objArray = listData.rows;
          $.each(objArray, function( index, obj ) {
            if (obj.name == thisName ) {
              CartoDbLib.modalPop(obj)
            }
          });
        });
    }).error(function(errors) {
      console.log("errors:" + errors);
    });
  },

  deleteBlankResults: function(array) {
    var counter = 0;
    // Count number of instances of whitespace.
    $.each(array, function (index, value) {
      if (value != undefined) {
        cleanText = value.trim();
        if (cleanText.length == 0) {
          counter++;
        }
      }
    });
    return counter
  },

  getResults: function() {
    var sql = new cartodb.SQL({ user: CartoDbLib.userName });

    sql.execute("SELECT count(*) FROM " + CartoDbLib.tableName + CartoDbLib.whereClause)
      .done(function(data) {
        CartoDbLib.resultsCount = data.rows[0]["count"];
        CartoDbLib.results_div.update(CartoDbLib.resultsCount);
      }
    );
  },

  modalPop: function(data) {
    if (data.website != "") {
      if (data.website.match(/^http/)) {
        data.url =  data.website;
      }
      else {
        data.url = "http://" + data.website;
      }
    }
    data.cookie = CartoDbLib.checkCookieDuplicate(data.id) == false;

    var source = $('#modal-pop-template').html();
    var template = Handlebars.compile(source);
    var result = template(data);
    $('#modal-pop').html(result);

    $.address.parameter('modal_id', data.id);
    $("#post-shortlink").val(location.href);

    $('#modal-pop').modal();

    // Add tooltip.
    $('.icon-star-o').tooltip();
    $('.icon-star').tooltip();
  },

  clearSearch: function(){
    if (CartoDbLib.sublayer) {
      CartoDbLib.sublayer.remove();
    }
    if (CartoDbLib.centerMark)
      CartoDbLib.map.removeLayer( CartoDbLib.centerMark );
    if (CartoDbLib.radiusCircle)
      CartoDbLib.map.removeLayer( CartoDbLib.radiusCircle );
  },

  findMe: function() {
    // Try W3C Geolocation (Preferred)
    var foundLocation;

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        CartoDbLib.addrFromLatLng(foundLocation);
      }, null);
    }
    else {
      alert("Sorry, we could not find your location.");
    }
  },

  addrFromLatLng: function(latLngPoint) {
    geocoder.geocode({'latLng': latLngPoint}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search-address').val(results[1].formatted_address);
          $('.hint').focus();
          CartoDbLib.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  },

  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
    return decodeURIComponent(text);
  },

  // Use this function to capitalize the insurance brand names
  capitalizeBrand: function(text) {
    return text.replace(/(?:^|\s|\_)\S/g, function(a) { return a.toUpperCase(); });
  },

  formatText: function(text) {
    // Format text with acronyms.
    var lookup = {
      "reentry": "Re-entry",
      "women_children_only": "Women and Children Only",
      "hiv_aids": "HIV/AIDS-specific",
      "lgbtq_only": "LGBTQ Only"
    }
    if (text in lookup) {
      var capitalText = lookup[text]
    }
    else {
      var capitalText = text.charAt(0).toUpperCase() + text.slice(1);
    }

    return capitalText.replace(/_/g, ' ');
  },

  addUnderscore: function(text) {
    newText = text.replace(/\s/g, '_').replace(/[\/]/g, '_').replace(/[\:]/g, '').replace('-', '');
    if (newText[0].match(/^[1-9]\d*/)) {
      newText = "_" + newText
    }
    return newText.toLowerCase();
  },

  createSearchHeader: function(count) {
    var resultObj = {count: count};
    var radiusMap = {
      400: "2 blocks",
      805: "1/2 mile",
      1610: "1 mile",
      3220: "2 miles",
      8050: "5 miles",
      16095: "10 miles",
      40253: "25 miles",
      80506: "50 miles"
    };

    var address = $("#search-address").val();
    if (address != "") {
      resultObj.location = {
        address: address.split(",").slice(0, 2).join(", "),
        distance: radiusMap[CartoDbLib.radius]
      }
    }
    var catSelections = $.map($('.filter-option.category:checked'), function(obj, i) {
      return obj.value;
    });
    var resSelections = $.map($('.filter-option.restriction:checked'), function(obj, i) {
      return obj.value;
    });
    resultObj.categories = catSelections.length ? catSelections.join(", ") : false;
    resultObj.restrictions = resSelections.length ? resSelections.join(", ") : false;

    var source = $('#search-header-template').html();
    var template = Handlebars.compile(source);
    var result = template(resultObj);
    $('#search-header').html(result);
  },

  // Call this in createSearch, when creating SQL queries from user selection.
  userSelectSQL: function(array) {
    if (array.length === 0) {
      return "";
    }
    var results = "";
    var categoryArr = [];
    var flagArr = [];

    $.each(array, function(index, obj) {
      var suffix = " is true";
      if (flagOptions.indexOf(CartoDbLib.addUnderscore(obj)) === -1) {
        categoryArr.push(" " + CartoDbLib.addUnderscore(obj) + suffix);
      }
      else {
        suffix = " is null";
        flagArr.push(" " + CartoDbLib.addUnderscore(obj) + suffix);
      }
    });

    if (categoryArr.length) {
      results += " AND (" + categoryArr.join(" OR ") + ")";
    }
    // Add flags with AND if specified
    if (flagArr.length) {
      results += " AND (" + flagArr.join(" AND ") + ")";
    }
    CartoDbLib.userSelection += results;

    return results;
  },

  createSQL: function() {
     // Devise SQL calls for geosearch and language search.
    var address = $("#search-address").val();

    if (CartoDbLib.currentPinpoint != null && address != '') {
      CartoDbLib.geoSearch = "ST_DWithin(ST_SetSRID(ST_POINT(" + CartoDbLib.currentPinpoint[1] +
        ", " + CartoDbLib.currentPinpoint[0] + "), 4326)::geography, the_geom::geography, " +
        CartoDbLib.radius + ") OR the_geom IS NULL";
    }
    else {
      CartoDbLib.geoSearch = ''
    }

    CartoDbLib.userSelection = '';
    var typeUserSelections = $.map($('.filter-option:checked'), function(obj, i) {
      return obj.value;
    });

    var facilityTypeResults = CartoDbLib.userSelectSQL(typeUserSelections);
    CartoDbLib.typeSelections = facilityTypeResults;

    CartoDbLib.whereClause = " WHERE clerks is null ";

    if (CartoDbLib.geoSearch != "") {
      CartoDbLib.whereClause += " AND " + CartoDbLib.geoSearch;
    }
    if (CartoDbLib.userSelection != "") {
      CartoDbLib.whereClause += CartoDbLib.userSelection;
    }
  },

  getIcons: function(obj) {
    var iconArr = [];
    $.each(facilityTypeOptions, function( index, cat ) {
      if (obj[cat] == true) {
        if (iconMap.hasOwnProperty(cat)) {
          iconArr.push(iconMap[cat]);
        }
      }
    });
    return iconArr;
  },

  getFlags: function(obj) {
    var flagArr = [];
    $.each(flagOptions, function( index, flag ) {
      if (obj[flag] == true) {
        var flagObj = {flag: CartoDbLib.formatText(flag)};
        if (iconMap.hasOwnProperty(flag)) {
          flagObj.icon = iconMap[flag];
        }
        flagArr.push(flagObj);
      }
    });
    return flagArr;
  },

  getClerk: function(addr) {
    // Cleark county clerk section, add if found
    $("#countyClerk").empty();
    for (var i = 0; i < addr.length; ++i) {
      if (addr[i].long_name.indexOf("County") !== -1) {
        var clerkStr = addr[i].long_name + " Clerk";
        break;
      }
    }
    var sql = new cartodb.SQL({ user: CartoDbLib.userName });
    sql.execute("SELECT name, address, phone FROM " + CartoDbLib.tableName + " WHERE name = '" + clerkStr + "'")
      .done(function(data) {
        var source = $('#countyClerk-template').html();
        var template = Handlebars.compile(source);
        var result = template(data.rows[0]);
        $('#countyClerk').html(result);
      }
    );
  },

  setZoom: function() {
    var zoom = '';
    if (CartoDbLib.radius >= 80506) zoom = 9;
    else if (CartoDbLib.radius >= 40253) zoom = 10;
    else if (CartoDbLib.radius >= 16095) zoom = 11;
    else if (CartoDbLib.radius >= 8050) zoom = 12; // 5 miles
    else if (CartoDbLib.radius >= 3220) zoom = 13; // 2 miles
    else if (CartoDbLib.radius >= 1610) zoom = 14; // 1 mile
    else if (CartoDbLib.radius >= 805) zoom = 15; // 1/2 mile
    else if (CartoDbLib.radius >= 400) zoom = 16; // 1/4 mile
    else zoom = 16;

    CartoDbLib.map.setView(new L.LatLng( CartoDbLib.currentPinpoint[0], CartoDbLib.currentPinpoint[1] ), zoom)
  },

  addIcon: function() {
    CartoDbLib.centerMark = new L.Marker(CartoDbLib.currentPinpoint, { icon: (new L.Icon({
            iconUrl: baseUrl + '/img/blue-pushpin.png',
            iconSize: [32, 32],
            iconAnchor: [10, 32]
    }))});

    CartoDbLib.centerMark.addTo(CartoDbLib.map);
  },

  addCircle: function() {
    CartoDbLib.radiusCircle = new L.circle(CartoDbLib.currentPinpoint, CartoDbLib.radius, {
        fillColor:'#1d5492',
        fillOpacity:'0.2',
        stroke: false,
        clickable: false
    });

    CartoDbLib.radiusCircle.addTo(CartoDbLib.map);
  },

  addCookieValues: function() {
    var objArr = new Array;

    if ($.cookie("reentryResources") != null) {
      storedObject = JSON.parse($.cookie("reentryResources"));
      objArr.push(storedObject)
    }

    var path = $.address.value();
    var parameters = {
      "address": CartoDbLib.address,
      "radius": CartoDbLib.radius,
      "type": $.map($('.filter-option:checked'), function(obj, i) {return obj.value;}).join(","),
      "path": path
    }

    objArr.push(parameters)
    flatArray = [].concat.apply([], objArr)
    $.cookie("reentryResources", JSON.stringify(flatArray));
  },

  renderSavedResults: function() {
    $('.saved-searches').empty();
    $('.saved-searches').append('<li class="dropdown-header">Saved searches</li><li class="divider"></li>');

    var objArray = JSON.parse($.cookie("reentryResources"));
    if (objArray == null || objArray.length == 0) {
      $('#saved-searches-nav').hide();
    }
    else {
      $('#saved-searches-nav').show();
      $.each(objArray, function( index, obj ) {
        var text = ''
        if (obj.address) {
          text += obj.address;
        }
        else {
          text += obj.type;
        }

        $('.saved-searches').append('<li><a href="#" class="remove-icon"><i class="icon-times-circle"></i></a><a class="saved-search" href="#"> ' + text + '<span class="hidden">' + obj.path + '</span></a></li>');
      });
    }
  },

  returnSavedResults: function(path) {
    var objArray = JSON.parse($.cookie("reentryResources"));

    $.each(objArray, function( index, obj ) {
      if (obj.path == path ) {
        $("#search-address").val(obj.address);
        $("#search-radius").val(obj.radius);

        var typeVals = obj.type.split(",");
        $.each(typeVals, function(idx, obj) {
          $("input.filter-option[value='" + obj + "']").prop("checked", true);
        });
      }
    });
  },

  deleteSavedResult: function(path) {
    var objArray = JSON.parse($.cookie("reentryResources"));

    for (var idx = 0; idx < objArray.length; idx++) {
      if (objArray[idx].path == path ) {
        objArray.splice(idx, 1);
      }
    }

    $.cookie("reentryResources", JSON.stringify(objArray), { path: '/' });
    CartoDbLib.renderSavedResults();
  },

  addFacilityCookie: function(address, id_nbr) {
    var objArr = new Array

    if ($.cookie("location") != null) {
      storedObject = JSON.parse($.cookie("location"));
      objArr.push(storedObject)
    }

    var parameters = {
      "address": address,
      "id": id_nbr
    }

    objArr.push(parameters)
    // Concatenate and flatten array of objects, after pushing new 'parameters' in.
    flatArray = [].concat.apply([], objArr)
    $.cookie("location", JSON.stringify(flatArray), { path: '/' });
    CartoDbLib.updateSavedCounter();
  },

  // Call when rendering list. To determine icon.
  checkCookieDuplicate: function(id_nbr) {
    var objArray = JSON.parse($.cookie("location"));
    var returnVal = true;

    if (objArray != null) {
      $.each(objArray, function( index, obj ) {
        if (obj.id == id_nbr) {
          returnVal = false;
        }
      });
    }

    return returnVal;
  },

  renderSavedFacilities: function() {
    $("#locations-div").empty();

    var objArray = JSON.parse($.cookie("location"));

    if (objArray != null) {
      // Create SQL call.
      CartoDbLib.whereClause = " WHERE "
      $.each(objArray, function( index, obj ) {
        CartoDbLib.whereClause += "id=" + obj.id + " OR "
      });
      CartoDbLib.whereClause += "id=0"

      // Execute SQL.
      var sql = new cartodb.SQL({ user: CartoDbLib.userName });
      sql.execute("SELECT " + CartoDbLib.fields + " FROM " + CartoDbLib.tableName + CartoDbLib.whereClause)
        .done(function(listData) {
          var obj_array = listData.rows;
          for (idx in obj_array) {
            if (obj_array[idx].website != "") {
              if (!obj_array[idx].website.match(/^http/)) {
                obj_array[idx].website = "http://" + obj_array[idx].website;
              }
            }
            obj_array[idx].cookie = CartoDbLib.checkCookieDuplicate(obj_array[idx].id) == false;
          }
          var source = $('#locations-div-template').html();
          var template = Handlebars.compile(source);
          var result = template(obj_array);
          $('#locations-div').html(result);

          // Activate jQuery for removing a location.
          $(".remove-location").on('click', function() {
            var tr = $(this).closest('tr');
            var id_nbr = tr.find('span.given-id').text();
            CartoDbLib.deleteSavedFacility(id_nbr);
            tr.remove();
          });

          // Activate jQuery for modalPop.
          $(".facility-name").on('click', function() {

            var thisId = $(this).siblings().text();
            var objArray = listData.rows;
            $.each(objArray, function( index, obj ) {
              if (obj.id == thisId ) {
                CartoDbLib.modalPop(obj)
              }
            });
          });
        });
    }
  },

  deleteSavedFacility: function(givenId) {
    var objArray = JSON.parse($.cookie("location"));

    for (var idx = 0; idx < objArray.length; idx++) {
      if (objArray[idx].id == givenId ) {
        objArray.splice(idx, 1);
      }
    }

    $.cookie("location", JSON.stringify(objArray), { path: '/' });
    CartoDbLib.updateSavedCounter();
  },

  updateSavedCounter: function() {
    $("#saved-locations").empty();
    $("#no-locations").empty();

    var objArray = JSON.parse($.cookie("location"));

    if (objArray == null || objArray.length == 0) {
      $("#saved-locations").hide();
      $("#no-locations").append("No saved locations. Return <a href='/'>home</a> to search for more results.")
      document.cookie = 'location=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    else if (objArray.length == 1) {
      $("#saved-locations").show();
      $("#saved-locations").append('<span class="badge">' + objArray.length + '</span>' + " Location saved")
    }
    else {
      $("#saved-locations").append('<span class="badge">' + objArray.length + '</span>' + " Locations saved")
    }

  },

  removeWhiteSpace: function(word) {
    while(word.charAt(0) === ' ')
        word = word.substr(1);
    return word;
  }

}
