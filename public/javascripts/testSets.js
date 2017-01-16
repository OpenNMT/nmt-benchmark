$(document).ready(function () {
  // enable dropdowns
  $('.ui.dropdown').dropdown();
  var defaultLP = 'enfr';

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      if (!value) {
        $('#languagePairs').dropdown('restore defaults');
      }
      getTable(value);
    }
  });

  getTable();
});

function getTable (languagePair) {
  $('#testSetTable').dataTable({
    destroy: true,
    searching: false,
    info: false,
    stateSave: true,
    paging: false,
    data: filterByLp(testSets, languagePair),
    order: [0, 'asc'],
    columns: [
      {data: 'languagePair', render: function (data, type, full) {
        // LP to human readable format
        return full.sourceLanguage + full.targetLanguage
      }},
      {data: 'fileName'},
      {data: 'download', sortable: false, sDefaultContent: '', render: function () {
        return '<div class="downloadSrc circular ui icon button" data-fileId="587645a0909f6c553ae80420"><i class="download icon"></i></div>'
      }}
    ],
    drawCallback: function (settings) {
      $('.downloadSrc').on('click', function () {
        var fileId = $(this).attr('data-fileId');
        var downloadPage = window.open('/download?fileId=' + fileId);
      });
    }
  });
}

function filterByLp (list, languagePair) {
  if (languagePair) {
    var src = languagePair.substring(0,2);
    var tgt = languagePair.substring(2);
    return list.filter(function (itme) {
      return itme.sourceLanguage == src && itme.targetLanguage == tgt;
    });
  } else {
    return list;
  }
}
