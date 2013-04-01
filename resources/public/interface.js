function abracadabra () {
  $(".dont-show")[0].click();
}

function initialize (velocity, stories) {
  $("input#velocity").val(velocity);
  $("input#stories").val(stories);
  abracadabra();
}

function setUpSliders () {
  var opts = {
    min: 0,
    value: 10,
    animate: true,
    orientation: "horizontal"
  };

  opts['max'] = 50;
  vSlider = $(".velocity.slider").slider(opts);
  opts['max'] = 30;
  sSlider = $(".stories.slider").slider(opts);
  vSlider.bind('slide', function( event, ui ) {
    $("input#velocity").val(ui.value);
    abracadabra();
  });
  sSlider.bind('slide', function( event, ui ) {
    $("input#stories").val(ui.value);
    abracadabra();
  });
}

$(function() {
  initialize(10, 6);
  setUpSliders();
});
