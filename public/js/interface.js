function abracadabra(){$(".dont-show")[0].click()}function initialize(b,a){$("input#velocity").val(b);$("input#stories").val(a);abracadabra()}function setUpSliders(){var a={range:"min",min:0,value:12,animate:true,orientation:"horizontal"};a.max=50;vSlider=$(".velocity.slider").slider(a);a.max=30;a.value=6;sSlider=$(".stories.slider").slider(a);vSlider.bind("slide",function(b,c){$("input#velocity").val(c.value);abracadabra()});sSlider.bind("slide",function(b,c){$("input#stories").val(c.value);abracadabra()})}function nextElement(c,a){var b=$("<span>|<br />"+c+"</span>");b.addClass("step-value");b.css("margin-left",a);console.log(a);return b}function setUpSteps(b,e,f,a){noOfDivisions=f/a;divisionWidth=e/(noOfDivisions+1);for(var c=0;c<=noOfDivisions;c++){var d=nextElement(a*c,divisionWidth);$(b).append(d)}}$(function(){initialize(12,6);setUpSliders()});