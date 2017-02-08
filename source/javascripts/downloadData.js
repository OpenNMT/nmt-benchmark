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
