function initTicker() {

  const blockArr = Array.from(document.querySelectorAll('.ticker li p'));

  let tickerItem = blockArr[0].cloneNode(true);

  const ticker = document.querySelector('.ticker');
  ticker.innerHTML = '';
  ticker.appendChild(tickerItem);

  const tickerWidth = ticker.offsetWidth;
  let textX = tickerWidth;

  // Position the ticker item absolutely
  tickerItem.style.position = 'absolute';
  tickerItem.style.left = textX + 'px';

  function scrollTicker() {
    textX--;
    tickerItem.style.left = textX + 'px';

    if (textX < -tickerItem.offsetWidth) {
      let currentIndex = blockArr.indexOf(tickerItem.__original || blockArr[0]);
      let nextIndex = (currentIndex + 1) % blockArr.length;
      tickerItem = blockArr[nextIndex].cloneNode(true);
      tickerItem.__original = blockArr[nextIndex]; // Store reference

      tickerItem.style.position = 'absolute';
      tickerItem.style.left = tickerWidth + 'px';

      ticker.innerHTML = '';
      ticker.appendChild(tickerItem);
      textX = tickerWidth;
    }
  }

  setInterval(scrollTicker, 6);
}

initTicker();