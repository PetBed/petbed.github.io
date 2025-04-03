const windowElements = document.querySelectorAll(".window-controls");
function moveWindow(ele) {
  var initX = 0, initY = 0, moveX = 0, moveY = 0;
  const iframe = ele.parentElement.querySelector("iframe");

  ele.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    if (iframe) {
      iframe.style.pointerEvents = "none";
    }

    initX = e.clientX;
    initY = e.clientY;

    document.onmouseup = dragMouseUp;
    document.onmousemove = dragMouseMove;
  }

  function dragMouseMove(e) {
    e = e || window.event;
    e.preventDefault();

    moveX = initX - e.clientX;
    moveY = initY - e.clientY;
    initX = e.clientX;
    initY = e.clientY;
    
    console.log("moving")
    const parentEle = ele.parentElement
    parentEle.style.left = (parentEle.offsetLeft - moveX) + "px";
    parentEle.style.top = (parentEle.offsetTop - moveY) + "px";
  }

  function dragMouseUp(e) {
    if (iframe) {
      iframe.style.pointerEvents = "auto";
    }
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

windowElements.forEach((ele) => {
  moveWindow(ele);
})