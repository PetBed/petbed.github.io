const clampNumber = (num, a, b) =>
  Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

const track = document.getElementsByClassName("image-track")[0];
const trackImage = document.getElementsByClassName("track-image");
var initX = 0;
var transVal = 0;
var diffPercentage;
var nextPercentage;

window.onmousedown = e => {
    initX = e.clientX;
}

window.onmousemove = e => {
    if (initX == 0) return;
    if (nextPercentage == NaN) nextPercentage = 0;
    const curX = e.clientX;

    nextPercentage = clampNumber(transVal + (initX - curX) / (window.innerWidth / 2) * -100, -94, -6)
    track.animate({
        transform: `translate(${nextPercentage}%, -50%)`
    }, {duration: 1200, fill: "forwards"});
    
    for (const image of trackImage) {
        image.animate({
            objectPosition: `${nextPercentage * -1}% 50%`
        }, {duration: 1200, fill: "forwards"});
    }
}

window.onmouseup = e => {
    initX = 0
    transVal = nextPercentage;
}