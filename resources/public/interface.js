function abracadabra () {
  $(".dont-show")[0].click();
}

function initialize (velocity, stories) {
  $("input#velocity").val(velocity);
  $("input#stories").val(stories);
  window.numStories = 0;
  updateStories(stories);
  abracadabra();
}

function setUpSliders () {
  var opts = {
    range: "min",
    min: 0,
    value: 12,
    animate: true,
    orientation: "horizontal"
  };

  opts['max'] = 50;
  vSlider = $(".velocity.slider").slider(opts);
  opts['max'] = 30;
  opts['value'] = 6;
  sSlider = $(".stories.slider").slider(opts);
  vSlider.bind('slide', function( event, ui ) {
    $("input#velocity").val(ui.value);
    abracadabra();
  });
  sSlider.bind('slide', function( event, ui ) {
    $("input#stories").val(ui.value);
    abracadabra();
    updateStories(ui.value);
  });
}

function updateStories(numStories) {
  var n = Math.abs(numStories - window.numStories);
  
  if(numStories < window.numStories) {
    for(var i = 0; i< n; i++) {
      $('div#stories').children().last().remove();
    }
  } else {
    for(var i = 0; i< n; i++) {
      var storyDiv = $(document.createElement('div'));
      storyDiv.addClass('story');
      storyDiv.append("<img class='star' src='/images/star.png'></img>");
      storyDiv.append("<div class='text'></div>");
      storyDiv.append("<div class='estimate'></div>");
      $('div#stories').append(storyDiv);
    }
  }
  window.numStories = numStories;
}

function nextElement (value, position) {
  var element = $("<span>|<br />" + value + "</span>");
  element.addClass("step-value");
  element.css("margin-left", position);
  console.log(position);
  return element;
}

function setUpSteps (container, sliderWidth, maxValue, stepValue) {
  noOfDivisions = maxValue / stepValue;
  divisionWidth = sliderWidth/(noOfDivisions + 1);

  for(var i = 0; i <= noOfDivisions; i++) {
    var next = nextElement(stepValue*i, divisionWidth);
    $(container).append(next);
  }
}

$(function() {
  initialize(12, 6);
  setUpSliders();  
});
