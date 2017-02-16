$(document).ready(function () {
  // Enable dropdowns
  $('.ui.dropdown').dropdown();
  // Language pair selection init
  $('#languagePairs .menu').text(defaultLP);

  // Initialize LP selection dropdown
  setDropdownContent('include Any language pair');
  setTestFileDropdownContent(getLanguagePair());

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      getTable(getLanguagePair());
    }
  });

  // Test file selection handler
  $('#testFile').dropdown({
    onChange: function (value, text) {
      swapScores(value);
    }
  });

  // Add new translation system button handler
  $('#addSystemButton').on('click', function () {
    $('#addSystemForm input[name="languagePair"]').val(getLanguagePair());
    $('#addSystemForm').submit();
  });
  $('#addSystemButton').on('keypress', function (e) {
    if (e.which === 13 || e.which === 32) {
      e.preventDefault();
      $(e.target).trigger('click');
    }
  });

  // Initial dataTable draw
  getTable();
});

function getTable (languagePair) {
  // TODO - i18n for table header
  var lp = {};
  if (languagePair) {
    lp = {
      sourceLanguage: languagePair.substring(0, 2),
      targetLanguage: languagePair.substring(2)
    };
  }

  $.get('/getDataTable', lp)
  .done(function (response) {
    var columns = [
      {data: 'user', sDefaultContent: '', render: function (data, type, full) {
        if (data) {
          return ('<a href="/userSystems/' + data.githubId + '"><img class="ui avatar image" src="' + data.avatarURL + '" alt="' + data.name + '"/><span class="userName">' + data.name + '</span></a>');
        }
      }},
      {data: 'systemName', className: 'systemName', sDefaultContent: '', render: function (data, type, full) {
        if (data) {
          return ('<a href="/translationSystem/view/' + full._id + '">' + data + '</a>');
        }
      }},
      {data: 'constraint', sDefaultContent: '', render: function (data, type, full) {
        return data ? 'Internal' : 'Custom';
      }},
      {data: 'date', sDefaultContent: '', render: function (data, type, full) {
        if (data) {
          var d = new Date(data);
          return d.toLocaleDateString();
        }
      }},
      {data: 'scores', className: 'scores', sDefaultContent: '', render: function (data, type, full) {
        var scores = [];
        for (var testId in data) {
          if (data.hasOwnProperty(testId)) {
            scores.push('<div class="testFile id_' + testId + '">' + data[testId].BLEU + '</div>');
          }
        }
        return scores.join('');
      }}
    ];

    $('#mainTable table').DataTable({
      destroy: true,
      searching: false,
      info: false,
      stateSave: true,
      pagingType: 'full_numbers',
      dom: 'ftp',
      'sAjaxDataProp': '',
      order: [[2, 'desc']],
      data: response.data,
      columns: columns,
      drawCallback: function (settings) {
        $('.pagination.menu').addClass('floated right');
        $('i.toggle.icon').popup();
        swapScores($('input[name="testSet"]').val());
      }
    });
  })
  .fail(function (error) {
    flash('error', error);
    console.log(error.statusText, error);
  });
}


function swapScores (fileId) {
  var trans = {
    animation: {
      show: 'fade left',
      hide: 'fade right'
    },
    duration: {
      show: 750,
      hide: 250
    }
  };
  var testId = getTestFileId();
  var $visibleScores = $('.scores .testFile:visible');
  var hidden = 0;

  if ($visibleScores.length) {
    // Hide all shown scores
    $.each($visibleScores, function () {
      $(this).transition({
        duration: trans.duration.hide,
        animation: trans.animation.hide,
        onComplete: function () {
          hidden++;
          if (hidden === $visibleScores.length) {
            showScores(testId);
          }
        }
      });
    });
  } else {
    showScores(testId);
  }
  function showScores (testId) {
    var $container = $('.scores .id_' + testId);
    $container.transition({
      duration: trans.duration.show,
      animation: trans.animation.show
    });
  }
}


function getTestFileId () {
  return $('input[name="testSet"]').val() || '';
}
