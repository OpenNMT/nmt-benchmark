$(document).ready(function () {
  if (mode === 'view') {
    $('.ui.form .input').addClass('transparent');
    setDescription(translationSystem);
  }
  $('.ui.dropdown').dropdown();
  $('.ui.toggle.checkbox').checkbox({
    onChange: function () {
      var state = $(this).prop('checked') ? 'On' : 'Off'; // i18n
      $(this).next('label').text(state)
      $('.trainSet').transition({
        animation: 'slide down',
        duration: '0.5s'
      });
    }
  });

  // Enable/disable submit button
  $('#translationSystem .field.required').on('change', function () {
    var filled = $('#translationSystem .field.required').map(function () {
      return !!($(this).find('input').val());
    }).toArray()
    .reduce(function (a, b) {
      return a && b;
    }, true);

    if (filled) {
      $('#createSystem').removeClass('disabled');
      $('#createSystem').addClass('basic');
    } else {
      $('#createSystem').addClass('disabled');
      $('#createSystem').removeClass('basic');
    }
  });

  // Controls
  $('#createSystem, #saveSystem').on('click', function () {
    var params = getDescription();
    var url = params.system_id ? '/translationSystem/update' : '/translationSystem/create';
    $.post(url, params)
    .success(function (response) {
      try {
        response = JSON.parse(response);
      } catch (e) {
        console.log('Unable to parse server response', e);
      }
      if (response.error) {
        if (response.error.errors) {
          for (field in response.error.errors) {
            console.log(response.error.errors[field].message);
          }
        }
      } else {
        window.location = '/translationSystem/view/' + response.data._id;
      }
    })
    .fail(function (err) {
      console.log(err, err.stack);
    });
  });
  $('#deleteSystem').on('click', function () {
    var config = {
      url: '/translationSystem/delete/' + translationSystem._id,
      done: function () {
        console.log('go home')
        window.location = '/'; // confirmation flash
      },
      header: 'Are you sure you want to delete this system?', // i18n
      content: 'All associated translations and scores will be lost' // i18n
    };
    confirm(config);
  });
  /*
  $('#editSystem').on('click', function () {
    window.location = '/translationSystem/edit/' + translationSystem._id;
  });*/

  // Customize file input
  $(document).on('change', ':file[name=file]', function () {
    var input = $(this);
    var fileName = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    var $form = $(this).closest('form');
    input.trigger('fileselect', [fileName, $form]);
  });
  $(':file[name=file]').on('fileselect', function (e, fileName, $form) {
    var $selectOutput = $form.find('.selectOutput');
    var $uploadOutput = $form.find('.uploadOutput');
    $selectOutput.find('input').val(fileName);
    fileName ? $uploadOutput.removeClass('disabled') : $uploadOutput.addClass('disabled');
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
    var config = {
      url: '/testOutput/delete/' + $(this).attr('data-testOutputId'),
      done: function () {
        console.log('reload')
        location.reload();
      },
      header: 'Are you sure you want to delete this translation?', // i18n
      content: 'All associated scores will be lost' // i18n
    };
    confirm(config);
  });

  // Download source
  $('#getSource').on('click', function () {
    var fileId = $(this).attr('data-fileId');
    var downloadPage = window.open('/download/' + fileId);
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
  $('.ui.modal').find('.header').text(config.header);
  $('.ui.modal').find('.content').text(config.content);
  $('.ui.modal').modal({
    blurring: true,
    onApprove: function () {
      $.get(config.url)
      .success(function (response) {
        try {
          response = JSON.parse(response);
        } catch (e) {
          console.log('Unable to parse server response, should be a JSON object already');
        }
        if (response.error) {
          console.log(response.error);
        } else {
          config.done();
        }
      })
      .fail(function (err) {
        console.log(err.trace);
      });
    }
  }).modal('show');
}
