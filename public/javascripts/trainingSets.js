$(document).ready(function () {
  // Enable dropdowns
  $('.ui.dropdown').dropdown();

  // DataTable configuration
  var dtConfig = {
    target: '#trainingSetTable',
    type: 'training',
    columns: [
      {data: 'languagePair', sWidth: '130', render: function (data, type, full) {
        return '-';
        // return [c2l[full.source.language], c2l[full.target.language]].join(' - ');
      }},
      {data: 'fileName', sWidth: '130', render: function (data, type, full) {
        return full;
      }},
      {data: 'size', render: function (data, type, full) {
        return '-';
      }},
      {data: 'download', sortable: false, sDefaultContent: '', render: function (data, type, full) {
        return '<div class="downloadSrc circular ui basic icon fireBrick disabled button" data-fileId="' + full._id + '"><i class="download icon"></i></div>';
      }}
    ]
  }

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      if (!value) {
        $('#languagePairs').dropdown('restore defaults');
      }
      getTable(filterByLp(trainingSets, value), dtConfig);
    }
  });

  getTable(filterByLp(trainingSets, null), dtConfig);
});
