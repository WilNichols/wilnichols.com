console.log('running js');
let body = document.getElementsByTagName('body')[0];
body.classList.add('page-loaded');

// fades images in and blur out onload 
const progressiveImages = document.getElementsByClassName('progressiveImg');
if (progressiveImages) {
  for (const img of progressiveImages) {
    if (img.complete) {
      img.classList.add('imgLoaded');
    } else {
      img.addEventListener('load', function() {
        img.classList.add('imgLoaded');
      });
    }
  }
}