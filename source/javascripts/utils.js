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
          if (e.target.className.indexOf('info') !== -1) {
            showInfo(e.target);
          }
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
  $.get('/getLanguagePairs?restricted=true')
  .done(function (response) {
    var dropdownHtml = response.data
      .sort(function (a, b) {
        return (c2l[a.src] + c2l[a.tgt]) > (c2l[b.src] + c2l[b.tgt]) ? 1 : -1;
      })
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
      });
    if (withAny) {
      var option = 'Any language pair';
      dropdownHtml.unshift('<div class="active item" data-value="">' + option + '</div>');
      $('#languagePairs .text').text(option);
    }
    $('#languagePairs .menu').html(dropdownHtml.join(''));
  })
  .fail(function (error) {
    flash('error', error);
    console.log(error.statusText, error);
  });
}

function getLanguagePair () {
  return $('#languagePairs').dropdown('get value') || defaultLP;
}

function getConstraint () {
  return $('#constraint').dropdown('get value') || 'Yes';
}

function setTestFileDropdownContent (lp) {
  var src = lp.substring(0, 2);
  var tgt = lp.substring(2);
  $.get('/getTestSets?src=' + src + '&tgt=' + tgt)
  .done(function (response) {
    $('#testFile .menu').html(
      response.data.map(function (f, i) {
        var active = '';
        i++;
        if (i === 1) {
          active = ' active';
          $('#testFile .text').text(i + ' - ' + f.source.fileName);
          $('#testFile input[name="testSet"]').val(f._id);
        }
        return [
          '<div class="item',
          active,
          '" data-value="',
          f._id,
          '">',
          i, ' - ', f.source.fileName,
          '</div>'
        ].join('');
      }).join('')
    );
  })
  .fail(function (error) {
    flash('error', error);
    console.log(error.statusText, error);
  });
}

function click2copy (trigger, id) {
  id = id || trigger;
  $('#' + trigger).on('click', function () {
    var range;
    if (document.selection) {
      range = document.body.createTextRange();
      range.moveToElementText(document.getElementById(id));
      range.select().createTextRange();
      document.execCommand('Copy');
    } else if (window.getSelection) {
      window.getSelection().removeAllRanges();
      range = document.createRange();
      range.selectNode(document.getElementById(id));
      window.getSelection().addRange(range);
      document.execCommand('Copy');
    }
  });
}

function showInfo (target) {
  var id = target.getAttribute('data-fileId');
  var languagePair = $($(target).closest('tr').find('td.languagePair')[0]).text();
  var corpusName = $($(target).closest('tr').find('td.fileName')[0]).text();
  var animation = {
    show: 'slide right',
    hide: 'slide left'
  };
  var $container = $('.info.card');
  if ($container.is(':visible')) {
    $container.transition({
      duration: 250,
      animation: animation.hide,
      onComplete: function () {
        show();
      }
    });
  } else {
    show();
  }

  function show () {
    var licenses = trainingSets.filter(function (ts) {
      return ts._id === id;
    })[0].licenses;
    $container.find('.content .header').text(languagePair);
    $container.find('.content .description').text(corpusName);
    $container.find('.extra.content .description').html(getCorpusInfo(licenses));
    $container.transition({
      duration: 500,
      animation: animation.show
    });
  }
}

function getCorpusInfo (licenses) {
  if (licenses.length > 0) {
    var buf = [];
    buf.push('<div class="ui list">');
    licenses.forEach(function (l) {
      buf.push('<div class="item">');
      buf.push('<i class="text file outline icon"></i>');
      buf.push('<div class="content">');
      buf.push('<div class="header">' + l.fileName + '</div>');
      buf.push('<div class="description">');
      buf.push('<div class="ui list">');
      buf.push('Licence: ');
      if (l.license.match(/http/)) {
        l.license = l.license.replace(/(.*)\((.*)\)/, '<a href="$2">$1</a>');
      }
      buf.push(l.license);
      buf.push('</div>');
      buf.push('<div class="ui list">');
      buf.push('References: ');
      l.references.forEach(function (ref) {
        buf.push('<div class="item">');
        if (ref.match(/^http/)) {
          ref = '<a href="' + ref + '">' + ref + '</a>';
          buf.push(ref);
        } else {
          buf.push(ref);
        }
        buf.push('</div>');
      });
      buf.push('</div>');
      buf.push('</div>');
      buf.push('</div>');
      buf.push('</div>');
    });
    buf.push('</div>');
    return buf.join('');
  } else {
    return '<div class="center aligned">No description</div>';
  }
}
