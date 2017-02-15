$(document).ready(function () {
  // Enable dropdowns
  $('.ui.dropdown').dropdown();

  // Initialize LP selection dropdown
  setDropdownContent();

  // DataTable configuration
  var dtConfig = {
    url: '/download/test/',
    target: '#testSetTable',
    type: 'test',
    columns: [
      {data: 'languagePair', render: function (data, type, full) {
        return [c2l[full.source.language], c2l[full.target.language]].join('&nbsp;-&nbsp;');
      }},
      {data: 'domain'},
      {data: 'origin'},
      {data: 'source.fileName'},
      {data: 'download', sortable: false, sDefaultContent: '', render: function (data, type, full) {
        return '<div class="downloadSrc circular ui basic icon fireBrick button" data-fileId="' + full._id + '" role="button" aria-label="download" tabindex="1" data-tooltip="Download" data-variation="mini" data-position="right center"><i class="download icon"></i></div>';
      }}
    ]
  };

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      if (!value) {
        $('#languagePairs').dropdown('restore defaults');
      }
      wrapGetTable(value, dtConfig);
    }
  });

  // Draw table
  wrapGetTable(defaultLP, dtConfig);
});

function wrapGetTable (lp, dtConfig) {
  var url = '/getTestSets';
  if (lp) {
    url += '?src=' + lp.substring(0, 2) + '&tgt=' + lp.substring(2);
  }
  $.get(url)
  .done(function (response) {
    getTable(response.data, dtConfig);
  })
  .fail(function (errro) {
    flash('error, error');
  });
}
