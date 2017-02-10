$(document).ready(function () {
  $('#copyApiKey').popup();
  $('#copyApiKey').on('click', function () {
    var range;
    if (document.selection) {
      range = document.body.createTextRange();
      range.moveToElementText(document.getElementById('apiKey'));
      range.select().createTextRange();
      document.execCommand('Copy');
    } else if (window.getSelection) {
      window.getSelection().removeAllRanges();
      range = document.createRange();
      range.selectNode(document.getElementById('apiKey'));
      window.getSelection().addRange(range);
      document.execCommand('Copy');
    }
  });
});
