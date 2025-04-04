const windows = document.querySelectorAll(".window");
const windowElements = document.querySelectorAll(".window-controls");
const cornerElements = document.querySelectorAll(".corner");
const edgeElements = document.querySelectorAll(".edge");
let z = 1;

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

function resizeCorner(ele) {
  ele.addEventListener('mousedown', (event) => {
    const parentEle = ele.parentElement;
    const iframe = ele.parentElement.querySelector("iframe");

    // Disable text selection
    document.body.style.userSelect = "none";

    if (iframe) {
      iframe.style.pointerEvents = "none"; // Disable pointer events during resizing
    }

    let w = parentEle.clientWidth;
    let h = parentEle.clientHeight;

    let startX = event.pageX;
    let startY = event.pageY;
    let startLeft = parentEle.offsetLeft;
    let startTop = parentEle.offsetTop;

    const drag = (event) => {
      let sizeDifferenceX = event.pageX - startX;
      let sizeDifferenceY = event.pageY - startY;
      event.preventDefault();

      switch (ele.classList[1]) {
        case "top-left":
          const newWidthTL = Math.max(200, w - sizeDifferenceX);
          const newHeightTL = Math.max(200, h - sizeDifferenceY);
          parentEle.style.width = newWidthTL + "px";
          parentEle.style.height = newHeightTL + "px";

          if (newWidthTL > 200) {
            parentEle.style.left = startLeft + sizeDifferenceX + "px";
          } else {
            parentEle.style.left = startLeft + (w - 200) + "px";
          }

          if (newHeightTL > 200) {
            parentEle.style.top = startTop + sizeDifferenceY + "px";
          } else {
            parentEle.style.top = startTop + (h - 200) + "px";
          }
          break;

        case "top-right":
          const newWidthTR = Math.max(200, w + sizeDifferenceX);
          const newHeightTR = Math.max(200, h - sizeDifferenceY);
          parentEle.style.width = newWidthTR + "px";
          parentEle.style.height = newHeightTR + "px";

          if (newHeightTR > 200) {
            parentEle.style.top = startTop + sizeDifferenceY + "px";
          } else {
            parentEle.style.top = startTop + (h - 200) + "px";
          }
          break;

        case "bottom-left":
          const newWidthBL = Math.max(200, w - sizeDifferenceX);
          const newHeightBL = Math.max(200, h + sizeDifferenceY);
          parentEle.style.width = newWidthBL + "px";
          parentEle.style.height = newHeightBL + "px";

          if (newWidthBL > 200) {
            parentEle.style.left = startLeft + sizeDifferenceX + "px";
          } else {
            parentEle.style.left = startLeft + (w - 200) + "px";
          }
          break;

        case "bottom-right":
          const newWidthBR = Math.max(200, w + sizeDifferenceX);
          const newHeightBR = Math.max(200, h + sizeDifferenceY);
          parentEle.style.width = newWidthBR + "px";
          parentEle.style.height = newHeightBR + "px";
          break;

        default:
          break;
      }
    };

    const mouseup = () => {
      document.body.style.userSelect = "";

      if (iframe) {
        iframe.style.pointerEvents = "auto"; // Restore pointer events after resizing
        iframe.contentWindow.focus();
      }
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", mouseup);
    };

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", mouseup);
  });
}

function resizeEdge(ele) {
  ele.addEventListener('mousedown', (event) => {
    const parentEle = ele.parentElement;
    const iframe = ele.parentElement.querySelector("iframe");

    // Disable text selection
    document.body.style.userSelect = "none";

    if (iframe) {
      iframe.style.pointerEvents = "none"; // Disable pointer events during resizing
    }

    let w = parentEle.clientWidth;
    let h = parentEle.clientHeight;

    let startX = event.pageX;
    let startY = event.pageY;
    let startLeft = parentEle.offsetLeft;
    let startTop = parentEle.offsetTop;

    const drag = (event) => {
      let sizeDifferenceX = event.pageX - startX;
      let sizeDifferenceY = event.pageY - startY;
      event.preventDefault();

      switch (ele.classList[1]) {
        case "edge-left":
          const newWidthLeft = Math.max(200, w - sizeDifferenceX);
          parentEle.style.width = newWidthLeft + "px";

          if (newWidthLeft > 200) {
            parentEle.style.left = startLeft + sizeDifferenceX + "px";
          } else {
            parentEle.style.left = startLeft + (w - 200) + "px";
          }
          break;

        case "edge-right":
          parentEle.style.width = Math.max(200, w + sizeDifferenceX) + "px";
          break;

        case "edge-top":
          const newHeightTop = Math.max(200, h - sizeDifferenceY);
          parentEle.style.height = newHeightTop + "px";

          if (newHeightTop > 200) {
            parentEle.style.top = startTop + sizeDifferenceY + "px";
          } else {
            parentEle.style.top = startTop + (h - 200) + "px";
          }
          break;

        case "edge-bottom":
          parentEle.style.height = Math.max(200, h + sizeDifferenceY) + "px";
          break;

        default:
          break;
      }
    };

    const mouseup = () => {
      document.body.style.userSelect = "";

      if (iframe) {
        iframe.style.pointerEvents = "auto"; // Restore pointer events after resizing
        iframe.contentWindow.focus();
      }
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", mouseup);
    };

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", mouseup);
  });
}

windowElements.forEach((ele) => {
  moveWindow(ele);
})

cornerElements.forEach((ele) => {
  resizeCorner(ele);
});

edgeElements.forEach((ele) => {
  resizeEdge(ele);
});

windows.forEach((ele) => {
  // Bring the window to the front when clicked
  ele.addEventListener('mousedown', () => {
    z = z + 1;
    ele.style.zIndex = z;
    console.log("Window clicked");
  });

  // Bring the window to the front when the iframe inside it is focused
  const iframe = ele.querySelector("iframe");
  if (iframe) {
    // Add a listener to the iframe's content window
    iframe.addEventListener('load', () => {
      iframe.contentWindow.addEventListener('focus', () => {
        z = z + 1;
        ele.style.zIndex = z;
        console.log("Iframe focused");
      });
    });
  }
});
