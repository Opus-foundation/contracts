function bezierCurveThrough(ctx, points, tension, gradient) {
    'use strict';

    // Default tension of one-quarter gives nice results
    tension = tension || 0.25;

    var l = points.length;

    // If we're given less than two points, there's nothing we can do
    if (l < 2) return;

    ctx.beginPath();

    // If we only have two points, we can only draw a straight line
    if (l == 2) {
        ctx.moveTo(points[0][0], points[0][1]);
        ctx.lineTo(points[1][0], points[1][1]);
        ctx.fill();
        return;
    }

    // Helper function to calculate the hypotenuse
    function h(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    /* For each interior point, we need to calculate the tangent and pick
     * two points on it that'll serve as control points for curves to and
     * from the point. */
    var cpoints = [];
    points.forEach(function() {
        cpoints.push({});
    });

    for (var i = 1; i < l - 1; i++) {
        var pi = points[i],     // current point
            pp = points[i - 1], // previous point
            pn = points[i + 1]; // next point;

        /* First, we calculate the normalized tangent slope vector (dx,dy).
         * We intentionally don't work with the derivative so we don't have
         * to handle the vertical line edge cases separately. */

        var rdx = pn[0] - pp[0],  // actual delta-x between previous and next points
            rdy = pn[1] - pp[1],  // actual delta-y between previous and next points
            rd = h(rdx, rdy),     // actual distance between previous and next points
            dx = rdx / rd,        // normalized delta-x (so the total distance is 1)
            dy = rdy / rd;        // normalized delta-y (so the total distance is 1)

        /* Next we calculate distances to previous and next points, so we
         * know how far out to put the control points on the tangents (tension).
         */

        var dp = h(pi[0] - pp[0], pi[1] - pp[1]), // distance to previous point
            dn = h(pi[0] - pn[0], pi[1] - pn[1]); // distance to next point

        /* Now we can calculate control points. Previous control point is
         * located on the tangent of the curve, with the distance between it
         * and the current point being a fraction of the distance between the
         * current point and the previous point. Analogous to next point. */

        var cpx = pi[0] - dx * dp * tension,
            cpy = pi[1] - dy * dp * tension,
            cnx = pi[0] + dx * dn * tension,
            cny = pi[1] + dy * dn * tension;

        cpoints[i] = {
            cp: [cpx, cpy], // previous control point
            cn: [cnx, cny], // next control point
       };
    }

    /* For the end points, we only need to calculate one control point.
     * Picking a point in the middle between the endpoint and the other's
     * control point seems to work well. */

    cpoints[0] = {
        cn: [ (points[0][0] + cpoints[1].cp[0]) / 2, (points[0][1] + cpoints[1].cp[1]) / 2 ],
    };
    cpoints[l - 1] = {
        cp: [ (points[l - 1][0] + cpoints[l - 2].cn[0]) / 2, (points[l - 1][1] + cpoints[l - 2].cn[1]) / 2 ],
    };

    /* Now we can draw! */

    ctx.moveTo(points[0][0], points[0][1]);

    for (i = 1; i < l; i++) {
        var p = points[i],
            cp = cpoints[i],
            cpp = cpoints[i - 1];

        /* Each bezier curve uses the "next control point" of first point
         * point, and "previous control point" of second point. */
        ctx.bezierCurveTo(cpp.cn[0], cpp.cn[1], cp.cp[0], cp.cp[1], p[0], p[1]);
    }

    if(gradient)
    	ctx.fillStyle = gradient;

    ctx.fill();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function redraw(ctxBackground, ctxFront, maxTime) {
    ctxBackground.clearRect(0, 0, canvas.width, canvas.height);
    ctxFront.clearRect(0, 0, canvas.width, canvas.height);

    ctxBackground.font = "16px Arial";
    var txt = "0:00";
    ctxBackground.fillStyle = "#b2b6bf";
    ctxBackground.textAlign = "start";
    ctxBackground.fillText(txt, 0, 27);
    ctxBackground.textAlign = "end";
    ctxBackground.fillText(maxTime, canvas.width, 27)

    ctxBackground.fillStyle = "#dadde3";
    ctxBackground.beginPath();
    ctxBackground.moveTo(0, canvas.height - points[0]);

    var gradient = ctxFront.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#f73e81");
    gradient.addColorStop(1, "#562293");

    bezierCurveThrough(ctxBackground, points, 0.25);
    bezierCurveThrough(ctxFront, points, 0.25, gradient);
}

function changeTime(time) {
    maxTime = time;

    redraw(ctx, ctxProgress, maxTime);
}

var canvas = document.getElementById("scrubbar-bg");
canvas.width = document.getElementById("scrubbar-bg").offsetWidth;
canvas.height = document.getElementById("scrubbar-bg").offsetHeight;
var ctx = canvas.getContext("2d");

var canvasProgress = document.getElementById("scrubbar-progress");
canvasProgress.width = document.getElementById("scrubbar-bg").offsetWidth;
canvasProgress.height = document.getElementById("scrubbar-bg").offsetHeight;
var ctxProgress = canvasProgress.getContext("2d");


var points = [];
var numOfPoints = 60;
var stepSize = canvas.width / numOfPoints;

var maxTime = "2:45";

for(var i = 0; i < numOfPoints; i++)
{
    points[i] = [stepSize * i, canvas.height - getRandomInt(10, 60)];
}
points[0] = [0, canvas.height];
points[numOfPoints] = [numOfPoints * stepSize, canvas.height];


redraw(ctx, ctxProgress, maxTime);

$(window).resize(function(event) {
    canvas.width = document.getElementById("scrubbar-bg").offsetWidth;
    canvas.height = document.getElementById("scrubbar-bg").offsetHeight;
    var ctx = canvas.getContext("2d");
    var stepSize = canvas.width / numOfPoints;

    for(var i = 0; i < numOfPoints; i++)
    {
        points[i] = [stepSize * i, points[i][1]];
    }
    points[0] = [0, canvas.height];
    points[numOfPoints] = [numOfPoints * stepSize, canvas.height];

    canvasProgress.width = document.getElementById("scrubbar-bg").offsetWidth;
    canvasProgress.height = document.getElementById("scrubbar-bg").offsetHeight;
    var ctxProgress = canvasProgress.getContext("2d");
    redraw(ctx, ctxProgress, maxTime);
});


// var audio = document.getElementsByTagName('audio')[0];


$('.muted').click(function () {
    // audio.muted = !audio.muted;
    return false;
});

//VOLUME BAR
//volume bar event
var volumeDrag = false;
var progressDrag = false;
var progressDragFloat = false;
$('#progress, #s-progress').on('mousedown', function (e) {
    progressDrag = true;
    updateProgress(e.pageX);
});

$('.scrubbar-progress-ico').on('mousedown', function (e) {
    updateProgress(e.pageX);
});

$('#float-progress').on('mousedown', function (e) {
    progressDragFloat = true;
    updateProgressFloat(e.pageX);
});

$('#float-progress-container').on('mousedown', function (e) {
    updateProgressFloat(e.pageX);
});

$('.volume').on('mousedown', function (e) {
    volumeDrag = true;
    // audio.muted = false;
    //$('.sound').removeClass('muted');
    updateVolume(e);
});
$(document).on('mouseup', function (e) {
    if (volumeDrag) {
        volumeDrag = false;
        updateVolume(e);
    }
    if(progressDrag) {
    	progressDrag = false;
    	updateProgress(e.pageX);
    }
    if(progressDragFloat) {
    	progressDragFloat = false;
    	updateProgressFloat(e.pageX);
    }
});
$(document).on('mousemove', function (e) {
    if (volumeDrag) {
        updateVolume(e);
    }
    if(progressDrag) {
    	updateProgress(e.pageX);
    }
    if(progressDragFloat){
      updateProgressFloat(e.pageX);
    }
});

var updateProgress = function (x) {
  var audio = document.getElementById("audioplayer");
  var duration = parseInt( audio.duration );
	var progress = $('.scrubbar-progress-ico');
	var precentage;

	var position = x - progress.offset().left;
	precentage = 100 * position / progress.width();

	if(precentage > 100) {
		precentage = 100;
	}
	if(precentage < 0) {
		precentage = 0;
	}

	$('#progress').css('margin-left', precentage + "%");
	$('.scrubbar-progress').css('width', precentage + '%');
  $('.progressBar').css('width', precentage + '%');
  audio.currentTime = duration * precentage/100;
}

var updateProgressFloat = function (x) {
  var audio = document.getElementById("audioplayer");
  var duration = parseInt( audio.duration );
	var progress = $('#float-progress-container');
	var precentage;

	var position = x - progress.offset().left;
	precentage = 100 * position / progress.width();

	if(precentage > 100) {
		precentage = 100;
	}
	if(precentage < 0) {
		precentage = 0;
	}

	$('#progress').css('margin-left', precentage + "%");
	$('.scrubbar-progress').css('width', precentage + '%');
  $('.progressBar').css('width', precentage + '%');
  audio.currentTime = duration * precentage/100;
}

var updateVolume = function (x, vol) {
  var audio = document.getElementById("audioplayer");
  var volume = $(x.target);

  if(!volume.hasClass('volume') && !volume.parent().hasClass('volume')) {
      return false;
  }

  if(!volume.hasClass('volume')) {
      volume = volume.parent()
  }
    var percentage;
    //if only volume have specificed
    //then direct update volume
    if (vol) {
        percentage = vol * 100;
    } else {
        var position = x.pageX - volume.offset().left;
        percentage = 100 * position / volume.width();
    }

    if (percentage > 100) {
        percentage = 100;
    }
    if (percentage < 0) {
        percentage = 0;
    }

    //update volume bar and video volume
    $('.volumeBar').css('width', percentage + '%');
    audio.volume = percentage / 100;

    // //change sound icon based on volume
    // if (audio.volume == 0) {
    //     $('.sound').removeClass('sound2').addClass('muted');
    // } else if (audio.volume > 0.5) {
    //     $('.sound').removeClass('muted').addClass('sound2');
    // } else {
    //     $('.sound').removeClass('muted').removeClass('sound2');
    // }

};


$(window).scroll(function(event) {
    var scroolPos = $(window).scrollTop();

    if(scroolPos > 370) {
        $("#floatPlayer").css('bottom', '0');
    } else {
        $("#floatPlayer").css('bottom', '-100%');
    }

    if(scroolPos > 82) {
        $('.tips').addClass('floating');
    }else {
        $('.tips').removeClass('floating');
    }

    // console.log(scroolPos);
});

jQuery('.scrollbar-macosx').scrollbar();

$('[data-target="dropdown"]').click(function(e) {
    /* Act on the event */
    var list = $($(e.target).data('element'));

    var open = !list.hasClass('opened');

    $('.songsList.opened').removeClass('opened');


    if(open) {
        list.addClass('opened');
    }

    console.log("Click data target");
    console.log(e);
});
