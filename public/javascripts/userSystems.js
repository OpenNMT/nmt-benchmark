$(document).ready(function () {
  // Enable dropdown
  $('.ui.dropdown').dropdown();

  // Add new translation system button handler
  $('#addSystemButton').on('click', function () {
    $('#addSystemForm').submit();
  });

  // Initial dataTable draw
  getTable();
});

function getTable () {
  var columns = [
    {data: 'systemName', className: 'systemName', sDefaultContent: '', sWidth: '30', render: function (data, type, full) {
      return ('<a href="/translationSystem/view/' + full._id + '">' + data + '</a>');
    }},
    {data: 'src', sDefaultContent: '', sWidth: '30', render: function (data, type, full) {
      return c2l[full.sourceLanguage];
    }},
    {data: 'tgt', sDefaultContent: '', sWidth: '30', render: function (data, type, full) {
      return c2l[full.targetLanguage];
    }},
    {data: 'scores', sDefaultContent: '', orderable: false, sWidth: '130', render: function (data, type, full) {
      var buf = [];
      testSets.filter(function (test) {
        return test.source.language === full.sourceLanguage && test.target.language === full.targetLanguage;
      }).forEach(function (test) {
        if (full.scores[test._id]) {
          buf.push('<div>' + test.source.fileName + ': ' + full.scores[test._id].BLEU + '</div>');
        }
      });
      return buf.join('');
    }}
  ];

  $('#mainTable').dataTable({
    destroy: true,
    searching: false,
    info: false,
    stateSave: true,
    pagingType: 'full_numbers',
    dom: 'tp',
    'sAjaxDataProp': '',
    data: tsData,
    columns: columns,
    drawCallback: function (settings) {
      $('.pagination.menu').addClass('floated right');
    }
  });
}
