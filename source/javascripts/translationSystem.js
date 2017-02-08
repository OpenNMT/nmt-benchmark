$(document).ready(function () {
  if (mode === 'view') {
    $('.ui.form .input').addClass('transparent');
    setDescription(translationSystem);
  }

  $('label').popup();

  // Enable dropdown
  $('.ui.dropdown').dropdown();
  $('.ui.toggle.checkbox').checkbox({
    onChange: function () {
      var state = $(this).prop('checked') ? 'On' : 'Off'; // i18n
      $(this).next('label').text(state);
      $('.trainSet').transition({
        animation: 'slide down',
        duration: '0.5s'
      });
    }
  });

  // Enable/disable submit button
  $('#translationSystem .field.required').on('input', function (e) {
    var filled = $('#translationSystem .field.required').map(function () {
      return !!($(this).find('input').val().trim());
    }).toArray()
    .reduce(function (a, b) {
      return a && b;
    }, true);

    if (filled) {
      $('#createSystem').removeClass('disabled');
      $('#createSystem').addClass('basic fireBrick');
    } else {
      $('#createSystem').addClass('disabled');
      $('#createSystem').removeClass('basic fireBrick');
    }
  });

  // Controls
  $('#createSystem').on('click', function () {
    var params = getDescription();
    var url = params.system_id ? '/translationSystem/update' : '/translationSystem/create';
    $.post(url, params)
    .done(function (response) {
      try {
        response = JSON.parse(response);
      } catch (e) {
        console.log('Unable to parse server response, should be a JSON object already');
      }
      if (response.error) {
        var level = 'error';
        if (response.error.errors) {
          var text = '';
          for (var field in response.error.errors) {
            if (response.error.errors.hasOwnProperty(field)) {
              text += response.error.errors[field].message;
            }
          }
          flash(level, text);
        } else {
          flash(level, response.error);
        }
      } else {
        window.location = '/translationSystem/view/' + response.data._id;
      }
    })
    .fail(function (err) {
      flash('error', err);
      console.log(err, err.stack);
    });
  });
  $('#deleteSystem').on('click', function () {
    var deleteSystem = {
      url: '/translationSystem/delete/' + translationSystem._id,
      done: function () {
        window.location = '/';
      },
      header: 'Are you sure you want to delete this system?', // i18n
      content: 'All associated translations and scores will be lost', // i18n
      $target: $(this)
    };
    confirm(deleteSystem);
  });
  $('#createSystem, #deleteSystem, .deleteOutput, .getSource, .selectOutput, .uploadOutput').on('keypress', function (e) {
    if (e.which === 13 || e.which === 32) {
      e.preventDefault();
      $(e.target).trigger('click');
    }
  });

  // Customize file input
  $(document).on('change', ':file[name=file]', function () {
    var $input = $(this);
    var fileName = $input.val().replace(/\\/g, '/').replace(/.*\//, '');
    var $form = $(this).closest('form');
    $input.trigger('fileselect', [fileName, $form]);
  });
  $(':file[name=file]').on('fileselect', function (e, fileName, $form) {
    var $selectOutput = $form.find('.selectOutput');
    var $uploadOutput = $form.find('.uploadOutput');
    $selectOutput.find('input').val(fileName);
    if (fileName) {
      $uploadOutput.removeClass('disabled');
      $uploadOutput.addClass('basic fireBrick');
    } else {
      $uploadOutput.removeClass('basic fireBrick');
      $uploadOutput.addClass('disabled');
    }
  });
  $('.selectOutput').on('click', function () {
    var fileId = $(this).attr('data-fileId');
    $(':file[data-fileId="' + fileId + '"]').trigger('click');
  });
  $('.fileName').on('focus', function () {
    $(this).blur();
  });

  // Upload output
  $('.uploadOutput').on('click', function () {
    $(this).closest('form').submit();
  });

  // Remove output
  $('.deleteOutput').on('click', function () {
    var deleteOutput = {
      url: '/testOutput/delete/' + $(this).attr('data-testOutputId'),
      done: function () {
        location.reload();
      },
      header: 'Are you sure you want to delete this translation?', // i18n
      content: 'All associated scores will be lost', // i18n
      $target: $(this)
    };
    confirm(deleteOutput);
  });

  // Download source
  $('.getSource').on('click', function () {
    var fileId = $(this).attr('data-fileId');
    var downloadPage = window.open('/download/test/' + fileId);
  });

  $('.cancel.button, .ok.button').on('keypress', function (e) {
    if (e.which === 13 || e.which === 32) {
      e.preventDefault();
      $(e.target).trigger('click');
    }
  });
});

function getDescription () {
  var description = {};
  $('.ui.form input, .ui.form textarea').each(function (i, input) {
    description[$(input).attr('name')] = $(input).val();
  });
  return description;
}

function setDescription (description) {
  $('.ui.form input, .ui.form textarea').each(function (i, input) {
    var field = $(input).attr('name');
    $(input).val(description[field] || '');
    $(input).attr('placeholder', '');
    $(input).attr('disabled', true);
  });
}

function confirm (config) {
  $('.ui.modal').modal({
    blurring: true,
    onApprove: function () {
      $.get(config.url)
      .done(function (response) {
        try {
          response = JSON.parse(response);
        } catch (e) {
          console.log('Unable to parse server response, should be a JSON object already');
        }
        if (response.error) {
          var level = 'error';
          if (response.error.errors) {
            var text = '';
            for (var field in response.error.errors) {
              if (response.error.errors.hasOwnProperty(field)) {
                text += response.error.errors[field].message;
              }
            }
            flash(level, text);
          } else {
            flash(level, response.error);
          }
        } else {
          config.done();
        }
      })
      .fail(function (err) {
        var level = 'error';
        flash(level, err);
        console.log(err.trace);
      });
    },
    onShow: function () {
      $('#dialogHeader').text(config.header);
      $('#dialogDescription').text(config.content);
    },
    onVisible: function () {
      $('.ui.modal').find('.cancel.button').focus();
    },
    onHidden: function () {
      $(config.$target).focus();
    }
  }).modal('show');
}
