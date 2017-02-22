$(document).ready(function () {
  // Enable dropdowns
  $('.ui.dropdown').dropdown();

  // DataTable configuration
  var dtConfig = {
    url: 'https://s3.amazonaws.com/opennmt-trainingdata/',
    target: '#trainingSetTable',
    type: 'training',
    columns: [
      {data: 'languagePair', className: 'languagePair', render: function (data, type, full) {
        return [c2l[full.source.language], c2l[full.target.language]].join('&nbsp;-&nbsp;');
      }},
      {data: 'fileName', className: 'fileName', render: function (data, type, full) {
        return '<i class="info circle icon" data-fileId="' + full._id + '"></i>' + full.fileName;
      }},
      {data: 'download', sortable: false, sDefaultContent: '', render: function (data, type, full) {
        return '<div class="downloadSrc circular ui basic icon fireBrick button" data-fileName="' + full.fileName + '.tgz" role="button" aria-label="download" tabindex="1" data-tooltip="Download training data" data-variation="mini" data-position="right center"><i class="download icon"></i></div>';
      }}
    ]
  };

  // Draw table
  getTable(filterByLp(trainingSets, null), dtConfig);
});
