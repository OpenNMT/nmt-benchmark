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
    {data: 'systemName', className: 'systemName', sDefaultContent: '', render: function (data, type, full) {
      var c = {
        'true': {
          content: 'Trained on internal data',
          toggle: 'on'
        },
        'false': {
          content: 'Trained on custom data',
          toggle: 'off'
        }
      };
      if (data) {
        return ('<i class="toggle ' + c[full.constraint].toggle + ' icon" data-content="' + c[full.constraint].content + '" data-position="top center"></i><a href="/translationSystem/view/' + full._id + '">' + data + '</a>');
      }
    }},
    {data: 'date', sDefaultContent: '', render: function (data, type, full) {
      if (data) {
        var d = new Date(data);
        return d.toLocaleDateString();
      }
    }},
    {data: 'src', sDefaultContent: '', render: function (data, type, full) {
      return full.sourceLanguage.map(function (l) {
        return c2l[l];
      }).join(', ');
    }},
    {data: 'tgt', sDefaultContent: '', render: function (data, type, full) {
      return full.targetLanguage.map(function (l) {
        return c2l[l];
      }).join(', ');
    }},
    {data: 'scores', sDefaultContent: '', render: function (data, type, full) {
      var scores = [];
      for (var testId in data) {
        if (data.hasOwnProperty(testId)) {
          scores.push(data[testId].BLEU);
        }
      }
      return Math.max(scores) || '';
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
      $('i.toggle').popup();
    }
  });
}
