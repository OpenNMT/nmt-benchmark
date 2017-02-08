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
      return ('<a href="/translationSystem/view/' + full._id + '">' + data + '</a>');
    }},
    {data: 'date', sDefaultContent: '', render: function (data, type, full) {
      if (data) {
        var d = new Date(data);
        return d.toLocaleDateString();
      }
    }},
    {data: 'src', sDefaultContent: '', render: function (data, type, full) {
      return c2l[full.sourceLanguage];
    }},
    {data: 'tgt', sDefaultContent: '', render: function (data, type, full) {
      return c2l[full.targetLanguage];
    }},
    {data: 'scores', sDefaultContent: '', orderable: false, render: function (data, type, full) {
      // TODO
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
