$(document).ready(function () {
  // Enable dropdown
  $('.ui.dropdown').dropdown();

  // Metrics selection handler
  $('#metrics').dropdown({
    onChange: function  (value, text) {
      // TODO - Update table scores accordingly
    }
  });

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
    {data: 'scores', sDefaultContent: '', sWidth: '130', render: function (data, type, full) {
      if (full.scores) {
        return full.scores.map(function (testFile) {
          var score = testFile.scores.find(function (s) {
            return s.metric === getMetrics();
          });
          return '<div class="metric">' + score.value + '</div>';
        })
      } else {
        return '';
      }
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
    data: systemList,
    columns: columns,
    drawCallback: function (settings) {
      $('.pagination.menu').addClass('floated right');
    }
  });
}

function getMetrics () {
  return $('#metrics').val() || 'BLEU';
}
