(function($) {
	var activeBox = 0;
	var numOfBoxes = $('.sidebar > li').length + 1;
	var body = $('html, body');

	$.fn.changeView = function (index) {
		body.stop().animate({scrollTop:$('div#box'+index).offset().top}, 1000, 'easeInOutCirc');
		$("ul.sidebar .links.active").removeClass('active');
		$("ul.sidebar #boxlink"+index).addClass('active');
		$('.box.active').removeClass('active');
		$("#box"+index).addClass('active');
		return this;
	}


	$.fn.clipPath = function() {
		
		this.filter('[data-clipPath]').each(function(i) {
			
			//get IMG attributes
			var maskPath = $(this).attr('data-clipPath');
			var maskSrc = $(this).attr('src');
			var maskWidth = $(this).attr('width');
			var maskHeight = $(this).attr('height');
			var maskAlt = $(this).attr('alt');
			var maskTitle = $(this).attr('title');
			var uniqueID = i;
			
			//build SVG from our IMG attributes & path coords.
			
			var svg = $('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" class="svgMask" width="'
				+maskWidth+'" height="'
				+maskHeight+'" viewBox="0 0 '
				+maskWidth+' '
				+maskHeight+'"><defs><clipPath id="maskID'
				+uniqueID+'"><path d="'
				+maskPath+'"/></clipPath>  </defs><title>'
				+maskTitle+'</title><desc>'
				+maskAlt+'</desc><image clip-path="url(#maskID'
				+uniqueID+')" width="'
				+maskWidth+'" height="'
				+maskHeight+'" xlink:href="'
				+maskSrc+'" /></svg>');
				
			//swap original IMG with SVG
			$(this).replaceWith(svg);
			
			//clean up
			delete maskPath, maskSrc, maskWidth, maskHeight, maskAlt, maskTitle, uniqueID, svg;
			
		});
 
		return this;
 
	};

	var lastRoadMap = 10;
	var activeRoadMap = 0;

	var events = $('.row.event .col-lg-3');

	var baseYRoadMap = $('.roadmap').offset().top - 200;

	$(window).scroll(function(event) {
	    var scroolPos = $(window).scrollTop();
	    if(scroolPos > baseYRoadMap) {
	    	var baseY = scroolPos - baseYRoadMap;

	    	console.log(baseY % 20);

	    	if(baseY % 20 == 0) {
	    		if(activeRoadMap < lastRoadMap)
	    			activeRoadMap++;
	    		$('.row.event .col-lg-3.last').removeClass('last');

	    		$('.row.event .col-lg-3[data-id="'+activeRoadMap+'"]').addClass('active');
	    		$('.row.event .col-lg-3[data-id="'+activeRoadMap+'"]').addClass('last');
	    	}

	    	$('.navbar').addClass('fixed');

	    	$('.navbar .logoWhite').hide();
	    	$('.navbar .logoBlack').show();
	    } else {
	    	$('.navbar').removeClass('fixed');

	    	$('.navbar .logoBlack').hide();
	    	$('.navbar .logoWhite').show();
	    }
	});

	$('.box').on('mousewheel', function(event) {
		var active = $(event.currentTarget).data("index");
	    console.log(active + " " + numOfBoxes);
	    if(event.deltaY < 0 && active <= numOfBoxes) {
	    	active++;
	    } else if(event.deltaY > 0 && active > 0) {
	    	if(active < 3) {
	    		console.log("less than 4");
	    		active--;
	    	} else if($('div#box'+active).offset().top >= body.scrollTop()) {
	    		console.log($('div#box'+active).offset().top + " " + body.scrollTop());
	    		active--;
	    	}
	    }
	    
	    if(active >= 0 && active < numOfBoxes) {
	    	$().changeView(active)
	    }
	});
})(jQuery);


function showDiv(element) {
	element = $(element).data('target');
	
	$(element).addClass('active');

	$('.box').addClass('filterBlur');
}

function closeDiv(argument) {
	$(argument).removeClass('active');

	$('.box').removeClass('filterBlur');
}

jQuery('.scrollbar-macosx').scrollbar();