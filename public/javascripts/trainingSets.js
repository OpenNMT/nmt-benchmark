$(document).ready(function () {
  // Enable dropdowns
  $('.ui.dropdown').dropdown();

  // DataTable configuration
  var dtConfig = {
    url: 'https://s3.amazonaws.com/opennmt-trainingdata/',
    target: '#trainingSetTable',
    type: 'training',
    columns: [
      {data: 'languagePair', sWidth: '130', render: function (data, type, full) {
        return [c2l[full.source.language], c2l[full.target.language]].join(' - ');
      }},
      {data: 'fileName', sWidth: '130', render: function (data, type, full) {
        return full.fileName;
      }},
      /*{data: 'size', render: function (data, type, full) {
        return '-';
      }},*/
      {data: 'download', sortable: false, sDefaultContent: '', render: function (data, type, full) {
        return '<div class="downloadSrc circular ui basic icon fireBrick button" data-fileName="' + full.fileName + '.tgz"><i class="download icon"></i></div>';
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
