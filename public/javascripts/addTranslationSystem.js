$(document).ready(function () {
  if (mode === 'view') {
    $('.ui.form .input').addClass('transparent');
    $('.ui.selection.dropdown').removeClass('selection');
    setSystemDescription(translationSystem);
  }
  $('.ui.dropdown').dropdown();
  $('#createSystem, #saveSystem').on('click', function () {
    var params = getSystemDescription();
    var url = params.system_id ? '/translationSystem/update' : '/translationSystem/add';
    // show spinner
    $.post(url, params)
    .success(function (data) {
      // remove spinner
      // change mode
      // refresh
      console.log('response data', data)
      if (!data.error) {
        // redirect to view + _id
      } else {
        // error
      }
    })
    .fail(function (err) {
      // remove spinner
      console.log(err, err.stack);
    });
  });

  $('#deleteSystem').on('click', function () {
    // modal confirmation
    var url = '/translationSystem/delete';
    $.post(url, {system_id: translationSystem._id})
    .done(function (result) {
      if (!result.error) {
        window.location = '/'; // redirect to home with confirmation message
      }
    })
    .fail(function (err) {
      console.log(err.trace);
    });
  });

  $('#editSystem').on('click', function () {
    window.location = '/translationSystem/edit?systemId=' + translationSystem._id;
  });

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
    $uploadOutput.find('.fileName').text(fileName);
    $selectOutput.hide();
    $uploadOutput.show();
  });
  $('.selectOutput').on('click', function () {
    var fileId = $(this).attr('data-fileId');
    $(':file[data-fileId="' + fileId + '"]').trigger('click');
  });

  // upload output
  $('.uploadOutput').on('click', function () {
    $(this).closest('form').submit();
  });

/*
  $('input[type="file"]').on('change', function (e) {
    console.log('fake path', e.target.value)
  });
*/
  // remove output
  $('#deleteOutput').on('click', function () {
    console.log('delete output')
    var params = {
      testOutputId: $(this).attr('data-testOutputId')
    };
    var url = '/testOutput/delete';
    $.post(url, params)
    .success(function (response) {
      if (response.error) {
        console.log(response.error);
      } else {
        location.reload();
      }
    })
    .fail(function (err) {
      console.log(err);
    });
  });

  $('#getSource').on('click', function () {
    var fileId = $(this).attr('data-fileId');
    var downloadPage = window.open('/download?fileId=' + fileId);
  });
});

function getSystemDescription () {
  var description = {};
  $('.ui.form input, .ui.form textarea').each(function (i, input) {
    description[$(input).attr('name')] = $(input).val();
  });
  return description;
}

function setSystemDescription (description) {
  $('.ui.form input, .ui.form textarea').each(function (i, input) {
    var field = $(input).attr('name');
    $(input).val(description[field] || '');
    $(input).attr('placeholder', '');
    $(input).attr('disabled', true);
  });
}
