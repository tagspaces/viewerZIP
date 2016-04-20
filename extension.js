/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

/*jshint loopfunc: true */

define(function (require, exports, module) {
    "use strict";

    var extensionID = "viewerZIP"; // ID should be equal to the directory name where the ext. is located
    var extensionSupportedFileTypes = ["zip"];
    var maxPreviewSize = (1024 * 3) || {}; //3kb limit for preview
    console.log("Loading " + extensionID);

    var TSCORE = require("tscore");
    var JSZip = require("jszip");
    var extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + extensionID;

    var zip2htmlConverter;
    var containerElID;
    var currentFilePath;
    var $containerElement;

    function init(filePath, containerElementID) {
        console.log("Initalization Browser ZIP Viewer...");
        containerElID = containerElementID;
        $containerElement = $('#' + containerElID);

        currentFilePath = filePath;
        $containerElement.empty();
        $containerElement.css("background-color", "white");
        $containerElement.append($('<iframe>', {
            sandbox: "allow-same-origin allow-scripts allow-modals",
            id: "iframeViewer",
            "nwdisable": "",
            //"nwfaketop": "",
            "src": extensionDirectory + "/index.html?&locale=" + TSCORE.currentLanguage,
        }));
    }

    function showContentFilePreviewDialog(containFile) {
        var unitArr = containFile.asUint8Array();
        var previewText = "";
        var byteLength = (unitArr.byteLength > maxPreviewSize) ? maxPreviewSize : unitArr.byteLength;

        for (var i = 0; i < byteLength; i++) {
            previewText += String.fromCharCode(unitArr[i]);
        }

        var fileContent = $("<pre/>").text(previewText);
        require(['text!' + extensionDirectory + '/previewDialog.html'], function (uiTPL) {

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

    function createZipPreview(filePath, elementID) {
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

        TSCORE.IO.getFileContentPromise(filePath).then(function (content) {
                var zipFile = new JSZip(content);
                $previewElement.append("<p> Contents of file " + filePath + "</p>");
                var ulFiles = $previewElement.append("<ul/>");

                for (var fileName in zipFile.files) {
                    if (zipFile.files[fileName].dir === true) {
                        continue;
                    }
                    var linkToFile = $('<a>').attr('href', '#').text(fileName);
                    linkToFile.click(function (event) {
                        event.preventDefault();
                        var containFile = zipFile.files[$(this).text()];
                        showContentFilePreviewDialog(containFile);
                    });
                    var liFile = $('<li/>').css('list-style-type', 'none').append(linkToFile);
                    ulFiles.append(liFile);
                }

                TSCORE.hideLoadingAnimation();
            },
            function (error) {
                $previewElement.append("<p> Error in getFileContent :" + error + "</p>");
            });
    }


    function viewerMode() {

        console.log("viewerMode not supported on this extension");
    }

    function setContent(content, fileDirectory) {
        var buffer = new ArrayBuffer(1024);
        // Create ArrayBufferView objects based on buffer

        var shorts = new Uint16Array(buffer, 512, 128);
        var bytes = new Uint8Array(buffer, shorts.byteOffset + shorts.byteLength);
        //createZipPreview(content, fileDirectory);

        var fileDirectory = TSCORE.TagUtils.extractContainingDirectoryPath(currentFilePath);

        if (isWeb) {
            fileDirectory = TSCORE.TagUtils.extractContainingDirectoryPath(location.href) + "/" + fileDirectory;
        }

        console.log("CREATE ZIP VIEWER EXTENSION.JS: "+ createZipPreview(content, fileDirectory));

        var contentWindow = document.getElementById("iframeViewer").contentWindow;
        console.log("CONTENT WINDOW : " + contentWindow);

        var zipContent = content;
        if (typeof contentWindow.setContent === "function") {
            contentWindow.setContent(zipContent, fileDirectory);
        } else {
            // TODO optimize setTimeout
            window.setTimeout(function() {
                contentWindow.setContent(zipContent, fileDirectory);
            }, 500);
        }
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
