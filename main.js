/* Copyright (c) 2013-present The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */
/* globals Handlebars, Nanobar, marked */
'use strict';

var isCordova;

var isWin;
var isWeb = (document.URL.startsWith('http') && !document.URL.startsWith('http://localhost:1212/'));
var JSZip, JSZipUtils;
var maxPreviewSize = (1024 * 3) || {}; //3kb limit for preview

$(document).ready(function() {
  function getParameterByName(name) {
    name = name.replace(/[\[]/ , '\\\[').replace(/[\]]/ , '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)') ,
            results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g , ' '));
  }

  var locale = getParameterByName('locale');
  var filePath = getParameterByName('file');

  var extSettings;
  loadExtSettings();

  // isCordova = parent.isCordova;
  // isWin = parent.isWin;

  initI18N(locale, 'ns.viewerZIP.json');

  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem('viewerZIPSettings'));
  }

  JSZipUtils.getBinaryContent(filePath , function(err, data) {
    if (err) {
      throw err; // or handle err
    }
    JSZip.loadAsync(data).then(function(data) {
      loadZipFile(data, filePath);
    });
    //JSZip.loadAsync(data).then(function (zip) {
    //  var re = /(.jpg|.png|.gif|.ps|.jpeg)$/;
    //  var promises = Object.keys(zip.files).filter(function(fileName) {
    //    // don't consider non image files
    //    console.log(fileName);
    //    return re.test(fileName.toLowerCase());
    //  })
    //});
    //  Object.keys(zip.files).map(function (fileName) {
    //    var file = zip.files[fileName];
    //    return file.async("text").then(function (blob) {
    //      console.log(blob);
    //      return [
    //        fileName,  // keep the link between the file name and the content
    //        URL.createObjectURL(blob) // create an url. img.src = URL.createObjectURL(...) will work
    //      ];
    //    });
    //  });
    //  // `promises` is an array of promises, `Promise.all` transforms it
    //  // into a promise of arrays
    //  return Promise.all(promises);
    //}).then(function (result) {
    //  // we have here an array of [fileName, url]
    //  // if you want the same result as imageSrc:
    //  return result.reduce(function (acc, val) {
    //    acc[val[0]] = val[1];
    //    return acc;
    //  }, {});
    //}).catch(function (e) {
    //  console.error(e);
    //});
  });
});

function loadZipFile(zipFile, filePath) {
  var $zipContent = $('#zipContent');

  $zipContent.append(zipFile);

  // if (filePath.indexOf('file://') === 0) {
  //   filePath = filePath.substring(('file://').length , filePath.length);
  // }

  $zipContent.append('<div/>').css({
    'overflow': 'auto' ,
    'padding': '5px' ,
    'background-color': 'white' ,
    'fontSize': 12 ,
    'width': '100%' ,
    'height': '100%'
  });
  $zipContent.append('<p><h4> Contents of file ' + filePath + '</h4></p>');
  var ulFiles = $zipContent.append('<ul/>');

  function showPreviewDialog(event) {
    event.preventDefault();
    var containFile = zipFile.files[$(this).text()];
    containFile.options.compression = 'STORE';
    containFile.async("text").then(function (blob) {
      showContentFilePreviewDialog(blob);
      //return [
      //  fileName,  // keep the link between the file name and the content
      //  URL.createObjectURL(blob) // create an url. img.src = URL.createObjectURL(...) will work
      //];
    });
  }

  if (!!Object.keys(zipFile.files) &&
    (typeof zipFile !== 'function' ||
    zipFile === null)) {
    for (var fileName in zipFile.files) {
      if (zipFile.files[fileName].dir === true) {
        continue;
      }
      var linkToFile = $('<a>').attr('href' , '#').text(fileName);
      linkToFile.click(showPreviewDialog);
      var liFile = $('<li/>').css('list-style-type' , 'none').append(linkToFile);
      ulFiles.append(liFile);
    }
  } else {
    throw new TypeError('Object.keys called on non-object');
  }
}

function showContentFilePreviewDialog(containFile) {
  //var unitArr = containFile._data.compressedContent;
  var previewText = '';
  //var byteLength = (unitArr.byteLength > maxPreviewSize) ? maxPreviewSize : unitArr.byteLength;

  //for (var i = 0; i < byteLength; i++) {
  //  previewText += String.fromCharCode(unitArr[i]);
  //}
  previewText = containFile;
  var fileContent = $('<pre/>').text(previewText);

  $.post('previewDialog.html' , function(uiTPL) {
    if ($('#previewDialog').length < 1) {
      var uiTemplate = Handlebars.compile(uiTPL);
      $('body').append(uiTemplate());
    }
    var dialogPreview = $('#previewDialog');
    dialogPreview.find('.modal-body').empty().append(fileContent);
    dialogPreview.modal({
      backdrop: 'static' ,
      show: true
    });
    var nanobar = new Nanobar({
      bg: '#42BEDB' , //(optional) background css property, '#000' by default
      target: document.getElementById('nanoBar') , //(optional) Where to put the progress bar, nanobar will be fixed to top of document if target is null
      // id for new nanobar
      id: 'nanoBar' // (optional) id for nanobar d
    });

    var progressChunk = parseInt(byteLength / 100);
    var currentProgress = 0;
    for (var i = 0; i < byteLength; i++) {
      var check = ((i % progressChunk) === 0);
      if (check) {
        currentProgress++;
        if (currentProgress <= 100) {
          nanobar.go(currentProgress);
        }
      }
      previewText += String.fromCharCode(unitArr[i]);
    }
  }).always(function() {
    window.setTimeout(function() {
      document.getElementById('nanoBar').remove();
    } , 1000);
  });
}
