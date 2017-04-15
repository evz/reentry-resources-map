$(window).resize(function () {
  var h = $(window).height(),
    offsetTop = 120; // Calculate the top offset

  $('#mapCanvas').css('height', (h - offsetTop));
}).resize();

$(function() {
  CartoDbLib.initialize();
  new Clipboard('#copy-button');

  var autocomplete = new google.maps.places.Autocomplete(document.getElementById('search-address'));

  $('#btnReset').tooltip();
  $('#btnViewMode').tooltip();
  $('[data-tooltip="true"]').tooltip();

  $(':checkbox').click(function(){
    CartoDbLib.doSearch();
  });

  $('#btnSearch').click(function(){
    // Temporary fix for map load issue: set show map as default.
    if ($('#mapCanvas').is(":visible")){
      CartoDbLib.doSearch();
    }
    else {
      $('#btnViewMode').html("<i class='fa fa-list'></i> List View");
      $('#mapCanvas').show();
      $('#listCanvas').hide();
      // $('#btnViewMode').html("<i class='fa fa-map-marker'></i> Map View");
      // $('#listCanvas').show();
      // $('#mapCanvas').hide();

      CartoDbLib.doSearch();
    }
  });

  $('#btnViewMode').click(function(){
    if ($('#mapCanvas').is(":visible")){
      $('#btnViewMode').html("<i class='fa fa-map-marker'></i> Map View");
      $('#listCanvas').show();
      $('#mapCanvas').hide();
    }
    else {
      $('#btnViewMode').html("<i class='fa fa-list'></i> List View");
      $('#listCanvas').hide();
      $('#mapCanvas').show();
    }
  });

  $("#search-address").keydown(function(e){
      var key =  e.keyCode ? e.keyCode : e.which;
      if(key == 13) {
          $('#btnSearch').click();
          return false;
      }
  });

  $('select').select2();

  var facility_type_data = makeSelectData(facilityTypeOptions);

  $(".data-array-type").select2({
    placeholder: "Facility type",
    data: facility_type_data
  });

  $("#btnSave").on('click', function() {
    CartoDbLib.addCookieValues();
    CartoDbLib.renderSavedResults();
  });

  $("#dropdown-results").on('click', '.saved-search', function() {
    var path = $(this).children().text();
    CartoDbLib.returnSavedResults(path);
    CartoDbLib.doSearch();
  });

  $("#dropdown-results").on('click', '.remove-icon', function() {
    var path = ($(this).siblings().children().text());
    CartoDbLib.deleteSavedResult(path);
    $(this).parent().remove();
  });

  $(".list-table").on('click', '.fa-star-o', function() {
    var tr = ($(this).parents().eq(1));
    var address = tr.find("span.facility-address").text();
    var id_nbr = tr.find("span#given-id").text();
    $(this).removeClass('fa-star-o');
    $(this).addClass('fa-star');
    $(this).removeAttr('data-original-title');
    $(this).attr('title', 'Location saved');
    CartoDbLib.addFacilityCookie(address, id_nbr);
  });

  $(".modal-header").on('click', '.fa-star-o', function() {
    var address = $("#modal-address").text();
    var id_nbr = $.address.parameter('modal_id');
    $(this).removeClass('fa-star-o');
    $(this).addClass('fa-star');
    $(this).removeAttr('data-original-title');
    $(this).attr('title', 'Location saved');
    CartoDbLib.addFacilityCookie(address, id_nbr);
  });

  $(".close-btn").on('click', function() {
    $.address.parameter('modal_id', null)
  });

  $(".list-table").on('click', '.fa-star', function() {
    var tr = ($(this).parents().eq(1));
    var id_nbr = tr.find('#given-id').text();
    $(this).removeClass('fa-star');
    $(this).addClass('fa-star-o');
    CartoDbLib.deleteSavedFacility(id_nbr);
  });

  $(".btn-print").on("click", function() {
    window.print();
  });

});

function makeSelectData(array) {
  data_arr = []
  for(var i = 0; i < array.length; i++) {
    data_arr.push({ id: i, text: CartoDbLib.formatText(array[i]) })
  }

  return data_arr
};

function makeSelectDataGroups(insuranceArray) {

  data_arr_generic = []
  data_arr_specific = []
  for(var i = 0; i < insuranceArray.length; i++) {
    if (insuranceArray[i].includes('medicaid_')) {
      data_arr_specific.push({ id: i, text: CartoDbLib.formatText(insuranceArray[i]) })
    }
    else {
      data_arr_generic.push({ id: i, text: CartoDbLib.formatText(insuranceArray[i]) })
    }
  }

   return [
      {text: "Insurance type",
      children: data_arr_generic},
      {text: "Specific plans (Medicaid only)",
      children: data_arr_specific},
    ]

};
