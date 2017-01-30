$(document).ready(function () {
  // Enable dropdowns
  $('.ui.dropdown').dropdown();

  // Language pair selection init
  $('#languagePairs .menu').html(languagePairs.map(function (lp) {
    var active = '';
    if (lp.sourceLanguage + lp.targetLanguage == getLanguagePair()) {
      active = ' active';
      $('#languagePairs .text').text(c2l[lp.sourceLanguage] + ' - ' + c2l[lp.targetLanguage]);
    }
    return [
      '<div class="item',
        active,
        '" data-value="',
        lp.sourceLanguage, lp.targetLanguage,
      '">',
        c2l[lp.sourceLanguage], ' - ', c2l[lp.targetLanguage],
      '</div>'
    ].join('');
  }).join(''));

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      getTable(getLanguagePair());
    }
  });

  // Metrics selection handler
  $('#metrics').dropdown({
    onChange: function  (value, text) {
      // TODO - Update table scores accordingly
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

function getTable (languagePair) {
  // TODO - i18n for table header
  var lp = {
    sourceLanguage: languagePair.substring(0,2),
    targetLanguage: languagePair.substring(2)
  };

  // Drop table - for variable width support (different test files number)
  var table = [
    '<table class="ui celled striped table"><thead><tr>',
    '<th class="user">User</th>',
    '<th class="systemName">System name</th>'
  ];
  getBest(testSets, languagePair).forEach(function (file) {
    table.push('<th data-id="' + file.source.fileName + '">' + file.source.fileName + '</th>');
  });
  table.push('</tr></thead></table>');
  $('#mainTable').html(table.join(''));

  $.get('/getDataTable', lp)
  .done(function (response) {
    var columns = [
      {data: 'user', sDefaultContent: '', render: function (data, type, full) {
        return ('<a href="/userSystems/' + data.githubId + '"><img class="ui avatar image" src="' + data.avatarURL + '" />' + data.name + '</a>');
      }},
      {data: 'systemName', className: 'systemName', sDefaultContent: '', render: function (data, type, full) {
        return ('<a href="/translationSystem/view/' + full._id + '">' + data + '</a>');
      }}
    ];
    $.each(getBest(testSets, languagePair), function (i, ts) {
      if (ts.source.language + ts.target.language === languagePair) {
        columns.push({
          data: ts.source.fileName,
          sDefaultContent: '',
          searchable: false,
          render: function (data, type, full) {
            return full.scores[ts._id] ? full.scores[ts._id][getMetrics()] : '';
          }
        });
      }
    });

    $('#mainTable table').DataTable({
      destroy: true,
      searching: false,
      info: false,
      stateSave: true,
      pagingType: 'full_numbers',
      dom: 'tp',
      'sAjaxDataProp': '',
      order: [2, 'desc'],
      data: response.data,
      columns: columns,
      drawCallback: function (settings) {
        $('.pagination.menu').addClass('floated right');
      }
    });
  })
  .fail(function (error) {
    flash('error', error);
    console.log(error.statusText, error);
  });
}

function getMetrics () {
  // Change order if #metrics iplemented
  return 'BLEU' || $('#metrics').dropdown('get value');
}

function getLanguagePair () {
  return $('#languagePairs').dropdown('get value') || defaultLP;
}

function getBest (testSets, languagePair) {
  return testSets.filter(function (file) {
    return (file.source.language + file.target.language === languagePair);
  }).sort(function (a, b) {
    return b.nbOutputs - a.nbOutputs;
  }).slice(0, 1);
}
