/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

/*jshint loopfunc: true */

define(function(require, exports, module) {
  "use strict";

  var extensionID = "viewerZIP"; // ID should be equal to the directory name where the ext. is located
  var extensionSupportedFileTypes = ["zip"];

  console.log("Loading " + extensionID);
  //nanobar progress
  var Nanobar = require('ext/viewerZIP/libs/nanobar/nanobar.min');
  var TSCORE = require("tscore");
  var JSZip = require("jszip");
  var maxPreviewSize = (1024 * 3); //3kb limit for preview
  var extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + extensionID;

  var nanobar = new Nanobar( {
	  bg : '#0000ff', //(optional) background css property, '#000' by default
	  id :  'nanobar_div' //(optional) id for nanobar div
  });

  function showContentFilePreviewDialog(containFile) {
    var unitArr = containFile.asUint8Array();
    var previewText = "";
    var byteLength = (unitArr.byteLength > maxPreviewSize) ? maxPreviewSize : unitArr.byteLength;

    //--nanobar settings--
	var progressChunk = parseInt(byteLength/100);
	var currentProgress = 0	;
    for (var i = 0; i < byteLength; i++) {
	   //--nanobar settings--
	  var check = (( i % progressChunk)==0);
      if(check) {
		  currentProgress++;
          if(currentProgress<=100) nanobar.go(currentProgress);
	  }
	  //--------------------
      previewText += String.fromCharCode(unitArr[i]);
    }
	nanobar.go(100); //set to 100% at the end

    var fileContent = $("<pre/>").text(previewText);
    require(['text!' + extensionDirectory + '/previewDialog.html'], function(uiTPL) {

      if ($('#previewDialog').length < 1) {
        var uiTemplate = Handlebars.compile(uiTPL);
        $('body').append(uiTemplate());
      }
      var dialogPreview = $('#previewDialog');
      dialogPreview.find('.modal-body').empty().append(fileContent);
      dialogPreview.modal({
        backdrop: 'static',
        show: true
      });
    });
  }

  function createZipPrewiew(filePath, elementID) {
    var $parent = $('#' + elementID);
    var $previewElement = $('<div/>').css({
      'overflow': 'auto',
      'padding': '5px',
      'background-color': 'white',
      'fontSize': 12,
      'width': '100%',
      'height': '100%',
    }).appendTo($parent);
    //.width($parent.width()).height($parent.height()).appendTo($parent);

    TSCORE.showLoadingAnimation();

    TSCORE.IO.getFileContentPromise(filePath).then(function(content) {
      var zipFile = new JSZip(content);
      $previewElement.append("<p> Contents of file " + filePath + "</p>");
      var ulFiles = $previewElement.append("<ul/>");

      for (var fileName in zipFile.files) {
        if (zipFile.files[fileName].dir === true) {
          continue;
        }
        var linkToFile = $('<a>').attr('href', '#').text(fileName);
        linkToFile.click(function(event) {
          event.preventDefault();
          var containFile = zipFile.files[$(this).text()];
          showContentFilePreviewDialog(containFile);
        });
        var liFile = $('<li/>').css('list-style-type', 'none').append(linkToFile);
        ulFiles.append(liFile);
      }

      TSCORE.hideLoadingAnimation();
    },
    function(error) {
      $previewElement.append("<p> Error in getFileContent :" + error + "</p>");
    });
  }

  function init(filePath, elementID) {
    console.log("Initalization Browser ZIP Viewer...");
    createZipPrewiew(filePath, elementID);
  }

  function viewerMode() {

    console.log("viewerMode not supported on this extension");
  }

  function setContent(content) {

    console.log("setContent not supported on this extension");
  }

  function getContent() {

    console.log("getContent not supported on this extension");
  }

  exports.init = init;
  exports.getContent = getContent;
  exports.setContent = setContent;
  exports.viewerMode = viewerMode;
  //exports.setFileType = setFileType;

});