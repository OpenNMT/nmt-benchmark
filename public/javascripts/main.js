$(document).ready(function () {
  // enable dropdowns
  $('.ui.dropdown').dropdown();
  var defaultLP = 'enfr';

  // Fill in language pair dropdown
  if (false) {

    $.get('/getLanguagePairs')
    .done(function (data) {
      // console.log(data); // debug
      var html = $(data.map(function (d) {
        return '<div class="item" data-value="' + d.value + '">' + d.text + '</div>';
      }).join(''));
      $('#languagePairs .menu').append(html);
    })
    .fail(function (error) {
      console.log(error.statusText, error);
    });
  }

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      getTable(getLanguagePair());
    }
  });

  // Metrics selection handler
  $('#metrics').dropdown({
    onChange: function  (value, text) {
      // update table
      $('#mainTable').DataTable().order([3, 'desc']).draw();
    }
  });

  // Add new translation system button handler
  $('#addSystemButton').on('click', function () {
    $('#addSystemForm input[name="languagePair"]').val(getLanguagePair());
    $('#addSystemForm').submit();
  });

  // Initial dataTable draw
  getTable(getLanguagePair());
});

/* TODO
  scores
  user
*/

function getTable (languagePair) {
  // TODO: destroy columns & headers
  var lp = languagePair ? {
    sourceLanguage: languagePair.substring(0,2),
    targetLanguage: languagePair.substring(2)
  } : {sourceLanguage: 'en', targetLanguage: 'fr'};
  var tableHeader = [
    '<th class="user">User</th>',
    '<th class="systemName">System name</th>'
  ];
  testSets.filter(function (file) {
    if (file.targetLanguage == lp.targetLanguage && file.sourceLanguage == lp.sourceLanguage) {
      tableHeader.push('<th data-id="' + file.fileName + '">' + file.fileName + '</th>');
    }
  });
  $('#mainTable thead tr').html(tableHeader.join(''));

  $.get('/getDataTable', lp)
  .done(function (response) {
    var columns = [
      {data: 'user', sDefaultContent: '', sWidth: '130'}, // object
      {data: 'systemName', className: 'systemName', sDefaultContent: '', sWidth: '130', render: function (data, type, full) {
        return ('<span data-systemId="' + full._id + '">' + data + '</span>');
      }}
    ];
    $.each(testSets, function (i, ts) {
      if (ts.sourceLanguage + ts.targetLanguage === getLanguagePair()) {
        columns.push({
          data: ts.fileName,
          sDefaultContent: '',
          searchable: false,
          render: function (data, type, full) {
            return 0;
            // TODO
            // return full.scores[ts._id][getMetrics()];
          }
        });
      }
    });

    $('#mainTable').dataTable({
      destroy: true,
      searching: false,
      info: false,
      stateSave: true,
      pagingType: 'full_numbers',
      dom: 'tp',
      'sAjaxDataProp': '',
      order: [2, 'desc'],
      ajax: function (d, callback, settings) {
        // {user: 'avik', systemName: 'system 1', _id: '1', scores: {'id_58739d324a06f419c708add7': {BLEU: 34,NIST: 100}}},
        callback(response.data);
      },
      columns: columns,
      drawCallback: function (settings) {
        $('td.systemName').on('click', function () {
          var systemId = $(this).find('span').attr('data-systemId');
          window.location.href = '/translationSystem/view?systemId=' + systemId;
          // $('#viewTranslationSystem input[name="systemId"]').val(systemId);
          // $('#viewTranslationSystem').submit();
        });
        $('.pagination.menu').addClass('floated right');
      }
    });
  })
  .fail(function (error) {
    console.log(error.statusText, error);
  });
}

function getTableWidth (table) {
  return $(table).find('thead th')
    .map(function (i, cell) {
      return +($(cell).prop('colspan')) || 1;
    })
    .toArray()
    .reduce(function (a, b) {
      return a + b;
    }, 0);
}

function getMetrics () {
  return $('#metrics').dropdown('get value');
}

function getLanguagePair () {
  return $('#languagePairs').dropdown('get value');
}
