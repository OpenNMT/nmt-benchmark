function getTable (list, config) {
  $(config.target).dataTable({
    destroy: true,
    searching: false,
    info: false,
    stateSave: true,
    paging: false,
    data: list,
    order: [0, 'asc'],
    columns: config.columns,
    drawCallback: function (settings) {
      $('table').on('click', function (e) {
        var $target;
        if (e.target.nodeName === 'I') {
          $target = $(e.target).closest('div');
        } else if (e.target.nodeName === 'DIV') {
          $target = $(e.target);
        }
        if ($target && ($target.attr('data-fileId') || $target.attr('data-fileName'))) {
          var downloadPage = window.open(config.url + ($target.attr('data-fileId') || $target.attr('data-fileName')));
        }
      });
      $('table').on('keypress', function (e) {
        if (e.which === 13 || e.which === 32) {
          e.preventDefault();
          $(e.target).trigger('click');
        }
      });
      $('.downloadSrc').popup();
    }
  });
}

function filterByLp (list, languagePair) {
  // comment
  if (languagePair) {
    var src = languagePair.substring(0, 2);
    var tgt = languagePair.substring(2);
    return list.filter(function (item) {
      if (item.source && item.target) {
        return item.source.language === src && item.target.language === tgt;
      }
    });
  }
  return list;
}

function setDropdownContent (withAny) {
  $.get('/getLanguagePairs')
  .done(function (response) {
    var prepend = withAny ? '<div class="item active" data-value="">Any language pair</div>' : '';
    $('#languagePairs .menu').html(
      prepend.concat(
        response.data
        .map(function (lp) {
          var active = '';
          if (!withAny && lp.src + lp.tgt === defaultLP) {
            active = ' active';
            $('#languagePairs .text').text(c2l[lp.src] + ' - ' + c2l[lp.tgt]);
          }
          return [
            '<div class="item',
              active,
              '" data-value="',
              lp.src, lp.tgt,
            '">',
              c2l[lp.src], ' - ', c2l[lp.tgt],
            '</div>'
          ].join('');
        })
        .join('')
      )
    );
  })
  .fail(function (error) {
    flash('error', error);
    console.log(error.statusText, error);
  });
}

function getLanguagePair () {
  return $('#languagePairs').dropdown('get value') || defaultLP;
}
