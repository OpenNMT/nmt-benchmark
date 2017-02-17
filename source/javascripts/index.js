$(document).ready(function () {
  // Enable dropdowns
  $('.ui.dropdown').dropdown();
  // Language pair selection init
  $('#languagePairs .menu').text(defaultLP);

  // Initialize LP selection dropdown
  setDropdownContent();
  setTestFileDropdownContent(getLanguagePair());

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      setTestFileDropdownContent(value);
      getTable(value, getConstraint());
    }
  });

  // Test file selection handler
  $('#testFile').dropdown({
    onChange: function (value, text) {
      swapScores(value);
    }
  });

  // Constraint selection handler
  $('#constraint').dropdown({
    onChange: function (value, text) {
      getTable(getLanguagePair(), getConstraint());
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
  getTable('fres');
});

function getTable (languagePair, constraint) {
  // TODO - i18n for table header
  var query = {};
  if (languagePair) {
    query = {
      sourceLanguage: languagePair.substring(0, 2),
      targetLanguage: languagePair.substring(2)
    };
  }
  if (constraint) {
    query.constraint = constraint === 'Yes' ? true : false;
  }

  $.get('/getDataTable', query)
  .done(function (response) {
    $('#mainTable').html(getTableHeader());
    var columns = [
      {data: 'systemName', className: 'systemName', sDefaultContent: '', render: function (data, type, full) {
        if (data) {
          return ('<a href="/translationSystem/view/' + full._id + '">' + data + '</a>');
        }
      }}
    ];

    $('#testFile .item').each(function (i, el) {
      var fileId = $(el).attr('data-value');
      var active = $(el).hasClass('active') ? ' active' : '';
      columns.push({
        data: 'scores',
        className: 'testFile id_' + $(el).attr('data-value') + active,
        sDefaultContent: 'n/a',
        render: function (data, type, full) {
          return data[fileId] ? data[fileId].BLEU : '';
        }
      });
    });

    $('#mainTable table').DataTable({
      destroy: true,
      searching: false,
      info: false,
      stateSave: true,
      pagingType: 'full_numbers',
      dom: 'ftp',
      'sAjaxDataProp': '',
      order: [[1, 'desc']],
      data: response.data,
      columns: columns,
      drawCallback: function (settings) {
        $('.pagination.menu').addClass('floated right');
        swapScores($('input[name="testSet"]').val());
      }
    });
  })
  .fail(function (error) {
    flash('error', error);
    console.log(error.statusText, error);
  });
}

function getTableHeader () {
  var buf = [];
  buf.push('<table class="ui celled striped sortable table"><thead><tr>');
  buf.push('<th class="systemName">System name</th>'); // i18n
  $('#testFile .item').each(function (i, el) {
    buf.push('<th class="testFile id_' + $(el).attr('data-value') + '">' + (++i) + '</th>');
  });
  buf.push('</tr></thead></table>');
  return buf.join('');
}

function swapScores (fileId) {
  var testId = getTestFileId();
  $('td.testFile').removeClass('active');
  $('td.testFile.id_' + testId).addClass('active');
}

function getTestFileId () {
  return $('input[name="testSet"]').val() || '';
}
